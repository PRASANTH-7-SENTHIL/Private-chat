import type { WSMessage } from '../types';
import { authApi } from './api';

type EventHandler = (payload: Record<string, any>) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private shouldReconnect = true;
  private onStatusChange?: (status: 'connected' | 'disconnected' | 'reconnecting') => void;

  async connect(onStatusChange?: typeof this.onStatusChange) {
    this.shouldReconnect = true;
    if (onStatusChange) {
      this.onStatusChange = onStatusChange;
    }
    await this.createConnection();
  }

  private async createConnection() {
    try {
      // 1. Secure Ticket Acquisition: Get single-use short-lived ticket
      const ticketRes = await authApi.getWsTicket();
      const ticket = ticketRes.data.ticket;

      const wsBase = import.meta.env.VITE_WS_BASE_URL;
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      let url: string;

      if (wsBase) {
        const cleanBase = wsBase.replace(/\/$/, '');
        url = `${cleanBase}/ws?ticket=${encodeURIComponent(ticket)}`;
      } else if (apiBase) {
        // Automatically derive wss:// from https:// API base URL
        const wsDerived = apiBase
          .replace(/^http:/, 'ws:')
          .replace(/^https:/, 'wss:')
          .replace(/\/$/, '');
        url = `${wsDerived}/ws?ticket=${encodeURIComponent(ticket)}`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        url = `${protocol}//${host}/ws?ticket=${encodeURIComponent(ticket)}`;
      }

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.onStatusChange?.('connected');
        this.startHeartbeat();
        // Request synchronization cursor on open
        this.send({ type: 'sync.request', payload: {} });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          const handlers = this.handlers.get(msg.type);
          if (handlers) {
            handlers.forEach((h) => h(msg.payload));
          }
        } catch {
          // ignore malformed frame
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        } else {
          this.onStatusChange?.('disconnected');
        }
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      } else {
        this.onStatusChange?.('disconnected');
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onStatusChange?.('disconnected');
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    this.onStatusChange?.('reconnecting');
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.createConnection();
      }
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping', payload: {} });
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  send(msg: WSMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  disconnect() {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService();

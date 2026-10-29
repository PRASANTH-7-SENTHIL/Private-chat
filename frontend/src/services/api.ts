import axios, { type AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config) & { _retry?: boolean };
    const url = original?.url || '';
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout');

    if (error.response?.status === 401 && !original?._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              original!.headers!['Authorization'] = `Bearer ${token}`;
              resolve(api(original!));
            },
            reject,
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE}/api/v1/auth/refresh`, {}, { withCredentials: true });
        const newToken: string = data.access_token;
        useAuthStore.getState().setAccessToken(newToken);
        if (data.user) {
          useAuthStore.getState().setUser(data.user);
        }
        queue.forEach((p) => p.resolve(newToken));
        queue = [];
        original!.headers!['Authorization'] = `Bearer ${newToken}`;
        return api(original!);
      } catch (e) {
        queue.forEach((p) => p.reject(e));
        queue = [];
        useAuthStore.getState().clearAuth();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  register: (data: { login_id?: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { login_id: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getWsTicket: () => api.post<{ ticket: string; expires_in: number }>('/auth/ws-ticket'),
};

export const usersApi = {
  search: (loginId: string) =>
    api.get(`/users/search?login_id=${encodeURIComponent(loginId)}`),
};

export const contactsApi = {
  sendRequest: (recipientId: string) =>
    api.post('/contacts/requests', { recipient_id: recipientId }),
  getRequests: () => api.get('/contacts/requests'),
  acceptRequest: (id: string) => api.post(`/contacts/requests/${id}/accept`),
  rejectRequest: (id: string) => api.post(`/contacts/requests/${id}/reject`),
  getContacts: () => api.get('/contacts'),
  blockContact: (id: string) => api.post(`/contacts/${id}/block`),
};

export const conversationsApi = {
  create: (participantId: string) =>
    api.post('/conversations', { participant_id: participantId }),
  list: () => api.get('/conversations'),
  get: (id: string) => api.get(`/conversations/${id}`),
  getMessages: (id: string, cursor?: number) =>
    api.get(`/conversations/${id}/messages${cursor ? `?cursor=${cursor}` : ''}`),
};

export const devicesApi = {
  list: () => api.get('/devices'),
  register: (data: {
    identity_public_key: string;
    signed_prekey: string;
    signed_prekey_signature: string;
    one_time_prekeys?: string[];
  }) => api.post('/devices', data),
  revoke: (id: string) => api.delete(`/devices/${id}`),
  getKeyBundle: (userId: string) => api.get(`/users/${userId}/key-bundle`),
};

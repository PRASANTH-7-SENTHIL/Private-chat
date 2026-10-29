import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import { wsService } from '../services/websocket';

export function useAuth() {
  const store = useAuthStore();
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      wsService.disconnect();
      store.clearAuth();
      navigate('/');
    }
  }, [store, navigate]);

  return { ...store, logout };
}

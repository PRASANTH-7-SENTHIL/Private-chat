import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthStore {
  user: User | null;
  deviceId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, deviceId: string | null, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      deviceId: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, deviceId, accessToken) =>
        set({ user, deviceId, accessToken, isAuthenticated: true }),
      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      clearAuth: () =>
        set({ user: null, deviceId: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'private-chat-auth',
      partialize: (state) => ({
        user: state.user,
        deviceId: state.deviceId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

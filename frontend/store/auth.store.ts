import { create } from 'zustand';

interface AuthState {
  token: string | null;
  initialized: boolean;
  setToken: (token: string) => void;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  initialized: false,

  init: () => {
    const token = localStorage.getItem('token');
    set({ token, initialized: true });
  },

  setToken: (token: string) => {
    localStorage.setItem('token', token);
    set({ token });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null });
  },
}));

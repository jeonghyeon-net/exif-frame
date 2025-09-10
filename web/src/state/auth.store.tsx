import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Member {
  id: number;
  email: string;
  nickname: string;
  createdAt: number;
}

interface AuthState {
  token: string | null;
  member: Member | null;
  setAuth: (token: string, member: Member) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      member: null,
      setAuth: (token, member) => set({ token, member }),
      clearAuth: () => set({ token: null, member: null }),
    }),
    {
      name: 'exif-frame-auth',
      partialize: (state) => ({ token: state.token, member: state.member }),
    }
  )
);


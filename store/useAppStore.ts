import { create } from 'zustand';
import { Language } from '@/lib/i18n/translations';

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  user: any | null; // Will type later with Supabase
  setUser: (user: any) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  user: null,
  setUser: (user) => set({ user }),
  language: 'es', // Default to Spanish
  setLanguage: (language) => set({ language }),
}));

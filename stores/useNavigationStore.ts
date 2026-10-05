import { create } from 'zustand';
import type { Screen } from '../types';

interface NavigationState {
  screen: Screen;
  params: Record<string, unknown> | null | undefined;
  history: Screen[];
  
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  reset: () => void;
}

export const useNavigationStore = create<NavigationState>()((set) => ({
  screen: 'welcome',
  params: null,
  history: [],
  
  navigate: (screen, params = undefined) => set((state) => ({
    screen,
    params,
    history: [...state.history, state.screen],
  })),
  
  goBack: () => set((state) => {
    const history = [...state.history];
    const previousScreen = history.pop() || 'home';
    return {
      screen: previousScreen,
      params: null,
      history,
    };
  }),
  
  reset: () => set({ screen: 'home', params: null, history: [] }),
}));

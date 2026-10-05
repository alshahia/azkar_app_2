import { create } from 'zustand';

/** Monotonic suffix so two toasts created in the same millisecond still get
 *  unique ids (Date.now() alone can collide). */
let toastCounter = 0;

interface UIState {
  // Modals
  whatsNewOpen: boolean;
  shareEditorOpen: boolean;
  
  // Toasts
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  
  // Loading
  globalLoading: boolean;
  
  // Actions
  setWhatsNewOpen: (open: boolean) => void;
  setShareEditorOpen: (open: boolean) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  whatsNewOpen: false,
  shareEditorOpen: false,
  toasts: [],
  globalLoading: false,
  
  setWhatsNewOpen: (open) => set({ whatsNewOpen: open }),
  setShareEditorOpen: (open) => set({ shareEditorOpen: open }),
  
  addToast: (message, type) => set((state) => ({
    toasts: [...state.toasts, { id: Date.now().toString() + '-' + (++toastCounter), message, type }],
  })),
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
  
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));

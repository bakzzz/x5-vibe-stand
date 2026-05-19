import { create } from 'zustand';

type RemarksMode = 'view' | 'add';

interface RemarksState {
  isPrototypeActive: boolean;
  setPrototypeActive: (active: boolean) => void;
  
  mode: RemarksMode;
  setMode: (mode: RemarksMode) => void;
  
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  
  activeRemarkId: string | null;
  setActiveRemarkId: (id: string | null) => void;

  authorName: string | null;
  setAuthorName: (name: string) => void;

  subTarget: string | null;
  setSubTarget: (target: string | null) => void;
}

export const useRemarksStore = create<RemarksState>((set) => ({
  isPrototypeActive: false,
  setPrototypeActive: (active) => set({ isPrototypeActive: active }),
  
  mode: 'view',
  setMode: (mode) => set({ mode }),
  
  isDrawerOpen: false,
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),
  
  activeRemarkId: null,
  setActiveRemarkId: (id) => set(state => ({ 
    activeRemarkId: id, 
    isDrawerOpen: id ? true : state.isDrawerOpen, 
    mode: 'view' 
  })),

  authorName: typeof window !== 'undefined' ? localStorage.getItem('author_name') : null,
  setAuthorName: (name) => {
    localStorage.setItem('author_name', name);
    set({ authorName: name });
  },

  subTarget: null,
  setSubTarget: (target) => set({ subTarget: target }),
}));

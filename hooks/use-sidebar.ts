import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  setOpen: (isOpen: boolean) => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  isOpen: true,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),
}));

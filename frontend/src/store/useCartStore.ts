import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

interface CartState {
  sessionId: string;
  isCartDrawerOpen: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgotPin';
  toggleCartDrawer: (open?: boolean) => void;
  toggleAuthModal: (open?: boolean, mode?: 'login' | 'register' | 'forgotPin') => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      sessionId: generateSessionId(),
      isCartDrawerOpen: false,
      isAuthModalOpen: false,
      authModalMode: 'login',
      toggleCartDrawer: (open) => set((state) => ({ isCartDrawerOpen: open !== undefined ? open : !state.isCartDrawerOpen })),
      toggleAuthModal: (open, mode = 'login') =>
        set((state) => ({
          isAuthModalOpen: open !== undefined ? open : !state.isAuthModalOpen,
          authModalMode: mode,
        })),
    }),
    {
      name: 'toy_store_cart_session',
      partialize: (state) => ({ sessionId: state.sessionId }),
    },
  ),
);

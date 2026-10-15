import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type ToastItem = {
  id: number;
  variant: ToastVariant;
  message: string;
  title?: string;
  // ms before it hides itself; errors stay a little longer so they can be read.
  duration: number;
};

type ToastState = {
  current: ToastItem | null;
  show: (toast: Omit<ToastItem, 'id' | 'duration'> & { duration?: number }) => void;
  hide: (id?: number) => void;
};

let nextId = 1;

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 3000,
  info: 3500,
  warning: 4500,
  error: 4500,
};

// One toast at a time, newest wins — a burst of errors shouldn't stack up over the screen.
export const useToastStore = create<ToastState>()((set, get) => ({
  current: null,
  show: ({ duration, ...toast }) =>
    set({ current: { ...toast, id: nextId++, duration: duration ?? DEFAULT_DURATION[toast.variant] } }),
  // With an id, only hides that toast — a late timer must not close a newer one.
  hide: (id) => {
    if (id === undefined || get().current?.id === id) set({ current: null });
  },
}));

type ToastOptions = { title?: string; duration?: number };

/** Top-of-screen toast, callable from anywhere (screens, stores, API handlers). */
export const toast = {
  success: (message: string, options?: ToastOptions) =>
    useToastStore.getState().show({ variant: 'success', message, ...options }),
  error: (message: string, options?: ToastOptions) =>
    useToastStore.getState().show({ variant: 'error', message, ...options }),
  info: (message: string, options?: ToastOptions) =>
    useToastStore.getState().show({ variant: 'info', message, ...options }),
  warning: (message: string, options?: ToastOptions) =>
    useToastStore.getState().show({ variant: 'warning', message, ...options }),
  hide: () => useToastStore.getState().hide(),
};

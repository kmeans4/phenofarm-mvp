'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'loading' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const showToast = useCallback((type: ToastType, message: string, options?: ToastOptions) => {
    switch (type) {
      case 'success':
        return toast.success(message, options);
      case 'error':
        return toast.error(message, options);
      case 'loading':
        return toast.loading(message, options);
      case 'info':
        return toast.info(message, options);
      case 'warning':
        return toast.warning(message, options);
      default:
        return toast(message, options);
    }
  }, []);

  const update = useCallback(async <T,>(
    item: string,
    promise: Promise<T>,
    options?: ToastOptions
  ): Promise<T> => {
    toast.loading(`Saving ${item}...`, { id: `update-${item}` });
    try {
      const result = await promise;
      toast.success(`${item} saved successfully`, {
        id: `update-${item}`,
        ...options,
      });
      return result;
    } catch (error) {
      toast.error(`Failed to save ${item}`, {
        id: `update-${item}`,
        description: error instanceof Error ? error.message : undefined,
        ...options,
      });
      throw error;
    }
  }, []);

  return useMemo(() => ({
    showToast,
    update,
    toast,
  }), [showToast, update]);
}

export { toast };

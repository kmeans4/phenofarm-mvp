'use client';

import { toast } from 'sonner';

// Toast types for CRUD operations
export type ToastType = 'success' | 'error' | 'loading' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Pre-configured toast messages for common CRUD operations
export const toastMessages = {
  create: {
    loading: (item: string) => `Creating ${item}...`,
    success: (item: string) => `${item} created successfully`,
    error: (item: string) => `Failed to create ${item}`,
  },
  update: {
    loading: (item: string) => `Saving ${item}...`,
    success: (item: string) => `${item} saved successfully`,
    error: (item: string) => `Failed to save ${item}`,
  },
  delete: {
    loading: (item: string) => `Deleting ${item}...`,
    success: (item: string) => `${item} deleted successfully`,
    error: (item: string) => `Failed to delete ${item}`,
  },
  fetch: {
    loading: (item: string) => `Loading ${item}...`,
    success: (item: string) => `${item} loaded`,
    error: (item: string) => `Failed to load ${item}`,
  },
  upload: {
    loading: (item: string) => `Uploading ${item}...`,
    success: (item: string) => `${item} uploaded successfully`,
    error: (item: string) => `Failed to upload ${item}`,
  },
};

// Hook for standardized CRUD toasts
export function useToast() {
  const showToast = (type: ToastType, message: string, options?: ToastOptions) => {
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
  };

  const create = async <T,>(
    item: string,
    promise: Promise<T>,
    options?: ToastOptions
  ): Promise<T> => {
    toast.loading(toastMessages.create.loading(item), { id: `create-${item}` });
    try {
      const result = await promise;
      toast.success(toastMessages.create.success(item), {
        id: `create-${item}`,
        ...options,
      });
      return result;
    } catch (error) {
      toast.error(toastMessages.create.error(item), {
        id: `create-${item}`,
        description: error instanceof Error ? error.message : undefined,
        ...options,
      });
      throw error;
    }
  };

  const update = async <T,>(
    item: string,
    promise: Promise<T>,
    options?: ToastOptions
  ): Promise<T> => {
    toast.loading(toastMessages.update.loading(item), { id: `update-${item}` });
    try {
      const result = await promise;
      toast.success(toastMessages.update.success(item), {
        id: `update-${item}`,
        ...options,
      });
      return result;
    } catch (error) {
      toast.error(toastMessages.update.error(item), {
        id: `update-${item}`,
        description: error instanceof Error ? error.message : undefined,
        ...options,
      });
      throw error;
    }
  };

  const remove = async <T,>(
    item: string,
    promise: Promise<T>,
    options?: ToastOptions
  ): Promise<T> => {
    toast.loading(toastMessages.delete.loading(item), { id: `delete-${item}` });
    try {
      const result = await promise;
      toast.success(toastMessages.delete.success(item), {
        id: `delete-${item}`,
        ...options,
      });
      return result;
    } catch (error) {
      toast.error(toastMessages.delete.error(item), {
        id: `delete-${item}`,
        description: error instanceof Error ? error.message : undefined,
        ...options,
      });
      throw error;
    }
  };

  const fetch = async <T,>(
    item: string,
    promise: Promise<T>,
    options?: { errorOptions?: ToastOptions }
  ): Promise<T> => {
    try {
      const result = await promise;
      return result;
    } catch (error) {
      toast.error(toastMessages.fetch.error(item), {
        description: error instanceof Error ? error.message : undefined,
        ...options?.errorOptions,
      });
      throw error;
    }
  };

  const upload = async <T,>(
    item: string,
    promise: Promise<T>,
    options?: ToastOptions
  ): Promise<T> => {
    toast.loading(toastMessages.upload.loading(item), { id: `upload-${item}` });
    try {
      const result = await promise;
      toast.success(toastMessages.upload.success(item), {
        id: `upload-${item}`,
        ...options,
      });
      return result;
    } catch (error) {
      toast.error(toastMessages.upload.error(item), {
        id: `upload-${item}`,
        description: error instanceof Error ? error.message : undefined,
        ...options,
      });
      throw error;
    }
  };

  const dismiss = (toastId?: string | number) => {
    toast.dismiss(toastId);
  };

  return {
    showToast,
    create,
    update,
    remove,
    fetch,
    upload,
    dismiss,
    toast,
  };
}

export { toast };

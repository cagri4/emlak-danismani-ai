import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'
import { PhotoUpload } from '../types/photo'

interface UploadState {
  uploads: PhotoUpload[];
  activePropertyId: string | null;

  // Actions
  addUploads: (files: File[], propertyId: string) => void;
  updateProgress: (id: string, progress: number) => void;
  setComplete: (id: string, url: string) => void;
  setError: (id: string, error: string) => void;
  clearCompleted: () => void;
  getUploadsForProperty: (propertyId: string) => PhotoUpload[];
  hasActiveUploads: () => boolean;
}

/**
 * IndexedDB storage adapter for zustand persist middleware
 *
 * Uses idb-keyval for simple key-value storage in IndexedDB.
 * Benefits over localStorage:
 * - Works in service worker context
 * - No 5MB size limit
 * - Better performance for large objects
 */
const idbStorage: StateStorage = {
  getItem: async (name) => (await get(name)) || null,
  setItem: async (name, value) => set(name, value),
  removeItem: async (name) => del(name),
}

/**
 * Upload state management using zustand with IndexedDB persistence.
 *
 * Key benefits:
 * - State persists across route navigation (uploads continue in background)
 * - State survives page refresh and browser restart
 * - Works in service worker context (localStorage doesn't)
 *
 * Per user decision: Uploads continue in background when user navigates.
 */
export const useUploadStore = create<UploadState>()(
  persist(
    (set, get) => ({
  uploads: [],
  activePropertyId: null,

  addUploads: (files: File[], propertyId: string) => {
    const currentPropertyUploads = get().uploads.filter(
      (u) => u.propertyId === propertyId
    );
    const startOrder = currentPropertyUploads.length;

    const newUploads: PhotoUpload[] = files.map((file, index) => ({
      id: `${propertyId}-${Date.now()}-${index}`,
      file,
      propertyId,
      order: startOrder + index,
      progress: 0,
      status: 'pending',
    }));

    set((state) => ({
      uploads: [...state.uploads, ...newUploads],
      activePropertyId: propertyId,
    }));
  },

  updateProgress: (id: string, progress: number) => {
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.id === id
          ? { ...upload, progress, status: 'uploading' as const }
          : upload
      ),
    }));
  },

  setComplete: (id: string, url: string) => {
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.id === id
          ? {
              ...upload,
              status: 'done' as const,
              url,
              thumbnailUrl: url.replace(/(\.[^.]+)$/, '-thumb.jpg'),
              progress: 100,
            }
          : upload
      ),
    }));
  },

  setError: (id: string, error: string) => {
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.id === id
          ? { ...upload, status: 'error' as const, error }
          : upload
      ),
    }));
  },

  clearCompleted: () => {
    set((state) => ({
      uploads: state.uploads.filter((u) => u.status !== 'done'),
    }));
  },

  getUploadsForProperty: (propertyId: string) => {
    return get().uploads.filter((u) => u.propertyId === propertyId);
  },

  hasActiveUploads: () => {
    return get().uploads.some(
      (u) => u.status === 'pending' || u.status === 'uploading'
    );
  },
    }),
    {
      name: 'upload-store',
      storage: createJSONStorage(() => idbStorage),
    }
  )
)

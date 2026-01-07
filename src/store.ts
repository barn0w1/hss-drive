import { create } from 'zustand';
import { entries as initialEntries, spaces as initialSpaces, type Entry, type Space } from '@/data';
import type { UploadSession } from '@/features/upload/types';

interface DriveState {
  // Data
  spaces: Space[];
  entries: Record<string, Entry[]>; // spaceId -> entries
  uploads: Record<string, UploadSession>; // uploadId -> session

  // UI State
  activeSpaceId: string;
  currentPath: string;
  selectedPaths: Set<string>;

  // Actions
  setActiveSpace: (spaceId: string) => void;
  setCurrentPath: (path: string) => void;
  navigateUp: () => void;
  toggleSelection: (path: string, multi: boolean) => void;
  clearSelection: () => void;
  
  // Upload Actions
  addUpload: (session: UploadSession) => void;
  updateUploadProgress: (id: string, progress: number) => void;
  completeUpload: (id: string, hash: string) => void;
  failUpload: (id: string, error: string) => void;
  addEntry: (spaceId: string, entry: Entry) => void;

  // Computed (helper)
  getCurrentSpace: () => Space | undefined;
}

export const useDriveStore = create<DriveState>((set, get) => ({
  spaces: initialSpaces,
  entries: initialEntries,
  uploads: {},
  
  activeSpaceId: initialSpaces[0]?.id || 'personal',
  currentPath: '',
  selectedPaths: new Set(),

  setActiveSpace: (spaceId) => set({ 
    activeSpaceId: spaceId, 
    currentPath: '', 
    selectedPaths: new Set() 
  }),

  setCurrentPath: (path) => set({ 
    currentPath: path, 
    selectedPaths: new Set() 
  }),

  navigateUp: () => {
    const { currentPath } = get();
    if (!currentPath) return; // already at root
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    set({ currentPath: parentPath, selectedPaths: new Set() });
  },

  toggleSelection: (path, multi) => {
    const { selectedPaths } = get();
    const newSet = new Set(multi ? selectedPaths : []);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    set({ selectedPaths: newSet });
  },

  clearSelection: () => set({ selectedPaths: new Set() }),

  addUpload: (session) => set((state) => ({
    uploads: { ...state.uploads, [session.id]: session }
  })),

  updateUploadProgress: (id, progress) => set((state) => {
     const session = state.uploads[id];
     if (!session) return {};
     return {
        uploads: {
            ...state.uploads,
            [id]: { ...session, progress }
        }
     };
  }),

  completeUpload: (id, hash) => set((state) => {
    const session = state.uploads[id];
    if (!session) return {};
    return {
       uploads: {
           ...state.uploads,
           [id]: { ...session, status: 'completed', hash, progress: 100 }
       }
    };
  }),
  
  failUpload: (id, error) => set((state) => {
    const session = state.uploads[id];
    if (!session) return {};
    return {
       uploads: {
           ...state.uploads,
           [id]: { ...session, status: 'error', error }
       }
    };
  }),

  addEntry: (spaceId, entry) => set((state) => {
      const spaceEntries = state.entries[spaceId] || [];
      // Remove existing entry with same path if it exists (upsert)
      const filtered = spaceEntries.filter(e => e.path !== entry.path);
      return {
          entries: {
              ...state.entries,
              [spaceId]: [...filtered, entry]
          }
      };
  }),

  getCurrentSpace: () => {
    const { spaces, activeSpaceId } = get();
    return spaces.find(s => s.id === activeSpaceId);
  },
}));

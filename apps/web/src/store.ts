import { create } from 'zustand';
import { type Entry } from '@/data';
import type { UploadSession } from '@/features/upload/types';

export interface Space {
    id: string;
    name: string;
    ownerId: string;
    meta?: any;
    createdAt: string;
}

export interface User {
    id: string;
    username: string;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

interface DriveState extends AuthState {
  // Data
  spaces: Space[];
  entries: Record<string, Entry[]>; // spaceId -> entries
  uploads: Record<string, UploadSession>; // uploadId -> session

  // UI State
  activeSpaceId: string | null;
  currentPath: string;
  selectedPaths: Set<string>;

  // Actions
  fetchSpaces: () => Promise<void>;
  createSpace: (name: string) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;

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
  // Auth State
  user: null,
  isAuthenticated: false,
  
  login: async (username: string) => {
      const res = await fetch('/api/auth/dev-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
      });
      if (res.ok) {
          const { user } = await res.json();
          set({ user, isAuthenticated: true });
          await get().fetchSpaces();
      } else {
          throw new Error('Login failed');
      }
  },

  logout: async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      set({ user: null, isAuthenticated: false, spaces: [], activeSpaceId: null });
  },

  checkAuth: async () => {
      try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
              const { user } = await res.json();
              if (user) {
                  set({ user, isAuthenticated: true });
                  await get().fetchSpaces();
              }
          }
      } catch (e) {
          console.error("Auth Check Failed", e);
      }
  },

  // Drive Data
  spaces: [],
  entries: {},
  uploads: {},
  
  activeSpaceId: null,
  currentPath: '',
  selectedPaths: new Set(),

  fetchSpaces: async () => {
      const res = await fetch('/api/spaces');
      if (res.ok) {
          const { spaces } = await res.json();
          set({ spaces });
          // Set active space if none or invalid
          const { activeSpaceId } = get();
          if (!activeSpaceId && spaces.length > 0) {
              set({ activeSpaceId: spaces[0].id });
          }
      }
  },

  createSpace: async (name: string) => {
      const res = await fetch('/api/spaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
      });
      if (res.ok) {
          await get().fetchSpaces();
      }
  },

  deleteSpace: async (id: string) => {
      await fetch(`/api/spaces/${id}`, { method: 'DELETE' });
      await get().fetchSpaces();
  },

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

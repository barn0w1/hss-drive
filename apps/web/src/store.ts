import { create } from 'zustand';
import type { UploadSession } from '@/features/upload/types';

export type EntryType = 'file' | 'dir';

export interface Entry {
  id: string; // UUID
  parentId: string | null;
  name: string;
  type: EntryType;
  size: number;
  mimeType?: string;
  isStarred: boolean;
  isTrashed: boolean;
  updatedAt: string;
}

export interface Breadcrumb {
    id: string | null; // null for root
    name: string;
}

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
  items: Entry[]; // Current folder items
  uploads: Record<string, UploadSession>;

  // UI State
  activeSpaceId: string | null;
  currentFolderId: string | null; 
  breadcrumbs: Breadcrumb[];
  pinnedSpaceIds: string[];
  
  selectedIds: Set<string>;

  // Actions
  fetchSpaces: () => Promise<void>;
  createSpace: (name: string) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  toggleSpacePin: (id: string) => void;

  setActiveSpace: (spaceId: string | null) => void;
  
  // Folder Navigation
  openFolder: (folderId: string | null, folderName?: string) => void;
  navigateUp: () => void;
  refreshFolder: () => Promise<void>;
  
  createFolder: (name: string) => Promise<void>;
  
  toggleSelection: (id: string, multi: boolean) => void;
  clearSelection: () => void;
  
  // Upload Actions
  addUpload: (session: UploadSession) => void;
  updateUploadProgress: (id: string, updates: Partial<UploadSession>) => void;
  completeUpload: (id: string, hash: string) => void;
  failUpload: (id: string, error: string) => void;
  
  // Computed
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
  items: [],
  uploads: {},
  
  activeSpaceId: null,
  currentFolderId: null,
  breadcrumbs: [{ id: null, name: 'Home' }],
  selectedIds: new Set(),
  pinnedSpaceIds: JSON.parse(localStorage.getItem('hss_pinned_spaces') || '[]'),

  fetchSpaces: async () => {
      const res = await fetch('/api/spaces');
      if (res.ok) {
          const { spaces } = await res.json();
          set({ spaces });
          // Auto-selection disabled to show Space Dashboard by default
          // const { activeSpaceId } = get();
          // if (!activeSpaceId && spaces.length > 0) {
          //    get().setActiveSpace(spaces[0].id);
          // }
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

  toggleSpacePin: (id: string) => set((state) => {
    const isPinned = state.pinnedSpaceIds.includes(id);
    const newPins = isPinned 
        ? state.pinnedSpaceIds.filter(pid => pid !== id)
        : [...state.pinnedSpaceIds, id];
    
    try {
        localStorage.setItem('hss_pinned_spaces', JSON.stringify(newPins));
    } catch (e) { console.error("Failed to save pins", e); }
    return { pinnedSpaceIds: newPins };
  }),

  setActiveSpace: (spaceId) => {
      set({ 
          activeSpaceId: spaceId, 
          currentFolderId: null, 
          breadcrumbs: [{ id: null, name: 'Home' }],
          selectedIds: new Set()
      });
      get().refreshFolder();
  },

  openFolder: (folderId, folderName) => {
      const { breadcrumbs, activeSpaceId } = get();
      if (!activeSpaceId) return;

      let newBreadcrumbs = [...breadcrumbs];
      if (!folderId) {
          newBreadcrumbs = [{ id: null, name: 'Home' }];
      } else {
          const index = newBreadcrumbs.findIndex(b => b.id === folderId);
          if (index !== -1) {
              newBreadcrumbs = newBreadcrumbs.slice(0, index + 1);
          } else {
              newBreadcrumbs.push({ id: folderId, name: folderName || 'Folder' });
          }
      }

      set({ 
          currentFolderId: folderId, 
          breadcrumbs: newBreadcrumbs, 
          selectedIds: new Set() 
      });
      get().refreshFolder();
  },

  navigateUp: () => {
      const { breadcrumbs } = get();
      if (breadcrumbs.length <= 1) return;
      const parent = breadcrumbs[breadcrumbs.length - 2];
      get().openFolder(parent.id, parent.name);
  },

  refreshFolder: async () => {
      const { activeSpaceId, currentFolderId } = get();
      if (!activeSpaceId) return;
      
      const query = currentFolderId ? `?parentId=${currentFolderId}` : '';
      const res = await fetch(`/api/spaces/${activeSpaceId}/files${query}`);
      if (res.ok) {
          const { files } = await res.json();
          set({ items: files });
      }
  },

  createFolder: async (name) => {
      const { activeSpaceId, currentFolderId } = get();
      if (!activeSpaceId) return;
      
      await fetch(`/api/spaces/${activeSpaceId}/files/folder`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ name, parentId: currentFolderId })
      });
      get().refreshFolder();
  },

  toggleSelection: (id, multi) => {
    const { selectedIds } = get();
    const newSet = new Set(multi ? selectedIds : []);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    set({ selectedIds: newSet });
  },

  clearSelection: () => set({ selectedIds: new Set() }),

  addUpload: (session) => set((state) => ({
    uploads: { ...state.uploads, [session.id]: session }
  })),

  updateUploadProgress: (id, updates) => set((state) => {
     const session = state.uploads[id];
     if (!session) return {};
     return {
        uploads: {
            ...state.uploads,
            [id]: { ...session, ...updates }
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

  getCurrentSpace: () => {
    const { spaces, activeSpaceId } = get();
    return spaces.find(s => s.id === activeSpaceId);
  },
}));

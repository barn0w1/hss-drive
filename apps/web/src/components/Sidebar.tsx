import { 
  Plus,
  Box,
  Trash2,
  LogOut,
  FolderPlus,
  LayoutGrid,
  Pin,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { useDriveStore } from '@/store';
import { useRef, useState, useMemo } from 'react';
import { Uploader } from '@/features/upload/Uploader';

export function Sidebar() {
  const spaces = useDriveStore((state) => state.spaces);
  const activeSpaceId = useDriveStore((state) => state.activeSpaceId);
  const pinnedSpaceIds = useDriveStore((state) => state.pinnedSpaceIds);
  const toggleSpacePin = useDriveStore((state) => state.toggleSpacePin);
  const setActiveSpace = useDriveStore((state) => state.setActiveSpace);
  const createSpace = useDriveStore((state) => state.createSpace);
  const deleteSpace = useDriveStore((state) => state.deleteSpace);
  const logout = useDriveStore((state) => state.logout);
  const currentFolderId = useDriveStore((state) => state.currentFolderId);
  const createFolder = useDriveStore((state) => state.createFolder);
  
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pinnedSpaces = useMemo(() => spaces.filter(s => pinnedSpaceIds.includes(s.id)), [spaces, pinnedSpaceIds]);
  const otherSpaces = useMemo(() => spaces.filter(s => !pinnedSpaceIds.includes(s.id)), [spaces, pinnedSpaceIds]);

  const handleCreateSpace = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newSpaceName.trim()) return;
      await createSpace(newSpaceName);
      setNewSpaceName('');
      setIsCreatingSpace(false);
  };

  const handleCreateFolder = async () => {
      const name = prompt("Enter folder name");
      if (name) {
          await createFolder(name);
      }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (!activeSpaceId) {
          alert("Please select a space first");
          return;
      }
      const files = Array.from(e.target.files);
      const targetSpaceId = activeSpaceId; 
      const targetFolderId = currentFolderId;

      files.forEach(file => {
        const uploadId = Math.random().toString(36).substring(7);
        useDriveStore.getState().addUpload({
          id: uploadId,
          spaceId: targetSpaceId, 
          file: file,
          progress: 0,
          hashProgress: 0,
          uploadProgress: 0,
          status: 'pending',
          targetPath: targetFolderId || 'root'
        });

        const uploader = new Uploader(file, {
          spaceId: targetSpaceId,
          parentId: targetFolderId,
          onProgress: (progress) => {
             useDriveStore.getState().updateUploadProgress(uploadId, progress);
          },
          onComplete: (hash) => {
             useDriveStore.getState().completeUpload(uploadId, hash);
             useDriveStore.getState().refreshFolder();
          },
          onError: (err) => {
             useDriveStore.getState().failUpload(uploadId, err.message || 'Unknown error');
          }
        });
        
        uploader.upload().catch(console.error);
      });
    }
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col pt-6 pb-4">
      <div className="px-5 mb-8">
        <h1 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Box className="w-5 h-5" />
            </div>
            HSS Drive
        </h1>

        <button 
          onClick={handleUploadClick}
          disabled={!activeSpaceId}
          className={clsx(
            "w-full rounded-xl py-3 px-4 shadow-sm flex items-center justify-center gap-2 transition-all font-medium mb-3",
            activeSpaceId 
                ? "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md cursor-pointer" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
        >
          <Plus className="w-5 h-5" />
          <span>New Upload</span>
        </button>
        <button
            onClick={handleCreateFolder}
            disabled={!activeSpaceId}
            className={clsx(
                "w-full border border-gray-200 rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 transition-all font-medium text-sm",
                activeSpaceId
                    ? "text-gray-700 hover:bg-gray-100 bg-white"
                    : "text-gray-300 border-gray-100 bg-transparent cursor-not-allowed"
            )}
        >
            <FolderPlus className="w-4 h-4" />
            <span>New Folder</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple
          onChange={handleFileSelect}
        />
      </div>

      <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
        {/* Main Nav */}
        <div className="space-y-1">
            <button
                onClick={() => setActiveSpace(null)}
                className={clsx(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    !activeSpaceId
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                )}
            >
                <LayoutGrid className={clsx("w-5 h-5", !activeSpaceId ? "text-blue-500" : "text-gray-400")} />
                Dashboard
            </button>
        </div>

        {/* Pinned Spaces */}
        {pinnedSpaces.length > 0 && (
            <div>
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Pinned Spaces
                </h3>
                <div className="space-y-0.5">
                    {pinnedSpaces.map(space => (
                        <div key={space.id} className="group relative flex items-center">
                            <button
                                onClick={() => setActiveSpace(space.id)}
                                className={clsx(
                                    "flex-1 flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                    activeSpaceId === space.id
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-700 hover:bg-gray-100"
                                )}
                            >
                                <Pin className={clsx("w-4 h-4", activeSpaceId === space.id ? "text-blue-500 fill-current" : "text-gray-400 fill-current")} />
                                <span className="truncate">{space.name}</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleSpacePin(space.id); }}
                                className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-400"
                                title="Unpin"
                            >
                                <Pin className="w-3 h-3 fill-none" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* All Spaces (Collapsible or just listed?) - Listing for accessibility but maybe hiding if not pinned? 
            Let's list all spaces but separate 'Other Spaces' 
        */}
        <div>
            <div className="flex items-center justify-between px-3 mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    All Spaces
                </h3>
                <button 
                    onClick={() => setIsCreatingSpace(true)}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>
            
            {isCreatingSpace && (
                <form onSubmit={handleCreateSpace} className="px-3 mb-2">
                    <input
                        autoFocus
                        type="text"
                        className="w-full text-sm border border-blue-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="Space name..."
                        value={newSpaceName}
                        onChange={e => setNewSpaceName(e.target.value)}
                        onBlur={() => !newSpaceName && setIsCreatingSpace(false)}
                    />
                </form>
            )}

            <div className="space-y-0.5">
                {otherSpaces.map(space => (
                    <div key={space.id} className="group relative flex items-center">
                        <button
                            onClick={() => setActiveSpace(space.id)}
                            className={clsx(
                                "flex-1 flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                activeSpaceId === space.id
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-700 hover:bg-gray-100"
                            )}
                        >
                            <Box className={clsx("w-4 h-4", activeSpaceId === space.id ? "text-blue-500" : "text-gray-400")} />
                            <span className="truncate">{space.name}</span>
                        </button>
                        <div className="absolute right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={(e) => { e.stopPropagation(); toggleSpacePin(space.id); }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Pin"
                            >
                                <Pin className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteSpace(space.id); }}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                title="Delete"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </nav>

      <div className="px-5 pt-4 border-t border-gray-200">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 w-full transition-colors group">
          <LogOut className="w-4 h-4 group-hover:stroke-red-600" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

import React, { useMemo, useRef } from 'react';
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Download,
  Trash,
  Edit2,
  Pin,
  MoreVertical,
  HardDrive,
  User as UserIcon,
  LayoutGrid,
  Plus,
  FolderPlus
} from 'lucide-react';
import { useDriveStore, Entry, Space } from '@/store';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Uploader } from '@/features/upload/Uploader';
import clsx from 'clsx';

function FileIcon({ item }: { item: Entry }) {
    if (item.type === 'dir') return <Folder className="w-5 h-5 text-blue-500 fill-blue-500/10" />;
    if (item.mimeType?.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-[#8B5CF6]" />;
    if (item.mimeType?.includes('pdf')) return <FileText className="w-5 h-5 text-[#EF4444]" />;
    return <FileText className="w-5 h-5 text-[#9CA3AF]" />;
}

function SpaceCard({ space, isPinned, onPin, onClick }: { space: Space, isPinned: boolean, onPin: (e: React.MouseEvent) => void, onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="group relative bg-white border border-[#E5E7EB] rounded-lg p-5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer flex flex-col justify-between h-40"
        >
            <div className="flex justify-between items-start">
                <div className="p-2.5 bg-[#F9FAFB] rounded-lg text-[#2563EB] group-hover:bg-blue-50 transition-colors">
                    <HardDrive className="w-5 h-5" />
                </div>
                <button 
                    onClick={onPin}
                    className={clsx(
                        "p-1.5 rounded-full transition-colors",
                        isPinned ? "text-[#2563EB] bg-blue-50" : "text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#4B5563] opacity-0 group-hover:opacity-100"
                    )}
                >
                    <Pin className={clsx("w-3.5 h-3.5", isPinned && "fill-current")} />
                </button>
            </div>
            
            <div>
                <h3 className="font-semibold text-[#111827] truncate text-base tracking-tight" title={space.name}>{space.name}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs font-medium text-[#6B7280]">
                    <span className="flex items-center gap-1.5 bg-[#F9FAFB] px-2 py-0.5 rounded-full border border-[#F3F4F6]">
                        <UserIcon className="w-3 h-3" /> Me
                    </span>
                    <span>{new Date(space.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
}

export function FileBrowser() {
  const items = useDriveStore((state) => state.items);
  const spaces = useDriveStore((state) => state.spaces);
  const activeSpaceId = useDriveStore((state) => state.activeSpaceId);
  const pinnedSpaceIds = useDriveStore((state) => state.pinnedSpaceIds);
  const selectedIds = useDriveStore((state) => state.selectedIds);
  
  const openFolder = useDriveStore((state) => state.openFolder);
  const toggleSelection = useDriveStore((state) => state.toggleSelection);
  const setActiveSpace = useDriveStore((state) => state.setActiveSpace);
  const toggleSpacePin = useDriveStore((state) => state.toggleSpacePin);
  
  // Actions
  const currentFolderId = useDriveStore((state) => state.currentFolderId);
  const createFolder = useDriveStore((state) => state.createFolder);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pinnedSpaces = useMemo(() => spaces.filter(s => pinnedSpaceIds.includes(s.id)), [spaces, pinnedSpaceIds]);
  const otherSpaces = useMemo(() => spaces.filter(s => !pinnedSpaceIds.includes(s.id)), [spaces, pinnedSpaceIds]);

  const handleRowClick = (e: React.MouseEvent, id: string) => {
    const multi = e.metaKey || e.ctrlKey;
    toggleSelection(id, multi);
  };

  const handleDoubleClick = (item: Entry) => {
    if (item.type === 'dir') {
      openFolder(item.id, item.name);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // --- ACTIONS ---
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
      if (!activeSpaceId) return;
      
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


  // --- SPACE DASHBOARD VIEW ---
  if (!activeSpaceId) {
      return (
          <div className="flex-1 p-8 overflow-y-auto bg-white h-[calc(100vh-2rem)]">
              <div className="max-w-6xl mx-auto pb-10">
                <header className="mb-10">
                    <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Dashboard</h1>
                    <p className="text-[#6B7280] mt-1 text-sm">Manage your spaces and pinned items</p>
                </header>

                {pinnedSpaces.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Pin className="w-3 h-3" /> Pinned Spaces
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {pinnedSpaces.map(space => (
                                <SpaceCard 
                                    key={space.id} 
                                    space={space} 
                                    isPinned={true} 
                                    onPin={(e) => { e.stopPropagation(); toggleSpacePin(space.id); }}
                                    onClick={() => setActiveSpace(space.id)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <h2 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-4 flex items-center gap-2">
                         <LayoutGrid className="w-3 h-3" /> All Spaces
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {otherSpaces.map(space => (
                            <SpaceCard 
                                key={space.id} 
                                space={space} 
                                isPinned={false} 
                                onPin={(e) => { e.stopPropagation(); toggleSpacePin(space.id); }}
                                onClick={() => setActiveSpace(space.id)}
                            />
                        ))}
                        {spaces.length === 0 && (
                            <div className="col-span-full py-16 text-center text-[#9CA3AF] border border-dashed border-[#E5E7EB] rounded-lg bg-[#F9FAFB]">
                                <HardDrive className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="font-medium text-sm">No spaces found</p>
                                <p className="text-xs mt-1">Create a new space from the sidebar to get started.</p>
                            </div>
                        )}
                    </div>
                </section>
              </div>
          </div>
      );
  }

  // --- FILE BROWSER VIEW ---
  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        multiple 
        onChange={handleFileSelect} 
      />

      {/* Header */}
      <div className="border-b border-[#E5E7EB] px-6 py-3 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-20">
         <div className="flex items-center gap-3">
            <button 
                onClick={() => setActiveSpace(null)} // Go back to dashboard
                className="p-1.5 -ml-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md transition-all"
                title="Back to Dashboard"
            >
                <LayoutGrid className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-[#E5E7EB]" />
            <Breadcrumbs />
         </div>
         
         <div className="flex items-center gap-2">
             {/* Action Buttons */}
            <button 
                onClick={handleUploadClick}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#111827] text-white rounded-md text-sm font-medium hover:bg-black transition-all shadow-sm shadow-gray-200"
            >
                <Plus className="w-4 h-4" /> 
                <span className="hidden sm:inline">Upload</span>
            </button>
            <button 
                onClick={handleCreateFolder}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#374151] rounded-md text-sm font-medium hover:bg-[#F9FAFB] transition-colors"
            >
                <FolderPlus className="w-4 h-4" /> 
                <span className="hidden sm:inline">New Folder</span>
            </button>
            
            <div className="h-4 w-px bg-[#E5E7EB] mx-2" />

            {selectedIds.size > 0 ? (
               <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-[#2563EB] mr-2">{selectedIds.size} selected</span>
                  
                  <button className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md transition-colors" title="Download">
                     <Download className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md transition-colors" title="Rename">
                     <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-md transition-colors" title="Delete">
                     <Trash className="w-4 h-4" />
                  </button>
               </div>
            ) : (
                <div className="text-xs text-[#9CA3AF] font-medium px-2">
                    {items.length} items
                </div>
            )}
         </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F9FAFB] sticky top-0 z-10 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider backdrop-blur-md">
            <tr>
              <th className="px-6 py-3 border-b border-[#E5E7EB] min-w-[300px] font-medium">Name</th>
              <th className="px-6 py-3 border-b border-[#E5E7EB] w-[180px] font-medium">Owner</th>
              <th className="px-6 py-3 border-b border-[#E5E7EB] w-[180px] font-medium">Date Modified</th>
              <th className="px-6 py-3 border-b border-[#E5E7EB] w-[120px] text-right font-medium">Size</th>
              <th className="px-6 py-3 border-b border-[#E5E7EB] w-[60px]"></th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {items.length === 0 ? (
               <tr>
                  <td colSpan={5} className="py-32 text-center text-[#9CA3AF]">
                      <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 bg-[#F9FAFB] rounded-full flex items-center justify-center mb-4 border border-[#F3F4F6]">
                              <Folder className="w-6 h-6 opacity-20" />
                          </div>
                          <p className="text-sm">This folder is empty</p>
                          <button onClick={handleUploadClick} className="mt-3 text-sm font-medium text-[#2563EB] hover:underline">Upload a file</button>
                      </div>
                  </td>
               </tr>
            ) : items.map((item) => (
              <tr 
                key={item.id}
                onClick={(e) => handleRowClick(e, item.id)}
                onDoubleClick={() => handleDoubleClick(item)}
                className={clsx(
                  "group transition-colors cursor-pointer select-none h-[52px]",
                  selectedIds.has(item.id) 
                    ? "bg-[#EFF6FF]" 
                    : "hover:bg-[#F9FAFB] border-b border-[#F9FAFB] last:border-0"
                )}
              >
                <td className="px-6 py-2">
                  <div className="flex items-center gap-3">
                    <FileIcon item={item} />
                    <span className={clsx(
                        "font-medium text-sm truncate max-w-[300px]",
                        selectedIds.has(item.id) ? "text-[#1D4ED8]" : "text-[#111827]"
                    )}>
                        {item.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-2">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[10px] font-bold text-[#6B7280]">
                             Me
                        </div>
                        <span className="text-sm text-[#6B7280]">Me</span>
                    </div>
                </td>
                <td className="px-6 py-2 text-sm text-[#6B7280]">
                    {new Date(item.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-2 text-sm text-[#6B7280] text-right font-mono">
                    {item.type === 'dir' ? '-' : formatSize(item.size)}
                </td>
                <td className="px-6 py-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-[#E5E7EB] rounded text-[#9CA3AF] hover:text-[#4B5563]">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

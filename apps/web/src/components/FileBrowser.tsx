import React, { useMemo } from 'react';
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
  LayoutGrid
} from 'lucide-react';
import { useDriveStore, Entry, Space } from '@/store';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import clsx from 'clsx';

function FileIcon({ item }: { item: Entry }) {
    if (item.type === 'dir') return <Folder className="w-5 h-5 text-blue-500 fill-blue-500/20" />;
    if (item.mimeType?.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (item.mimeType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <FileText className="w-5 h-5 text-gray-400" />;
}

function SpaceCard({ space, isPinned, onPin, onClick }: { space: Space, isPinned: boolean, onPin: (e: React.MouseEvent) => void, onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer flex flex-col justify-between h-44"
        >
            <div className="flex justify-between items-start">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <HardDrive className="w-6 h-6" />
                </div>
                <button 
                    onClick={onPin}
                    className={clsx(
                        "p-1.5 rounded-full transition-colors",
                        isPinned ? "text-blue-600 bg-blue-50" : "text-gray-300 hover:bg-gray-100 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                    )}
                >
                    <Pin className={clsx("w-4 h-4", isPinned && "fill-current")} />
                </button>
            </div>
            
            <div>
                <h3 className="font-semibold text-gray-900 truncate text-lg" title={space.name}>{space.name}</h3>
                <div className="flex items-center gap-3 mt-3 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full">
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

  // --- SPACE DASHBOARD VIEW ---
  if (!activeSpaceId) {
      return (
          <div className="p-8 h-full overflow-y-auto bg-gray-50">
              <div className="max-w-7xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 mt-2">Manage your spaces and pinned items</p>
                </header>

                {pinnedSpaces.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <Pin className="w-3.5 h-3.5" /> Pinned Spaces
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                         <LayoutGrid className="w-3.5 h-3.5" /> All Spaces
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                            <div className="col-span-full py-16 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                <HardDrive className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="font-medium">No spaces found</p>
                                <p className="text-sm mt-1">Create a new space from the sidebar to get started.</p>
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-20 transition-all">
         <div className="flex items-center gap-4">
            <button 
                onClick={() => setActiveSpace(null)} // Go back to dashboard
                className="p-2 -ml-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                title="Back to Dashboard"
            >
                <LayoutGrid className="w-5 h-5" />
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <Breadcrumbs />
         </div>
         
         <div className="flex items-center gap-2">
            {selectedIds.size > 0 ? (
               <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium animate-in fade-in slide-in-from-top-2 shadow-sm border border-blue-100">
                  <span>{selectedIds.size} selected</span>
                  <div className="h-4 w-px bg-blue-200 mx-2" />
                  <button className="p-1.5 hover:bg-blue-100 rounded-full transition-colors" title="Download">
                     <Download className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 hover:bg-blue-100 rounded-full transition-colors" title="Rename">
                     <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 hover:bg-blue-100 rounded-full transition-colors" title="Delete">
                     <Trash className="w-4 h-4" />
                  </button>
               </div>
            ) : (
                <div className="text-sm text-gray-400 font-medium px-2">
                    {items.length} items
                </div>
            )}
         </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 sticky top-0 z-10 text-[11px] font-bold text-gray-400 uppercase tracking-widest backdrop-blur-md">
            <tr>
              <th className="px-6 py-4 border-b border-gray-100 min-w-[300px]">Name</th>
              <th className="px-6 py-4 border-b border-gray-100 w-[180px]">Owner</th>
              <th className="px-6 py-4 border-b border-gray-100 w-[180px]">Date Modified</th>
              <th className="px-6 py-4 border-b border-gray-100 w-[120px] text-right">File Size</th>
              <th className="px-6 py-4 border-b border-gray-100 w-[60px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {items.map((item: Entry) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <tr 
                  key={item.id}
                  onClick={(e) => handleRowClick(e, item.id)}
                  onDoubleClick={() => handleDoubleClick(item)}
                  className={clsx(
                    "cursor-pointer transition-all duration-200 group",
                    isSelected ? "bg-blue-50/80" : "hover:bg-gray-50"
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={clsx("transition-transform duration-200", isSelected && "scale-110")}>
                        <FileIcon item={item} />
                      </div>
                      <span className={clsx("font-medium truncate max-w-[320px]", isSelected ? "text-blue-700" : "text-gray-700")}>
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                            ME
                        </div>
                        <span className="text-gray-500 text-xs">Me</span>
                      </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                      {item.updatedAt ? (
                          <span className="group-hover:text-gray-900 transition-colors delay-75">
                            {new Date(item.updatedAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                      ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-right font-mono text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                    {formatSize(item.size)}
                  </td>
                  <td className="px-6 py-4 text-right">
                      <button className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                          <MoreVertical className="w-4 h-4" />
                      </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {items.length === 0 && (
           <div className="flex flex-col items-center justify-center h-[50vh] text-gray-300">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 animate-in fade-in zoom-in-50 duration-500">
                  <Folder className="w-10 h-10 text-gray-200" />
              </div>
              <p className="font-medium text-gray-400 text-lg">Empty Folder</p>
              <p className="text-sm text-gray-300 mt-2 max-w-[200px] text-center">Drag files here to upload or create a new folder.</p>
           </div>
        )}
      </div>
    </div>
  );
}

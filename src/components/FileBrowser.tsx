import React, { useMemo } from 'react';
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  MoreVertical,
  Download,
  Trash,
  Edit2
} from 'lucide-react';
import type { Entry } from '@/data';
import { useDriveStore } from '@/store';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import clsx from 'clsx';

export function FileBrowser() {
  const entries = useDriveStore((state) => state.entries);
  const activeSpaceId = useDriveStore((state) => state.activeSpaceId);
  const currentPath = useDriveStore((state) => state.currentPath);
  const selectedPaths = useDriveStore((state) => state.selectedPaths);
  const setCurrentPath = useDriveStore((state) => state.setCurrentPath);
  const toggleSelection = useDriveStore((state) => state.toggleSelection);

  const items = useMemo(() => {
    const spaceEntries = entries[activeSpaceId] || [];

    return spaceEntries.filter(item => {
      // If currentPath is empty, we want top-level items (no slash)
      if (currentPath === "") {
        return !item.path.includes('/');
      }

      // Check if item starts with currentPath
      if (!item.path.startsWith(currentPath + '/')) {
        return false;
      }

      // Ensure it's a direct child (no extra slashes after prefix)
      const relativePath = item.path.slice(currentPath.length + 1);
      return !relativePath.includes('/');
    });
  }, [entries, activeSpaceId, currentPath]);

  const handleRowClick = (e: React.MouseEvent, path: string) => {
    // ctrl/cmd key for multi select
    const multi = e.metaKey || e.ctrlKey;
    toggleSelection(path, multi);
  };

  const handleDoubleClick = (item: Entry) => {
    if (item.type === 'dir') {
      setCurrentPath(item.path);
    }
  };

  const getIcon = (item: Entry) => {
    if (item.type === 'dir') return <Folder className="w-5 h-5 text-gray-500 fill-gray-500/20" />;
    // Simple extension check
    if (item.name.endsWith('.jpg') || item.name.endsWith('.png')) return <ImageIcon className="w-5 h-5 text-red-500" />;
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200">
         <Breadcrumbs />
         
         <div className="flex items-center justify-between px-4 pb-2">
            <h2 className="text-sm font-medium text-gray-500">
               {items.length === 0 ? 'Empty folder' : `${items.length} items`}
            </h2>
            
            {/* Action bar for selection */}
            {selectedPaths.size > 0 && (
               <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm transition-all animate-in fade-in slide-in-from-top-1">
                  <span>{selectedPaths.size} selected</span>
                  <div className="h-4 w-px bg-blue-200 mx-1" />
                  <button className="p-1 hover:bg-blue-100 rounded" title="Download">
                     <Download className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-blue-100 rounded" title="Rename">
                     <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-blue-100 rounded" title="Delete">
                     <Trash className="w-4 h-4" />
                  </button>
               </div>
            )}
         </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white sticky top-0 z-10 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 min-w-[300px]">Name</th>
              <th className="px-4 py-3 w-[150px]">Owner</th>
              <th className="px-4 py-3 w-[150px]">Last modified</th>
              <th className="px-4 py-3 w-[100px]">File size</th>
              <th className="px-4 py-3 w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const isSelected = selectedPaths.has(item.path);
              return (
                <tr 
                  key={item.path}
                  onClick={(e) => handleRowClick(e, item.path)}
                  onDoubleClick={() => handleDoubleClick(item)}
                  className={clsx(
                    "cursor-pointer group transition-colors",
                    isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {getIcon(item)}
                      <span className={clsx("text-sm font-medium", isSelected ? "text-blue-700" : "text-gray-700")}>
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">me</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.updatedAt}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatSize(item.size)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {items.length === 0 && (
           <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Folder className="w-16 h-16 mb-4 opacity-20" />
              <p>No files in here</p>
           </div>
        )}
      </div>
    </div>
  );
}


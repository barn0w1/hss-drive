import React from 'react';
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Download,
  Trash,
  Edit2
} from 'lucide-react';
import { useDriveStore, Entry } from '@/store';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import clsx from 'clsx';

export function FileBrowser() {
  const items = useDriveStore((state) => state.items);
  const selectedIds = useDriveStore((state) => state.selectedIds);
  const openFolder = useDriveStore((state) => state.openFolder);
  const toggleSelection = useDriveStore((state) => state.toggleSelection);

  const handleRowClick = (e: React.MouseEvent, id: string) => {
    // ctrl/cmd key for multi select
    const multi = e.metaKey || e.ctrlKey;
    toggleSelection(id, multi);
  };

  const handleDoubleClick = (item: Entry) => {
    if (item.type === 'dir') {
      openFolder(item.id, item.name);
    }
  };

  const getIcon = (item: Entry) => {
    if (item.type === 'dir') return <Folder className="w-5 h-5 text-gray-500 fill-gray-500/20" />;
    // Simple extension check
    if (item.mimeType?.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-';
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
            {selectedIds.size > 0 && (
               <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm transition-all animate-in fade-in slide-in-from-top-1">
                  <span>{selectedIds.size} selected</span>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item: Entry) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <tr 
                  key={item.id}
                  onClick={(e) => handleRowClick(e, item.id)}
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
                  <td className="px-4 py-3 text-sm text-gray-500">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatSize(item.size)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
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


import { X, FileText, Image as ImageIcon, Folder, Copy, Check, File } from 'lucide-react';
import { useDriveStore, Entry } from '@/store';
import clsx from 'clsx';
import { useState, useEffect } from 'react';

export function Inspector() {
  const selectedIds = useDriveStore((state) => state.selectedIds);
  const items = useDriveStore((state) => state.items);
  const clearSelection = useDriveStore((state) => state.clearSelection);
  const spaces = useDriveStore((state) => state.spaces);
  const activeSpaceId = useDriveStore((state) => state.activeSpaceId);

  const [copied, setCopied] = useState(false);

  // Derive selection
  const selectedItem = Array.from(selectedIds).map(id => items.find(i => i.id === id)).filter(Boolean)[0];

  useEffect(() => {
     setCopied(false);
  }, [selectedItem]);

  const copyHash = () => {
      if (selectedItem?.blobHash) {
          navigator.clipboard.writeText(selectedItem.blobHash);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  if (selectedIds.size === 0) {
      return null;
  }

  // Multi-select view (Soft Inspector)
  if (selectedIds.size > 1) {
       return (
          <aside className="w-[300px] border-l border-[#E5E7EB] bg-white flex flex-col h-full animate-in slide-in-from-right-2 duration-300 z-30">
              <div className="flex justify-between items-center px-4 py-3 border-b border-[#F9FAFB]">
                  <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Selection</h3>
                  <button onClick={clearSelection} className="p-1 hover:bg-[#F3F4F6] rounded text-[#9CA3AF] hover:text-[#4B5563]">
                      <X className="w-3.5 h-3.5" />
                  </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-[#EFF6FF] text-[#3B82F6] rounded-2xl flex items-center justify-center mb-4 ring-4 ring-[#EFF6FF]">
                      <div className="font-bold text-xl">{selectedIds.size}</div>
                  </div>
                  <h4 className="font-medium text-[#111827]">Items Selected</h4>
                  <p className="text-xs text-[#6B7280] mt-1">Select a single item to view details</p>
              </div>
          </aside>
       );
  }

  if (!selectedItem) return null; // Should not happen if logic is correct

  const isImage = selectedItem.mimeType?.startsWith('image/');

  return (
    <aside className="w-[300px] border-l border-[#E5E7EB] bg-white flex flex-col h-full animate-in slide-in-from-right-2 duration-300 z-30">
      {/* Header with Close */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#F9FAFB]">
           <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Details</span>
           <button onClick={clearSelection} className="p-1 hover:bg-[#F3F4F6] rounded text-[#9CA3AF] hover:text-[#4B5563] transition-colors">
               <X className="w-3.5 h-3.5" />
           </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        
        {/* Preview Area */}
        <div className="aspect-video bg-[#F9FAFB] border-b border-[#F3F4F6] flex items-center justify-center relative overflow-hidden group">
             {isImage ? (
                 <ImageIcon className="w-8 h-8 text-[#9CA3AF]" />
             ) : selectedItem.type === 'dir' ? (
                 <Folder className="w-10 h-10 text-[#3B82F6] fill-blue-100" />
             ) : (
                 <File className="w-8 h-8 text-[#9CA3AF]" />
             )}
        </div>

        {/* Content */}
        <div className="p-5">
            {/* Name & Basic Info */}
            <div className="mb-6">
                <h2 className="font-semibold text-[#111827] text-base leading-snug break-words">{selectedItem.name}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563] text-[10px] font-medium uppercase tracking-wide">
                        {selectedItem.type === 'dir' ? 'FOLDER' : selectedItem.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                    </span>
                    {selectedItem.size > 0 && (
                        <span className="text-xs text-[#6B7280]">
                            {(selectedItem.size / 1024).toFixed(1)} KB
                        </span>
                    )}
                </div>
            </div>

            {/* Properties Grid */}
            <div className="space-y-6">
                
                {/* Information Table */}
                <div>
                    <h4 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Metadata</h4>
                    <div className="space-y-0.5">
                        <div className="grid grid-cols-[80px_1fr] py-1.5 border-b border-[#F3F4F6]">
                            <span className="text-xs text-[#6B7280]">Created</span>
                            <span className="text-xs font-medium text-[#111827] text-right">
                                {new Date(selectedItem.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="grid grid-cols-[80px_1fr] py-1.5 border-b border-[#F3F4F6]">
                            <span className="text-xs text-[#6B7280]">Modified</span>
                            <span className="text-xs font-medium text-[#111827] text-right">
                                {new Date(selectedItem.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                         <div className="grid grid-cols-[80px_1fr] py-1.5 border-b border-[#F3F4F6]">
                            <span className="text-xs text-[#6B7280]">Owner</span>
                            <span className="text-xs font-medium text-[#111827] text-right">Me</span>
                        </div>
                    </div>
                </div>

                {/* Hash Section (CAS) - Refined */}
                {selectedItem.blobHash && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Content Address</span>
                            <button 
                                onClick={copyHash}
                                className={clsx(
                                    "text-xs flex items-center gap-1 transition-colors",
                                    copied ? "text-green-600" : "text-[#2563EB] hover:text-[#1D4ED8]"
                                )}
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                        <div className="bg-[#F9FAFB] rounded-lg p-3 border border-[#E5E7EB] break-all">
                            <code className="text-[10px] text-[#4B5563] font-mono leading-relaxed">
                                {selectedItem.blobHash}
                            </code>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </aside>
  );
}

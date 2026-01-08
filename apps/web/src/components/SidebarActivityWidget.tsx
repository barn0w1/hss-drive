import { useDriveStore } from '@/store';
import { Loader2, ChevronUp } from 'lucide-react';
import { useMemo, useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { UploadSession } from '@/features/upload/types';

export function SidebarActivityWidget() {
  const uploads = useDriveStore((state) => state.uploads);
  // Filter active (pending, hashing, downloading) uploads
  const activeUploads = useMemo(() => 
    Object.values(uploads).filter(s => s.status === 'hashing' || s.status === 'uploading' || s.status === 'pending')
  , [uploads]);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (activeUploads.length === 0) return null;

  // Calculate simple average progress
  const overallProgress = activeUploads.reduce((acc, curr) => {
      const p = curr.status === 'hashing' ? curr.hashProgress : curr.uploadProgress;
      return acc + (p || 0);
  }, 0) / activeUploads.length;

  return (
    <div className="mx-3 mb-3 relative z-40" ref={containerRef}>
        {/* Trigger / Widget */}
        <div 
            onClick={() => setIsOpen(!isOpen)}
            className="cursor-pointer bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:border-blue-300 transition-all group"
        >
             <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                     <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                     <span className="text-xs font-medium text-gray-700">Processing {activeUploads.length} files...</span>
                 </div>
                 <ChevronUp className={clsx("w-3.5 h-3.5 text-gray-400 transition-transform", isOpen && "rotate-180")} />
             </div>
             
             {/* Simple Line Progress */}
             <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${overallProgress}%` }}
                 />
             </div>
        </div>

        {/* Popover Details (Floating above) */}
        {isOpen && (
            <div className="absolute bottom-full left-0 w-[240px] bg-white rounded-xl shadow-xl border border-gray-100 mb-2 p-1 animate-in fade-in slide-in-from-bottom-2 z-50">
                <div className="px-3 py-2 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center rounded-t-lg">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Tasks</span>
                </div>
                <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                    {activeUploads.map(upload => (
                        <div key={upload.id} className="p-2 hover:bg-gray-50 rounded flex flex-col gap-1">
                             <div className="flex justify-between items-center w-full">
                                <span className="text-xs text-gray-700 truncate max-w-[150px]">{upload.file.name}</span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                    {upload.status === 'hashing' ? `Hash ${Math.round(upload.hashProgress)}%` : `${Math.round(upload.uploadProgress)}%`}
                                </span>
                             </div>
                             <div className="w-full h-0.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500"
                                    style={{ width: `${upload.status === 'hashing' ? upload.hashProgress : upload.uploadProgress}%` }}
                                />
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
}

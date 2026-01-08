import { 
  Download, 
  Edit2, 
  Trash, 
  Copy, 
  Archive, 
  Hash, 
  MoreVertical 
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Entry } from '@/store';
import clsx from 'clsx';

interface FileActionMenuProps {
  item: Entry;
  selectedIds: Set<string>;
  onAction: (action: string, item: Entry) => void;
}

export function FileActionMenu({ item, selectedIds, onAction }: FileActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // If multiple items are selected and this item is one of them, we are in "Batch Mode"
  const isBatchMode = selectedIds.size > 1 && selectedIds.has(item.id);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: string) => {
      setIsOpen(false);
      onAction(action, item);
  };

  return (
    <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={clsx(
            "p-1 rounded transition-colors",
            isOpen ? "bg-gray-200 text-gray-900" : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"
        )}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
          
          {isBatchMode ? (
            // BATCH ACTIONS
            <>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                    {selectedIds.size} Items Selected
                </div>
                <button onClick={() => handleAction('download_zip')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Archive className="w-4 h-4" /> Download as Zip
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button onClick={() => handleAction('delete')} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <Trash className="w-4 h-4" /> Move to Trash
                </button>
            </>
          ) : (
            // SINGLE ITEM ACTIONS
            <>
                <button onClick={() => handleAction('download')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Download className="w-4 h-4" /> Download
                </button>
                <button onClick={() => handleAction('rename')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Edit2 className="w-4 h-4" /> Rename
                </button>
                <button onClick={() => handleAction('copy')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Make a Copy
                </button>
                <button onClick={() => handleAction('hash')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Hash className="w-4 h-4" /> Copy ID/Hash
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button onClick={() => handleAction('delete')} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <Trash className="w-4 h-4" /> Move to Trash
                </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

import { X, Download, Edit2, Copy, Trash, MoreVertical, Archive, Info } from 'lucide-react';
import { Entry } from '@/store';

export function SelectionBar({ 
    selectedIds, 
    onClear, 
    onAction 
}: { 
    selectedIds: Set<string>, 
    onClear: () => void,
    onAction: (action: string) => void 
}) {
    if (selectedIds.size === 0) return null;

    const count = selectedIds.size;
    const isSingle = count === 1;

    return (
        <div className="h-[52px] bg-[#EFF6FF] border-b border-blue-100 flex items-center justify-between px-6 animate-in slide-in-from-top-2 duration-200 z-20 shadow-sm relative">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onClear}
                    className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                    title="Clear Selection"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="font-semibold text-sm text-blue-900 border-r border-blue-200 pr-4 mr-0">
                    {count} selected
                </div>
            </div>

            <div className="flex items-center gap-2">
                 {isSingle && (
                    <button onClick={() => onAction('info')} className="p-2 text-blue-700 hover:bg-blue-100 rounded-md transition-colors" title="View Details">
                        <Info className="w-4 h-4" />
                    </button>
                 )}
            
                 <button onClick={() => onAction('download')} className="p-2 text-blue-700 hover:bg-blue-100 rounded-md transition-colors" title={isSingle ? "Download" : "Download Zip"}>
                    {isSingle ? <Download className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                 </button>
                 
                 {isSingle && (
                    <button onClick={() => onAction('rename')} className="p-2 text-blue-700 hover:bg-blue-100 rounded-md transition-colors" title="Rename">
                        <Edit2 className="w-4 h-4" />
                    </button>
                 )}

                 <button onClick={() => onAction('copy')} className="p-2 text-blue-700 hover:bg-blue-100 rounded-md transition-colors" title="Make a Copy">
                    <Copy className="w-4 h-4" />
                 </button>
                 
                 <div className="h-4 w-px bg-blue-200 mx-1" />

                 <button onClick={() => onAction('delete')} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Move to Trash">
                    <Trash className="w-4 h-4" />
                 </button>
                 
                 <button onClick={() => onAction('more')} className="p-2 text-blue-700 hover:bg-blue-100 rounded-md transition-colors" title="More Actions">
                    <MoreVertical className="w-4 h-4" />
                 </button>
            </div>
        </div>
    )
}

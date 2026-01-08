import { 
  Box,
  LogOut,
  LayoutGrid,
  Pin,
  HardDrive,
  Plus,
  Hash
} from 'lucide-react';
import clsx from 'clsx';
import { useDriveStore } from '@/store';
import { useMemo, useState } from 'react';
import { SidebarActivityWidget } from './SidebarActivityWidget';

export function Sidebar() {
  const spaces = useDriveStore((state) => state.spaces);
  const activeSpaceId = useDriveStore((state) => state.activeSpaceId);
  const pinnedSpaceIds = useDriveStore((state) => state.pinnedSpaceIds);
  const setActiveSpace = useDriveStore((state) => state.setActiveSpace);
  const createSpace = useDriveStore((state) => state.createSpace);
  const logout = useDriveStore((state) => state.logout);
  const user = useDriveStore((state) => state.user);
  
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  const pinnedSpaces = useMemo(() => spaces.filter(s => pinnedSpaceIds.includes(s.id)), [spaces, pinnedSpaceIds]);
  const otherSpaces = useMemo(() => spaces.filter(s => !pinnedSpaceIds.includes(s.id)), [spaces, pinnedSpaceIds]);

  const handleCreateSpace = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newSpaceName.trim()) return;
      await createSpace(newSpaceName);
      setNewSpaceName('');
      setIsCreatingSpace(false);
  };

  return (
    <aside className="w-[260px] bg-[#F9FAFB] flex flex-col h-full border-r border-[#E5E7EB] z-10">
      {/* Brand / Logo Area */}
      <div className="h-14 flex items-center px-6 border-b border-[#F9FAFB] mb-2">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/10 mr-3">
          <Box className="w-4 h-4 text-white" />
        </div>
        <div>
           <span className="font-semibold text-[#111827] tracking-tight text-sm">HSS Drive</span>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 space-y-6">
        
        {/* Main Nav */}
        <div>
            <div className="px-3 mb-1.5 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                Menu
            </div>
            <button 
                onClick={() => setActiveSpace(null)}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
                  !activeSpaceId 
                    ? "bg-white text-[#111827] shadow-sm ring-1 ring-[#E5E7EB]" 
                    : "text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]"
                )}
            >
              <LayoutGrid className="w-4 h-4 text-gray-400" />
              Dashboard
            </button>
        </div>

        {/* Pinned Spaces */}
        {pinnedSpaces.length > 0 && (
            <div>
                 <div className="px-3 mb-1.5 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                    Pinned
                </div>
                <div className="space-y-0.5">
                    {pinnedSpaces.map(space => (
                        <button
                            key={space.id}
                            onClick={() => setActiveSpace(space.id)}
                            className={clsx(
                                "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 group",
                                activeSpaceId === space.id
                                    ? "bg-white text-[#111827] shadow-sm ring-1 ring-[#E5E7EB]"
                                    : "text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]"
                            )}
                        >
                            <HardDrive className={clsx(
                                "w-4 h-4 transition-colors",
                                activeSpaceId === space.id ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600"
                            )} />
                            <span className="truncate">{space.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* All Spaces (with Create Option) */}
        <div>
            <div className="px-3 mb-1.5 flex items-center justify-between group cursor-pointer" onClick={() => setIsCreatingSpace(true)}>
                <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                    Spaces
                </div>
                <Plus className="w-3 h-3 text-gray-400 hover:text-[#111827] transition-colors opacity-0 group-hover:opacity-100" />
            </div>

            <div className="space-y-0.5">
                {/* Create Space Input */}
                {isCreatingSpace && (
                    <form onSubmit={handleCreateSpace} className="px-1 mb-1">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Space name..."
                            className="w-full text-sm px-2.5 py-1.5 rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white shadow-sm"
                            value={newSpaceName}
                            onChange={(e) => setNewSpaceName(e.target.value)}
                            onBlur={() => !newSpaceName && setIsCreatingSpace(false)}
                        />
                    </form>
                )}

                {otherSpaces.map(space => (
                    <button
                        key={space.id}
                        onClick={() => setActiveSpace(space.id)}
                        className={clsx(
                            "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 group",
                            activeSpaceId === space.id
                                ? "bg-white text-[#111827] shadow-sm ring-1 ring-[#E5E7EB]"
                                : "text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]"
                        )}
                    >
                        <HardDrive className={clsx(
                            "w-4 h-4 transition-colors",
                            activeSpaceId === space.id ? "text-blue-500" : "text-gray-400 group-hover:text-gray-600"
                        )} />
                        <span className="truncate">{space.name}</span>
                    </button>
                ))}
            </div>
        </div>

      </div>

      <SidebarActivityWidget />

      {/* User Footer */}
      <div className="p-3 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-2.5 px-2">
            
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111827] truncate">{user?.username}</p>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                   <span className="text-xs text-[#6B7280]">Online</span>
                </div>
            </div>
            <button onClick={logout} className="text-[#9CA3AF] hover:text-[#EF4444] p-1.5 hover:bg-[#FEF2F2] rounded-md transition-colors">
                <LogOut className="w-4 h-4" /> 
            </button>
        </div>
      </div>
    </aside>
  );
}

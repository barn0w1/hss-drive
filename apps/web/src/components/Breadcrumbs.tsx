import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useDriveStore } from '@/store';

export function Breadcrumbs() {
  const breadcrumbs = useDriveStore((state) => state.breadcrumbs);
  const openFolder = useDriveStore((state) => state.openFolder);
  const getCurrentSpace = useDriveStore((state) => state.getCurrentSpace);
  
  const rootSpaceName = getCurrentSpace()?.name || 'Space';

  return (
    <div className="flex items-center gap-1 text-lg text-gray-600 mb-4 px-4 pt-4">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const displayName = item.id === null ? rootSpaceName : item.name;
        
        return (
          <div key={item.id || 'root'} className="flex items-center gap-1">
             {index > 0 && <ChevronRight className="w-5 h-5 text-gray-400" />}
             <button
              onClick={() => openFolder(item.id, item.name)}
              className={clsx(
                "hover:bg-gray-100 px-2 py-1 rounded transition-colors max-w-[150px] truncate",
                isLast ? "font-semibold text-gray-900" : ""
              )}
            >
              {displayName}
            </button>
          </div>
        );
      })}
    </div>
  );
}

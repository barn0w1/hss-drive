import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useMemo } from 'react';
import { useDriveStore } from '@/store';

export function Breadcrumbs() {
  const currentPath = useDriveStore((state) => state.currentPath);
  const getCurrentSpace = useDriveStore((state) => state.getCurrentSpace);
  const setCurrentPath = useDriveStore((state) => state.setCurrentPath);

  const rootName = getCurrentSpace()?.name || 'Space';
  
  const pathParts = useMemo(() => {
     if (!currentPath) return [];
     const parts = currentPath.split('/');
     return parts.map((part, index) => ({
        name: part,
        fullPath: parts.slice(0, index + 1).join('/')
     }));
  }, [currentPath]);

  return (
    <div className="flex items-center gap-1 text-lg text-gray-600 mb-4 px-4 pt-4">
      <button 
        onClick={() => setCurrentPath('')}
        className={clsx(
          "hover:bg-gray-100 px-2 py-1 rounded transition-colors",
          pathParts.length === 0 ? "font-semibold text-gray-900" : ""
        )}
      >
        {rootName}
      </button>
      
      {pathParts.map((item, index) => {
        const isLast = index === pathParts.length - 1;
        return (
          <div key={item.fullPath} className="flex items-center gap-1">
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <button
              onClick={() => setCurrentPath(item.fullPath)}
              className={clsx(
                "hover:bg-gray-100 px-2 py-1 rounded transition-colors max-w-[150px] truncate",
                isLast ? "font-semibold text-gray-900" : ""
              )}
            >
              {item.name}
            </button>
          </div>
        );
      })}
    </div>
  );
}

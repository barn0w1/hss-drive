import { useDriveStore } from '@/store';
import { UploadSession } from '../types';
import { FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useMemo } from 'react';

export function UploadProgress() {
  const uploads = useDriveStore((state) => state.uploads);
  const activeSessions = useMemo(() => Object.values(uploads).filter(s => s.status !== 'completed' && s.status !== 'error'), [uploads]);
  
  // Also show recently completed/failed? For now just active
  // Or actually, let's render all and let user dismiss them? 
  // Maybe just show pending/uploading for now.
  
  if (activeSessions.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
         <span className="font-medium">Uploading {activeSessions.length} items</span>
      </div>
      <div className="max-h-60 overflow-y-auto">
         {activeSessions.map(session => (
            <UploadItem key={session.id} session={session} />
         ))}
      </div>
    </div>
  );
}

function UploadItem({ session }: { session: UploadSession }) {
  return (
    <div className="px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
       <div className="flex items-center gap-3 mb-2">
          <FileText className="w-5 h-5 text-gray-500" />
          <div className="flex-1 min-w-0">
             <p className="text-sm font-medium text-gray-700 truncate">{session.file.name}</p>
             <p className="text-xs text-gray-400 truncate">{session.targetPath || 'Root'}</p>
          </div>
          <div className="text-sm text-gray-500 font-mono">
             {Math.round(session.progress)}%
          </div>
       </div>
       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
             className="h-full bg-blue-600 transition-all duration-300" 
             style={{ width: `${session.progress}%` }}
          />
       </div>
    </div>
  );
}

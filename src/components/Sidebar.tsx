import { 
  Plus,
  Box
} from 'lucide-react';
import clsx from 'clsx';
import { useDriveStore } from '@/store';
import { useRef } from 'react';
import { Uploader } from '@/features/upload/Uploader';

export function Sidebar() {
  const spaces = useDriveStore((state) => state.spaces);
  const activeSpaceId = useDriveStore((state) => state.activeSpaceId);
  const setActiveSpace = useDriveStore((state) => state.setActiveSpace);
  const currentPath = useDriveStore((state) => state.currentPath);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      // Capture the space ID at the start of the upload
      const targetSpaceId = activeSpaceId; 
      
      files.forEach(file => {
        const uploadId = Math.random().toString(36).substring(7);
        const targetPath = currentPath; 
        
        // 1. Add to store
        useDriveStore.getState().addUpload({
          id: uploadId,
          file: { name: file.name, size: file.size, type: file.type },
          progress: 0,
          status: 'pending',
          targetPath: targetPath
        });

        // 2. Start Upload
        const uploader = new Uploader(file, {
          onProgress: (progress) => {
             useDriveStore.getState().updateUploadProgress(uploadId, progress);
          },
          onComplete: (hash) => {
             useDriveStore.getState().completeUpload(uploadId, hash);
             
             // 3. Add to file list
             const newDisplayPath = targetPath ? `${targetPath}/${file.name}` : file.name;
             
             useDriveStore.getState().addEntry(targetSpaceId, {
                path: newDisplayPath,
                name: file.name,
                type: 'file',
                size: file.size,
                updatedAt: new Date().toISOString()
             });
          },
          onError: (err) => {
             useDriveStore.getState().failUpload(uploadId, err.message || 'Unknown error');
          }
        });

        uploader.upload().catch(console.error);
      });
    }
    
    // Reset the input so the same file selection works again
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col pt-4 pb-4">
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-6 text-gray-700">
           <img src="/icon.svg" alt="Logo" className="w-8 h-8" />
           <span className="text-xl font-semibold">Drive</span>
        </div>
        
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            onChange={handleFileSelect} 
        />

        <button 
            onClick={handleUploadClick}
            className="flex items-center gap-2 bg-white border border-gray-300 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full text-left"
        >
          <Plus className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">New Item</span>
        </button>
      </div>

      <nav className="flex-1 px-3">
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Spaces</p>
        
        {spaces.map((space) => {
          const isActive = activeSpaceId === space.id;
          return (
            <button
              key={space.id}
              onClick={() => setActiveSpace(space.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium mb-1 transition-colors",
                isActive 
                  ? "bg-blue-100 text-blue-700" 
                  : "text-gray-700 hover:bg-gray-200"
              )}
            >
              <Box className={clsx("w-5 h-5", space.color)} />
              {space.name}
            </button>
          );
        })}
      </nav>

      <div className="px-6 mt-4">
        <div className="bg-gray-200 rounded-full h-1 w-full overflow-hidden">
          <div className="bg-blue-600 w-3/4 h-full" />
        </div>
        <p className="text-xs text-gray-500 mt-2">11.5 GB of 15 GB used</p>
      </div>
    </aside>
  );
}

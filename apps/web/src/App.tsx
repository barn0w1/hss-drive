import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { FileBrowser } from '@/components/FileBrowser';
import { Inspector } from '@/components/Inspector';
import { LoginScreen } from '@/components/LoginScreen';
import { useDriveStore } from '@/store';
import { Loader2 } from 'lucide-react';

function App() {
  const checkAuth = useDriveStore(s => s.checkAuth);
  const isAuthenticated = useDriveStore(s => s.isAuthenticated);
  const user = useDriveStore(s => s.user);
  const uploads = useDriveStore(s => s.uploads);
  const isInspectorOpen = useDriveStore(s => s.isInspectorOpen);
  
  // Initial Auth Check
  const [init, setInit] = useState(true);

  useEffect(() => {
    checkAuth().finally(() => setInit(false));
  }, []);

  // Browser Safeguard: Prevent accidental tab close during upload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        const hasActiveUploads = Object.values(uploads).some(
            u => u.status === 'uploading' || u.status === 'hashing' || u.status === 'pending'
        );
        
        if (hasActiveUploads) {
            e.preventDefault();
            e.returnValue = ''; // Chrome requires returnValue to be set
            return '';
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploads]);

  if (init) {
      return (
          <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
      )
  }

  if (!isAuthenticated || !user) {
      return <LoginScreen />;
  }

  return (
    <div className="flex h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      {/* Pane A: Navigation Sidebar */}
      <Sidebar />
      
      {/* Pane B: Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative z-0">
         <div className="flex-1 flex overflow-hidden">
             <div className="flex-1 flex flex-col min-w-0 relative">
                <FileBrowser />
             </div>
             
             {/* Pane C: Inspector (conditionally rendered by component itself) */}
             {isInspectorOpen && <Inspector />}
         </div>
      </main>
    </div>
  );
}

export default App;

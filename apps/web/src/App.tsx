import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { FileBrowser } from '@/components/FileBrowser';
import { UploadProgress } from '@/features/upload/components/UploadProgress';
import { LoginScreen } from '@/components/LoginScreen';
import { useDriveStore } from '@/store';
import { Loader2 } from 'lucide-react';

function App() {
  const checkAuth = useDriveStore(s => s.checkAuth);
  const isAuthenticated = useDriveStore(s => s.isAuthenticated);
  const user = useDriveStore(s => s.user);
  
  // Initial Auth Check (very simple state management for now)
  const [init, setInit] = useState(true);

  useEffect(() => {
    checkAuth().finally(() => setInit(false));
  }, []);

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
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <FileBrowser />
      </main>
      <UploadProgress />
    </div>
  );
}

export default App;

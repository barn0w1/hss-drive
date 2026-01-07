import { Sidebar } from '@/components/Sidebar';
import { FileBrowser } from '@/components/FileBrowser';
import { UploadProgress } from '@/features/upload/components/UploadProgress';

function App() {
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

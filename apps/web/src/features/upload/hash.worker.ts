import { createSHA256 } from 'hash-wasm';

// 20MB is a sweet spot for modern CPUs/Memory. 
// Too small = overhead. Too big = UI stutter (even in worker due to main thread memory allocation pressure).
const CHUNK_SIZE = 20 * 1024 * 1024; 

self.onmessage = async (e: MessageEvent<{ file: File }>) => {
  const { file } = e.data;
  
  if (!file) {
    self.postMessage({ error: 'No file provided' });
    return;
  }

  try {
    const hasher = await createSHA256();
    hasher.init();

    const totalSize = file.size;
    let offset = 0;

    while (offset < totalSize) {
      // Slice the file manually to control memory usage
      const end = Math.min(offset + CHUNK_SIZE, totalSize);
      const chunk = file.slice(offset, end);
      
      // Read directly as ArrayBuffer (Fastest modern method)
      const buffer = await chunk.arrayBuffer();
      
      // Feed Uint8Array view to WASM
      hasher.update(new Uint8Array(buffer));
      
      offset = end;

      // Report progress
      self.postMessage({ 
        progress: (offset / totalSize) * 100 
      });
    }

    const hash = hasher.digest();
    self.postMessage({ hash, progress: 100 });

  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Unknown hashing error' });
  }
};
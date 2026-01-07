import { createSHA256 } from 'hash-wasm';

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunk for hashing buffer

self.onmessage = async (e: MessageEvent<{ file: File }>) => {
  const { file } = e.data;
  
  if (!file) {
    self.postMessage({ error: 'No file provided' });
    return;
  }

  try {
    const reader = file.stream().getReader();
    const hasher = await createSHA256();
    hasher.init();

    let processedSize = 0;
    const totalSize = file.size;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      // value is a Uint8Array
      hasher.update(value);
      processedSize += value.length;

      // Report progress
      self.postMessage({ 
        progress: (processedSize / totalSize) * 100 
      });
    }

    const hash = hasher.digest();
    self.postMessage({ hash, progress: 100 });

  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Unknown hashing error' });
  }
};

import { UploaderOptions } from './types';

/**
 * Uploader class responsible for handling file uploads.
 * Implements client-side hashing and chunking strategies.
 */
export class Uploader {
  private file: File;
  private options: UploaderOptions;
  private aborted: boolean = false;
  private worker: Worker | null = null;

  constructor(file: File, options: UploaderOptions = {}) {
    this.file = file;
    this.options = { 
        chunkSize: 128 * 1024 * 1024, // 128MB
        ...options 
    };
  }

  /**
   * Starts the upload process.
   * 1. Calculates SHA-256 hash using Web Worker.
   * 2. (Future) Checks existence on server (deduplication).
   * 3. (Future) Uploads chunks to S3.
   */
  public async upload(): Promise<string> {
    this.aborted = false;
    console.log(`Starting upload for ${this.file.name} (${this.file.size} bytes)`);

    try {
      // Step 1: Calculate Hash
      const hash = await this.calculateHash();
      if (this.aborted) throw new Error("Upload aborted");
      
      console.log(`File hash calculated: ${hash}`);
      
      // Step 2: (Simulation) Upload Logic
      // In a real implementation, we would use the hash to check if the file exists
      // and then upload chunks if needed.
      // For now, we'll keep the simulation for the "transfer" part to show UI progress
      // but we return the REAL hash.
      
      // Reset progress for "uploading" phase (0-100 again, or split 50/50?)
      // Let's assume hashing is "Preparing..." and upload is "Uploading..."
      // But currently UI shows one progress bar. 
      // Let's just do a quick simulated upload delay.
      
      const totalSteps = 10;
      for (let i = 0; i <= totalSteps; i++) {
          if (this.aborted) throw new Error("Upload aborted");
          // Fake network delay
          await new Promise(resolve => setTimeout(resolve, 50));
      }

      this.options.onComplete?.(hash);
      return hash;

    } catch (err) {
      this.options.onError?.(err as Error);
      throw err;
    } finally {
        this.worker?.terminate();
        this.worker = null;
    }
  }

  private calculateHash(): Promise<string> {
    return new Promise((resolve, reject) => {
        this.worker = new Worker(new URL('./hash.worker.ts', import.meta.url), { type: 'module' });
        
        this.worker.onmessage = (e) => {
            if (this.aborted) {
                this.worker?.terminate();
                reject(new Error("Upload aborted"));
                return;
            }

            const { progress, hash, error } = e.data;

            if (error) {
                reject(new Error(error));
            } else if (hash) {
                resolve(hash);
            } else if (progress !== undefined) {
                // Hashing progress
                this.options.onProgress?.(progress);
            }
        };

        this.worker.onerror = (err) => {
            reject(new Error('Worker error: ' + err.message));
        };

        this.worker.postMessage({ file: this.file });
    });
  }

  public abort() {
    this.aborted = true;
    if (this.worker) {
        this.worker.terminate();
        this.worker = null;
    }
  }
}

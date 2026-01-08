import { UploaderOptions } from './types';
import { UPLOAD_CONFIG } from '@hss/shared';

/**
 * Uploader class responsible for handling file uploads.
 * Implements client-side hashing and multipart upload to S3/R2.
 */
export class Uploader {
  private file: File;
  private options: UploaderOptions;
  private aborted: boolean = false;
  private worker: Worker | null = null;
  private activeRequest: XMLHttpRequest | null = null; // To abort XHR ops

  constructor(file: File, options: UploaderOptions = {}) {
    this.file = file;
    this.options = { 
        chunkSize: UPLOAD_CONFIG.CHUNK_SIZE, 
        ...options 
    };
  }

  /**
   * Starts the upload process.
   */
  public async upload(): Promise<string> {
    this.aborted = false;
    console.log(`Starting upload for ${this.file.name} (${this.file.size} bytes)`);

    if (!this.options.spaceId) {
        throw new Error("Target Space ID is missing");
    }

    try {
      // Step 1: Calculate Hash
      const hash = await this.calculateHash();
      if (this.aborted) throw new Error("Upload aborted");
      
      console.log(`File hash calculated: ${hash}`);

      // Step 2: Initialize Multipart Upload / CAS Check
      const initData = await this.apiCall('/api/storage/multipart/init', {
        filename: this.file.name,
        contentType: this.file.type || 'application/octet-stream',
        size: this.file.size,
        hash: hash,
        spaceId: this.options.spaceId // Pass it if needed for validation
      });
      
      // CAS Hit (Fast Path)
      if (initData.exists) {
          console.log("CAS Hit: Instant upload");
          this.options.onProgress?.(100);
          await this.completeUpload(null, null, [], hash, this.options.spaceId!);
          return hash;
      }
      
      // Hybrid Strategy Check
      if (initData.url && !initData.uploadId) {
          // Single PUT Strategy
          console.log("Using Single PUT Strategy (Small File)");
          await this.uploadToS3(initData.url, this.file);
          this.options.onProgress?.(100);
          await this.completeUpload(initData.key, null, [], hash, this.options.spaceId!);
          return hash;
      }

      // Multipart Strategy
      const { uploadId, key } = initData;
      if (!uploadId || !key) throw new Error("Failed to initialize upload");

      // Step 3: Concurrent Chunk Upload
      const chunks = this.getChunks();
      const parts: { ETag: string; PartNumber: number }[] = [];
      const totalSize = this.file.size;
      let uploadedSize = 0;
      
      // Concurrency Control
      const CONCURRENCY = UPLOAD_CONFIG.CONCURRENCY; 

      const activePromises: Promise<void>[] = [];
      
      // Helper to process a single chunk
      const processChunk = async (index: number) => {
          if (this.aborted) return;
          
          const partNumber = index + 1;
          const chunk = chunks[index];

          // 1. Get Signed URL
          const { url: signedUrl } = await this.apiCall('/api/storage/multipart/sign-part', {
              key, uploadId, partNumber
          });

          // 2. Upload to S3
          const eTag = await this.uploadToS3(signedUrl, chunk);
          parts.push({ PartNumber: partNumber, ETag: eTag });

          // 3. Progress Update (Atomic increment needed?)
          // Since JS is single threaded event loop, this is safe
          uploadedSize += chunk.size;
          const percent = Math.round((uploadedSize / totalSize) * 100);
          this.options.onProgress?.(percent);
      };

      // Execution Loop
      for (let i = 0; i < chunks.length; i++) {
          if (this.aborted) break;

          // Create new task
          const task = processChunk(i);
          activePromises.push(task);

          // If limit reached, wait for at least one to finish
          if (activePromises.length >= CONCURRENCY) {
              await Promise.race(activePromises);
              // Clean up finished promises
              // (Actually Promise.race doesn't remove, we need to filter)
              // But standard pattern is just to await one.
              // A better way for simple pool:
          }
          
          // Basic Pool Cleanup: remove settled promises
          // This is a bit naive but works for small concurrency
          /* 
             Actually, Promise.race just waits. It doesn't tell us WHICH one finished index-wise easily.
             Let's use a simpler queueing approach or a library-free semaphore.
          */
      }

      // Wait for all remaining
      // To implement proper queue: use a recursion or iterative approach
      // Re-implementing correctly below:
      
      await this.runConcurrent(chunks, CONCURRENCY, async (chunk, i) => {
          if (this.aborted) throw new Error("Upload aborted");
          const partNumber = i + 1;
          const { url: signedUrl } = await this.apiCall('/api/storage/multipart/sign-part', {
              key, uploadId, partNumber
          });
          const eTag = await this.uploadToS3(signedUrl, chunk);
          parts.push({ PartNumber: partNumber, ETag: eTag });
          
          uploadedSize += chunk.size;
          const percent = Math.round((uploadedSize / totalSize) * 100);
          this.options.onProgress?.(percent);
      });


      if (this.aborted) throw new Error("Upload aborted");
      
      // Sort parts by number before completing (S3 requires ordered list)
      parts.sort((a, b) => a.PartNumber - b.PartNumber);

      // Step 4: Complete
      await this.completeUpload(key, uploadId, parts, hash, this.options.spaceId!);

      this.options.onComplete?.(hash);
      return hash;

    } catch (err) {
      console.error("Upload failed", err);
      this.options.onError?.(err as Error);
      throw err;
    } finally {
        this.worker?.terminate();
        this.worker = null;
    }
  }

  // Simple Concurrent Executor
  private async runConcurrent<T>(items: T[], concurrency: number, fn: (item: T, index: number) => Promise<void>) {
      const results = [];
      const executing = new Set<Promise<void>>();
      
      for (const [index, item] of items.entries()) {
          const p = fn(item, index).then(() => { executing.delete(p); });
          executing.add(p);
          results.push(p);
          
          if (executing.size >= concurrency) {
              await Promise.race(executing);
          }
      }
      return Promise.all(results);
  }

  private async completeUpload(
      key: string | null, 
      uploadId: string | null, 
      parts: any[], 
      hash: string, 
      spaceId: string
  ) {
      await this.apiCall('/api/storage/multipart/complete', {
          key,
          uploadId,
          parts,
          filename: this.file.name,
          size: this.file.size,
          hash,
          spaceId
      });
  }


  private getChunks(): Blob[] {
    const chunks: Blob[] = [];
    const chunkSize = this.options.chunkSize || UPLOAD_CONFIG.CHUNK_SIZE;
    let start = 0;

    while (start < this.file.size) {
      const end = Math.min(start + chunkSize, this.file.size);
      chunks.push(this.file.slice(start, end));
      start = end;
    }
    return chunks;
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
                // Reporting hash progress as "Preparing..." (can be logged or used)
                // If we want to reflect in main progress, we can do it here.
                // console.debug('Hashing:', progress);
            }
        };

        this.worker.onerror = (err) => {
            reject(new Error('Worker error: ' + err.message));
        };

        this.worker.postMessage({ file: this.file });
    });
  }

  // --- Helper Methods ---

  private async apiCall(url: string, body: any): Promise<any> {
      const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      return res.json();
  }

  private async uploadToS3(url: string, body: Blob): Promise<string> {
      return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          this.activeRequest = xhr;

          xhr.open('PUT', url);
          
          xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                  const etag = xhr.getResponseHeader('ETag');
                  if (!etag) {
                      // Some S3 comptabile stores might not expose ETag header due to CORS
                      // Warning: This will break Multipart Complete if ETag is required
                      reject(new Error("ETag header missing. Check CORS configuration."));
                      return;
                  }
                  resolve(etag.replace(/"/g, '')); // Strip quotes
              } else {
                  reject(new Error(`S3 Upload Failed: ${xhr.statusText}`));
              }
          };

          xhr.onerror = () => reject(new Error("Network Error uploading to S3"));
          
          xhr.send(body);
      });
  }

  public abort() {
    this.aborted = true;
    if (this.worker) {
        this.worker.terminate();
        this.worker = null;
    }
    if (this.activeRequest) {
        this.activeRequest.abort();
    }
  }
}

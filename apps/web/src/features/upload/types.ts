export type UploadStatus = 'pending' | 'hashing' | 'uploading' | 'completed' | 'error';

export interface UploadSession {
  id: string;
  file: File;
  spaceId: string;
  targetPath: string; // The "folder" path where it's being uploaded
  
  // Progress Tracking
  status: UploadStatus;
  progress: number; // 0-100 (Overall)
  hashProgress: number; // 0-100
  uploadProgress: number; // 0-100
  speed?: number; // bytes/sec (optional)

  hash?: string; // Content hash (e.g. SHA-256)
  error?: string;
  abortControl?: AbortController; // To cancel uploads
}

export interface UploaderOptions {
  spaceId?: string; // Target space
  parentId?: string | null; // Target folder ID
  chunkSize?: number; // Default from shared config (e.g. 128MB)
  onProgress?: (state: Partial<UploadSession>) => void;
  onComplete?: (hash: string) => void;
  onError?: (error: Error) => void;
}

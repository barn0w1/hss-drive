export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'error';

export interface UploadSession {
  id: string;
  file: File;
  spaceId: string;
  targetPath: string; // The "folder" path where it's being uploaded
  progress: number; // 0 to 100
  status: UploadStatus;
  hash?: string; // Content hash (e.g. SHA-256)
  error?: string;
}

export interface UploaderOptions {
  chunkSize?: number; // Default 128MB
  onProgress?: (progress: number) => void;
  onComplete?: (hash: string) => void;
  onError?: (error: Error) => void;
}

// Generic API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Upload Session Initialization
export interface InitiateUploadRequest {
    fileName: string;
    fileSize: number;
    fileHash: string; // The complete SHA-256 hash
    mimeType: string;
    spaceId: string;
    parentId?: string;
}

export interface InitiateUploadResponse {
    exists: boolean; // If true, upload is skipped (CAS hit)
    uploadId?: string; // S3 Multipart Upload ID
    parts?: {
        partNumber: number;
        url: string; // Presigned URL
    }[];
}

// Upload Completion
export interface CompleteUploadRequest {
    uploadId: string;
    fileHash: string;
    parts: {
        partNumber: number;
        etag: string;
    }[];
}

export interface CompleteUploadResponse {
    fileId: string;
    path: string;
}

export const UPLOAD_CONFIG = {
    /**
     * Size of each part in a multipart upload.
     * Default: 128MB
     */
    CHUNK_SIZE: 128 * 1024 * 1024,

    /**
     * Files larger than this size will be uploaded using S3 Multipart Upload.
     * S3 requires parts to be at least 5MB.
     * If this threshold is set too low while CHUNK_SIZE is large, small files might break.
     * Setting this to 150MB ensures most small files go via Single PUT.
     */
    MULTIPART_THRESHOLD: 150 * 1024 * 1024,

    /**
     * Maximum number of concurrent uploads
     */
    CONCURRENCY: 4,
} as const;

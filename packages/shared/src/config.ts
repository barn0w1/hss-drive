export const UPLOAD_CONFIG = {
    /**
     * Size of each part in a multipart upload.
     * Default: 128MB
     */
    CHUNK_SIZE: 128 * 1024 * 1024,

    /**
     * Files larger than this size will be uploaded using S3 Multipart Upload.
     * Files smaller or equal to this size will be uploaded using a single PUT request.
     * Usually aligned with CHUNK_SIZE.
     */
    MULTIPART_THRESHOLD: 128 * 1024 * 1024,

    /**
     * Maximum number of concurrent uploads
     */
    CONCURRENCY: 4,
} as const;

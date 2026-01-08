import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 / S3 Client Initialization
const s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export const storageService = {
    /**
     * Step 1: Initialize Multipart Upload
     * Returns uploadId needed for subsequent steps
     */
    async startMultipartUpload(key: string, contentType: string) {
        const command = new CreateMultipartUploadCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });
        return s3Client.send(command);
    },

    /**
     * Alternative Step 1: Get Single Presigned PUT URL
     * For small files < 100MB where Multipart is overkill or problematic
     */
    async getPresignedPutUrl(key: string, contentType: string) {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });
        return getSignedUrl(s3Client, command, { expiresIn: 3600 });
    },

    /**
     * Verify object exists
     */
    async headObject(key: string) {
         const command = new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        return s3Client.send(command);
    },

    /**
     * Step 2: Generate Presigned URL for a specific part
     * Client uses this URL to PUT the binary data directly to R2
     */
    async getPresignedPartUrl(key: string, uploadId: string, partNumber: number) {
        const command = new UploadPartCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
        });
        
        // URL expires in 1 hour
        return getSignedUrl(s3Client, command, { expiresIn: 3600 });
    },

    /**
     * Step 3: Complete Multipart Upload
     * Combines all parts into the final object
     */
    async completeMultipartUpload(key: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]) {
        const command = new CompleteMultipartUploadCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: parts,
            },
        });
        return s3Client.send(command);
    },

    /**
     * Cleanup: Abort upload if failed or cancelled
     */
    async abortMultipartUpload(key: string, uploadId: string) {
        const command = new AbortMultipartUploadCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            UploadId: uploadId,
        });
        return s3Client.send(command);
    },
    
    /**
     * Check if object exists (Head Object)
     * Useful for checking deduplication
     */
    // Implement later if needed
};

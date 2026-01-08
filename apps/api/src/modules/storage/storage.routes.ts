import { Hono } from "hono";
import { AppBindings } from "../../lib/context.js";
import { storageService } from "./storage.service.js";
import { db } from "../../db/index.js";
import { files, blobs, spaces, UPLOAD_CONFIG } from "@hss/shared"; 
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../auth/auth.guard.js";

const app = new Hono<AppBindings>();

// Ensure user is authenticated for all storage routes
app.use("*", authMiddleware);

/**
 * 1. Initialize Upload
 * POST /api/storage/multipart/init
 * Body: { filename: string, contentType: string, size: number, spaceId: string }
 */
app.post("/multipart/init", async (c) => {
    const user = c.var.user;
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { filename, contentType, size, spaceId, hash } = body;

    // CAS Strategy: Key is derived solely from the Content Hash
    // Structure: blobs/ab/cd/abcdef12345... (prefixing for better distribution if needed)
    // Actually R2 handles flat structure well, but a little prefix checks help humans debugging listings.
    // Let's use: blobs/{hash} for simplicity, or prefix if requested.
    // User requested: blobs/2d/13/2d13...
    
    if (!hash) {
        return c.json({ error: "SHA-256 hash is required for initialization" }, 400);
    }

    // 1. Check Deduplication
    const existingBlob = await db.query.blobs.findFirst({
        where: eq(blobs.hash, hash)
    });

    if (existingBlob) {
        // FAST PATH: File exists globally. No upload needed.
        // Immediate completion logic can happen here or client calls complete instantly.
        return c.json({ 
            uploadId: null, 
            key: null,
            exists: true,
            message: "Duplicate found. Instant upload."
        });
    }

    // 2. Prepare Storage Key
    // blobs/2d/13/2d13...
    const prefix1 = hash.substring(0, 2);
    const prefix2 = hash.substring(2, 4);
    const objectKey = `blobs/${prefix1}/${prefix2}/${hash}`;

    try {
        // Hybrid Strategy:
        // If file is small, use Single PUT (Presigned URL)
        // If file is large, use Multipart Upload
        
        if (size <= UPLOAD_CONFIG.MULTIPART_THRESHOLD) {
            // SINGLE PUT MODE
            const url = await storageService.getPresignedPutUrl(objectKey, contentType);
            return c.json({
                uploadId: null, // Indicates single put
                key: objectKey,
                url: url,
                exists: false
            });
        } else {
            // MULTIPART MODE
            const { UploadId } = await storageService.startMultipartUpload(objectKey, contentType);
            
            if (!UploadId) throw new Error("Failed to get UploadId");

            return c.json({ 
                uploadId: UploadId, 
                key: objectKey,
                exists: false
            });
        }
    } catch (e) {
        c.var.logger.error(e, "Multipart Init Error");
        return c.json({ error: "Failed to initialize upload" }, 500);
    }
});

/**
 * 2. Get Presigned URLs for Parts
 * POST /api/storage/multipart/sign-part
 * Body: { key: string, uploadId: string, partNumber: number }
 */
app.post("/multipart/sign-part", async (c) => {
    const { key, uploadId, partNumber } = await c.req.json();
    
    // Security check: ideally verify that 'key' belongs to the user or ongoing session
    try {
        const url = await storageService.getPresignedPartUrl(key, uploadId, partNumber);
        return c.json({ url });
    } catch (e) {
        c.var.logger.error(e, "Presign Error");
        return c.json({ error: "Failed to generate presigned URL" }, 500);
    }
});

/**
 * 3. Complete Upload
 * POST /api/storage/multipart/complete
 * Body: { key: string, uploadId: string, parts: { ETag: string, PartNumber: number }[], filename: string, size: number, hash: string }
 */
app.post("/multipart/complete", async (c) => {
    const user = c.var.user;
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { key, uploadId, parts, filename, contentType, size, hash, spaceId, parentId } = body;

    try {
        // 1. If keyprovided, finalize file on S3/R2 (Otherwise it's a dedupe link)
        if (key) {
             if (uploadId && parts && parts.length > 0) {
                 // Multipart Completion
                 await storageService.completeMultipartUpload(key, uploadId, parts);
             } else {
                 // Single PUT Verification
                 // Check if file actually exists on S3 having been uploaded directly
                 try {
                    await storageService.headObject(key);
                 } catch (err) {
                     c.var.logger.warn(err, "HeadObject failed - upload might have failed");
                     return c.json({ error: "Upload verification failed" }, 400);
                 }
             }
             
             // Register new blob
             const existing = await db.query.blobs.findFirst({ where: eq(blobs.hash, hash) });
             if (!existing) {
                 await db.insert(blobs).values({
                    hash: hash,
                    size: size, 
                    mimeType: contentType || "application/octet-stream", 
                });
             }
        }

        // 2. Register File Entry in User's Space
        let targetSpaceId = spaceId;

        if (spaceId === 'personal') {
             // DEV: Resolve "personal" to a real space for this user
             const existingSpace = await db.query.spaces.findFirst({
                 where: and(
                     eq(spaces.ownerId, user.id),
                     eq(spaces.name, 'Personal')
                 )
             });

             if (existingSpace) {
                 targetSpaceId = existingSpace.id;
             } else {
                 const [newSpace] = await db.insert(spaces).values({
                     name: 'Personal',
                     ownerId: user.id
                 }).returning();
                 targetSpaceId = newSpace.id;
             }
        }

        const [newFile] = await db.insert(files).values({
             name: filename,
             blobHash: hash,
             spaceId: targetSpaceId,
             type: 'file',
             parentId: parentId || null
        }).returning();
        
        return c.json({ success: true, blobId: hash, fileId: newFile.id });

    } catch (e) {
        c.var.logger.error(e, "Complete Upload Error");
        return c.json({ error: "Failed to complete upload" }, 500);
    }
});

export default app;

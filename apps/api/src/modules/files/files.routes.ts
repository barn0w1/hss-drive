import { Hono } from "hono";
import { AppBindings } from "../../lib/context.js";
import { db } from "../../db/index.js";
import { files } from "@hss/shared"; 
import { eq, and, isNull, desc, asc } from "drizzle-orm";

const app = new Hono<AppBindings>();

/**
 * List files in a space
 * GET /spaces/:spaceId/files
 * Query: parentId (optional), view ('trash', 'starred', 'recent')
 */
app.get("/spaces/:spaceId/files", async (c) => {
    const spaceId = c.req.param("spaceId");
    const parentId = c.req.query("parentId") || null;
    const view = c.req.query("view"); 

    const conditions = [eq(files.spaceId, spaceId)];

    if (view === 'trash') {
        conditions.push(eq(files.isTrashed, true));
    } else if (view === 'starred') {
        conditions.push(eq(files.isStarred, true));
        conditions.push(eq(files.isTrashed, false));
    } else if (view === 'recent') {
         conditions.push(eq(files.isTrashed, false));
         // Sort by updated desc implies recent
    } else {
         // Browse Mode
         conditions.push(eq(files.isTrashed, false));
         if (parentId) {
             conditions.push(eq(files.parentId, parentId));
         } else {
             conditions.push(isNull(files.parentId));
         }
    }

    const result = await db.query.files.findMany({
        where: and(...conditions),
        orderBy: [asc(files.type), desc(files.updatedAt)], // Type: 'dir' < 'file' so dirs first
    });

    return c.json({ files: result });
});

/**
 * Create a folder
 * POST /spaces/:spaceId/files/folder
 */
app.post("/spaces/:spaceId/files/folder", async (c) => {
    const spaceId = c.req.param("spaceId");
    const { name, parentId } = await c.req.json();
    
    const [newFolder] = await db.insert(files).values({
        spaceId,
        parentId: parentId || null,
        name: name || 'Untitled Folder',
        type: 'dir',
        size: 0
    }).returning();
    
    return c.json({ folder: newFolder });
});

/**
 * Update file/folder (Rename, Move, Star, Trash)
 * PATCH /files/:id
 */
app.patch("/files/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.isStarred !== undefined) updates.isStarred = body.isStarred;
    if (body.isTrashed !== undefined) updates.isTrashed = body.isTrashed;
    if (body.parentId !== undefined) updates.parentId = body.parentId;
    
    updates.updatedAt = new Date(); // Touch

    const [updated] = await db.update(files)
        .set(updates)
        .where(eq(files.id, id))
        .returning();
        
    return c.json({ file: updated });
});

/**
 * Permanently Delete
 * DELETE /files/:id
 */
app.delete("/files/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(files).where(eq(files.id, id));
    return c.json({ success: true, id });
});

export default app;

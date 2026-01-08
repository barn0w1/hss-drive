import { Hono } from "hono";
import { AppBindings } from "../../lib/context.js";
import { db } from "../../db/index.js";
import { nodes } from "@hss/shared"; 
import { eq, and, isNull, desc, asc } from "drizzle-orm";

const app = new Hono<AppBindings>();

/**
 * List nodes (files/dirs) in a space
 * GET /spaces/:spaceId/nodes
 * Query: parentId (optional), view ('trash', 'starred', 'recent')
 */
app.get("/spaces/:spaceId/nodes", async (c) => {
    const spaceId = c.req.param("spaceId");
    const parentId = c.req.query("parentId") || null;
    const view = c.req.query("view"); 

    const conditions = [eq(nodes.spaceId, spaceId)];

    if (view === 'trash') {
        conditions.push(eq(nodes.isTrashed, true));
    } else if (view === 'starred') {
        conditions.push(eq(nodes.isStarred, true));
        conditions.push(eq(nodes.isTrashed, false));
    } else if (view === 'recent') {
         conditions.push(eq(nodes.isTrashed, false));
         // Sort by updated desc implies recent
    } else {
         // Browse Mode
         conditions.push(eq(nodes.isTrashed, false));
         if (parentId) {
             conditions.push(eq(nodes.parentId, parentId));
         } else {
             conditions.push(isNull(nodes.parentId));
         }
    }

    const result = await db.query.nodes.findMany({
        where: and(...conditions),
        orderBy: [asc(nodes.type), desc(nodes.updatedAt)], // Type: 'dir' < 'file' so dirs first
    });

    return c.json({ nodes: result });
});

/**
 * Create a folder (directory node)
 * POST /spaces/:spaceId/nodes/folder
 */
app.post("/spaces/:spaceId/nodes/folder", async (c) => {
    const spaceId = c.req.param("spaceId");
    const { name, parentId } = await c.req.json();
    
    const [newFolder] = await db.insert(nodes).values({
        spaceId,
        parentId: parentId || null,
        name: name || 'Untitled Folder',
        type: 'dir',
        size: 0
    }).returning();
    
    return c.json({ node: newFolder });
});

/**
 * Update node (Rename, Move, Star, Trash)
 * PATCH /nodes/:id
 */
app.patch("/nodes/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.isStarred !== undefined) updates.isStarred = body.isStarred;
    if (body.isTrashed !== undefined) updates.isTrashed = body.isTrashed;
    if (body.parentId !== undefined) updates.parentId = body.parentId;
    
    updates.updatedAt = new Date(); // Touch

    const [updated] = await db.update(nodes)
        .set(updates)
        .where(eq(nodes.id, id))
        .returning();
        
    return c.json({ node: updated });
});

/**
 * Permanently Delete
 * DELETE /nodes/:id
 */
app.delete("/nodes/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(nodes).where(eq(nodes.id, id));
    return c.json({ success: true, id });
});

export default app;

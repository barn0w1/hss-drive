import { Hono } from "hono";
import { AppBindings } from "../../lib/context.js";
import { db } from "../../db/index.js";
import { spaces } from "@hss/shared"; 
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../auth/auth.guard.js";

const app = new Hono<AppBindings>();

app.use("*", authMiddleware);

/**
 * List all spaces for the current user
 * GET /api/spaces
 */
app.get("/", async (c) => {
    const user = c.var.user;
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const userSpaces = await db.query.spaces.findMany({
        where: eq(spaces.ownerId, user.id),
        orderBy: (spaces, { asc }) => [asc(spaces.createdAt)]
    });

    return c.json({ spaces: userSpaces });
});

/**
 * Create a new space
 * POST /api/spaces
 * Body: { name: string }
 */
app.post("/", async (c) => {
    const user = c.var.user;
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { name } = await c.req.json();
    if (!name) return c.json({ error: "Name is required" }, 400);

    // Initial styling color (random)
    const colors = ['text-blue-500', 'text-green-500', 'text-purple-500', 'text-red-500', 'text-yellow-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const [newSpace] = await db.insert(spaces).values({
        name,
        ownerId: user.id,
        meta: { color: randomColor }
    }).returning();

    return c.json({ space: newSpace });
});

/**
 * Delete a space
 * DELETE /api/spaces/:id
 */
app.delete("/:id", async (c) => {
    const user = c.var.user;
    const spaceId = c.req.param("id");
    
    // Ensure ownership
    const toDelete = await db.query.spaces.findFirst({
        where: and(
            eq(spaces.id, spaceId),
            eq(spaces.ownerId, user.id)
        )
    });

    if (!toDelete) {
        return c.json({ error: "Space not found or permission denied" }, 404);
    }

    await db.delete(spaces).where(eq(spaces.id, spaceId));

    return c.json({ success: true, id: spaceId });
});

export default app;

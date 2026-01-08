import { createMiddleware } from "hono/factory";
import { lucia } from "./auth.service.js";
import { AppBindings } from "../../lib/context.js";

export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const sessionId = lucia.readSessionCookie(c.req.header("Cookie") ?? "");
  
  if (!sessionId) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (session && session.fresh) {
    c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), { append: true });
  }
  if (!session) {
    c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), { append: true });
  }

  c.set("user", user);
  c.set("session", session);
  return next();
});

// Guard: Require Authentication
export const requireAuth = createMiddleware(async (c, next) => {
    const user = c.get('user');
    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    return next();
});

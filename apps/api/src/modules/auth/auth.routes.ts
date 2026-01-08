import { Hono } from "hono";
import { generateState } from "arctic";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { discord, lucia } from "./auth.service.js";
import { generateId } from "lucia";
import { db } from "../../db/index.js";
import { users } from "@hss/shared";
import { eq } from "drizzle-orm";
import { AppBindings } from "../../lib/context.js";

const app = new Hono<AppBindings>();

app.get("/discord", async (c) => {
  if (!discord) return c.text("Discord OAuth not configured", 500);

  const state = generateState();
  // PKCE disabled (null), requesting "identify" scope
  const url = await discord.createAuthorizationURL(state, null, ["identify"]);

  setCookie(c, "discord_oauth_state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10, // 10 min
    sameSite: "Lax",
  });

  return c.redirect(url.toString());
});

app.get("/discord/callback", async (c) => {
  if (!discord) return c.text("Discord OAuth not configured", 500);

  const code = c.req.query("code");
  const state = c.req.query("state");
  const storedState = getCookie(c, "discord_oauth_state");

  if (!code || !state || !storedState || state !== storedState) {
    return c.text("Invalid state or code", 400);
  }

  try {
    const tokens = await discord.validateAuthorizationCode(code, null);
    const accessToken = tokens.accessToken();
    const discordUserRes = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const discordUser = await discordUserRes.json();

    // 1. Check if user exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.discordId, discordUser.id)
    });

    let userId = existingUser?.id;

    if (!existingUser) {
        // 2. Create new user
        userId = generateId(15);
        await db.insert(users).values({
            id: userId,
            discordId: discordUser.id,
            username: discordUser.username,
            avatar: discordUser.avatar
        });
    }

    // 3. Create Session
    const session = await lucia.createSession(userId!, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // 4. Set Cookie & Redirect
    c.header("Set-Cookie", sessionCookie.serialize(), { append: true });
    
    // Redirect to frontend root
    return c.redirect(process.env.FRONTEND_URL || "http://localhost:5173/");

  } catch (e) {
    console.error(e);
    // return c.text("Auth failed", 500);
    // Consider parsing OAuth error specifically
    if (e instanceof Error) {
         return c.text(`Auth error: ${e.message}`, 500);
    }
    return c.text("Unknown Auth error", 500);
  }
});

app.post("/logout", async (c) => {
    const sessionId = lucia.readSessionCookie(c.req.header("Cookie") ?? "");
    if (!sessionId) {
        return c.json({ success: false }, 401);
    }
    await lucia.invalidateSession(sessionId);
    
    const sessionCookie = lucia.createBlankSessionCookie();
    c.header("Set-Cookie", sessionCookie.serialize(), { append: true });
    
    return c.json({ success: true });
});

app.get("/me", async (c) => {
    // Current user is already set by global middleware
    const user = c.get('user');
    return c.json({ user });
});

app.post("/dev-login", async (c) => {
    // Only allow in non-production? Or generally for now while setting up.
    // if (process.env.NODE_ENV === "production") return c.text("Not allowed", 403);

    const { username } = await c.req.json();
    if (!username) return c.json({ error: "Username required" }, 400);

    // 1. Find or create dummy user
    // We treat "username" as the unique identifier for dev login
    // but use a fake Discord ID pattern to play nice with schema
    const fakeDiscordId = `dev:${username}`;
    
    let user = await db.query.users.findFirst({
        where: eq(users.discordId, fakeDiscordId)
    });

    if (!user) {
        const userId = generateId(15);
        await db.insert(users).values({
            id: userId,
            discordId: fakeDiscordId,
            username: username,
            avatar: null
        });
        user = { id: userId, username, discordId: fakeDiscordId, avatar: null, createdAt: new Date() };
    }

    // 2. Create Session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    c.header("Set-Cookie", sessionCookie.serialize(), { append: true });
    
    return c.json({ user });
});

export default app;

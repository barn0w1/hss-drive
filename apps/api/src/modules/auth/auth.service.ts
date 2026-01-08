import { Lucia } from "lucia";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "../../db/index.js";
import { sessions, users } from "@hss/shared";
import { Discord } from "arctic";

// 1. Adapter Setup
const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

// 2. Lucia Initialization
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      // set to `true` when using HTTPS
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      // attributes has the type of DatabaseUserAttributes
      discordId: attributes.discordId,
      username: attributes.username,
      avatar: attributes.avatar
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  discordId: string;
  username: string;
  avatar: string | null;
}

// 3. OAuth Provider Setup
// Load credentials from environment
const clientId = process.env.DISCORD_CLIENT_ID!;
const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
const redirectUri = process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/auth/discord/callback";

// We only initialize this if credeintials are present to avoid crash during build
export const discord = (clientId && clientSecret) 
  ? new Discord(clientId, clientSecret, redirectUri)
  : null;

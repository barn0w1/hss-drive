import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "../../packages/shared/src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // This is for local dev generation, doesn't need real password if just generating
    // but migration needs real connection.
    url: process.env.DATABASE_URL || "postgres://user:password@localhost:5432/hss_drive"
  }
});

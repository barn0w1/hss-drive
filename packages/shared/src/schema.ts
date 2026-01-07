import { pgTable, uuid, text, integer, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// 1. Spaces (Namespace)
export const spaces = pgTable('spaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  meta: jsonb('meta'), // { color: 'blue', createdBy: 'user_123', etc }
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Blobs (CAS Entity)
export const blobs = pgTable('blobs', {
  hash: text('hash').primaryKey(), // SHA-256
  size: integer('size').notNull(),
  mimeType: text('mime_type'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Files (Tree Structure & Metadata)
export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),
  spaceId: uuid('space_id').references(() => spaces.id).notNull(),
  parentId: uuid('parent_id'), // Self-reference added manually in Drizzle if needed, or treated as plain UUID
  
  name: text('name').notNull(),
  type: text('type').$type<'file' | 'dir'>().notNull(),
  
  blobHash: text('blob_hash').references(() => blobs.hash), // NULL if directory
  
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  // Uniqueness constraint: Same parent, Same name = Conflict
  // Note: NULL parentId handling varies by DB, usually handled by partial index in raw SQL if strictly needed.
  // For simplicity, we define the index here.
  unq: uniqueIndex('unique_name_idx').on(t.spaceId, t.parentId, t.name)
}));

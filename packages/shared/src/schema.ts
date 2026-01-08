import { pgTable, uuid, text, integer, jsonb, timestamp, uniqueIndex, foreignKey, boolean } from 'drizzle-orm/pg-core';

// 0. Auth Tables (Lucia)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  discordId: text('discord_id').notNull().unique(),
  username: text('username').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
});

// 1. Spaces (Namespace)
export const spaces = pgTable('spaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').references(() => users.id).notNull(), 
  meta: jsonb('meta'), 
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
  spaceId: uuid('space_id').notNull(),
  parentId: uuid('parent_id'), 
  
  name: text('name').notNull(),
  type: text('type').$type<'file' | 'dir'>().notNull(),

  // Metadata (Denormalized for performance)
  size: integer('size').default(0).notNull(),
  mimeType: text('mime_type'),
  
  // Status flags
  isStarred: boolean('is_starred').default(false).notNull(),
  isTrashed: boolean('is_trashed').default(false).notNull(),
  
  blobHash: text('blob_hash'), // NULL if directory
  
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  spaceFk: foreignKey({
      columns: [table.spaceId],
      foreignColumns: [spaces.id]
  }).onDelete('cascade'),
  parentFk: foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id]
  }),
  blobFk: foreignKey({
      columns: [table.blobHash],
      foreignColumns: [blobs.hash]
  }),
  unq: uniqueIndex('unique_name_idx').on(table.spaceId, table.parentId, table.name)
}));

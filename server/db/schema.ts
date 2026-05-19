import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  authorName: text('author_name'),
  gitlabUrl: text('gitlab_url').notNull(),
  prototypeUrl: text('prototype_url'),
  localRepoPath: text('local_repo_path'),
  lastSyncAt: text('last_sync_at'),
  lastSyncCommit: text('last_sync_commit'),
  syncStatus: text('sync_status'),
  syncError: text('sync_error'),
  status: text('status').notNull().default('ACTIVE'),
  order: integer('order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const remarks = sqliteTable('remarks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  targetType: text('target_type').notNull().default('prototype'),
  targetRef: text('target_ref'),
  content: text('content').notNull(),
  status: text('status').notNull().default('open'),
  author: text('author').notNull().default('Гость'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const selectProjectSchema = createSelectSchema(projects);

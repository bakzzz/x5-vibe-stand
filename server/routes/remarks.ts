import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { remarks, projects } from '../db/schema';

export const remarksApi = new Hono();

remarksApi.get('/', zValidator('query', z.object({ projectId: z.string() })), (c) => {
  const { projectId } = c.req.valid('query');
  let id = projectId;
  if (!projectId.includes('-')) {
    const p = db.select().from(projects).where(eq(projects.slug, projectId)).get();
    if (p) id = p.id;
  }
  const rows = db
    .select()
    .from(remarks)
    .where(eq(remarks.projectId, id))
    .orderBy(desc(remarks.createdAt))
    .all();
  return c.json(rows);
});

remarksApi.post(
  '/',
  zValidator(
    'json',
    z.object({
      projectId: z.string(),
      content: z.string().min(1),
      targetType: z.string().optional(),
      targetRef: z.string().nullable().optional(),
      author: z.string().optional(),
    }),
  ),
  (c) => {
    const body = c.req.valid('json');
    let id = body.projectId;
    if (!body.projectId.includes('-')) {
      const p = db.select().from(projects).where(eq(projects.slug, body.projectId)).get();
      if (!p) return c.json({ error: 'Project not found' }, 404);
      id = p.id;
    }
    const row = db
      .insert(remarks)
      .values({
        projectId: id,
        content: body.content,
        targetType: body.targetType ?? 'prototype',
        targetRef: body.targetRef ?? null,
        author: body.author ?? 'Гость',
      })
      .returning()
      .get();
    return c.json(row, 201);
  },
);

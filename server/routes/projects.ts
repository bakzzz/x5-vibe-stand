import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { projects, remarks, selectProjectSchema } from '../db/schema';
import { resolvePrototypeUrl, storedPrototypeUrl, validateSlug } from '../../src/lib/project';
import { standOrigin } from '../../src/lib/prototypeUrl';
import {
  readRequirementsMarkdown,
  syncProtoFromGitlab,
  type ProtoSyncResult,
} from '../lib/protoGitSync';

export const projectsApi = new Hono();

function applySyncToProject(projectId: string, sync: ProtoSyncResult) {
  const now = new Date().toISOString();
  db.update(projects)
    .set({
      localRepoPath: sync.repoDir || null,
      lastSyncAt: sync.ok ? now : undefined,
      lastSyncCommit: sync.commit,
      syncStatus: sync.ok ? 'ok' : 'error',
      syncError: sync.error ?? (sync.ok ? null : sync.message),
      updatedAt: now,
    })
    .where(eq(projects.id, projectId))
    .run();
}

function runGitSync(slug: string, gitlabUrl: string): ProtoSyncResult {
  return syncProtoFromGitlab(slug, gitlabUrl);
}

const importSchema = z.object({
  slug: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  gitlabUrl: z.string().url().max(500),
  description: z.string().max(2000).optional(),
  authorName: z.string().max(120).optional(),
  prototypeUrl: z.union([z.string().url().max(500), z.literal('')]).optional(),
});

const createSchema = z.object({
  slug: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  gitlabUrl: z.union([z.string().url().max(500), z.literal('')]).optional(),
  description: z.string().max(2000).optional(),
  authorName: z.string().max(120).optional(),
  prototypeUrl: z.union([z.string().url().max(500), z.literal('')]).optional(),
});

const patchSchema = importSchema.partial().omit({ slug: true });

function resolveGitlabUrl(slug: string, url?: string) {
  const trimmed = url?.trim();
  if (trimmed) return trimmed;
  return `https://gitlab.pending/${slug}`;
}

function emptyToNull(v: string | undefined | null) {
  if (v === undefined || v === null || v === '') return null;
  return v;
}

function enrich(p: typeof projects.$inferSelect, remarksCount: number) {
  const parsed = selectProjectSchema.parse(p);
  return {
    ...parsed,
    remarksCount,
    resolvedPrototypeUrl: resolvePrototypeUrl(parsed, standOrigin()),
  };
}

function listRows(includeArchived: boolean) {
  let rows = db.select().from(projects).all();
  if (!includeArchived) rows = rows.filter((p) => p.status !== 'ARCHIVED');
  rows.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'ru'));
  const allRemarks = db.select().from(remarks).all();
  return rows.map((row) => {
    const count = allRemarks.filter((r) => r.projectId === row.id).length;
    return enrich(row, count);
  });
}

projectsApi.get('/', (c) => {
  const includeArchived = c.req.query('includeArchived') === '1';
  const author = c.req.query('author');
  let rows = listRows(includeArchived);
  if (author?.trim()) {
    const a = author.trim().toLowerCase();
    rows = rows.filter((p) => (p.authorName ?? '').toLowerCase().includes(a));
  }
  return c.json(rows);
});

projectsApi.post('/:slug/sync', (c) => {
  const slug = c.req.param('slug');
  const project = db.select().from(projects).where(eq(projects.slug, slug)).get();
  if (!project) return c.json({ error: 'Not found' }, 404);
  const sync = runGitSync(slug, project.gitlabUrl);
  applySyncToProject(project.id, sync);
  const updated = db.select().from(projects).where(eq(projects.id, project.id)).get()!;
  const count = db.select().from(remarks).where(eq(remarks.projectId, project.id)).all().length;
  return c.json({ ...enrich(updated, count), sync }, sync.ok ? 200 : 502);
});

projectsApi.get('/:slug/requirements', (c) => {
  const slug = c.req.param('slug');
  const project = db.select().from(projects).where(eq(projects.slug, slug)).get();
  if (!project) return c.json({ error: 'Not found' }, 404);
  const doc = readRequirementsMarkdown(slug, project.gitlabUrl);
  return c.json(doc);
});

projectsApi.get('/:slug', (c) => {
  const slug = c.req.param('slug');
  const project = db.select().from(projects).where(eq(projects.slug, slug)).get();
  if (!project) return c.json({ error: 'Not found' }, 404);
  const count = db.select().from(remarks).where(eq(remarks.projectId, project.id)).all().length;
  return c.json(enrich(project, count));
});

projectsApi.post('/', zValidator('json', createSchema), (c) => {
  const data = c.req.valid('json');
  const slugErr = validateSlug(data.slug);
  if (slugErr) return c.json({ error: slugErr }, 400);
  if (db.select().from(projects).where(eq(projects.slug, data.slug)).get()) {
    return c.json({ error: 'Проект с таким slug уже есть — используйте «Импорт GitLab» для обновления' }, 409);
  }
  const maxOrder = db.select().from(projects).all().reduce((m, p) => Math.max(m, p.order), -1);
  const row = db
    .insert(projects)
    .values({
      slug: data.slug,
      name: data.name,
      gitlabUrl: resolveGitlabUrl(data.slug, data.gitlabUrl),
      description: emptyToNull(data.description),
      authorName: emptyToNull(data.authorName),
      prototypeUrl: storedPrototypeUrl(data.slug, data.prototypeUrl),
      icon: 'IconLayoutDashboard',
      order: maxOrder + 1,
      status: 'ACTIVE',
    })
    .returning()
    .get();
  return c.json(enrich(row!, 0), 201);
});

projectsApi.post('/import', zValidator('json', importSchema), (c) => {
  const data = c.req.valid('json');
  const slugErr = validateSlug(data.slug);
  if (slugErr) return c.json({ error: slugErr }, 400);

  const existing = db.select().from(projects).where(eq(projects.slug, data.slug)).get();
  if (existing) {
    const row = db
      .update(projects)
      .set({
        name: data.name,
        gitlabUrl: data.gitlabUrl,
        description: emptyToNull(data.description),
        authorName: emptyToNull(data.authorName),
        prototypeUrl: storedPrototypeUrl(data.slug, data.prototypeUrl),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, existing.id))
      .returning()
      .get();
    const count = db.select().from(remarks).where(eq(remarks.projectId, existing.id)).all().length;
    const sync = runGitSync(data.slug, data.gitlabUrl);
    applySyncToProject(existing.id, sync);
    const refreshed = db.select().from(projects).where(eq(projects.id, existing.id)).get()!;
    return c.json({
      ...enrich(refreshed, count),
      imported: 'updated' as const,
      sync,
    });
  }

  const maxOrder = db.select().from(projects).all().reduce((m, p) => Math.max(m, p.order), -1);
  const row = db
    .insert(projects)
    .values({
      slug: data.slug,
      name: data.name,
      gitlabUrl: data.gitlabUrl,
      description: emptyToNull(data.description),
      authorName: emptyToNull(data.authorName),
      prototypeUrl: storedPrototypeUrl(data.slug, data.prototypeUrl),
      icon: 'IconLayoutDashboard',
      order: maxOrder + 1,
      status: 'ACTIVE',
    })
    .returning()
    .get();
  const sync = runGitSync(data.slug, data.gitlabUrl);
  applySyncToProject(row!.id, sync);
  const refreshed = db.select().from(projects).where(eq(projects.id, row!.id)).get()!;
  return c.json({ ...enrich(refreshed, 0), imported: 'created' as const, sync }, 201);
});

projectsApi.put('/:slug', zValidator('json', patchSchema), (c) => {
  const slug = c.req.param('slug');
  const existing = db.select().from(projects).where(eq(projects.slug, slug)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);
  const data = c.req.valid('json');
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined) patch.description = emptyToNull(data.description);
  if (data.authorName !== undefined) patch.authorName = emptyToNull(data.authorName);
  if (data.gitlabUrl !== undefined) patch.gitlabUrl = data.gitlabUrl;
  if (data.prototypeUrl !== undefined) {
    patch.prototypeUrl = storedPrototypeUrl(slug, data.prototypeUrl);
  }
  const row = db.update(projects).set(patch).where(eq(projects.id, existing.id)).returning().get();
  const count = db.select().from(remarks).where(eq(remarks.projectId, existing.id)).all().length;
  return c.json(enrich(row!, count));
});

projectsApi.delete('/:slug', (c) => {
  const slug = c.req.param('slug');
  const existing = db.select().from(projects).where(eq(projects.slug, slug)).get();
  if (!existing) return c.json({ error: 'Not found' }, 404);
  db.delete(projects).where(eq(projects.id, existing.id)).run();
  return c.json({ deleted: true });
});

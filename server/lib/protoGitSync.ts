import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export type ProtoSyncResult = {
  ok: boolean;
  slug: string;
  repoDir: string;
  commit: string | null;
  branch: string | null;
  copiedTo: string | null;
  message: string;
  error?: string;
};

const REPOS_ROOT = path.join(process.cwd(), 'data', 'proto-repos');
const MANIFEST_PATH = path.join(REPOS_ROOT, 'manifest.json');

function runGit(cwd: string, args: string[]): { ok: boolean; stdout: string; stderr: string } {
  const r = spawnSync('git', args, {
    cwd,
    encoding: 'utf-8',
    windowsHide: true,
    timeout: Number(process.env.PROTO_GIT_TIMEOUT_MS ?? 120_000),
  });
  return {
    ok: r.status === 0,
    stdout: (r.stdout ?? '').trim(),
    stderr: (r.stderr ?? '').trim(),
  };
}

/** Локальный клон рядом с репо: ../x5-proto-{slug} или PROTO_LOCAL_REPO_{SLUG} */
export function resolveLocalProtoRepo(slug: string): string | null {
  const envKey = `PROTO_LOCAL_REPO_${slug.toUpperCase().replace(/-/g, '_')}`;
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv && fs.existsSync(path.join(fromEnv, '.git'))) return path.resolve(fromEnv);

  const sibling = path.resolve(process.cwd(), '..', `x5-proto-${slug}`);
  if (fs.existsSync(path.join(sibling, '.git'))) return sibling;

  return null;
}

function normalizeGitUrl(url: string): string {
  const u = url.trim().replace(/\/$/, '');
  return u.endsWith('.git') ? u : `${u}.git`;
}

function ensureReposRoot() {
  fs.mkdirSync(REPOS_ROOT, { recursive: true });
}

function readHeadCommit(repoDir: string): string | null {
  const r = runGit(repoDir, ['rev-parse', '--short', 'HEAD']);
  return r.ok ? r.stdout : null;
}

function readBranch(repoDir: string): string | null {
  const r = runGit(repoDir, ['rev-parse', '--abbrev-ref', 'HEAD']);
  return r.ok ? r.stdout : null;
}

function cloneOrPull(slug: string, gitlabUrl: string): { repoDir: string; error?: string } {
  ensureReposRoot();
  const local = resolveLocalProtoRepo(slug);
  if (local) {
    const pull = runGit(local, ['pull', '--ff-only']);
    if (!pull.ok) {
      return { repoDir: local, error: pull.stderr || 'git pull failed' };
    }
    return { repoDir: local };
  }

  const repoDir = path.join(REPOS_ROOT, slug);
  const remote = normalizeGitUrl(gitlabUrl);

  if (!fs.existsSync(path.join(repoDir, '.git'))) {
    if (fs.existsSync(repoDir)) {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
    const clone = runGit(REPOS_ROOT, ['clone', '--depth', '1', remote, slug]);
    if (!clone.ok) {
      return { repoDir, error: clone.stderr || 'git clone failed' };
    }
  } else {
    runGit(repoDir, ['remote', 'set-url', 'origin', remote]);
    const pull = runGit(repoDir, ['pull', '--ff-only']);
    if (!pull.ok) {
      return { repoDir, error: pull.stderr || 'git pull failed' };
    }
  }

  return { repoDir };
}

function findProtoRoot(repoDir: string): string | null {
  const candidates = [
    path.join(repoDir, 'proto'),
    path.join(repoDir, 'src', 'features'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function copyProtoIntoStand(slug: string, repoDir: string): { copiedTo: string | null; error?: string } {
  const protoRoot = findProtoRoot(repoDir);
  if (!protoRoot) {
    return { copiedTo: null, error: 'В репозитории нет каталога proto/ (ожидается FSD-прототип)' };
  }

  const standProtoDir = path.join(process.cwd(), 'src', 'features', slug, 'proto');
  fs.mkdirSync(standProtoDir, { recursive: true });

  if (protoRoot.endsWith(`${path.sep}proto`) || protoRoot.endsWith('/proto')) {
    fs.cpSync(protoRoot, standProtoDir, { recursive: true, force: true });
  } else {
    const slugProto = path.join(protoRoot, slug, 'proto');
    if (fs.existsSync(slugProto)) {
      fs.cpSync(slugProto, standProtoDir, { recursive: true, force: true });
    } else {
      return { copiedTo: null, error: `Не найден proto для slug «${slug}» в репозитории` };
    }
  }

  const marker = path.join(standProtoDir, '.proto-from-git');
  fs.writeFileSync(
    marker,
    JSON.stringify({ slug, repoDir, syncedAt: new Date().toISOString() }, null, 2),
    'utf-8',
  );

  return { copiedTo: standProtoDir };
}

function writeManifest(slug: string, entry: Record<string, unknown>) {
  ensureReposRoot();
  let manifest: Record<string, Record<string, unknown>> = {};
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as typeof manifest;
    } catch {
      manifest = {};
    }
  }
  manifest[slug] = { ...manifest[slug], ...entry, slug };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

/** Подтянуть репозиторий из GitLab и скопировать proto/* в src/features/{slug}/proto */
export function syncProtoFromGitlab(slug: string, gitlabUrl: string): ProtoSyncResult {
  if (!gitlabUrl?.trim()) {
    return {
      ok: false,
      slug,
      repoDir: '',
      commit: null,
      branch: null,
      copiedTo: null,
      message: 'Не указан URL GitLab',
      error: 'gitlabUrl required',
    };
  }

  const { repoDir, error: gitError } = cloneOrPull(slug, gitlabUrl);
  if (gitError) {
    return {
      ok: false,
      slug,
      repoDir,
      commit: null,
      branch: null,
      copiedTo: null,
      message: 'Ошибка git',
      error: gitError,
    };
  }

  const commit = readHeadCommit(repoDir);
  const branch = readBranch(repoDir);
  const { copiedTo, error: copyError } = copyProtoIntoStand(slug, repoDir);

  if (copyError) {
    return {
      ok: false,
      slug,
      repoDir,
      commit,
      branch,
      copiedTo: null,
      message: copyError,
      error: copyError,
    };
  }

  writeManifest(slug, {
    repoDir,
    gitlabUrl: gitlabUrl.trim(),
    commit,
    branch,
    standProtoDir: copiedTo,
    syncedAt: new Date().toISOString(),
  });

  return {
    ok: true,
    slug,
    repoDir,
    commit,
    branch,
    copiedTo,
    message:
      resolveLocalProtoRepo(slug) != null
        ? 'Обновлено из локального клона (../x5-proto-*), код готов к показу на /proto/'
        : 'Клон из GitLab обновлён, код готов к показу на /proto/',
  };
}

const REQUIREMENT_FILES = [
  'docs/requirements.md',
  'docs/REQUIREMENTS.md',
  'docs/requirements/README.md',
  'REQUIREMENTS.md',
  'README.md',
];

export function readRequirementsMarkdown(slug: string, gitlabUrl: string): {
  found: boolean;
  path: string | null;
  content: string | null;
} {
  const local = resolveLocalProtoRepo(slug);
  const repoDir = local ?? path.join(REPOS_ROOT, slug);
  if (!fs.existsSync(repoDir)) {
    return { found: false, path: null, content: null };
  }

  for (const rel of REQUIREMENT_FILES) {
    const full = path.join(repoDir, rel);
    if (fs.existsSync(full)) {
      return { found: true, path: rel, content: fs.readFileSync(full, 'utf-8') };
    }
  }

  void gitlabUrl;
  return { found: false, path: null, content: null };
}

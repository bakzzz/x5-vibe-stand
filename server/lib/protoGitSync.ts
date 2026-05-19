import { spawn } from 'node:child_process';
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
const GIT_TIMEOUT_MS = Number(process.env.PROTO_GIT_TIMEOUT_MS ?? 120_000);

function runGit(cwd: string, args: string[]): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn('git', args, { cwd, windowsHide: true });
    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (result: { ok: boolean; stdout: string; stderr: string }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      child.kill();
      finish({ ok: false, stdout: '', stderr: `git timeout (${GIT_TIMEOUT_MS}ms)` });
    }, GIT_TIMEOUT_MS);

    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (err) => {
      finish({ ok: false, stdout: '', stderr: err.message });
    });
    child.on('close', (code) => {
      finish({ ok: code === 0, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
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

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function removeDirBestEffort(target: string): Promise<void> {
  if (!fs.existsSync(target)) return;
  for (let i = 0; i < 6; i++) {
    try {
      fs.rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
      return;
    } catch {
      await sleep(350 * (i + 1));
    }
  }
}

async function discardRepoDir(repoDir: string): Promise<{ locked: boolean }> {
  if (!fs.existsSync(repoDir)) return { locked: false };

  const trash = `${repoDir}.trash-${Date.now()}`;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      fs.renameSync(repoDir, trash);
      void removeDirBestEffort(trash);
      return { locked: false };
    } catch {
      await sleep(250 * (attempt + 1));
    }
  }

  await removeDirBestEffort(repoDir);
  return { locked: fs.existsSync(repoDir) };
}

async function cloneFresh(
  slug: string,
  remote: string,
): Promise<{ ok: boolean; repoDir: string; stderr: string }> {
  const repoDir = path.join(REPOS_ROOT, slug);
  let { locked } = await discardRepoDir(repoDir);

  if (!locked && !fs.existsSync(repoDir)) {
    const clone = await runGit(REPOS_ROOT, ['clone', '--depth', '1', remote, slug]);
    return { ok: clone.ok, repoDir, stderr: clone.stderr || 'git clone failed' };
  }

  const stagingName = `${slug}.__staging-${Date.now()}`;
  const stagingDir = path.join(REPOS_ROOT, stagingName);
  const clone = await runGit(REPOS_ROOT, ['clone', '--depth', '1', remote, stagingName]);
  if (!clone.ok) {
    await removeDirBestEffort(stagingDir);
    return { ok: false, repoDir, stderr: clone.stderr || 'git clone failed' };
  }

  ({ locked } = await discardRepoDir(repoDir));
  if (!fs.existsSync(repoDir)) {
    try {
      fs.renameSync(stagingDir, repoDir);
      return { ok: true, repoDir, stderr: '' };
    } catch {
      return { ok: true, repoDir: stagingDir, stderr: '' };
    }
  }

  return { ok: true, repoDir: stagingDir, stderr: '' };
}

async function readHeadCommit(repoDir: string): Promise<string | null> {
  const r = await runGit(repoDir, ['rev-parse', '--short', 'HEAD']);
  return r.ok ? r.stdout : null;
}

async function readBranch(repoDir: string): Promise<string | null> {
  const r = await runGit(repoDir, ['rev-parse', '--abbrev-ref', 'HEAD']);
  return r.ok ? r.stdout : null;
}

async function cloneOrPull(slug: string, gitlabUrl: string): Promise<{ repoDir: string; error?: string }> {
  ensureReposRoot();
  const local = resolveLocalProtoRepo(slug);
  if (local) {
    const pull = await runGit(local, ['pull', '--ff-only']);
    if (!pull.ok) {
      return { repoDir: local, error: pull.stderr || 'git pull failed' };
    }
    return { repoDir: local };
  }

  const repoDir = path.join(REPOS_ROOT, slug);
  const remote = normalizeGitUrl(gitlabUrl);
  const gitDir = path.join(repoDir, '.git');
  const hasGit = fs.existsSync(gitDir);
  const head = hasGit ? await readHeadCommit(repoDir) : null;
  const broken = hasGit && !head;

  if (!hasGit || broken) {
    const fresh = await cloneFresh(slug, remote);
    if (!fresh.ok) {
      return { repoDir: fresh.repoDir, error: fresh.stderr };
    }
    return { repoDir: fresh.repoDir };
  }

  await runGit(repoDir, ['remote', 'set-url', 'origin', remote]);
  const pull = await runGit(repoDir, ['pull', '--ff-only']);
  if (!pull.ok) {
    const fresh = await cloneFresh(slug, remote);
    if (!fresh.ok) {
      return { repoDir: fresh.repoDir, error: pull.stderr || fresh.stderr || 'git pull failed' };
    }
    return { repoDir: fresh.repoDir };
  }

  return { repoDir };
}

function findProtoRoot(repoDir: string): string | null {
  const candidates = [path.join(repoDir, 'proto'), path.join(repoDir, 'src', 'features')];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

/** После копирования: proto из repo «tracker» должен импортировать @/features/{slug}/, не жёсткий tracker. */
function rewriteProtoImportPaths(slug: string, hubProtoDir: string) {
  const exts = new Set(['.ts', '.tsx']);
  const walk = (dir: string) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        walk(full);
        continue;
      }
      if (!exts.has(path.extname(name))) continue;
      let text = fs.readFileSync(full, 'utf-8');
      const next = text
        .replaceAll('@/features/tracker/', `@/features/${slug}/`)
        .replaceAll("from '@/features/tracker'", `from '@/features/${slug}'`)
        .replaceAll('from "@/features/tracker"', `from "@/features/${slug}"`);
      if (next !== text) fs.writeFileSync(full, next, 'utf-8');
    }
  };
  if (fs.existsSync(hubProtoDir)) walk(hubProtoDir);
}

function copyProtoIntoHub(slug: string, repoDir: string): { copiedTo: string | null; error?: string } {
  const protoRoot = findProtoRoot(repoDir);
  if (!protoRoot) {
    return { copiedTo: null, error: 'В репозитории нет каталога proto/ (ожидается FSD-прототип)' };
  }

  const hubProtoDir = path.join(process.cwd(), 'src', 'features', slug, 'proto');
  fs.mkdirSync(hubProtoDir, { recursive: true });

  if (protoRoot.endsWith(`${path.sep}proto`) || protoRoot.endsWith('/proto')) {
    fs.cpSync(protoRoot, hubProtoDir, { recursive: true, force: true });
  } else {
    const slugProto = path.join(protoRoot, slug, 'proto');
    if (fs.existsSync(slugProto)) {
      fs.cpSync(slugProto, hubProtoDir, { recursive: true, force: true });
    } else {
      return { copiedTo: null, error: `Не найден proto для slug «${slug}» в репозитории` };
    }
  }

  rewriteProtoImportPaths(slug, hubProtoDir);

  const marker = path.join(hubProtoDir, '.proto-from-git');
  fs.writeFileSync(
    marker,
    JSON.stringify({ slug, repoDir, syncedAt: new Date().toISOString() }, null, 2),
    'utf-8',
  );

  return { copiedTo: hubProtoDir };
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
export async function syncProtoFromGitlab(slug: string, gitlabUrl: string): Promise<ProtoSyncResult> {
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

  const { repoDir, error: gitError } = await cloneOrPull(slug, gitlabUrl);
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

  const commit = await readHeadCommit(repoDir);
  const branch = await readBranch(repoDir);
  const { copiedTo, error: copyError } = copyProtoIntoHub(slug, repoDir);

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
    hubProtoDir: copiedTo,
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
        ? 'Обновлено из локального клона (../x5-proto-*)'
        : 'Клон из GitLab обновлён',
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

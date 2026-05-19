/** Канон URL прототипа (Иван): каждый проект — свой поддомен, не path в Hub и не /proto/… на общем origin. */

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const DEFAULT_PROTO_DOMAIN = 'proto.x5.ru';
const DEFAULT_STAND_PORT = '3002';

/** Реестр стенда (оболочка): localhost:3002, на бою — корень стенда. */
export function standOrigin(): string {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_STAND_PUBLIC_URL
      ? String(import.meta.env.VITE_STAND_PUBLIC_URL)
      : undefined;
  const fromProcess =
    typeof process !== 'undefined' ? process.env.VITE_STAND_PUBLIC_URL ?? process.env.STAND_PUBLIC_URL : undefined;
  return (fromVite ?? fromProcess ?? `http://localhost:${DEFAULT_STAND_PORT}`).replace(/\/$/, '');
}

export function protoBaseDomain(): string {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_STAND_PROTO_DOMAIN
      ? String(import.meta.env.VITE_STAND_PROTO_DOMAIN)
      : undefined;
  const fromProcess = typeof process !== 'undefined' ? process.env.STAND_PROTO_DOMAIN : undefined;
  return (fromVite ?? fromProcess ?? DEFAULT_PROTO_DOMAIN).replace(/^\./, '');
}

export function vibeStandPort(): string {
  try {
    return new URL(standOrigin()).port || DEFAULT_STAND_PORT;
  } catch {
    return DEFAULT_STAND_PORT;
  }
}

/**
 * Slug прототипа из Host (поддомен).
 * Локально: tracker.localhost
 * Бой: tracker.proto.x5.ru
 */
export function parseProtoSlugFromHostname(hostname: string): string | null {
  const host = hostname.split(':')[0].toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;

  if (host.endsWith('.localhost')) {
    const sub = host.slice(0, -'.localhost'.length);
    if (!sub || sub.includes('.')) return null;
    return SLUG_RE.test(sub) ? sub : null;
  }

  const base = protoBaseDomain();
  const suffix = `.${base}`;
  if (host.endsWith(suffix)) {
    const sub = host.slice(0, -suffix.length);
    if (!sub || sub.includes('.')) return null;
    return SLUG_RE.test(sub) ? sub : null;
  }

  return null;
}

/** Локальный поддомен прототипа: http://tracker.localhost:3002/ */
export function localPrototypeOrigin(slug: string, port = vibeStandPort()): string {
  const p = port ? `:${port}` : '';
  return `http://${slug}.localhost${p}`;
}

/** Бой: https://tracker.proto.x5.ru/ */
export function productionPrototypeOrigin(slug: string, domain = protoBaseDomain()): string {
  return `https://${slug}.${domain.replace(/^\./, '')}`;
}

/** Канонический URL прототипа для текущей среды (dev → *.localhost). */
export function defaultPrototypeUrl(slug: string, _version = 'v1'): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    return `${productionPrototypeOrigin(slug)}/`;
  }
  return `${localPrototypeOrigin(slug)}/`;
}

export function isLegacyPrototypeUrl(url: string, slug: string): boolean {
  if (isLegacyHubPrototypeUrl(url, slug)) return true;
  try {
    const u = new URL(url);
    if (u.pathname.includes('/proto/')) return true;
    if (u.hostname === 'localhost' && !u.hostname.startsWith(`${slug}.`)) return true;
  } catch {
    return url.includes('/tasks/') || url.includes('/proto/') || url.includes('localhost:3001');
  }
  return false;
}

export function storedPrototypeUrl(slug: string, explicit?: string | null): string {
  const trimmed = explicit?.trim();
  if (!trimmed || isLegacyPrototypeUrl(trimmed, slug)) return defaultPrototypeUrl(slug);
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

export function resolvePrototypeUrl(project: { prototypeUrl?: string | null; slug: string }): string {
  return storedPrototypeUrl(project.slug, project.prototypeUrl);
}

/** @deprecated используйте productionPrototypeOrigin */
export function productionPrototypeHost(slug: string, domain?: string): string {
  return productionPrototypeOrigin(slug, domain);
}

/** Старый bridge: прототип в монорепо Hub. */
export function isLegacyHubPrototypeUrl(url: string, slug: string): boolean {
  try {
    const u = new URL(url);
    return /\/tasks\/[^/]+\/proto\//.test(u.pathname) || u.pathname.includes(`/tasks/${slug}/proto/`);
  } catch {
    return url.includes(`/tasks/${slug}/proto/`) || url.includes('localhost:3001/tasks/');
  }
}

/** Редирект со старых path-URL на поддомен. */
export function redirectPathToSubdomain(slug: string): string {
  return defaultPrototypeUrl(slug);
}

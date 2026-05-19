export type StandProject = {

  id: string;

  slug: string;

  name: string;

  description: string | null;

  icon: string | null;

  authorName: string | null;

  gitlabUrl: string;

  prototypeUrl: string | null;

  localRepoPath?: string | null;

  lastSyncAt?: string | null;

  lastSyncCommit?: string | null;

  syncStatus?: string | null;

  syncError?: string | null;

  status: string;

  order: number;

  createdAt: string;

  updatedAt: string;

  remarksCount?: number;

  resolvedPrototypeUrl?: string;

};



import {
  SLUG_RE,
  defaultPrototypeUrl,
  productionPrototypeHost,
  resolvePrototypeUrl,
  storedPrototypeUrl,
  standOrigin,
} from './prototypeUrl';

export {
  defaultPrototypeUrl,
  productionPrototypeHost,
  resolvePrototypeUrl,
  storedPrototypeUrl,
  standOrigin,
};

export function validateSlug(slug: string): string | null {
  if (!slug || slug.length > 64) return 'slug: 1–64 символа';
  if (!SLUG_RE.test(slug)) return 'slug: только a-z, 0-9 и дефис';
  return null;
}


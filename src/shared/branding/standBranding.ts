/** Логотипы X5 для стенда прототипов. */

export const X5_FAVICON_HREF = '/favicon.svg';
export const X5_LOGO_LONG_URL = '/brands/x5-logo-long.svg';
export const X5_LOGO_TEXT_URL = '/brands/x5-logo-text.svg';
export const X5_LOGO_SHORT_URL = '/brands/x5-logo-mark.svg';

export type StandBrandingMeta = {
  logoLong?: string | null;
  logoShort?: string | null;
};

export const DEFAULT_STAND_BRANDING_JSON = JSON.stringify({
  logoLong: X5_LOGO_LONG_URL,
  logoShort: X5_LOGO_SHORT_URL,
});

export function parseStandBrandingMeta(value: string | undefined | null): StandBrandingMeta {
  if (!value?.trim()) return {};
  try {
    return JSON.parse(value) as StandBrandingMeta;
  } catch {
    return {};
  }
}

export function isLegacyLongLogoUrl(url: string): boolean {
  return url.includes('x5-logo-text.svg');
}

export function resolveX5Logos(meta: StandBrandingMeta = {}) {
  const long = meta.logoLong?.trim();
  const short = meta.logoShort?.trim();
  const resolvedLong = long && !isLegacyLongLogoUrl(long) ? long : X5_LOGO_LONG_URL;
  return {
    logoLong: resolvedLong,
    logoShort: short || X5_LOGO_SHORT_URL,
  };
}

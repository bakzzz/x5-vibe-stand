/**
 * Каноническая геометрия зоны контента Shell-layout / Хаб X5.
 * Единственный источник числовых правил для fluid | narrow и режима embed (CDE).
 *
 * @see `.cursor/rules/hub-shell-content-layout.mdc`
 */
import type { GlobalToken } from 'antd/es/theme/interface';

/** Максимальная ширина колонки «форма / статья» — как в Shell Segmented Narrow */
export const SHELL_NARROW_MAX_WIDTH_PX = 1152;

type CssLike = Record<string, string | number | undefined>;

/** Базовые поля shell-layout «демо»: таблицы и полноширинный контент */
export function shellContentInnerBase(token: GlobalToken): CssLike {
  return {
    paddingInline: token.paddingLG,
    paddingTop: Number(token.paddingLG) / 2,
    paddingBottom: token.paddingLG,
  };
}

/** Мобильная версия полей для contentInner (≤768px) */
export function shellContentInnerMobile(token: GlobalToken): CssLike {
  return {
    paddingInline: token.padding,
    paddingTop: Number(token.padding) / 2,
    paddingBottom: token.padding,
  };
}

export function shellContentInnerFluid(): CssLike {
  return { width: '100%' };
}

export function shellContentInnerNarrow(_token: GlobalToken): CssLike {
  return {
    width: '100%',
    maxWidth: SHELL_NARROW_MAX_WIDTH_PX,
    marginInline: 'auto',
    boxSizing: 'border-box',
  };
}

/**
 * Режим встраивания приложения в Shell (CDE): один слой полей к `colorBgLayout`,
 * без суммирования с полным демо-padding там, где внутри уже `PageContainer ghost` + Card.
 */
export function shellContentInnerEmbed(token: GlobalToken): CssLike {
  return {
    paddingInline: token.padding,
    paddingTop: token.paddingSM,
    paddingBottom: token.paddingLG,
    width: '100%',
    boxSizing: 'border-box',
  };
}

export function shellContentInnerEmbedMobile(token: GlobalToken): CssLike {
  return {
    paddingInline: token.paddingSM,
    paddingTop: token.paddingXS,
    paddingBottom: token.padding,
  };
}

/** Типичный блок заголовка/тулбара внутри Card в зоне Shell (документы, секции) */
export function shellCardHeaderPadding(token: GlobalToken): CssLike {
  return {
    paddingInline: token.paddingLG,
    paddingBlock: token.padding,
  };
}

/**
 * Горизонтальные поля внутри Card в CDE (эталон: `FileManager`).
 * На узком экране (`md === false`) — `token.padding`, как у embed-shell; иначе `paddingLG`.
 * Передавайте `screens.md` из `Grid.useBreakpoint()`.
 */
export function shellCardInnerInlinePad(
  token: GlobalToken,
  screensMd: boolean | undefined,
): string | number {
  return screensMd === false ? token.padding : token.paddingLG;
}

/**
 * Длина для CSS custom property (`--*`), передаваемой через `style` / `setProperty`.
 * Числа из дизайн-токенов (`padding`, `paddingLG` и т.д.) в React для обычных свойств
 * (`paddingInline: n`) превращаются в `npx` автоматически; для `var(--x)` подстановка
 * идёт «как есть» — без единицы длина невалидна. Строки вида `16px` возвращаются без изменений.
 */
export function lengthForCssCustomProperty(value: string | number): string {
  if (typeof value === 'number') return `${value}px`;
  const t = value.trim();
  if (/^-?\d+(\.\d+)?$/.test(t)) return `${t}px`;
  return value;
}

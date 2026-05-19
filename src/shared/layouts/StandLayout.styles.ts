import { css, cx } from '@emotion/css';
import { theme } from 'antd';

export const useStandLayoutStyles = () => {
  const { token } = theme.useToken();

  const siderFooter = css`
    cursor: pointer;
    padding: ${token.padding}px;
    display: flex;
    justify-content: center;
    transition: background-color 0.3s;
    background-color: transparent;

    &:hover {
      background-color: ${token.colorFillAlter};
    }

    .collapse-icon {
      color: ${token.colorText};
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `;

  const actionsContainer = css`
    display: flex;
    align-items: center;
    gap: ${token.margin}px;
  `;

  const bellIcon = css`
    cursor: pointer;
    margin-top: 4px;
  `;

  const logoLink = css`
    display: flex;
    align-items: center;
    color: inherit;
    text-decoration: none;
    outline: none;
    &:focus-visible {
      outline: 2px solid ${token.colorPrimary};
      outline-offset: 2px;
    }
  `;

  const logoContainer = css`
    display: flex;
    align-items: center;
    min-height: 32px;
    overflow: visible;
  `;

  const logoImage = css`
    max-height: 32px;
    object-fit: contain;
  `;

  /** Текстовый логотип, если в настройках нет logoLong/logoShort */
  const logoFallback = css`
    font-weight: 600;
    font-size: ${token.fontSizeLG}px;
    color: ${token.colorPrimary};
    letter-spacing: -0.02em;
    white-space: nowrap;
  `;

  const menuItemContainer = css`
    width: 100%;
    display: flex;
    align-items: center;
    gap: ${token.marginXS}px;
    color: inherit;
    cursor: pointer;
  `;

  const navItem = css`
    width: 100%;
    cursor: pointer;
  `;

  return {
    siderFooter,
    actionsContainer,
    bellIcon,
    logoLink,
    logoContainer,
    logoImage,
    logoFallback,
    menuItemContainer,
    navItem,
    cx
  };
};

import { css } from '@emotion/css';
import { theme } from 'antd';

export const useDesignSystemStyles = () => {
  const { token } = theme.useToken();

  const promptBlock = css`
    background: ${token.colorFillAlter};
    padding: ${token.paddingLG}px;
    border-radius: ${token.borderRadius}px;
    border: 1px solid ${token.colorBorder};
    font-family: monospace;
    white-space: pre-wrap;
    color: ${token.colorText};
    font-size: 14px;
    line-height: 1.6;
  `;

  const headerContainer = css`
    padding: ${token.paddingXS}px 0 ${token.paddingLG}px 0;
  `;

  return {
    promptBlock,
    headerContainer
  };
};

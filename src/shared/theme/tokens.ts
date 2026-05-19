import { ThemeConfig } from 'antd';

export const themeTokens: ThemeConfig = {
  token: {
    colorPrimary: '#52c41a',
    borderRadius: 6,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      bodyBg: '#f5f5f5',
    },
    Avatar: {
      colorTextPlaceholder: '#52c41a',
    },
  },
};

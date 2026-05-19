import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useAppTheme } from '@/shared/theme/ThemeContext';
import { VibeStandLayout } from './layout/VibeStandLayout';
import { RegistryPage } from './pages/RegistryPage';
import { ProjectPage } from './pages/ProjectPage';
import { StandDesignSystemPage } from './pages/StandDesignSystemPage';
import { ProtoPathRedirect } from './pages/ProtoPathRedirect';
import { useDocumentBranding } from '@/shared/branding/useDocumentBranding';

const queryClient = new QueryClient();

const VibeStandShell: React.FC = () => {
  useDocumentBranding('X5 · Стенд прототипов');
  return <RouterProvider router={router} />;
};

const router = createBrowserRouter([
  /** Legacy path → редирект на поддомен (Иван). */
  { path: '/proto/:slug/:version/*', element: <ProtoPathRedirect /> },
  { path: '/proto/:slug', element: <ProtoPathRedirect /> },
  {
    element: <VibeStandLayout />,
    children: [
      { path: '/', element: <RegistryPage /> },
      { path: '/p/:slug', element: <ProjectPage /> },
      { path: '/design-system', element: <StandDesignSystemPage /> },
      { path: '/login', element: <Navigate to="/" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

const ThemedApp: React.FC = () => {
  const { theme } = useAppTheme();
  return (
    <ConfigProvider theme={theme} locale={ruRU}>
      <VibeStandShell />
    </ConfigProvider>
  );
};

export const VibeStandApp: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  </QueryClientProvider>
);

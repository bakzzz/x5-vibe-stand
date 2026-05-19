import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { ProtoHostPage } from './pages/ProtoHostPage';
import { useDocumentBranding } from '@/shared/branding/useDocumentBranding';

const queryClient = new QueryClient();

const ProtoSubdomainShell: React.FC<{ slug: string; version: string }> = ({ slug, version }) => {
  useDocumentBranding('X5');
  return (
    <BrowserRouter>
      <ProtoHostPage slug={slug} version={version} />
    </BrowserRouter>
  );
};

/** Прототип на поддомене (tracker.localhost) — без оболочки реестра. */
export const ProtoSubdomainRoot: React.FC<{ slug: string; version?: string }> = ({
  slug,
  version = 'v1',
}) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ProtoSubdomainShell slug={slug} version={version} />
    </ThemeProvider>
  </QueryClientProvider>
);

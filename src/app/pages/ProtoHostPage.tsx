import React, { Suspense, lazy, useMemo } from 'react';
import { ConfigProvider, Result, Skeleton } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RemarksOverlay } from '@/shared/components/Remarks/RemarksOverlay';
import { useAppTheme } from '@/shared/theme/ThemeContext';
import '@/features/shell-layout/x5-fonts.css';
import { standApi } from '../api';

const shellModules = import.meta.glob<{ default: React.ComponentType }>(
  '../../features/*/proto/*/*ShellRoot.tsx',
);

const x5FontFamily =
  "'X5 Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

function findShellLoader(slug: string, version: string) {
  const suffix = `/features/${slug}/proto/${version}/`;
  const key = Object.keys(shellModules).find((k) => k.replace(/\\/g, '/').includes(suffix));
  if (!key) return null;
  return shellModules[key];
}

type Props = {
  slug?: string;
  version?: string;
};

export const ProtoHostPage: React.FC<Props> = (props) => {
  const { theme } = useAppTheme();
  const params = useParams<{ slug: string; version: string }>();
  const slug = props.slug ?? params.slug;
  const version = props.version ?? params.version ?? 'v1';

  const { data: project } = useQuery({
    queryKey: ['vibe-project', slug],
    queryFn: () => standApi.projects.get(slug!),
    enabled: !!slug,
  });

  const RootComponent = useMemo(() => {
    if (!slug || !version) return null;
    const loader = findShellLoader(slug, version);
    if (!loader) return null;
    return lazy(loader);
  }, [slug, version]);

  if (!slug || !version) {
    return <Result status="error" title="Не указан slug или версия прототипа" />;
  }

  if (!RootComponent) {
    return (
      <Result
        status="404"
        title="Прототип не подключён"
        subTitle={`Нет ShellRoot для «${slug}» / ${version}. Импортируйте GitLab и нажмите «Подтянуть из GitLab» на стенде.`}
      />
    );
  }

  return (
    <ConfigProvider
      theme={{
        ...theme,
        token: {
          ...theme.token,
          fontFamily: x5FontFamily,
        },
      }}
      locale={ruRU}
    >
      <Suspense fallback={<Skeleton active style={{ padding: 24 }} />}>
        {project ? (
          <RemarksOverlay projectId={project.id} targetRef={version}>
            <RootComponent />
          </RemarksOverlay>
        ) : (
          <RootComponent />
        )}
      </Suspense>
    </ConfigProvider>
  );
};

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton } from 'antd';
import { redirectPathToSubdomain } from '@/lib/prototypeUrl';

/** Старые закладки /proto/:slug/… → поддомен tracker.localhost */
export const ProtoPathRedirect: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  useEffect(() => {
    if (slug) window.location.replace(redirectPathToSubdomain(slug));
  }, [slug]);
  return <Skeleton active style={{ padding: 48 }} />;
};

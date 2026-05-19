import React from 'react';
import ReactDOM from 'react-dom/client';
import { VibeStandApp } from './app/App';
import { ProtoSubdomainRoot } from './app/ProtoSubdomainRoot';
import { parseProtoSlugFromHostname } from '@/lib/prototypeUrl';
import 'antd/dist/reset.css';
import './styles/global-scrollbar.css';

const protoSlug = parseProtoSlugFromHostname(window.location.hostname);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {protoSlug ? <ProtoSubdomainRoot slug={protoSlug} /> : <VibeStandApp />}
  </React.StrictMode>,
);

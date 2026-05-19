import React, { useState } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  IconLayoutDashboard,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconPalette,
} from '@tabler/icons-react';
import { theme } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useStandLayoutStyles } from '@/shared/layouts/StandLayout.styles';
import { standApi } from '../api';
import { STAND_BRANDING_KEY } from '@/lib/constants';
import { parseStandBrandingMeta } from '@/shared/branding/standBranding';
import { X5BrandLogo } from '@/shared/branding/X5BrandLogo';

const menuData = [
  {
    path: '/',
    name: 'Проекты',
    icon: (
      <span className="anticon">
        <IconLayoutDashboard size={20} stroke={1.5} />
      </span>
    ),
  },
  {
    path: '/design-system',
    name: 'Дизайн-система',
    icon: (
      <span className="anticon">
        <IconPalette size={20} stroke={1.5} />
      </span>
    ),
  },
];

export const VibeStandLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const styles = useStandLayoutStyles();
  const { token } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);

  const { data: systemSettings } = useQuery({
    queryKey: ['vibe-branding'],
    queryFn: () => standApi.settings.get(STAND_BRANDING_KEY),
  });

  const brandingMeta = parseStandBrandingMeta(systemSettings?.value);

  const logoNode = (
    <Link to="/" className={styles.logoLink} aria-label="На главную стенда">
      <div className={styles.logoContainer}>
        <X5BrandLogo collapsed={collapsed} branding={brandingMeta} />
      </div>
    </Link>
  );

  return (
    <ProLayout
      collapsed={collapsed}
      onCollapse={setCollapsed}
      title={false}
      logo={logoNode}
      layout="mix"
      splitMenus={false}
      collapsedButtonRender={false}
      menuHeaderRender={false}
      contentStyle={{ padding: `${token.paddingXS}px ${token.paddingLG}px ${token.paddingLG}px` }}
      menuFooterRender={(props) => (
        <div
          onClick={() => props?.onCollapse?.(!props.collapsed)}
          className={styles.cx(styles.siderFooter, { collapsed: props?.collapsed })}
        >
          {props?.collapsed ? (
            <span className="anticon collapse-icon">
              <IconLayoutSidebarLeftExpand size={20} stroke={1.5} />
            </span>
          ) : (
            <span className="anticon collapse-icon">
              <IconLayoutSidebarLeftCollapse size={20} stroke={1.5} />
            </span>
          )}
        </div>
      )}
      route={{ path: '/', routes: menuData }}
      location={location}
      menuItemRender={(item, dom) => (
        <div
          onClick={(e) => {
            e.preventDefault();
            navigate(item.path || '/');
          }}
          className={styles.navItem}
        >
          {dom}
        </div>
      )}
    >
      <Outlet />
    </ProLayout>
  );
};

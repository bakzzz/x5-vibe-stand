import { IconSettings } from '@tabler/icons-react';
import { Button, Drawer, Grid, Typography, theme } from 'antd';
import { css } from '@emotion/css';
import type { FC, ReactNode } from 'react';
import { useState } from 'react';

export type PrototypeSettingsFrameProps = {
  children: ReactNode;
  /** Заголовок Drawer (по умолчанию — «Настройки прототипа»). */
  drawerTitle?: string;
  /** Содержимое Drawer; если не задано — заглушка с подписью пути. */
  settingsContent?: ReactNode;
  /** Подпись для заглушки, напр. `tracker / v1`. */
  prototypePathLabel?: string;
};

/**
 * Общая оболочка прототипов: плавающая кнопка «шестерёнка» у правого края открывает Drawer настроек.
 */
export const PrototypeSettingsFrame: FC<PrototypeSettingsFrameProps> = ({
  children,
  drawerTitle = 'Настройки прототипа',
  settingsContent,
  prototypePathLabel,
}) => {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const [open, setOpen] = useState(false);

  const triggerWrap = css`
    position: fixed;
    z-index: ${token.zIndexPopupBase};
    right: ${token.marginMD}px;
    top: 50%;
    transform: translateY(-50%);
  `;

  const defaultBody = (
    <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
      Для прототипа{' '}
      <Typography.Text code>{prototypePathLabel ?? '—'}</Typography.Text> отдельные параметры экрана
      можно подключить сюда.
    </Typography.Paragraph>
  );

  return (
    <>
      {children}
      <div className={triggerWrap}>
        <Button
          type="primary"
          shape="circle"
          size="large"
          aria-label={drawerTitle}
          title={drawerTitle}
          icon={<IconSettings className="anticon" size={20} stroke={1.5} />}
          onClick={() => setOpen(true)}
        />
      </div>
      <Drawer
        title={drawerTitle}
        placement="right"
        width={screens.md ? 420 : '100%'}
        onClose={() => setOpen(false)}
        open={open}
        destroyOnClose={false}
      >
        {settingsContent ?? defaultBody}
      </Drawer>
    </>
  );
};

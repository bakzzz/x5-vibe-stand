import React from 'react';
import { ColorPicker, Slider, Switch, Button, Form, Typography, Space, theme as antdTheme, Tabs, InputNumber, Input, Flex } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import { useAppTheme } from '@/shared/theme/ThemeContext';
import { themeTokens as defaultTokens } from '@/shared/theme/tokens';
const { Text } = Typography;

export const ThemeSettings: React.FC = () => {
  const { theme, setTheme, resetTheme } = useAppTheme();
  const { token: antdToken } = antdTheme.useToken();

  const updateToken = (key: string, value: any) => {
    setTheme({
      ...theme,
      token: {
        ...theme.token,
        [key]: value,
      },
    });
  };

  const handleAlgorithmChange = (type: 'dark' | 'compact', checked: boolean) => {
    let currentAlgos = Array.isArray(theme.algorithm) ? [...theme.algorithm] : (theme.algorithm ? [theme.algorithm] : [antdTheme.defaultAlgorithm]);
    
    const algoMap = {
      dark: antdTheme.darkAlgorithm,
      compact: antdTheme.compactAlgorithm,
    };
    
    const targetAlgo = algoMap[type];

    if (checked) {
      if (!currentAlgos.includes(targetAlgo)) {
        currentAlgos.push(targetAlgo);
      }
    } else {
      currentAlgos = currentAlgos.filter(a => a !== targetAlgo);
    }

    if (currentAlgos.length === 0) {
      currentAlgos = [antdTheme.defaultAlgorithm];
    }
    
    // Default algorithm should be removed if dark is added (usually)
    if (currentAlgos.includes(antdTheme.darkAlgorithm)) {
        currentAlgos = currentAlgos.filter(a => a !== antdTheme.defaultAlgorithm);
    } else if (!currentAlgos.includes(antdTheme.defaultAlgorithm) && !currentAlgos.includes(antdTheme.darkAlgorithm)) {
        currentAlgos.push(antdTheme.defaultAlgorithm);
    }

    const isDarkNow = currentAlgos.includes(antdTheme.darkAlgorithm);

    setTheme({
      ...theme,
      algorithm: currentAlgos,
      components: {
        ...theme.components,
        Layout: {
          headerBg: isDarkNow ? '#141414' : defaultTokens.components?.Layout?.headerBg,
          bodyBg: isDarkNow ? '#000000' : defaultTokens.components?.Layout?.bodyBg,
        }
      }
    });
  };

  const currentAlgos = Array.isArray(theme.algorithm) ? theme.algorithm : (theme.algorithm ? [theme.algorithm] : []);
  const isDark = currentAlgos.includes(antdTheme.darkAlgorithm);
  const isCompact = currentAlgos.includes(antdTheme.compactAlgorithm);

  const t = theme.token || {};
  const d = defaultTokens.token || {};

  const colorsTab = (
    <Flex gap="large" align="flex-start" wrap>
      <Form.Item label="Primary (Основной)">
        <ColorPicker value={t.colorPrimary || d.colorPrimary || '#1677ff'} onChangeComplete={(c) => updateToken('colorPrimary', c.toHexString())} showText />
      </Form.Item>
      <Form.Item label="Success (Успех)">
        <ColorPicker value={t.colorSuccess || d.colorSuccess || '#52c41a'} onChangeComplete={(c) => updateToken('colorSuccess', c.toHexString())} showText />
      </Form.Item>
      <Form.Item label="Warning (Внимание)">
        <ColorPicker value={t.colorWarning || d.colorWarning || '#faad14'} onChangeComplete={(c) => updateToken('colorWarning', c.toHexString())} showText />
      </Form.Item>
      <Form.Item label="Error (Ошибка)">
        <ColorPicker value={t.colorError || d.colorError || '#ff4d4f'} onChangeComplete={(c) => updateToken('colorError', c.toHexString())} showText />
      </Form.Item>
      <Form.Item label="Info (Инфо)">
        <ColorPicker value={t.colorInfo || d.colorInfo || '#1677ff'} onChangeComplete={(c) => updateToken('colorInfo', c.toHexString())} showText />
      </Form.Item>
      <Form.Item label="Base Text (Текст)">
        <ColorPicker value={t.colorTextBase || d.colorTextBase || '#000000'} onChangeComplete={(c) => updateToken('colorTextBase', c.toHexString())} showText />
      </Form.Item>
      <Form.Item label="Base Bg (Фон)">
        <ColorPicker value={t.colorBgBase || d.colorBgBase || '#ffffff'} onChangeComplete={(c) => updateToken('colorBgBase', c.toHexString())} showText />
      </Form.Item>
    </Flex>
  );

  const typoTab = (
    <Flex gap="large" align="flex-start" wrap>
      <Form.Item label="Размер шрифта (fontSize)">
        <InputNumber min={10} max={32} value={t.fontSize || d.fontSize || 14} onChange={(v) => updateToken('fontSize', v)} />
      </Form.Item>
      <Form.Item label="Шрифт (fontFamily)">
        <Input value={t.fontFamily || d.fontFamily} onChange={(e) => updateToken('fontFamily', e.target.value)} />
      </Form.Item>
      <Form.Item label="Высота контролов (controlHeight)">
        <Slider min={24} max={64} value={t.controlHeight || d.controlHeight || 32} onChange={(v) => updateToken('controlHeight', v)} style={{ minWidth: 200 }} />
      </Form.Item>
    </Flex>
  );

  const layoutTab = (
    <Flex gap="large" align="flex-start" wrap>
      <Form.Item label="Скругления (borderRadius)">
        <Slider min={0} max={24} value={t.borderRadius ?? d.borderRadius ?? 6} onChange={(v) => updateToken('borderRadius', v)} style={{ minWidth: 200 }} />
      </Form.Item>
      <Form.Item label="Wireframe (Чертеж)">
        <Switch checked={t.wireframe || false} onChange={(v) => updateToken('wireframe', v)} checkedChildren="Вкл" unCheckedChildren="Выкл" />
      </Form.Item>
      <Form.Item label="Темная тема">
        <Switch checked={isDark} onChange={(v) => handleAlgorithmChange('dark', v)} checkedChildren="Вкл" unCheckedChildren="Выкл" />
      </Form.Item>
      <Form.Item label="Компактный режим">
        <Switch checked={isCompact} onChange={(v) => handleAlgorithmChange('compact', v)} checkedChildren="Вкл" unCheckedChildren="Выкл" />
      </Form.Item>
    </Flex>
  );

  const tabItems = [
    { key: '1', label: 'Цвета', children: colorsTab },
    { key: '2', label: 'Типографика', children: typoTab },
    { key: '3', label: 'Лейаут и Формы', children: layoutTab },
  ];

  return (
    <ProCard title="Управление Темой (Design Tokens v5)">
      <Form layout="vertical">
        <Tabs defaultActiveKey="1" items={tabItems} />

        <Flex justify="space-between" align="center" style={{ marginTop: antdToken.marginLG }}>
          <Text type="secondary">
            Настройки темы применяются каскадно ко всему приложению и сохраняются в вашем браузере.
          </Text>
          <Space>
            <Button onClick={() => {
              const json = JSON.stringify(theme, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'hub-theme.json';
              a.click();
            }}>
              Экспорт JSON
            </Button>
            <Button onClick={resetTheme} danger>
              Сбросить
            </Button>
          </Space>
        </Flex>
      </Form>
    </ProCard>
  );
};

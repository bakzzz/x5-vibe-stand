import React from 'react';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Typography, theme } from 'antd';
import { useDesignSystemStyles } from '@/shared/pages/DesignSystem.styles';
import { ThemeSettings } from '@/shared/pages/ThemeSettings';
import { StandLogoSettings } from './StandLogoSettings';

const { Title, Text } = Typography;

export const StandDesignSystemPage: React.FC = () => {
  const styles = useDesignSystemStyles();
  const { token } = theme.useToken();
  const [activeTab, setActiveTab] = React.useState('theme');

  const promptSnippet = `Каркас прототипа X5: Ant Design Pro, colorPrimary #52c41a, layout mix, иконки @tabler/icons-react.`;

  return (
    <PageContainer
      title="Дизайн-система"
      content={
        <Text type="secondary" style={{ fontSize: token.fontSizeLG }}>
          Тема и токены применяются ко всему стенду и прототипам на поддомене.
        </Text>
      }
      tabList={[
        { tab: 'Темы и токены', key: 'theme' },
        { tab: 'Логотипы', key: 'logos' },
        { tab: 'Промпт', key: 'prompt' },
      ]}
      tabActiveKey={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'theme' && <ThemeSettings />}
      {activeTab === 'logos' && <StandLogoSettings />}
      {activeTab === 'prompt' && (
        <ProCard>
          <Title level={4} style={{ marginTop: 0 }}>
            Промпт для нового прототипа
          </Title>
          <div className={styles.promptBlock}>{promptSnippet}</div>
        </ProCard>
      )}
    </PageContainer>
  );
};

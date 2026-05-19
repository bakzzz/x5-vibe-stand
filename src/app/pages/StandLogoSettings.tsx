import React from 'react';

import { Upload, Button, message, Typography, Space, theme } from 'antd';

import { ProCard } from '@ant-design/pro-components';

import { IconUpload } from '@tabler/icons-react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { standApi } from '../api';
import { STAND_BRANDING_KEY } from '@/lib/constants';

import { parseStandBrandingMeta, X5_LOGO_LONG_URL, X5_LOGO_SHORT_URL } from '@/shared/branding/standBranding';

import { X5BrandLogo } from '@/shared/branding/X5BrandLogo';



const { Title, Text } = Typography;



/** Логотипы стенда — `STAND_BRANDING` в `stand.db`. */

export const StandLogoSettings: React.FC = () => {

  const { token } = theme.useToken();

  const queryClient = useQueryClient();



  const { data: systemSettings } = useQuery({

    queryKey: ['vibe-branding'],

    queryFn: () => standApi.settings.get(STAND_BRANDING_KEY),

  });



  const brandingMeta = parseStandBrandingMeta(systemSettings?.value);



  const getBase64 = (file: File): Promise<string> =>

    new Promise((resolve, reject) => {

      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => resolve(reader.result as string);

      reader.onerror = (error) => reject(error);

    });



  const updateGlobalSettings = useMutation({

    mutationFn: async (patch: { logoLong?: string; logoShort?: string }) => {

      const merged = { ...parseStandBrandingMeta(systemSettings?.value), ...patch };

      return standApi.settings.put(STAND_BRANDING_KEY, JSON.stringify(merged));

    },

    onSuccess: () => {

      message.success('Логотип сохранён');

      queryClient.invalidateQueries({ queryKey: ['vibe-branding'] });

    },

    onError: () => message.error('Не удалось сохранить'),

  });



  const handleUpload = (file: File, type: 'logoLong' | 'logoShort') => {

    getBase64(file).then((base64) => updateGlobalSettings.mutate({ [type]: base64 }));

    return false;

  };



  return (

    <ProCard title="Логотипы стенда">

      <Text type="secondary" style={{ display: 'block', marginBottom: token.marginLG }}>

        Хранятся в БД стенда. По умолчанию: lockup (знак + Real Estate), свёрнутый — только знак X5.

      </Text>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>

        <div>

          <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>

            Развёрнутый (logoLong) — знак X5 + Real Estate

          </Text>

          <Upload showUploadList={false} beforeUpload={(file) => handleUpload(file, 'logoLong')}>

            <Button icon={<IconUpload size={18} stroke={1.5} />}>Загрузить</Button>

          </Upload>

          <div>

            <X5BrandLogo branding={brandingMeta} />

            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>

              По умолчанию: {X5_LOGO_LONG_URL}

            </Text>

          </div>

        </div>

        <div>

          <Title level={5} style={{ marginTop: 0 }}>

            Свёрнутый (logoShort) · фавиконка

          </Title>

          <Upload showUploadList={false} beforeUpload={(file) => handleUpload(file, 'logoShort')}>

            <Button icon={<IconUpload size={18} stroke={1.5} />}>Загрузить</Button>

          </Upload>

          <div>

            <X5BrandLogo collapsed branding={brandingMeta} />

            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>

              По умолчанию: {X5_LOGO_SHORT_URL}

            </Text>

          </div>

        </div>

      </Space>

    </ProCard>

  );

};



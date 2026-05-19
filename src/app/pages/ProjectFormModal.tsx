import React, { useEffect } from 'react';
import { Modal, Form, Input, Typography } from 'antd';
import { defaultPrototypeUrl, type StandProject } from '@/lib/project';

export type ProjectFormValues = {
  slug: string;
  name: string;
  gitlabUrl: string;
  description?: string;
  authorName?: string;
  prototypeUrl?: string;
};

type Props = {
  open: boolean;
  mode: 'create' | 'import' | 'edit';
  initial?: Partial<StandProject>;
  onCancel: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  loading?: boolean;
};

export const ProjectFormModal: React.FC<Props> = ({
  open,
  mode,
  initial,
  onCancel,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm<ProjectFormValues>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      slug: initial?.slug ?? '',
      name: initial?.name ?? '',
      gitlabUrl: initial?.gitlabUrl ?? '',
      description: initial?.description ?? '',
      authorName: initial?.authorName ?? '',
      prototypeUrl: initial?.prototypeUrl ?? '',
    });
  }, [open, initial, form]);

  const title =
    mode === 'create'
      ? 'Создать проект'
      : mode === 'import'
        ? 'Импорт из GitLab'
        : 'Редактировать';

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="slug"
          label="Slug"
          rules={[{ required: true }]}
          extra={mode === 'import' ? 'Как в репозитории: tracker для x5-proto-tracker' : undefined}
        >
          <Input disabled={mode === 'edit'} placeholder="tracker" />
        </Form.Item>
        <Form.Item name="name" label="Название" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="gitlabUrl"
          label="GitLab"
          rules={mode === 'import' ? [{ required: true, type: 'url' as const }] : [{ type: 'url' as const }]}
          extra={mode === 'create' ? 'Можно указать позже, после создания репозитория' : undefined}
        >
          <Input placeholder="https://gitlab.../group/repo" />
        </Form.Item>
        <Form.Item
          name="prototypeUrl"
          label="URL прототипа"
          extra="Если пусто — подставится автоматически"
        >
          <Input placeholder="http://tracker.localhost:3002/" />
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.slug !== cur.slug}>
          {({ getFieldValue }) => {
            const slug = getFieldValue('slug') as string;
            if (!slug?.trim()) return null;
            return (
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                Авто: {defaultPrototypeUrl(slug.trim())}
              </Typography.Text>
            );
          }}
        </Form.Item>
        <Form.Item name="authorName" label="Автор">
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Описание">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

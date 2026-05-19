import React, { useMemo, useState } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button, Input, message, Select, Space, Tag, Typography } from 'antd';
import { IconGitBranch, IconPlus } from '@tabler/icons-react';
import { standApi } from '../api';
import { STAND_TAGLINE } from '@/lib/constants';
import type { StandProject } from '@/lib/project';
import { ProjectFormModal, type ProjectFormValues } from './ProjectFormModal';

type ModalMode = 'create' | 'import' | 'edit' | null;

export const RegistryPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<StandProject | null>(null);
  const [search, setSearch] = useState('');
  const [author, setAuthor] = useState<string>();

  const { data, isLoading } = useQuery({
    queryKey: ['vibe-projects', author],
    queryFn: () => standApi.projects.list({ author }),
  });

  const createMutation = useMutation({
    mutationFn: (v: ProjectFormValues) => standApi.projects.create(v),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['vibe-projects'] });
      setModal(null);
      message.success('Проект создан');
      navigate(`/p/${project.slug}`);
    },
    onError: (e: Error) => message.error(e.message),
  });

  const importMutation = useMutation({
    mutationFn: (v: ProjectFormValues) => standApi.projects.import(v),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['vibe-projects'] });
      setModal(null);
      const updated = (project as { imported?: string }).imported === 'updated';
      const sync = (project as { sync?: { ok: boolean; message: string } }).sync;
      if (sync && !sync.ok) {
        message.warning(`${updated ? 'Проект обновлён' : 'Проект импортирован'}, но код не подтянут: ${sync.message}`);
      } else {
        message.success(
          updated ? 'Проект обновлён из GitLab' : 'Проект импортирован, прототип готов',
        );
      }
      navigate(`/p/${project.slug}`);
    },
    onError: (e: Error) => message.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ slug, v }: { slug: string; v: Partial<ProjectFormValues> }) =>
      standApi.projects.update(slug, v),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibe-projects'] });
      setModal(null);
      setEditing(null);
      message.success('Сохранено');
    },
    onError: (e: Error) => message.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.includes(q) ||
        (p.gitlabUrl ?? '').toLowerCase().includes(q),
    );
  }, [data, search]);

  const authors = useMemo(
    () => [...new Set((data ?? []).map((p) => p.authorName).filter(Boolean))] as string[],
    [data],
  );

  const openCreate = () => {
    setEditing(null);
    setModal('create');
  };

  const openImport = () => {
    setEditing(null);
    setModal('import');
  };

  return (
    <PageContainer
      title="Проекты"
      subTitle={STAND_TAGLINE}
      extra={
        <Space wrap>
          <Button
            type="primary"
            icon={
              <span className="anticon">
                <IconPlus size={18} stroke={1.5} />
              </span>
            }
            onClick={openCreate}
          >
            Создать новый
          </Button>
          <Button
            icon={
              <span className="anticon">
                <IconGitBranch size={18} stroke={1.5} />
              </span>
            }
            onClick={openImport}
          >
            Импорт GitLab
          </Button>
        </Space>
      }
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search placeholder="Поиск" allowClear onSearch={setSearch} style={{ width: 260 }} />
        <Select
          allowClear
          placeholder="Автор"
          style={{ width: 160 }}
          options={authors.map((a) => ({ value: a, label: a }))}
          onChange={setAuthor}
        />
      </Space>
      <ProTable<StandProject>
        rowKey="id"
        loading={isLoading}
        dataSource={filtered}
        search={false}
        pagination={false}
        onRow={(r) => ({ onClick: () => navigate(`/p/${r.slug}`), style: { cursor: 'pointer' } })}
        columns={[
          { title: 'Название', dataIndex: 'name' },
          { title: 'Slug', dataIndex: 'slug', width: 120 },
          {
            title: 'Замечания',
            width: 100,
            render: (_, r) => <Tag>{r.remarksCount ?? 0}</Tag>,
          },
          {
            title: '',
            width: 80,
            render: (_, r) => (
              <Button
                type="link"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(r);
                  setModal('edit');
                }}
              >
                Изм.
              </Button>
            ),
          },
        ]}
      />
      {!isLoading && filtered.length === 0 && (
        <Typography.Paragraph type="secondary" style={{ marginTop: 24, textAlign: 'center' }}>
          Нет проектов. Нажмите «Создать новый» или «Импорт GitLab».
        </Typography.Paragraph>
      )}
      <ProjectFormModal
        open={modal !== null}
        mode={modal === 'edit' ? 'edit' : modal === 'import' ? 'import' : 'create'}
        initial={editing ?? undefined}
        onCancel={() => {
          setModal(null);
          setEditing(null);
        }}
        onSubmit={async (v) => {
          if (modal === 'create') await createMutation.mutateAsync(v);
          else if (modal === 'import') await importMutation.mutateAsync(v);
          else if (editing) await updateMutation.mutateAsync({ slug: editing.slug, v });
        }}
        loading={createMutation.isPending || importMutation.isPending || updateMutation.isPending}
      />
    </PageContainer>
  );
};

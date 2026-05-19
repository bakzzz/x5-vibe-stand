import React, { useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { PageContainer, ProCard } from '@ant-design/pro-components';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {

  Alert,

  Button,

  Flex,

  Input,

  List,

  Result,

  Skeleton,

  Space,

  Tag,

  Typography,

} from 'antd';

import { IconBrandGitlab, IconRefresh } from '@tabler/icons-react';

import { standApi } from '../api';
import { localPrototypeOrigin, productionPrototypeOrigin } from '@/lib/prototypeUrl';



export const ProjectPage: React.FC = () => {

  const { slug } = useParams<{ slug: string }>();

  const navigate = useNavigate();

  const [tab, setTab] = useState('prototype');

  const [remarkText, setRemarkText] = useState('');

  const queryClient = useQueryClient();



  const { data: project, isLoading } = useQuery({

    queryKey: ['vibe-project', slug],

    queryFn: () => standApi.projects.get(slug!),

    enabled: !!slug,

  });



  const { data: remarks } = useQuery({

    queryKey: ['vibe-remarks', project?.id],

    queryFn: () => standApi.remarks.list(project!.id),

    enabled: !!project?.id,

  });



  const { data: requirements, isLoading: reqLoading } = useQuery({

    queryKey: ['vibe-requirements', slug],

    queryFn: () => standApi.projects.requirements(slug!),

    enabled: !!slug && tab === 'requirements',

  });



  const syncMutation = useMutation({

    mutationFn: () => standApi.projects.sync(slug!),

    onSuccess: (data) => {

      queryClient.invalidateQueries({ queryKey: ['vibe-project', slug] });

      queryClient.invalidateQueries({ queryKey: ['vibe-requirements', slug] });

      if (data.sync?.ok) {

        queryClient.invalidateQueries({ queryKey: ['vibe-projects'] });

      }

    },

  });



  const addRemark = useMutation({

    mutationFn: () =>

      standApi.remarks.create({

        projectId: project!.id,

        content: remarkText,

      }),

    onSuccess: () => {

      setRemarkText('');

      queryClient.invalidateQueries({ queryKey: ['vibe-remarks'] });

      queryClient.invalidateQueries({ queryKey: ['vibe-projects'] });

    },

  });



  if (isLoading) return <Skeleton active />;

  if (!project) return <Result status="404" title="Нет проекта" extra={<Button onClick={() => navigate('/')}>Назад</Button>} />;



  const protoUrl = project.resolvedPrototypeUrl ?? null;

  const syncOk = project.syncStatus === 'ok';

  const syncFailed = project.syncStatus === 'error';



  return (

    <PageContainer

      title={project.name}

      onBack={() => navigate('/')}

      extra={

        <Button

          icon={

            <span className="anticon">

              <IconRefresh size={16} stroke={1.5} />

            </span>

          }

          loading={syncMutation.isPending}

          onClick={() => syncMutation.mutate()}

        >

          Подтянуть из GitLab

        </Button>

      }

      tabList={[

        { tab: 'Прототип', key: 'prototype' },

        { tab: 'Требования', key: 'requirements' },

        { tab: 'Замечания', key: 'remarks' },

      ]}

      tabActiveKey={tab}

      onTabChange={setTab}

    >

      {syncMutation.data?.sync && !syncMutation.data.sync.ok && (

        <Alert

          type="error"

          showIcon

          style={{ marginBottom: 16 }}

          message="Синхронизация не удалась"

          description={syncMutation.data.sync.message}

        />

      )}



      {tab === 'prototype' && (

        <Flex vertical gap="middle">

          <ProCard>

            <Space wrap style={{ marginBottom: 12 }}>

              <Tag

                icon={

                  <span className="anticon" style={{ marginRight: 4 }}>

                    <IconBrandGitlab size={14} />

                  </span>

                }

                color="geekblue"

              >

                <a href={project.gitlabUrl} target="_blank" rel="noreferrer">

                  GitLab

                </a>

              </Tag>

              {syncOk && project.lastSyncCommit && (

                <Tag color="success">Git: {project.lastSyncCommit}</Tag>

              )}

              {syncFailed && <Tag color="error">Нет синхронизации</Tag>}

              {project.lastSyncAt && (

                <Typography.Text type="secondary">

                  обновлено {new Date(project.lastSyncAt).toLocaleString('ru-RU')}

                </Typography.Text>

              )}

            </Space>

            {syncFailed && project.syncError && (

              <Alert type="warning" showIcon message={project.syncError} style={{ marginBottom: 12 }} />

            )}

            <Typography.Paragraph type="secondary">
              Каждый прототип — <strong>свой поддомен</strong>. Локально:{' '}
              <Typography.Text copyable>{localPrototypeOrigin(project.slug)}</Typography.Text>
              <br />
              На бою: <Typography.Text copyable>{productionPrototypeOrigin(project.slug)}</Typography.Text>
            </Typography.Paragraph>

            <Space wrap>

              <Button type="primary" size="large" href={protoUrl!} target="_blank" rel="noreferrer">

                Открыть прототип

              </Button>

              <Button href={project.gitlabUrl} target="_blank" rel="noreferrer">

                Открыть GitLab

              </Button>

            </Space>

          </ProCard>

          {protoUrl && syncOk && (

            <ProCard title="Прототип" bodyStyle={{ padding: 0, overflow: 'hidden' }}>

              <iframe

                title={`Прототип ${project.name}`}

                src={protoUrl}

                style={{ width: '100%', height: 'min(72vh, 900px)', border: 0, display: 'block' }}

              />

            </ProCard>

          )}

        </Flex>

      )}



      {tab === 'requirements' && (

        <ProCard loading={reqLoading}>

          {requirements?.found && requirements.content ? (

            <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>

              {requirements.content}

            </Typography.Paragraph>

          ) : (

            <Typography.Paragraph type="secondary">

              Положите <code>docs/requirements.md</code> в репозиторий GitLab и нажмите «Подтянуть из GitLab».

            </Typography.Paragraph>

          )}

        </ProCard>

      )}



      {tab === 'remarks' && (

        <ProCard>

          <Flex vertical gap="middle">

            <Flex gap="small">

              <Input.TextArea

                rows={2}

                value={remarkText}

                onChange={(e) => setRemarkText(e.target.value)}

                placeholder="Новое замечание"

              />

              <Button type="primary" onClick={() => addRemark.mutate()} disabled={!remarkText.trim()}>

                Добавить

              </Button>

            </Flex>

            <List

              dataSource={remarks ?? []}

              renderItem={(item) => (

                <List.Item>

                  <List.Item.Meta title={item.author} description={item.content} />

                </List.Item>

              )}

            />

          </Flex>

        </ProCard>

      )}

    </PageContainer>

  );

};

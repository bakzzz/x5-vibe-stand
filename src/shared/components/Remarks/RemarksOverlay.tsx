import React, { useEffect, useState } from 'react';
import { Button, Input, Popover, theme, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { css } from '@emotion/css';
import { standApi } from '@/app/api';
import { useRemarksStore } from '@/shared/store/useRemarksStore';

const useOverlayStyles = (token: ReturnType<typeof theme.useToken>['token']) => ({
  wrapper: css`
    position: relative;
    width: 100%;
    height: 100%;
    min-height: calc(100vh - 100px);
  `,
  glassPane: css`
    position: absolute;
    inset: 0;
    z-index: 900;
    cursor: crosshair;
  `,
  popoverContent: css`
    width: 260px;
  `,
  actions: css`
    margin-top: ${token.marginSM}px;
    text-align: right;
  `,
});

type Props = {
  projectId: string;
  targetRef: string;
  children: React.ReactNode;
};

export const RemarksOverlay: React.FC<Props> = ({ projectId, targetRef, children }) => {
  const { token } = theme.useToken();
  const styles = useOverlayStyles(token);
  const queryClient = useQueryClient();
  const { mode, setMode, setPrototypeActive, authorName } = useRemarksStore();
  const [content, setContent] = useState('');
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setPrototypeActive(true);
    return () => setPrototypeActive(false);
  }, [setPrototypeActive]);

  const { data: remarks = [] } = useQuery({
    queryKey: ['remarks', projectId, targetRef],
    queryFn: () => standApi.remarks.list(projectId),
    select: (rows) => rows.filter((r) => r.targetRef === targetRef),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      standApi.remarks.create({
        projectId,
        content,
        targetRef,
        author: authorName ?? 'Гость',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remarks', projectId, targetRef] });
      message.success('Замечание добавлено');
      setAnchor(null);
      setContent('');
      setMode('view');
    },
    onError: (e: Error) => message.error(e.message),
  });

  return (
    <div className={styles.wrapper}>
      {children}
      {mode === 'add' && (
        <div
          className={styles.glassPane}
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            setAnchor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
        />
      )}
      {anchor && (
        <Popover
          open
          content={
            <div className={styles.popoverContent}>
              <Input.TextArea
                rows={3}
                value={content}
                onChange={(ev) => setContent(ev.target.value)}
                placeholder="Текст замечания"
              />
              <div className={styles.actions}>
                <Button size="small" onClick={() => setAnchor(null)}>
                  Отмена
                </Button>
                <Button
                  type="primary"
                  size="small"
                  loading={createMutation.isPending}
                  disabled={!content.trim()}
                  onClick={() => createMutation.mutate()}
                >
                  Сохранить
                </Button>
              </div>
            </div>
          }
        >
          <span style={{ position: 'absolute', left: anchor.x, top: anchor.y }} />
        </Popover>
      )}
      {remarks.length > 0 && mode === 'view' && (
        <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 800 }}>
          <Button size="small">Замечаний: {remarks.length}</Button>
        </div>
      )}
    </div>
  );
};

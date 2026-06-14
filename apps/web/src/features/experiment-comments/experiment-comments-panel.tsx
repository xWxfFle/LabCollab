import { useState } from 'react';
import type { CommentDto } from '@labcollab/shared';
import { Button, Paper, Stack, Text, Textarea } from '@mantine/core';

interface ExperimentCommentsPanelProps {
  comments: CommentDto[];
  pending: boolean;
  submitPending: boolean;
  onSubmit: (body: string) => void;
}

export function ExperimentCommentsPanel({
  comments,
  pending,
  submitPending,
  onSubmit,
}: ExperimentCommentsPanelProps) {
  const [body, setBody] = useState('');

  const handleSubmit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setBody('');
  };

  return (
    <Stack gap="sm">
      <Text size="sm" fw={500}>
        Комментарии ({comments.length})
      </Text>

      {pending && <Text size="sm" c="dimmed">Загрузка…</Text>}

      {!pending && comments.length === 0 && (
        <Text size="sm" c="dimmed">
          Комментариев пока нет
        </Text>
      )}

      {comments.map((comment) => (
        <Paper key={comment.id} withBorder p="sm">
          <Text size="xs" c="dimmed" mb={4}>
            {comment.authorDisplayName} ·{' '}
            {new Date(comment.createdAt).toLocaleString('ru-RU')}
          </Text>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {comment.body}
          </Text>
        </Paper>
      ))}

      <Textarea
        label="Новый комментарий"
        placeholder="Комментарий руководителя или коллеги"
        value={body}
        onChange={(e) => setBody(e.currentTarget.value)}
        minRows={3}
      />
      <Button onClick={handleSubmit} loading={submitPending} disabled={!body.trim()}>
        Отправить
      </Button>
    </Stack>
  );
}

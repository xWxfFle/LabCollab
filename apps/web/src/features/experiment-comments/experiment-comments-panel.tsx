import { Button, Paper, Stack, Text, Textarea } from '@mantine/core'
import { useUnit } from 'effector-react'
import { useState } from 'react'
import { commentsQuery, createCommentMutation } from '@/shared/api'
import { commentSubmitted } from './model'

export function ExperimentCommentsPanel() {
  const [body, setBody] = useState('')
  const [comments, pending, submitPending, onSubmit] = useUnit([
    commentsQuery.$data,
    commentsQuery.$pending,
    createCommentMutation.$pending,
    commentSubmitted,
  ])

  const commentList = comments ?? []

  const handleSubmit = () => {
    const trimmed = body.trim()
    if (!trimmed)
      return
    onSubmit(trimmed)
    setBody('')
  }

  return (
    <Stack gap="sm">
      <Text size="sm" fw={500}>
        Комментарии (
        {commentList.length}
        )
      </Text>

      {pending && <Text size="sm" c="dimmed">Загрузка…</Text>}

      {!pending && commentList.length === 0 && (
        <Text size="sm" c="dimmed">
          Комментариев пока нет
        </Text>
      )}

      {commentList.map(comment => (
        <Paper key={comment.id} withBorder p="sm">
          <Text size="xs" c="dimmed" mb={4}>
            {comment.authorDisplayName}
            {' '}
            ·
            {' '}
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
        onChange={e => setBody(e.currentTarget.value)}
        minRows={3}
      />
      <Button onClick={handleSubmit} loading={submitPending} disabled={!body.trim()}>
        Отправить
      </Button>
    </Stack>
  )
}

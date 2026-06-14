import type { CommentDto, ExperimentDto, ExperimentVersionDto } from '@labcollab/shared';
import {
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { VersionSnapshotView } from '@/features/experiment-version-view';
import { ExperimentCommentsPanel } from '@/features/experiment-comments';
import { ExperimentTagsInput } from '@/features/experiment-tags';
import { ObservationsEditor } from '@/features/observations-editor';
import { ProjectWorkspaceLayout } from '@/layouts/project-workspace';
import { commentsQuery, createCommentMutation } from '@/shared/api/comments';
import { attachmentsQuery, experimentQuery, versionsQuery } from '@/shared/api/experiments';
import { routes } from '@/shared/routing';
import { useForm } from '@effector-reform/react';
import { useUnit } from 'effector-react';
import type { AttachmentDto } from '@labcollab/shared';
import {
  $canEdit,
  $isSaving,
  $observationsText,
  $selectedVersion,
  $tags,
  $versionModalOpened,
  attachmentDownloadClicked,
  commentSubmitted,
  exportPdfClicked,
  fileSelected,
  metadataForm,
  observationsTextChanged,
  tagsChanged,
  versionModalClosed,
  versionSelected,
} from './model';

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function ExperimentPage() {
  const [
    experiment,
    params,
    versions,
    attachments,
    comments,
    commentsPending,
    commentSubmitPending,
    observationsText,
    tags,
    canEdit,
    isSaving,
    versionModalOpened,
    selectedVersion,
  ] = useUnit([
    experimentQuery.$data,
    routes.experimentView.$params,
    versionsQuery.$data,
    attachmentsQuery.$data,
    commentsQuery.$data,
    commentsQuery.$pending,
    createCommentMutation.$pending,
    $observationsText,
    $tags,
    $canEdit,
    $isSaving,
    $versionModalOpened,
    $selectedVersion,
  ]);

  const exportPdf = useUnit(exportPdfClicked);
  const onFileSelected = useUnit(fileSelected);
  const onObservationsChange = useUnit(observationsTextChanged);
  const onTagsChange = useUnit(tagsChanged);
  const onCommentSubmit = useUnit(commentSubmitted);
  const onVersionSelected = useUnit(versionSelected);
  const onVersionModalClosed = useUnit(versionModalClosed);
  const onAttachmentDownload = useUnit(attachmentDownloadClicked);

  const { fields } = useForm(metadataForm);

  if (!experiment) {
    return (
      <ProjectWorkspaceLayout activeExperimentId={params.experimentId}>
        <Text p="md">Загрузка...</Text>
      </ProjectWorkspaceLayout>
    );
  }

  const experimentData = experiment as ExperimentDto;
  const versionList = (versions ?? []) as ExperimentVersionDto[];
  const attachmentList = (attachments ?? []) as AttachmentDto[];
  const commentList = (comments ?? []) as CommentDto[];
  const readOnly = !canEdit;

  return (
    <ProjectWorkspaceLayout activeExperimentId={params.experimentId}>
      <Stack maw={800} mx="auto" gap="md">
        <Group justify="space-between" align="flex-start">
          <Title order={2}>{experimentData.title}</Title>
          <Group gap="sm">
            {canEdit && (
              <Text size="sm" c="dimmed">
                {isSaving ? 'Сохранение…' : 'Сохранено'}
              </Text>
            )}
            {readOnly && (
              <Text size="sm" c="dimmed">
                Только чтение
              </Text>
            )}
            <Button onClick={() => exportPdf()}>PDF</Button>
          </Group>
        </Group>

        <Stack>
          <TextInput
            label="Название"
            value={fields.title.value}
            onChange={(e) => fields.title.onChange(e.currentTarget.value)}
            onBlur={fields.title.onBlur}
            readOnly={readOnly}
          />
          <Select
            label="Статус"
            value={fields.status.value}
            onChange={(v) =>
              v && fields.status.onChange(v as 'draft' | 'in_progress' | 'completed')
            }
            data={[
              { value: 'draft', label: 'Черновик' },
              { value: 'in_progress', label: 'В процессе' },
              { value: 'completed', label: 'Завершён' },
            ]}
            readOnly={readOnly}
            disabled={readOnly}
          />
          <Textarea
            label="Цель"
            value={fields.objective.value}
            onChange={(e) => fields.objective.onChange(e.currentTarget.value)}
            onBlur={fields.objective.onBlur}
            required
            readOnly={readOnly}
          />
          <Textarea
            label="Гипотеза"
            value={fields.hypothesis.value}
            onChange={(e) => fields.hypothesis.onChange(e.currentTarget.value)}
            onBlur={fields.hypothesis.onBlur}
            readOnly={readOnly}
          />
          <Textarea
            label="Материалы"
            value={fields.materials.value}
            onChange={(e) => fields.materials.onChange(e.currentTarget.value)}
            onBlur={fields.materials.onBlur}
            readOnly={readOnly}
          />
          <Textarea
            label="Протокол"
            value={fields.protocolSteps.value}
            onChange={(e) => fields.protocolSteps.onChange(e.currentTarget.value)}
            onBlur={fields.protocolSteps.onBlur}
            readOnly={readOnly}
          />
          <Textarea
            label="Условия"
            value={fields.conditions.value}
            onChange={(e) => fields.conditions.onChange(e.currentTarget.value)}
            onBlur={fields.conditions.onBlur}
            readOnly={readOnly}
          />
          <Textarea
            label="Результаты"
            value={fields.results.value}
            onChange={(e) => fields.results.onChange(e.currentTarget.value)}
            onBlur={fields.results.onBlur}
            readOnly={readOnly}
          />

          <ExperimentTagsInput
            value={tags}
            onChange={onTagsChange}
            readOnly={readOnly}
          />

          <ObservationsEditor
            editorKey={params.experimentId}
            content={observationsText}
            onChange={onObservationsChange}
            readOnly={readOnly}
          />

          <div>
            <Text size="sm" fw={500} mb={4}>
              Вложения
            </Text>
            {canEdit && (
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFileSelected(file);
                }}
              />
            )}
            <Stack gap={4} mt="xs">
              {attachmentList.map((a) => (
                <Group key={a.id} gap="xs">
                  <Text size="sm">{a.filename}</Text>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => onAttachmentDownload({ id: a.id, filename: a.filename })}
                  >
                    Скачать
                  </Button>
                </Group>
              ))}
            </Stack>
          </div>

          <Text size="sm" fw={500}>
            История версий ({versionList.length})
          </Text>
          <Stack gap="xs">
            {versionList.length === 0 && (
              <Text size="sm" c="dimmed">
                Версий пока нет — они создаются при сохранении изменений
              </Text>
            )}
            {versionList.map((version) => {
              const snapshot = version.snapshot;
              const observationsPreview = snapshot.observationsText
                ? stripHtml(snapshot.observationsText)
                : '';

              return (
                <Paper
                  key={version.id}
                  withBorder
                  p="sm"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onVersionSelected(version)}
                >
                  <Text size="sm" fw={500}>
                    {snapshot.title ?? 'Без названия'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(version.createdAt).toLocaleString('ru-RU')}
                    {snapshot.status ? ` · ${snapshot.status}` : ''}
                  </Text>
                  {observationsPreview && (
                    <Text size="sm" mt={4} lineClamp={3}>
                      {observationsPreview}
                    </Text>
                  )}
                  <Text size="xs" c="blue" mt={4}>
                    Открыть снапшот →
                  </Text>
                </Paper>
              );
            })}
          </Stack>

          <ExperimentCommentsPanel
            comments={commentList}
            pending={commentsPending}
            submitPending={commentSubmitPending}
            onSubmit={onCommentSubmit}
          />
        </Stack>
      </Stack>

      <Modal
        opened={versionModalOpened}
        onClose={() => onVersionModalClosed()}
        title={
          selectedVersion
            ? `Версия от ${new Date(selectedVersion.createdAt).toLocaleString('ru-RU')}`
            : 'Версия'
        }
        size="lg"
      >
        {selectedVersion && (
          <VersionSnapshotView
            snapshot={selectedVersion.snapshot}
            editorKey={selectedVersion.id}
          />
        )}
      </Modal>
    </ProjectWorkspaceLayout>
  );
}

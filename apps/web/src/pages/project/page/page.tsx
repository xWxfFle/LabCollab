import { useUnit } from 'effector-react';
import {
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DocPageEditor } from '@/features/doc-page-editor';
import { ProjectWorkspaceLayout } from '@/layouts/project-workspace';
import { pageVersionsQuery, projectPageQuery } from '@/shared/api';
import { routes } from '@/shared/routing';
import type { ProjectPageVersionDto } from '@labcollab/shared';
import {
  $bodyHtml,
  $canEdit,
  $isSaving,
  $selectedVersion,
  $title,
  $versionModalOpened,
  bodyChanged,
  exportMdClicked,
  exportPdfClicked,
  titleChanged,
  versionModalClosed,
  versionSelected,
} from './model';

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function ProjectDocPage() {
  const [
    page,
    params,
    title,
    bodyHtml,
    canEdit,
    isSaving,
    versions,
    versionModalOpened,
    selectedVersion,
  ] = useUnit([
    projectPageQuery.$data,
    routes.projectPageView.$params,
    $title,
    $bodyHtml,
    $canEdit,
    $isSaving,
    pageVersionsQuery.$data,
    $versionModalOpened,
    $selectedVersion,
  ]);

  const onTitleChange = useUnit(titleChanged);
  const onBodyChange = useUnit(bodyChanged);
  const onExportPdf = useUnit(exportPdfClicked);
  const onExportMd = useUnit(exportMdClicked);
  const onVersionSelected = useUnit(versionSelected);
  const onVersionModalClosed = useUnit(versionModalClosed);

  if (!page) {
    return (
      <ProjectWorkspaceLayout activePageId={params.pageId}>
        <Text>Загрузка…</Text>
      </ProjectWorkspaceLayout>
    );
  }

  const readOnly = !canEdit;
  const versionList = (versions ?? []) as ProjectPageVersionDto[];

  return (
    <ProjectWorkspaceLayout activePageId={params.pageId}>
      <Stack maw={900} mx="auto" gap="md">
        <Group justify="space-between" align="flex-start">
          <Title order={2} style={{ flex: 1 }}>
            {readOnly ? (
              title
            ) : (
              <TextInput
                variant="unstyled"
                size="xl"
                fw={700}
                value={title}
                onChange={(e) => onTitleChange(e.currentTarget.value)}
              />
            )}
          </Title>
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
            <Button variant="light" size="xs" onClick={() => onExportPdf()}>
              PDF
            </Button>
            <Button variant="light" size="xs" onClick={() => onExportMd()}>
              Markdown
            </Button>
          </Group>
        </Group>

        <DocPageEditor
          editorKey={`${params.pageId}-${page.updatedAt}`}
          content={bodyHtml}
          projectId={params.projectId}
          onChange={onBodyChange}
          readOnly={readOnly}
        />

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
            const preview = stripHtml(version.snapshot.bodyHtml);
            return (
              <Paper
                key={version.id}
                withBorder
                p="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => onVersionSelected(version)}
              >
                <Text size="sm" fw={500}>
                  {version.snapshot.title || 'Без названия'}
                </Text>
                <Text size="xs" c="dimmed">
                  {new Date(version.createdAt).toLocaleString('ru-RU')}
                </Text>
                {preview && (
                  <Text size="sm" mt={4} lineClamp={3}>
                    {preview}
                  </Text>
                )}
                <Text size="xs" c="blue" mt={4}>
                  Открыть снапшот →
                </Text>
              </Paper>
            );
          })}
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
          <Stack gap="sm">
            <Title order={4}>{selectedVersion.snapshot.title}</Title>
            <div
              dangerouslySetInnerHTML={{ __html: selectedVersion.snapshot.bodyHtml }}
            />
          </Stack>
        )}
      </Modal>
    </ProjectWorkspaceLayout>
  );
}

import { Modal, Stack, Title } from '@mantine/core'
import { useUnit } from 'effector-react'
import { DocPageEditor } from '@/features/doc-page-editor'
import { useUnsavedChangesGuard } from '@/features/unsaved-changes-guard/use-unsaved-changes-guard'
import { ProjectWorkspaceLayout } from '@/layouts/project-workspace'
import { projectPageQuery } from '@/shared/api'
import { routes } from '@/shared/routing'
import {
  $isDirty,
  $selectedVersion,
  $versionModalOpened,
  versionModalClosed,
} from './model'
import {
  ProjectPageBodyEditor,
  ProjectPageHeader,
  ProjectPageVersionsSection,
} from './ui/project-page-sections'

export default function ProjectDocPage() {
  const [page, params, isDirty, versionModalOpened, selectedVersion, pagePending] = useUnit([
    projectPageQuery.$data,
    routes.projectPageView.$params,
    $isDirty,
    $versionModalOpened,
    $selectedVersion,
    projectPageQuery.$pending,
  ])

  const onVersionModalClosed = useUnit(versionModalClosed)

  useUnsavedChangesGuard(isDirty)

  const loading = pagePending && (!page || page.id !== params.pageId)

  return (
    <ProjectWorkspaceLayout activePageId={params.pageId} loading={loading}>
      {page && (
        <>
          <Stack w="100%" gap="md">
            <ProjectPageHeader />
            <ProjectPageBodyEditor
              pageId={page.id}
              pageUpdatedAt={page.updatedAt}
              projectId={params.projectId}
            />
            <ProjectPageVersionsSection />
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
                <DocPageEditor
                  editorKey={`version-${selectedVersion.id}`}
                  content={selectedVersion.snapshot.bodyHtml}
                  projectId={params.projectId}
                  onChange={() => {}}
                  readOnly
                />
              </Stack>
            )}
          </Modal>
        </>
      )}
    </ProjectWorkspaceLayout>
  )
}

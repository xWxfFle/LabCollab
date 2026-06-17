import type { ExperimentDto } from '@labcollab/shared'
import { Group, Loader, Modal, Stack } from '@mantine/core'
import { useUnit } from 'effector-react'
import { ExperimentCommentsPanel } from '@/features/experiment-comments'
import { VersionSnapshotView } from '@/features/experiment-version-view'
import { useUnsavedChangesGuard } from '@/features/unsaved-changes-guard/use-unsaved-changes-guard'
import { ProjectWorkspaceLayout } from '@/layouts/project-workspace'
import {
  $isDirty,
  $selectedVersion,
  $versionModalOpened,
  currentRoute,
  experimentQuery,
  versionModalClosed,
} from './model'
import {
  ExperimentAttachmentsSection,
  ExperimentChecklistSection,
  ExperimentDynamicFields,
  ExperimentMetadataFields,
  ExperimentObservationsSection,
  ExperimentPageHeader,
  ExperimentTagsSection,
  ExperimentVersionsSection,
} from './ui/experiment-editor-sections'

export default function ExperimentPage() {
  const [
    experiment,
    params,
    isDirty,
    versionModalOpened,
    selectedVersion,
    experimentPending,
  ] = useUnit([
    experimentQuery.$data,
    currentRoute.$params,
    $isDirty,
    $versionModalOpened,
    $selectedVersion,
    experimentQuery.$pending,
  ])

  const onVersionModalClosed = useUnit(versionModalClosed)

  useUnsavedChangesGuard(isDirty)

  const loading = experimentPending && (!experiment || experiment.id !== params.experimentId)
  const experimentData = experiment as ExperimentDto | null

  return (
    <ProjectWorkspaceLayout activeExperimentId={params.experimentId} loading={loading}>
      {experimentData && (
        <Stack w="100%" gap="md">
          <ExperimentPageHeader title={experimentData.title} />

          <Stack>
            <ExperimentMetadataFields />
            <ExperimentDynamicFields />
            <ExperimentTagsSection />
            <ExperimentChecklistSection />
            <ExperimentObservationsSection />
          </Stack>

          <ExperimentAttachmentsSection />
          <ExperimentVersionsSection />
          <ExperimentCommentsPanel />

          <Modal
            opened={versionModalOpened}
            onClose={() => onVersionModalClosed()}
            title="Версия записи"
            size="lg"
          >
            {selectedVersion && (
              <VersionSnapshotView
                snapshot={selectedVersion.snapshot}
                editorKey={selectedVersion.id}
              />
            )}
          </Modal>
        </Stack>
      )}
      {loading && (
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      )}
    </ProjectWorkspaceLayout>
  )
}

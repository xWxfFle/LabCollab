import { createEffect } from 'effector'
import { apiFetch } from './base'

export interface PendingAttachmentDraft {
  localId: string
  file: File
}

export const uploadAttachmentFx = createEffect(
  async ({ experimentId, file }: { experimentId: string, file: File }) => {
    const form = new FormData()
    form.append('file', file)
    const res = await apiFetch(`/experiments/${experimentId}/attachments`, {
      method: 'POST',
      body: form,
    })
    return res.json()
  },
)

export const deleteAttachmentFx = createEffect(
  async (attachmentId: string) => {
    const res = await apiFetch(`/attachments/${attachmentId}`, {
      method: 'DELETE',
    })
    return res.json()
  },
)

export const syncExperimentAttachmentsFx = createEffect(
  async ({
    experimentId,
    uploads,
    deletes,
  }: {
    experimentId: string
    uploads: PendingAttachmentDraft[]
    deletes: string[]
  }) => {
    for (const attachmentId of deletes) {
      const res = await apiFetch(`/attachments/${attachmentId}`, { method: 'DELETE' })
      await res.json()
    }

    for (const { file } of uploads) {
      const form = new FormData()
      form.append('file', file)
      const res = await apiFetch(`/experiments/${experimentId}/attachments`, {
        method: 'POST',
        body: form,
      })
      await res.json()
    }
  },
)

export const downloadPdfFx = createEffect(
  async ({ experimentId, observationsText }: { experimentId: string, observationsText: string }) => {
    const res = await apiFetch(
      `/experiments/${experimentId}/export/pdf?observationsText=${encodeURIComponent(observationsText)}`,
    )
    return res.blob()
  },
)

export const downloadAttachmentFx = createEffect(
  async ({ attachmentId, filename }: { attachmentId: string, filename: string }) => {
    const res = await apiFetch(`/attachments/${attachmentId}/download`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },
)

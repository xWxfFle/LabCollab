import { createEffect } from 'effector'
import { apiFetch } from './base'

export const downloadPagePdfFx = createEffect(async ({ pageId }: { pageId: string }) => {
  const res = await apiFetch(`/pages/${pageId}/export/pdf`)
  return res.blob()
})

export const downloadPageMdFx = createEffect(async ({ pageId }: { pageId: string }) => {
  const res = await apiFetch(`/pages/${pageId}/export/md`)
  return res.text()
})

export const savePageExportFx = createEffect(
  async ({
    blob,
    pageId,
    extension,
  }: {
    blob: Blob
    pageId: string
    extension: 'pdf' | 'md'
  }) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `page-${pageId}.${extension}`
    a.click()
    URL.revokeObjectURL(url)
  },
)

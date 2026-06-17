import type { TablerIcon } from '@tabler/icons-react'
import {
  IconFile,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconPhoto,
} from '@tabler/icons-react'

export const allowedAttachmentMimeTypes = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const

export const allowedAttachmentAccept = [
  ...allowedAttachmentMimeTypes,
  '.jpg',
  '.jpeg',
  '.png',
  '.pdf',
  '.csv',
  '.xlsx',
].join(',')

export const allowedAttachmentHint = 'JPEG, PNG, PDF, CSV, XLSX · до 10 МБ'

const allowedMimeSet = new Set<string>(allowedAttachmentMimeTypes)
const allowedExtensionSet = new Set(['jpg', 'jpeg', 'png', 'pdf', 'csv', 'xlsx'])

export function filterAllowedAttachmentFiles(files: File[]) {
  return files.filter((file) => {
    if (allowedMimeSet.has(file.type))
      return true

    const ext = file.name.split('.').pop()?.toLowerCase()
    return ext ? allowedExtensionSet.has(ext) : false
  })
}

interface AttachmentFileMeta {
  Icon: TablerIcon
  color: string
  formatLabel: string
}

export function getAttachmentFileMeta(filename: string): AttachmentFileMeta {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''

  switch (ext) {
    case 'pdf':
      return { Icon: IconFileTypePdf, color: 'red', formatLabel: 'PDF' }
    case 'png':
      return { Icon: IconPhoto, color: 'blue', formatLabel: 'PNG' }
    case 'jpg':
    case 'jpeg':
      return { Icon: IconPhoto, color: 'blue', formatLabel: 'JPEG' }
    case 'csv':
      return { Icon: IconFileSpreadsheet, color: 'green', formatLabel: 'CSV' }
    case 'xlsx':
      return { Icon: IconFileSpreadsheet, color: 'teal', formatLabel: 'XLSX' }
    default:
      return { Icon: IconFile, color: 'gray', formatLabel: ext.toUpperCase() || 'FILE' }
  }
}

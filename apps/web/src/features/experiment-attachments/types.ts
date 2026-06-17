export interface AttachmentDraftRow {
  id: string
  filename: string
  source: 'local' | 'server'
  isPending: boolean
}

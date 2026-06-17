import { ThemeIcon, Tooltip } from '@mantine/core'
import {
  IconFile,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconPhoto,
} from '@tabler/icons-react'
import { getAttachmentFileMeta } from './lib'

interface AttachmentFileIconProps {
  filename: string
}

function renderAttachmentGlyph(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''

  switch (ext) {
    case 'pdf':
      return <IconFileTypePdf size={18} stroke={1.5} />
    case 'png':
    case 'jpg':
    case 'jpeg':
      return <IconPhoto size={18} stroke={1.5} />
    case 'csv':
      return <IconFileSpreadsheet size={18} stroke={1.5} />
    case 'xlsx':
      return <IconFileSpreadsheet size={18} stroke={1.5} />
    default:
      return <IconFile size={18} stroke={1.5} />
  }
}

export function AttachmentFileIcon({ filename }: AttachmentFileIconProps) {
  const { color, formatLabel } = getAttachmentFileMeta(filename)

  return (
    <Tooltip label={formatLabel} withArrow>
      <ThemeIcon variant="light" color={color} size={34} radius="sm">
        {renderAttachmentGlyph(filename)}
      </ThemeIcon>
    </Tooltip>
  )
}

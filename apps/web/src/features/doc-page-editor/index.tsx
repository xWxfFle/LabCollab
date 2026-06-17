import { Paper, Text } from '@mantine/core'
import { RichTextEditor } from '@mantine/tiptap'
import { IconAt } from '@tabler/icons-react'
import LinkExtension from '@tiptap/extension-link'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { memo, useState } from 'react'
import {
  handleInternalLinkClick,
  insertInternalLink,
  InternalLinkPicker,
  useInternalLinkNavigation,
} from '@/features/internal-link'

interface DocPageEditorProps {
  editorKey: string
  content: string
  projectId: string
  onChange: (html: string) => void
  readOnly?: boolean
}

export const DocPageEditor = memo(({
  editorKey,
  content,
  projectId,
  onChange,
  readOnly,
}: DocPageEditorProps) => {
  const [linkPickerOpened, setLinkPickerOpened] = useState(false)
  const navigateInternal = useInternalLinkNavigation()

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ link: false }),
        LinkExtension.configure({
          openOnClick: false,
          HTMLAttributes: {
            'data-labcollab-internal': 'true',
          },
        }),
      ],
      content: content || '<p></p>',
      editable: !readOnly,
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getHTML())
      },
      editorProps: {
        handleClick: (view, pos, event) => {
          if (readOnly) {
            return handleInternalLinkClick(event, navigateInternal)
          }
          return false
        },
      },
    },
    [editorKey, readOnly],
  )

  return (
    <Paper withBorder p="sm">
      <RichTextEditor editor={editor}>
        {!readOnly && (
          <RichTextEditor.Toolbar sticky stickyOffset={56}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
            </RichTextEditor.ControlsGroup>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Control
                onClick={() => setLinkPickerOpened(true)}
                aria-label="Внутренняя ссылка"
                title="Ссылка на страницу или эксперимент"
              >
                <IconAt size={16} stroke={1.5} />
              </RichTextEditor.Control>
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>
        )}
        <RichTextEditor.Content
          mih={320}
          onClick={(e) => {
            if (readOnly) {
              handleInternalLinkClick(e.nativeEvent, navigateInternal)
            }
          }}
        />
      </RichTextEditor>
      {readOnly && (
        <Text size="xs" c="dimmed" mt="xs">
          Клик по внутренней ссылке откроет страницу или эксперимент
        </Text>
      )}
      {editor && (
        <InternalLinkPicker
          projectId={projectId}
          opened={linkPickerOpened}
          onClose={() => setLinkPickerOpened(false)}
          onSelect={(href, label) => insertInternalLink(editor, href, label)}
        />
      )}
    </Paper>
  )
})

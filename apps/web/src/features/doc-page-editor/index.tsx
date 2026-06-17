import { ActionIcon, Paper, Text } from '@mantine/core'
import { RichTextEditor } from '@mantine/tiptap'
import LinkExtension from '@tiptap/extension-link'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useState } from 'react'
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

export function DocPageEditor({
  editorKey,
  content,
  projectId,
  onChange,
  readOnly,
}: DocPageEditorProps) {
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
              <ActionIcon
                variant="default"
                size="lg"
                aria-label="Внутренняя ссылка"
                onClick={() => setLinkPickerOpened(true)}
              >
                @
              </ActionIcon>
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
}

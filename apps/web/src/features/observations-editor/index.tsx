import { Paper, Text } from '@mantine/core'
import { RichTextEditor } from '@mantine/tiptap'
import LinkExtension from '@tiptap/extension-link'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface ObservationsEditorProps {
  editorKey: string
  content: string
  onChange: (html: string) => void
  readOnly?: boolean
}

export function ObservationsEditor({
  editorKey,
  content,
  onChange,
  readOnly,
}: ObservationsEditorProps) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ link: false }),
        LinkExtension.configure({ openOnClick: false }),
      ],
      content: content || '<p></p>',
      editable: !readOnly,
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getHTML())
      },
    },
    [editorKey, readOnly],
  )

  return (
    <Paper withBorder p="sm" mt="sm">
      <Text size="sm" c="dimmed" mb="xs">
        Наблюдения / ход эксперимента
      </Text>
      <RichTextEditor editor={editor}>
        {!readOnly && (
          <RichTextEditor.Toolbar sticky stickyOffset={56}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Strikethrough />
              <RichTextEditor.ClearFormatting />
            </RichTextEditor.ControlsGroup>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H1 />
              <RichTextEditor.H2 />
              <RichTextEditor.H3 />
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
            </RichTextEditor.ControlsGroup>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>
        )}
        <RichTextEditor.Content mih={160} />
      </RichTextEditor>
    </Paper>
  )
}

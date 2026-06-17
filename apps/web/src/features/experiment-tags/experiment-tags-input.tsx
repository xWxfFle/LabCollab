import { TagsInput } from '@mantine/core'

interface ExperimentTagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  readOnly?: boolean
}

export function ExperimentTagsInput({ value, onChange, readOnly }: ExperimentTagsInputProps) {
  if (readOnly) {
    return (
      <TagsInput
        label="Теги"
        value={value}
        readOnly
        data={value}
      />
    )
  }

  return (
    <TagsInput
      label="Теги"
      placeholder="Добавить тег"
      value={value}
      onChange={onChange}
      splitChars={[',', ' ']}
      clearable
    />
  )
}

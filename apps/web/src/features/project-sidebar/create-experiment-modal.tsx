import type { ExperimentTemplateDto } from '@labcollab/shared'
import type { FormEvent } from 'react'
import { useForm } from '@effector-reform/react'
import { Alert, Button, Select, Stack, Text, TextInput } from '@mantine/core'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'
import { userTemplateCopyToProjectRequested } from '@/features/experiment-template-editor/model'
import {
  copyUserExperimentTemplateToProjectMutation,
  projectExperimentTemplatesQuery,
  userExperimentTemplatesQuery,
} from '@/shared/api'
import { routes, RouteTextLink } from '@/shared/routing'
import {
  $canEdit,
  $createTemplateId,
  $projectId,
  createExperimentForm,
  createTemplateIdChanged,
} from './model'

function buildTemplateOptions(
  projectTemplates: ExperimentTemplateDto[] | null,
  userTemplates: ExperimentTemplateDto[] | null,
) {
  const options: Array<
    | { value: string, label: string }
    | { group: string, items: Array<{ value: string, label: string }> }
  > = []

  const projectItems = (projectTemplates ?? []).map(template => ({
    value: template.id,
    label: template.name,
  }))

  if (projectItems.length > 0)
    options.push({ group: 'Проекта', items: projectItems })

  const userItems = (userTemplates ?? []).map(template => ({
    value: template.id,
    label: template.name,
  }))

  if (userItems.length > 0)
    options.push({ group: 'Мои', items: userItems })

  options.push({
    group: 'Другое',
    items: [{ value: '__minimal__', label: 'Минимальный (только «Цель»)' }],
  })

  return options
}

function TemplatePreview({
  templateId,
  projectTemplates,
  userTemplates,
}: {
  templateId: string
  projectTemplates: ExperimentTemplateDto[] | null
  userTemplates: ExperimentTemplateDto[] | null
}) {
  const template = [...(projectTemplates ?? []), ...(userTemplates ?? [])].find(t => t.id === templateId)
  if (!template)
    return null

  const fields = [...template.fieldDefinitions].sort((a, b) => a.order - b.order)

  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" fw={600}>
        Поля шаблона
      </Text>
      {fields.map(field => (
        <Text key={field.id} size="sm">
          {field.label}
          {field.required ? ' *' : ''}
        </Text>
      ))}
      {template.defaultChecklist.length > 0 && (
        <Text size="xs" c="dimmed" mt={4}>
          Чеклист:
          {' '}
          {template.defaultChecklist.length}
          {' '}
          пункт(ов)
        </Text>
      )}
    </Stack>
  )
}

interface CreateExperimentModalProps {
  onClose: () => void
}

export function CreateExperimentModal({ onClose }: CreateExperimentModalProps) {
  const [
    projectId,
    projectTemplates,
    userTemplates,
    selectedTemplateId,
    canEdit,
    copyPending,
  ] = useUnit([
    $projectId,
    projectExperimentTemplatesQuery.$data,
    userExperimentTemplatesQuery.$data,
    $createTemplateId,
    $canEdit,
    copyUserExperimentTemplateToProjectMutation.$pending,
  ])

  const onTemplateChange = useUnit(createTemplateIdChanged)
  const copyToProject = useUnit(userTemplateCopyToProjectRequested)
  const { fields: createFields, onSubmit: onCreateSubmit } = useForm(createExperimentForm)

  const templateOptions = useMemo(
    () => buildTemplateOptions(projectTemplates, userTemplates),
    [projectTemplates, userTemplates],
  )

  const defaultTemplateValue = useMemo(() => {
    for (const option of templateOptions) {
      if ('items' in option && option.items[0])
        return option.items[0].value
    }
    return '__minimal__'
  }, [templateOptions])

  const selectedTemplateValue = selectedTemplateId ?? defaultTemplateValue
  const selectedUserTemplate = (userTemplates ?? []).find(t => t.id === selectedTemplateValue)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const value = selectedTemplateValue === '__minimal__' ? null : selectedTemplateValue
    onTemplateChange(value)
    onCreateSubmit(event)
  }

  if (!projectId)
    return null

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          label="Название"
          required
          value={createFields.title.value}
          onChange={e => createFields.title.onChange(e.currentTarget.value)}
          onBlur={createFields.title.onBlur}
        />
        <Select
          label="Шаблон"
          value={selectedTemplateValue}
          onChange={(value) => {
            if (!value)
              return
            onTemplateChange(value === '__minimal__' ? null : value)
          }}
          data={templateOptions}
        />

        {canEdit && (
          <Alert variant="light" color="violet" p="sm">
            <Text size="sm">
              Шаблоны проекта доступны всем участникам. Создать или изменить — в
              {' '}
              <RouteTextLink
                to={routes.projectSettings}
                params={{ projectId, tab: 'templates' }}
                c="violet"
                fw={500}
                td="underline"
                afterNavigate={() => onClose()}
              >
                настройках проекта → Шаблоны
              </RouteTextLink>
              .
            </Text>
          </Alert>
        )}

        {canEdit && selectedUserTemplate && (
          <Alert variant="light" color="gray" p="sm">
            <Stack gap="xs">
              <Text size="sm">
                «
                {selectedUserTemplate.name}
                » — личный шаблон. Скопируйте в проект, чтобы им могли пользоваться
                другие участники.
              </Text>
              <Button
                type="button"
                variant="light"
                size="xs"
                loading={copyPending}
                onClick={() =>
                  copyToProject({
                    projectId,
                    sourceTemplateId: selectedUserTemplate.id,
                  })}
              >
                Скопировать в проект
              </Button>
            </Stack>
          </Alert>
        )}

        {selectedTemplateValue !== '__minimal__' && (
          <TemplatePreview
            templateId={selectedTemplateValue}
            projectTemplates={projectTemplates}
            userTemplates={userTemplates}
          />
        )}
        <Button type="submit">Создать</Button>
      </Stack>
    </form>
  )
}

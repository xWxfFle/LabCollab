import type { ExperimentTemplateDto } from '@labcollab/shared'
import type { TemplateEditorScope } from './model'

export function templatesForScope(
  scope: TemplateEditorScope,
  userTemplates: ExperimentTemplateDto[] | null,
  projectTemplates: ExperimentTemplateDto[] | null,
) {
  return scope === 'user' ? (userTemplates ?? []) : (projectTemplates ?? [])
}

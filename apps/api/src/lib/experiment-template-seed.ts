import { defaultExperimentTemplateSeed } from '@labcollab/shared'
import { db } from '../db'
import { experimentTemplates } from '../db/schema'
import { assignFieldIds } from './experiment-fields'

export async function seedDefaultProjectExperimentTemplate(projectId: string) {
  const fieldDefinitions = assignFieldIds(defaultExperimentTemplateSeed.fieldDefinitions)

  await db.insert(experimentTemplates).values({
    name: defaultExperimentTemplateSeed.name,
    scope: 'project',
    projectId,
    userId: null,
    fieldDefinitions,
    defaultObservations: defaultExperimentTemplateSeed.defaultObservations,
    defaultChecklist: defaultExperimentTemplateSeed.defaultChecklist,
  })
}

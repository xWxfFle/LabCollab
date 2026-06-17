import type { ExperimentSnapshot, LegacyExperimentSnapshot } from '@labcollab/shared'
import { stripHtml } from './html'

export interface VersionHistoryItem {
  id: string
  createdAt: string
  createdByDisplayName: string
  title: string
  preview?: string
}

export function formatVersionDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU')
}

type ExperimentVersionSnapshot = Partial<ExperimentSnapshot> & Partial<LegacyExperimentSnapshot>

function firstNonEmptyText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const text = typeof value === 'string' ? stripHtml(value) : ''
    if (text)
      return text
  }
  return ''
}

export function experimentVersionPreview(snapshot: ExperimentVersionSnapshot) {
  const observations = firstNonEmptyText(snapshot.observationsText)
  if (observations)
    return observations

  const fieldValues = snapshot.fieldValues
  if (fieldValues) {
    for (const value of Object.values(fieldValues)) {
      const text = typeof value === 'string' ? value.trim() : ''
      if (text)
        return text
    }
  }

  return firstNonEmptyText(
    snapshot.results,
    snapshot.hypothesis,
    snapshot.objective,
    snapshot.materials,
    snapshot.protocolSteps,
    snapshot.conditions,
  )
}

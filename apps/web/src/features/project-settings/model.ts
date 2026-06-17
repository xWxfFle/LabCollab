import { createForm } from '@effector-reform/core'
import { zodAdapter } from '@effector-reform/zod'
import { addMemberSchema, createProjectSchema } from '@labcollab/shared'
import { createEvent, sample } from 'effector'
import { $projectId, projectRouteClosed } from '@/features/project-sidebar/model'
import {
  addMemberMutation,
  deleteProjectMutation,
  patchProjectMutation,
  projectMembersQuery,
  projectQuery,
  projectsQuery,
  removeMemberMutation,
  updateMemberRoleMutation,
} from '@/shared/api'
import { routes } from '@/shared/routing'

export const deleteProjectConfirmed = createEvent()
export const memberRemoveConfirmed = createEvent<string>()
export const memberRoleChanged = createEvent<{ userId: string, role: 'editor' | 'viewer' }>()

export const projectSettingsForm = createForm({
  schema: {
    name: '',
    description: '',
  },
  validation: zodAdapter(createProjectSchema),
})

export const memberForm = createForm({
  schema: {
    email: '',
    role: 'editor' as 'editor' | 'viewer',
  },
  validation: zodAdapter(addMemberSchema),
})

sample({
  clock: routes.projectSettings.opened,
  fn: ({ params }) => ({ projectId: params.projectId }),
  target: projectMembersQuery.start,
})

sample({
  clock: routes.projectSettings.opened,
  source: projectQuery.$data,
  filter: Boolean,
  fn: project => ({
    values: {
      name: project.name,
      description: project.description ?? '',
    },
  }),
  target: projectSettingsForm.fill,
})

sample({
  clock: projectSettingsForm.validatedAndSubmitted,
  source: $projectId,
  filter: Boolean,
  fn: (projectId, values) => ({
    projectId: projectId!,
    name: values.name,
    description: values.description || null,
  }),
  target: patchProjectMutation.start,
})

sample({
  clock: patchProjectMutation.finished.success,
  fn: ({ params }) => ({ id: params.projectId }),
  target: projectQuery.start,
})

sample({
  clock: patchProjectMutation.finished.success,
  target: projectsQuery.start,
})

sample({
  clock: memberForm.validatedAndSubmitted,
  source: $projectId,
  filter: Boolean,
  fn: (projectId, values) => ({
    projectId: projectId!,
    email: values.email,
    role: values.role,
  }),
  target: addMemberMutation.start,
})

sample({
  clock: addMemberMutation.finished.success,
  target: memberForm.reset,
})

sample({
  clock: addMemberMutation.finished.success,
  source: $projectId,
  filter: Boolean,
  fn: projectId => ({ projectId: projectId! }),
  target: projectMembersQuery.start,
})

sample({
  clock: memberRoleChanged,
  source: $projectId,
  filter: Boolean,
  fn: (projectId, { userId, role }) => ({
    projectId: projectId!,
    userId,
    role,
  }),
  target: updateMemberRoleMutation.start,
})

sample({
  clock: updateMemberRoleMutation.finished.success,
  source: $projectId,
  filter: Boolean,
  fn: projectId => ({ projectId: projectId! }),
  target: projectMembersQuery.start,
})

sample({
  clock: memberRemoveConfirmed,
  source: $projectId,
  filter: Boolean,
  fn: (projectId, userId) => ({
    projectId: projectId!,
    userId,
  }),
  target: removeMemberMutation.start,
})

sample({
  clock: removeMemberMutation.finished.success,
  source: $projectId,
  filter: Boolean,
  fn: projectId => ({ projectId: projectId! }),
  target: projectMembersQuery.start,
})

sample({
  clock: deleteProjectConfirmed,
  source: $projectId,
  filter: Boolean,
  fn: projectId => ({ projectId: projectId! }),
  target: deleteProjectMutation.start,
})

sample({
  clock: deleteProjectMutation.finished.success,
  target: projectsQuery.start,
})

sample({
  clock: deleteProjectMutation.finished.success,
  fn: () => ({ query: {} }),
  target: routes.dashboard.open,
})

sample({
  clock: [routes.projectSettings.closed, projectRouteClosed],
  target: [projectSettingsForm.reset, memberForm.reset],
})

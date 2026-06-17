import { relations } from 'drizzle-orm'
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

export const projectRoleEnum = pgEnum('project_role', ['owner', 'editor', 'viewer'])
export const experimentStatusEnum = pgEnum('experiment_status', [
  'draft',
  'in_progress',
  'completed_success',
  'completed_failure',
])
export const experimentTemplateScopeEnum = pgEnum('experiment_template_scope', ['user', 'project'])
export const projectNodeTypeEnum = pgEnum('project_node_type', ['folder', 'page', 'experiment'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const projectMembers = pgTable(
  'project_members',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: projectRoleEnum('role').notNull(),
  },
  t => [primaryKey({ columns: [t.projectId, t.userId] })],
)

export const experimentTemplates = pgTable('experiment_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  scope: experimentTemplateScopeEnum('scope').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  fieldDefinitions: jsonb('field_definitions').notNull(),
  defaultObservations: text('default_observations'),
  defaultChecklist: jsonb('default_checklist').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const experiments = pgTable('experiments', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  templateId: uuid('template_id').references(() => experimentTemplates.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  status: experimentStatusEnum('status').notNull().default('draft'),
  fieldDefinitions: jsonb('field_definitions').notNull().default([]),
  fieldValues: jsonb('field_values').notNull().default({}),
  checklist: jsonb('checklist').notNull().default([]),
  observationsYjsState: text('observations_yjs_state'),
  tags: text('tags').array().notNull().default([]),
  conductedAt: timestamp('conducted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const attachments = pgTable('attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  experimentId: uuid('experiment_id')
    .notNull()
    .references(() => experiments.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  storagePath: text('storage_path').notNull(),
  uploadedBy: uuid('uploaded_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const experimentVersions = pgTable('experiment_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  experimentId: uuid('experiment_id')
    .notNull()
    .references(() => experiments.id, { onDelete: 'cascade' }),
  snapshotJson: jsonb('snapshot_json').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const experimentComments = pgTable('experiment_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  experimentId: uuid('experiment_id')
    .notNull()
    .references(() => experiments.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const projectNodes = pgTable(
  'project_nodes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): typeof projectNodes.id => projectNodes.id, {
      onDelete: 'cascade',
    }),
    nodeType: projectNodeTypeEnum('node_type').notNull(),
    title: text('title').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    experimentId: uuid('experiment_id').references(() => experiments.id, {
      onDelete: 'cascade',
    }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  t => [unique('project_nodes_experiment_id_unique').on(t.experimentId)],
)

export const projectPages = pgTable('project_pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  nodeId: uuid('node_id')
    .notNull()
    .unique()
    .references(() => projectNodes.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  bodyHtml: text('body_html').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const projectPageVersions = pgTable('project_page_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageId: uuid('page_id')
    .notNull()
    .references(() => projectPages.id, { onDelete: 'cascade' }),
  snapshotJson: jsonb('snapshot_json').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  memberships: many(projectMembers),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  members: many(projectMembers),
  experiments: many(experiments),
  experimentTemplates: many(experimentTemplates),
  nodes: many(projectNodes),
  pages: many(projectPages),
}))

export const projectNodesRelations = relations(projectNodes, ({ one, many }) => ({
  project: one(projects, { fields: [projectNodes.projectId], references: [projects.id] }),
  parent: one(projectNodes, {
    fields: [projectNodes.parentId],
    references: [projectNodes.id],
    relationName: 'node_children',
  }),
  children: many(projectNodes, { relationName: 'node_children' }),
  experiment: one(experiments, {
    fields: [projectNodes.experimentId],
    references: [experiments.id],
  }),
  page: one(projectPages, { fields: [projectNodes.id], references: [projectPages.nodeId] }),
}))

export const projectPagesRelations = relations(projectPages, ({ one, many }) => ({
  node: one(projectNodes, { fields: [projectPages.nodeId], references: [projectNodes.id] }),
  project: one(projects, { fields: [projectPages.projectId], references: [projects.id] }),
  versions: many(projectPageVersions),
}))

export const projectPageVersionsRelations = relations(projectPageVersions, ({ one }) => ({
  page: one(projectPages, { fields: [projectPageVersions.pageId], references: [projectPages.id] }),
}))

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}))

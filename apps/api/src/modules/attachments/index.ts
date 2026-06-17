import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { eq } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { db } from '../../db'
import { attachments } from '../../db/schema'
import { canEditExperiment, canReadExperiment } from '../../lib/rbac'
import { authGuard } from '../../plugins/auth-guard'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'data', 'uploads')
const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'application/pdf', 'text/csv'])

export const attachmentsModule = new Elysia()
  .use(authGuard)
  .get('/experiments/:id/attachments', async ({ userId, params, set }) => {
    if (!(await canReadExperiment(userId, params.id))) {
      set.status = 404
      return { error: 'Not found' }
    }

    const rows = await db
      .select()
      .from(attachments)
      .where(eq(attachments.experimentId, params.id))

    return rows.map(a => ({
      id: a.id,
      experimentId: a.experimentId,
      filename: a.filename,
      mimeType: a.mimeType,
      size: a.size,
      uploadedBy: a.uploadedBy,
      createdAt: a.createdAt.toISOString(),
    }))
  })
  .post(
    '/experiments/:id/attachments',
    async ({ userId, params, body, set }) => {
      if (!(await canEditExperiment(userId, params.id))) {
        set.status = 403
        return { error: 'Forbidden' }
      }

      const file = body.file
      if (!file || file.size > MAX_SIZE) {
        set.status = 400
        return { error: 'File too large or missing' }
      }

      if (!ALLOWED.has(file.type)) {
        set.status = 400
        return { error: 'Unsupported file type' }
      }

      const dir = join(UPLOAD_DIR, params.id)
      await mkdir(dir, { recursive: true })

      const safeName = `${randomUUID()}-${file.name}`
      const storagePath = join(dir, safeName)
      await Bun.write(storagePath, file)

      const [row] = await db
        .insert(attachments)
        .values({
          experimentId: params.id,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          storagePath,
          uploadedBy: userId,
        })
        .returning()

      return {
        id: row.id,
        experimentId: row.experimentId,
        filename: row.filename,
        mimeType: row.mimeType,
        size: row.size,
        uploadedBy: row.uploadedBy,
        createdAt: row.createdAt.toISOString(),
      }
    },
    {
      body: t.Object({ file: t.File() }),
    },
  )
  .get('/attachments/:id/download', async ({ userId, params, set }) => {
    const [row] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, params.id))
      .limit(1)

    if (!row || !(await canReadExperiment(userId, row.experimentId))) {
      set.status = 404
      return { error: 'Not found' }
    }

    const file = Bun.file(row.storagePath)
    if (!(await file.exists())) {
      set.status = 404
      return { error: 'File missing' }
    }

    return new Response(file, {
      headers: {
        'Content-Type': row.mimeType,
        'Content-Disposition': `attachment; filename="${row.filename}"`,
      },
    })
  })

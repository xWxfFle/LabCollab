import { cors } from '@elysiajs/cors'
import { API_VERSION, APP_NAME } from '@labcollab/shared'
import { Elysia } from 'elysia'
import { attachmentsModule } from './modules/attachments'
import { authModule } from './modules/auth'
import { commentsModule } from './modules/comments'
import { experimentTemplatesModule } from './modules/experiment-templates'
import { experimentsModule } from './modules/experiments'
import { exportModule } from './modules/export'
import { projectsModule } from './modules/projects'
import { workspaceModule } from './modules/workspace'

const port = Number(process.env.PORT ?? 3000)

const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
      credentials: true,
    }),
  )
  .get('/health', () => ({ status: 'ok', service: 'api' }))
  .get('/', () => ({
    name: APP_NAME,
    version: API_VERSION,
  }))
  .use(authModule)
  .use(projectsModule)
  .use(experimentTemplatesModule)
  .use(experimentsModule)
  .use(attachmentsModule)
  .use(commentsModule)
  .use(workspaceModule)
  .use(exportModule)
  .onError(({ error, set }) => {
    if (error instanceof Error && error.message === 'Unauthorized') {
      set.status = 401
      return { error: 'Unauthorized' }
    }
    console.error(error)
    set.status = 500
    return { error: 'Internal server error' }
  })
  .listen(port)

console.log(`🦊 ${APP_NAME} API: http://${app.server?.hostname}:${app.server?.port}`)

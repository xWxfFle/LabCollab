import { Elysia } from 'elysia';
import { buildExperimentPdf } from './pdf';
import { buildPageMarkdown, buildPagePdf } from './page-export';
import { authGuard } from '../../plugins/auth-guard';
export const exportModule = new Elysia()
  .use(authGuard)
  .get('/experiments/:id/export/pdf', async ({ userId, params, query, set }) => {
    try {
      const observationsText =
        typeof query.observationsText === 'string' ? query.observationsText : '';
      const buffer = await buildExperimentPdf(params.id, userId, observationsText);

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="experiment-${params.id}.pdf"`,
        },
      });
    } catch {
      set.status = 404;
      return { error: 'Not found' };
    }
  })
  .get('/pages/:id/export/pdf', async ({ userId, params, set }) => {
    try {
      const buffer = await buildPagePdf(params.id, userId);
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="page-${params.id}.pdf"`,
        },
      });
    } catch {
      set.status = 404;
      return { error: 'Not found' };
    }
  })
  .get('/pages/:id/export/md', async ({ userId, params, set }) => {
    try {
      const markdown = await buildPageMarkdown(params.id, userId);
      return new Response(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="page-${params.id}.md"`,
        },
      });
    } catch {
      set.status = 404;
      return { error: 'Not found' };
    }
  });

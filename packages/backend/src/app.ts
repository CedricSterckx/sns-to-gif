import fs from 'fs';
import { resolve, join } from 'path';
import { serveMediaFetch } from './routes/media.routes';
import { serveCreateJob, serveGetJob } from './routes/jobs.routes';
import { serveGiphyExport, serveDownload } from './routes/export.routes';
import { serveProxy } from './routes/proxy.routes';
import { AppError } from './utils/errors';
import { getOutputDir } from './utils/temp';
import { CORS_HEADERS, json } from './utils/response';

function handleError(err: unknown): Response {
  if (err instanceof AppError) {
    return json({ error: err.code, message: err.message }, err.statusCode);
  }
  console.error('Unhandled error:', err);
  return json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, 500);
}

async function serveOutputFile(filename: string): Promise<Response> {
  if (!filename || filename.includes('..') || /[/\\]/.test(filename)) {
    return new Response('Bad Request', { status: 400 });
  }
  const file = Bun.file(join(getOutputDir(), filename));
  if (!(await file.exists())) return new Response('Not Found', { status: 404 });
  return new Response(file, { headers: { 'Access-Control-Allow-Origin': '*' } });
}

async function serveFrontend(reqPath: string, frontendDist: string): Promise<Response> {
  const file = Bun.file(join(frontendDist, reqPath));
  if (await file.exists()) return new Response(file);
  return new Response(Bun.file(join(frontendDist, 'index.html')));
}

export function createRequestHandler() {
  const frontendDist = resolve(import.meta.dir, '../../frontend/dist');
  const hasFrontend = fs.existsSync(join(frontendDist, 'index.html'));
  return async function fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method;

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      if (method === 'GET' && pathname.startsWith('/output/')) {
        return await serveOutputFile(pathname.slice('/output/'.length));
      }

      if (pathname.startsWith('/api/')) {
        const apiPath = pathname.slice('/api'.length);

        if (method === 'GET' && apiPath === '/health') {
          return json({ status: 'ok', timestamp: new Date().toISOString() });
        }

        if (method === 'POST' && apiPath === '/media/fetch') {
          return await serveMediaFetch(req);
        }

        if (method === 'POST' && apiPath === '/jobs') {
          return await serveCreateJob(req);
        }

        const jobMatch = apiPath.match(/^\/jobs\/([^/]+)$/);
        if (method === 'GET' && jobMatch) {
          return serveGetJob(jobMatch[1]);
        }

        if (method === 'POST' && apiPath === '/export/giphy') {
          return await serveGiphyExport(req);
        }

        const dlMatch = apiPath.match(/^\/export\/download\/([^/]+)$/);
        if (method === 'GET' && dlMatch) {
          return serveDownload(dlMatch[1]);
        }

        if (method === 'GET' && apiPath === '/proxy') {
          return await serveProxy(req);
        }

        return json({ error: 'NOT_FOUND', message: 'Route not found' }, 404);
      }

      if (hasFrontend) {
        return await serveFrontend(pathname, frontendDist);
      }

      return new Response('Not Found', { status: 404 });
    } catch (err) {
      return handleError(err);
    }
  };
}

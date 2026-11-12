import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import type { FastifyInstance, FastifyReply } from 'fastify';

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
};

export function registerStaticFiles(
  app: FastifyInstance,
  rootDirectory: string,
  previewDirectory?: string,
) {
  const registerDirectory = (directory: string, prefix: string, entryFile = 'index.html') => {
    const root = resolve(directory);
    const sendFile = async (requestedPath: string, reply: FastifyReply, sandboxed = false) => {
      let path: string;
      try {
        const decoded = decodeURIComponent(requestedPath);
        if (decoded.includes('\\') || decoded.split('/').includes('..')) {
          return reply.code(404).send();
        }
        path = resolve(root, decoded || entryFile);
      } catch {
        return reply.code(404).send();
      }
      if (path !== root && !path.startsWith(`${root}${sep}`)) {
        return reply.code(404).send();
      }
      try {
        const body = await readFile(path);
        reply.header('Content-Type', contentTypes[extname(path)] ?? 'application/octet-stream');
        reply.header('X-Content-Type-Options', 'nosniff');
        if (sandboxed) {
          reply.header('Access-Control-Allow-Origin', '*');
        }
        reply.header(
          'Content-Security-Policy',
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'",
        );
        return reply.send(body);
      } catch {
        return reply.code(404).send();
      }
    };
    if (prefix) {
      app.get(`/${prefix}/*`, async (request, reply) => {
        const relativePath = request.params as { '*': string };
        return sendFile(relativePath['*'] ?? '', reply, true);
      });
      app.get(`/${prefix}`, async (_request, reply) => sendFile('', reply, true));
      app.get(`/${prefix}/`, async (_request, reply) => sendFile('', reply, true));
    } else {
      app.get('/*', async (request, reply) => {
        if (request.url.startsWith('/api/')) {
          return reply.callNotFound();
        }
        const relativePath = request.params as { '*': string };
        return sendFile(relativePath['*'] ?? '', reply);
      });
      app.get('/', async (_request, reply) => sendFile('', reply));
    }
  };

  if (previewDirectory) {
    registerDirectory(previewDirectory, 'preview');
  }
  registerDirectory(rootDirectory, '');
}

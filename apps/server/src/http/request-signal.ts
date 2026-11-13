import type { FastifyReply, FastifyRequest } from 'fastify';

/** Aborts upstream Home Assistant work when the browser goes away. */
export function requestSignal(request: FastifyRequest, reply: FastifyReply): AbortSignal {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const cleanup = () => {
    request.raw.removeListener('aborted', abort);
    request.raw.socket.removeListener('close', abort);
  };
  request.raw.once('aborted', abort);
  request.raw.socket.once('close', abort);
  reply.raw.once('finish', cleanup);
  reply.raw.once('close', () => {
    if (!reply.raw.writableFinished) {
      abort();
    }
    cleanup();
  });
  return controller.signal;
}

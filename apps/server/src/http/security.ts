import type { FastifyReply, FastifyRequest } from 'fastify';

export async function requireMutationOrigin(
  request: FastifyRequest,
  reply: FastifyReply,
  expectedOrigin: (request: FastifyRequest) => string | null,
): Promise<boolean> {
  const providedOrigin = request.headers.origin;
  const expected = expectedOrigin(request);
  if (
    request.headers['x-everdash-request'] !== '1' ||
    typeof providedOrigin !== 'string' ||
    expected === null ||
    providedOrigin !== expected
  ) {
    reply.code(403).send({ code: 'ORIGIN_DENIED', message: 'Request origin is not allowed.' });
    return false;
  }
  return true;
}

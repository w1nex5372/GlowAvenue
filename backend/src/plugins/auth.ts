import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config';

/**
 * Registers @fastify/jwt and exposes an `authenticate` preHandler that
 * rejects requests without a valid admin Bearer token.
 */
export async function registerAuth(app: FastifyInstance): Promise<void> {
  await app.register(jwt, { secret: config.jwtSecret });

  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

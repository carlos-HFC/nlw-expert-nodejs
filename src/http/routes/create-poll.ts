import { FastifyInstance } from "fastify";
import z from "zod";

import { prisma } from "../../lib/prisma";

export async function createPoll(app: FastifyInstance) {
  app.post("/polls", async (request, reply) => {
    const createPollBody = z.object({
      title: z.string(),
      options: z.array(z.string())
    });

    const { title, options } = createPollBody.parse(request.body);

    const poll = await prisma.poll.create({
      data: {
        title,
      }
    });

    await Promise.all(options.map(title => {
      return prisma.pollOption.create({
        data: {
          title,
          pollId: poll.id
        }
      });
    }));

    return reply.status(201).send({
      pollId: poll.id
    });
  });
}
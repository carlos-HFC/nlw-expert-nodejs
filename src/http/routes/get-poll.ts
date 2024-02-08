import { FastifyInstance } from "fastify";
import z from "zod";

import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";

export async function getPoll(app: FastifyInstance) {
  app.get("/polls/:pollId", async (request, reply) => {
    const getPollParams = z.object({
      pollId: z.string().uuid()
    });

    const { pollId } = getPollParams.parse(request.params);

    const poll = await prisma.poll.findUnique({
      where: {
        id: pollId
      },
      include: {
        options: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    if (!poll) {
      return reply.status(404).send({
        statusCode: 404,
        error: "Not Found",
        message: "Poll not found."
      });
    }

    const result = await redis.zrange(pollId, 0, -1, "WITHSCORES");

    const votes = result.reduce((prev, cur, index) => {
      if (index % 2 === 0) {
        const score = result[index + 1];

        Object.assign(prev, { [cur]: Number(score) });
      }

      return prev;
    }, {} as Record<string, number>);

    return reply.send({
      poll: {
        id: poll.id,
        title: poll.title,
        options: poll.options.map(item => ({
          id: item.id,
          title: item.title,
          score: item.id in votes ? votes[item.id] : 0
        })),
      }
    });
  });
}
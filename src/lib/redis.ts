import { Redis } from "ioredis";

import { env } from "../env/env";

export const redis = new Redis(env.REDIS_URL);
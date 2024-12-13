import Redis from "ioredis"
import { configDotenv } from "dotenv";
configDotenv()

export const redis = new Redis(process.env.UPSTASH_REDIS_URL);
await redis.set('foo', 'bar');
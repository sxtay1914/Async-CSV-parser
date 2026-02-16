import bullmq from "bullmq";
import { redisConnection } from "../config/redis.js";

const { Queue } = bullmq;

// set up connection between redis and bullmq worker
export const importQueue = new Queue("importQueue", {
  connection: redisConnection,
});

// Helper to add jobs
export function addImportJob(filePath, importJobId) {
  return importQueue.add("processCsv", { filePath, importJobId });
}

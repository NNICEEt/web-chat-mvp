import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma Client");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

type WebChatPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as typeof globalThis & {
  webChatPrisma?: WebChatPrismaClient;
};

export const db = globalForPrisma.webChatPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.webChatPrisma = db;
}

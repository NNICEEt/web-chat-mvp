import type { Prisma } from "@/db/generated/prisma/client";

export type DatabaseContext = Pick<
  Prisma.TransactionClient,
  "user" | "conversation" | "message"
>;

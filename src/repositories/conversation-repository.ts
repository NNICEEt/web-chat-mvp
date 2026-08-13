import { ConversationStatus } from "@/db/generated/prisma/enums";

import type { DatabaseContext } from "./database-context";

export function findActiveConversationByUserId(
  database: DatabaseContext,
  userId: string,
) {
  return database.conversation.findFirst({
    where: {
      userId,
      status: ConversationStatus.ACTIVE,
    },
  });
}

export function createActiveConversation(
  database: DatabaseContext,
  userId: string,
) {
  return database.conversation.create({
    data: {
      userId,
      status: ConversationStatus.ACTIVE,
    },
  });
}

export function findConversationByIdWithUser(
  database: DatabaseContext,
  conversationId: string,
) {
  return database.conversation.findUnique({
    where: { id: conversationId },
    include: { user: true },
  });
}

export function listConversations(database: DatabaseContext) {
  return database.conversation.findMany({
    include: { user: true },
    orderBy: [
      { lastMessageAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });
}

export function updateConversationLastMessageAt(
  database: DatabaseContext,
  conversationId: string,
  lastMessageAt: Date,
) {
  return database.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt },
  });
}

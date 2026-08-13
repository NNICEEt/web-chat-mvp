import {
  MessageDirection,
  MessageStatus,
  MessageType,
} from "@/db/generated/prisma/enums";

import type { DatabaseContext } from "./database-context";

type CreateInboundMessageInput = {
  conversationId: string;
  text: string;
  providerMessageId: string;
  webhookEventId: string;
  occurredAt: Date;
};

type CreateOutboundMessageInput = {
  conversationId: string;
  text: string;
  occurredAt: Date;
};

export function findMessageByWebhookEventId(
  database: DatabaseContext,
  webhookEventId: string,
) {
  return database.message.findUnique({
    where: { webhookEventId },
  });
}

export function createInboundMessage(
  database: DatabaseContext,
  input: CreateInboundMessageInput,
) {
  return database.message.create({
    data: {
      ...input,
      direction: MessageDirection.INBOUND,
      type: MessageType.TEXT,
      status: MessageStatus.RECEIVED,
    },
  });
}

export function createOutboundMessage(
  database: DatabaseContext,
  input: CreateOutboundMessageInput,
) {
  return database.message.create({
    data: {
      ...input,
      direction: MessageDirection.OUTBOUND,
      type: MessageType.TEXT,
      status: MessageStatus.PENDING,
    },
  });
}

export function listMessagesByConversationId(
  database: DatabaseContext,
  conversationId: string,
) {
  return database.message.findMany({
    where: { conversationId },
    orderBy: { occurredAt: "asc" },
  });
}

export function updateMessageStatus(
  database: DatabaseContext,
  messageId: string,
  status: MessageStatus,
) {
  return database.message.update({
    where: { id: messageId },
    data: { status },
  });
}

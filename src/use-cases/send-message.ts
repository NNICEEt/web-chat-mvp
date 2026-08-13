import { db } from "@/db/client";
import {
  MessageDirection,
  MessageStatus,
  MessageType,
} from "@/db/generated/prisma/enums";
import { sendLineTextMessage } from "@/integrations/line/client";
import {
  findConversationByIdWithUser,
  updateConversationLastMessageAt,
} from "@/repositories/conversation-repository";
import {
  createOutboundMessage,
  updateMessageStatus,
} from "@/repositories/message-repository";

export class ConversationNotFoundError extends Error {
  constructor() {
    super("Conversation not found");
    this.name = "ConversationNotFoundError";
  }
}

export class InvalidMessageTextError extends Error {
  constructor() {
    super("Message text must not be empty");
    this.name = "InvalidMessageTextError";
  }
}

export type SendMessageResult = {
  messageId: string;
  conversationId: string;
  direction: "OUTBOUND";
  type: "TEXT";
  text: string;
  status: "SENT";
  occurredAt: string;
};

export async function sendMessage(
  conversationId: string,
  text: string,
): Promise<SendMessageResult> {
  if (text.trim().length === 0) {
    throw new InvalidMessageTextError();
  }

  const occurredAt = new Date();
  const conversation = await findConversationByIdWithUser(db, conversationId);

  if (!conversation) {
    throw new ConversationNotFoundError();
  }

  const pendingMessage = await db.$transaction(async (transaction) => {
    const message = await createOutboundMessage(transaction, {
      conversationId,
      text,
      occurredAt,
    });

    await updateConversationLastMessageAt(
      transaction,
      conversationId,
      occurredAt,
    );

    return message;
  });

  try {
    await sendLineTextMessage(conversation.user.lineUserId, text);
  } catch (error) {
    await updateMessageStatus(db, pendingMessage.id, MessageStatus.FAILED);
    throw error;
  }

  const sentMessage = await updateMessageStatus(
    db,
    pendingMessage.id,
    MessageStatus.SENT,
  );

  return {
    messageId: sentMessage.id,
    conversationId: sentMessage.conversationId,
    direction: MessageDirection.OUTBOUND,
    type: MessageType.TEXT,
    text: sentMessage.text,
    status: MessageStatus.SENT,
    occurredAt: sentMessage.occurredAt.toISOString(),
  };
}

import { db } from "@/db/client";
import type { InboundTextEvent } from "@/models/inbound-text-event";
import {
  createActiveConversation,
  findActiveConversationByUserId,
  updateConversationLastMessageAt,
} from "@/repositories/conversation-repository";
import {
  createInboundMessage,
  findMessageByWebhookEventId,
} from "@/repositories/message-repository";
import {
  createUser,
  findUserByLineUserId,
} from "@/repositories/user-repository";

export type ProcessInboundMessageResult =
  | {
      outcome: "duplicate";
      messageId: string;
    }
  | {
      outcome: "created";
      messageId: string;
      conversationId: string;
    };

export function processInboundMessage(
  event: InboundTextEvent,
): Promise<ProcessInboundMessageResult> {
  return db.$transaction(async (transaction) => {
    const existingMessage = await findMessageByWebhookEventId(
      transaction,
      event.webhookEventId,
    );

    if (existingMessage) {
      return {
        outcome: "duplicate",
        messageId: existingMessage.id,
      };
    }

    const existingUser = await findUserByLineUserId(
      transaction,
      event.providerUserId,
    );
    const user =
      existingUser ??
      (await createUser(transaction, event.providerUserId));

    const existingConversation = await findActiveConversationByUserId(
      transaction,
      user.id,
    );
    const conversation =
      existingConversation ??
      (await createActiveConversation(transaction, user.id));

    const message = await createInboundMessage(transaction, {
      conversationId: conversation.id,
      providerMessageId: event.providerMessageId,
      webhookEventId: event.webhookEventId,
      text: event.text,
      occurredAt: event.occurredAt,
    });

    await updateConversationLastMessageAt(
      transaction,
      conversation.id,
      event.occurredAt,
    );

    return {
      outcome: "created",
      messageId: message.id,
      conversationId: conversation.id,
    };
  });
}

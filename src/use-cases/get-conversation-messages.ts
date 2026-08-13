import { db } from "@/db/client";
import { listMessagesByConversationId } from "@/repositories/message-repository";

export type ConversationMessage = {
  messageId: string;
  direction: "INBOUND" | "OUTBOUND";
  type: "TEXT";
  text: string;
  status: "RECEIVED" | "PENDING" | "SENT" | "FAILED";
  occurredAt: string;
};

export async function getConversationMessages(
  conversationId: string,
): Promise<ConversationMessage[]> {
  const messages = await listMessagesByConversationId(db, conversationId);

  return messages.map((message) => ({
    messageId: message.id,
    direction: message.direction,
    type: message.type,
    text: message.text,
    status: message.status,
    occurredAt: message.occurredAt.toISOString(),
  }));
}

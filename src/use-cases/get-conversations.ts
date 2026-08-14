import { db } from "@/db/client";
import { listConversations } from "@/repositories/conversation-repository";

export type ConversationSummary = {
  conversationId: string;
  status: "ACTIVE" | "CLOSED";
  lastMessageAt: string | null;
  latestMessage: {
    text: string;
  } | null;
  user: {
    displayName: string | null;
    pictureUrl: string | null;
  };
};

export async function getConversations(): Promise<ConversationSummary[]> {
  const conversations = await listConversations(db);

  return conversations.map((conversation) => ({
    conversationId: conversation.id,
    status: conversation.status,
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    latestMessage: conversation.messages[0] ?? null,
    user: {
      displayName: conversation.user.displayName,
      pictureUrl: conversation.user.pictureUrl,
    },
  }));
}

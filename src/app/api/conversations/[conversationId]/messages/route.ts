import { getConversationMessages } from "@/use-cases/get-conversation-messages";

type MessagesRouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(_request: Request, context: MessagesRouteContext) {
  const { conversationId } = await context.params;
  const messages = await getConversationMessages(conversationId);

  return Response.json({ messages });
}

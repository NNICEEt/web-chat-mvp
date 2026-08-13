import { getConversationMessages } from "@/use-cases/get-conversation-messages";
import {
  ConversationNotFoundError,
  InvalidMessageTextError,
  sendMessage,
} from "@/use-cases/send-message";

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

export async function POST(request: Request, context: MessagesRouteContext) {
  const { conversationId } = await context.params;
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("text" in payload) ||
    typeof payload.text !== "string"
  ) {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  try {
    const message = await sendMessage(conversationId, payload.text);

    return Response.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidMessageTextError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ConversationNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }

    return Response.json({ error: "Unable to send message" }, { status: 502 });
  }
}

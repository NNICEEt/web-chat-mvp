import { getConversations } from "@/use-cases/get-conversations";

export async function GET() {
  const conversations = await getConversations();

  return Response.json({ conversations });
}

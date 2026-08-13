import { adaptLineWebhook } from "@/integrations/line/adapter";
import { verifyLineSignature } from "@/integrations/line/signature-verifier";
import { processInboundMessage } from "@/use-cases/process-inbound-message";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let events: ReturnType<typeof adaptLineWebhook>;

  try {
    const payload: unknown = JSON.parse(rawBody);
    events = adaptLineWebhook(payload);
  } catch {
    return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  for (const event of events) {
    await processInboundMessage(event);
  }

  return Response.json({ processedEvents: events.length });
}

import { after } from "next/server";

import { adaptLineWebhook } from "@/integrations/line/adapter";
import { verifyLineSignature } from "@/integrations/line/signature-verifier";
import { processInboundMessage } from "@/use-cases/process-inbound-message";
import { syncLineUserProfile } from "@/use-cases/sync-line-user-profile";

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

  const providerUserIds = [
    ...new Set(events.map((event) => event.providerUserId)),
  ];

  if (providerUserIds.length > 0) {
    after(async () => {
      const results = await Promise.allSettled(
        providerUserIds.map(syncLineUserProfile),
      );

      for (const [index, result] of results.entries()) {
        if (result.status === "rejected") {
          console.error("Unable to sync LINE user profile", {
            lineUserId: providerUserIds[index],
            error: result.reason,
          });
        }
      }
    });
  }

  return Response.json({ processedEvents: events.length });
}

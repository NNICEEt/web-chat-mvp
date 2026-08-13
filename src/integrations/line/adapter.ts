import type { InboundTextEvent } from "@/models/inbound-text-event";

export function adaptLineWebhook(payload: unknown): InboundTextEvent[] {
  if (!isRecord(payload) || !Array.isArray(payload.events)) {
    throw new Error("Invalid LINE webhook payload: events must be an array");
  }

  return payload.events.flatMap((event) => {
    const adaptedEvent = adaptLineEvent(event);

    return adaptedEvent ? [adaptedEvent] : [];
  });
}

function adaptLineEvent(event: unknown): InboundTextEvent | null {
  if (!isRecord(event) || typeof event.type !== "string") {
    throw new Error("Invalid LINE webhook payload: event must have a type");
  }

  if (event.type !== "message") {
    return null;
  }

  if (!isRecord(event.message) || typeof event.message.type !== "string") {
    throw new Error("Invalid LINE webhook payload: message event is malformed");
  }

  if (event.message.type !== "text") {
    return null;
  }

  if (!isRecord(event.source) || typeof event.source.type !== "string") {
    throw new Error("Invalid LINE webhook payload: event source is malformed");
  }

  if (event.source.type !== "user") {
    return null;
  }

  if (
    !isNonEmptyString(event.source.userId) ||
    !isNonEmptyString(event.message.id) ||
    !isNonEmptyString(event.webhookEventId) ||
    typeof event.message.text !== "string" ||
    typeof event.timestamp !== "number" ||
    !Number.isSafeInteger(event.timestamp) ||
    event.timestamp < 0
  ) {
    throw new Error(
      "Invalid LINE webhook payload: text message is missing required fields",
    );
  }

  return {
    providerUserId: event.source.userId,
    providerMessageId: event.message.id,
    webhookEventId: event.webhookEventId,
    text: event.message.text,
    occurredAt: new Date(event.timestamp),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

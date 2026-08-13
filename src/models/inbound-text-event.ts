export type InboundTextEvent = {
  providerUserId: string;
  providerMessageId: string;
  webhookEventId: string;
  text: string;
  occurredAt: Date;
};

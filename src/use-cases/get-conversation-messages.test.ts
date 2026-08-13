import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  database: { database: true },
  listMessagesByConversationId: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  db: mocks.database,
}));

vi.mock("@/repositories/message-repository", () => ({
  listMessagesByConversationId: mocks.listMessagesByConversationId,
}));

import { getConversationMessages } from "./get-conversation-messages";

describe("getConversationMessages", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the scoped message history in repository order", async () => {
    mocks.listMessagesByConversationId.mockResolvedValue([
      {
        id: "inbound-message-id",
        direction: "INBOUND",
        type: "TEXT",
        text: "Hello",
        status: "RECEIVED",
        occurredAt: new Date("2026-08-14T09:00:00.000Z"),
        providerMessageId: "provider-id-not-exposed",
        webhookEventId: "webhook-id-not-exposed",
      },
      {
        id: "outbound-message-id",
        direction: "OUTBOUND",
        type: "TEXT",
        text: "Hi there",
        status: "SENT",
        occurredAt: new Date("2026-08-14T09:01:00.000Z"),
        providerMessageId: null,
        webhookEventId: null,
      },
    ]);

    await expect(
      getConversationMessages("conversation-id"),
    ).resolves.toEqual([
      {
        messageId: "inbound-message-id",
        direction: "INBOUND",
        type: "TEXT",
        text: "Hello",
        status: "RECEIVED",
        occurredAt: "2026-08-14T09:00:00.000Z",
      },
      {
        messageId: "outbound-message-id",
        direction: "OUTBOUND",
        type: "TEXT",
        text: "Hi there",
        status: "SENT",
        occurredAt: "2026-08-14T09:01:00.000Z",
      },
    ]);
    expect(mocks.listMessagesByConversationId).toHaveBeenCalledWith(
      mocks.database,
      "conversation-id",
    );
  });

  it("returns an empty history when a conversation has no messages", async () => {
    mocks.listMessagesByConversationId.mockResolvedValue([]);

    await expect(
      getConversationMessages("conversation-id"),
    ).resolves.toEqual([]);
  });
});

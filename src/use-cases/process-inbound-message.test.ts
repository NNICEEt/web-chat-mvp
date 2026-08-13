import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DatabaseContext } from "@/repositories/database-context";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findMessageByWebhookEventId: vi.fn(),
  createInboundMessage: vi.fn(),
  findUserByLineUserId: vi.fn(),
  createUser: vi.fn(),
  findActiveConversationByUserId: vi.fn(),
  createActiveConversation: vi.fn(),
  updateConversationLastMessageAt: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  db: {
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/repositories/message-repository", () => ({
  findMessageByWebhookEventId: mocks.findMessageByWebhookEventId,
  createInboundMessage: mocks.createInboundMessage,
}));

vi.mock("@/repositories/user-repository", () => ({
  findUserByLineUserId: mocks.findUserByLineUserId,
  createUser: mocks.createUser,
}));

vi.mock("@/repositories/conversation-repository", () => ({
  findActiveConversationByUserId: mocks.findActiveConversationByUserId,
  createActiveConversation: mocks.createActiveConversation,
  updateConversationLastMessageAt: mocks.updateConversationLastMessageAt,
}));

import { processInboundMessage } from "./process-inbound-message";

const event = {
  providerUserId: "U4af4980629b14c0872cc3e7c54fb9e11",
  providerMessageId: "468789577898262530",
  webhookEventId: "01H810YECXQQZ37VAXPF6H9E6T",
  text: "Hello, world!",
  occurredAt: new Date("2023-08-17T08:34:26.727Z"),
};

const transaction = { transaction: true } as unknown as DatabaseContext;

describe("processInboundMessage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(
      async (operation: (database: DatabaseContext) => Promise<unknown>) =>
        operation(transaction),
    );
  });

  it("returns the existing message without creating duplicate data", async () => {
    mocks.findMessageByWebhookEventId.mockResolvedValue({
      id: "existing-message-id",
    });

    await expect(processInboundMessage(event)).resolves.toEqual({
      outcome: "duplicate",
      messageId: "existing-message-id",
    });

    expect(mocks.findMessageByWebhookEventId).toHaveBeenCalledWith(
      transaction,
      event.webhookEventId,
    );
    expect(mocks.findUserByLineUserId).not.toHaveBeenCalled();
    expect(mocks.createInboundMessage).not.toHaveBeenCalled();
    expect(mocks.updateConversationLastMessageAt).not.toHaveBeenCalled();
  });

  it("reuses an existing user and active conversation", async () => {
    mocks.findMessageByWebhookEventId.mockResolvedValue(null);
    mocks.findUserByLineUserId.mockResolvedValue({ id: "user-id" });
    mocks.findActiveConversationByUserId.mockResolvedValue({
      id: "conversation-id",
    });
    mocks.createInboundMessage.mockResolvedValue({ id: "message-id" });

    await expect(processInboundMessage(event)).resolves.toEqual({
      outcome: "created",
      messageId: "message-id",
      conversationId: "conversation-id",
    });

    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.createActiveConversation).not.toHaveBeenCalled();
    expect(mocks.createInboundMessage).toHaveBeenCalledWith(transaction, {
      conversationId: "conversation-id",
      providerMessageId: event.providerMessageId,
      webhookEventId: event.webhookEventId,
      text: event.text,
      occurredAt: event.occurredAt,
    });
    expect(mocks.updateConversationLastMessageAt).toHaveBeenCalledWith(
      transaction,
      "conversation-id",
      event.occurredAt,
    );
  });

  it("creates a user and active conversation when they do not exist", async () => {
    mocks.findMessageByWebhookEventId.mockResolvedValue(null);
    mocks.findUserByLineUserId.mockResolvedValue(null);
    mocks.createUser.mockResolvedValue({ id: "new-user-id" });
    mocks.findActiveConversationByUserId.mockResolvedValue(null);
    mocks.createActiveConversation.mockResolvedValue({
      id: "new-conversation-id",
    });
    mocks.createInboundMessage.mockResolvedValue({ id: "new-message-id" });

    await expect(processInboundMessage(event)).resolves.toEqual({
      outcome: "created",
      messageId: "new-message-id",
      conversationId: "new-conversation-id",
    });

    expect(mocks.createUser).toHaveBeenCalledWith(
      transaction,
      event.providerUserId,
    );
    expect(mocks.createActiveConversation).toHaveBeenCalledWith(
      transaction,
      "new-user-id",
    );
  });

  it("runs the persistence workflow in the required order", async () => {
    mocks.findMessageByWebhookEventId.mockResolvedValue(null);
    mocks.findUserByLineUserId.mockResolvedValue({ id: "user-id" });
    mocks.findActiveConversationByUserId.mockResolvedValue({
      id: "conversation-id",
    });
    mocks.createInboundMessage.mockResolvedValue({ id: "message-id" });

    await processInboundMessage(event);

    const invocationOrder = [
      mocks.findMessageByWebhookEventId,
      mocks.findUserByLineUserId,
      mocks.findActiveConversationByUserId,
      mocks.createInboundMessage,
      mocks.updateConversationLastMessageAt,
    ].map((mock) => mock.mock.invocationCallOrder[0]);

    expect(invocationOrder).toEqual([...invocationOrder].sort((a, b) => a - b));
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });
});

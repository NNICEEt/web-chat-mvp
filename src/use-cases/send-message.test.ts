import { beforeEach, describe, expect, it, vi } from "vitest";

import { MessageStatus } from "@/db/generated/prisma/enums";
import type { DatabaseContext } from "@/repositories/database-context";

const mocks = vi.hoisted(() => {
  const transaction = vi.fn();

  return {
    database: { $transaction: transaction },
    transaction,
    sendLineTextMessage: vi.fn(),
    findConversationByIdWithUser: vi.fn(),
    updateConversationLastMessageAt: vi.fn(),
    createOutboundMessage: vi.fn(),
    updateMessageStatus: vi.fn(),
  };
});

vi.mock("@/db/client", () => ({
  db: mocks.database,
}));

vi.mock("@/integrations/line/client", () => ({
  sendLineTextMessage: mocks.sendLineTextMessage,
}));

vi.mock("@/repositories/conversation-repository", () => ({
  findConversationByIdWithUser: mocks.findConversationByIdWithUser,
  updateConversationLastMessageAt: mocks.updateConversationLastMessageAt,
}));

vi.mock("@/repositories/message-repository", () => ({
  createOutboundMessage: mocks.createOutboundMessage,
  updateMessageStatus: mocks.updateMessageStatus,
}));

import {
  ConversationNotFoundError,
  InvalidMessageTextError,
  sendMessage,
} from "./send-message";

const transaction = { transaction: true } as unknown as DatabaseContext;
const conversation = {
  id: "conversation-id",
  user: {
    lineUserId: "U4af4980629b14c0872cc3e7c54fb9e11",
  },
};
const pendingMessage = {
  id: "message-id",
  conversationId: conversation.id,
  direction: "OUTBOUND",
  type: "TEXT",
  text: "Hello from the agent",
  status: "PENDING",
  occurredAt: new Date("2026-08-14T10:00:00.000Z"),
};
const sentMessage = {
  ...pendingMessage,
  status: "SENT",
};

describe("sendMessage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(pendingMessage.occurredAt);
    mocks.transaction.mockImplementation(
      async (operation: (database: DatabaseContext) => Promise<unknown>) =>
        operation(transaction),
    );
    mocks.findConversationByIdWithUser.mockResolvedValue(conversation);
    mocks.createOutboundMessage.mockResolvedValue(pendingMessage);
    mocks.sendLineTextMessage.mockResolvedValue(undefined);
    mocks.updateMessageStatus.mockResolvedValue(sentMessage);
  });

  it("persists PENDING before sending to LINE and then marks the message SENT", async () => {
    const order: string[] = [];

    mocks.findConversationByIdWithUser.mockImplementation(async () => {
      order.push("conversation-resolved");
      return conversation;
    });
    mocks.transaction.mockImplementation(
      async (operation: (database: DatabaseContext) => Promise<unknown>) => {
        order.push("transaction-started");
        const result = await operation(transaction);
        order.push("committed");
        return result;
      },
    );
    mocks.createOutboundMessage.mockImplementation(async () => {
      order.push("pending-created");
      return pendingMessage;
    });
    mocks.sendLineTextMessage.mockImplementation(async () => {
      order.push("line-sent");
    });
    mocks.updateMessageStatus.mockImplementation(async () => {
      order.push("marked-sent");
      return sentMessage;
    });

    await expect(
      sendMessage(conversation.id, pendingMessage.text),
    ).resolves.toEqual({
      messageId: pendingMessage.id,
      conversationId: conversation.id,
      direction: "OUTBOUND",
      type: "TEXT",
      text: pendingMessage.text,
      status: "SENT",
      occurredAt: "2026-08-14T10:00:00.000Z",
    });

    expect(order).toEqual([
      "conversation-resolved",
      "transaction-started",
      "pending-created",
      "committed",
      "line-sent",
      "marked-sent",
    ]);
    expect(mocks.findConversationByIdWithUser).toHaveBeenCalledWith(
      mocks.database,
      conversation.id,
    );
    expect(mocks.createOutboundMessage).toHaveBeenCalledWith(transaction, {
      conversationId: conversation.id,
      text: pendingMessage.text,
      occurredAt: pendingMessage.occurredAt,
    });
    expect(mocks.updateConversationLastMessageAt).toHaveBeenCalledWith(
      transaction,
      conversation.id,
      pendingMessage.occurredAt,
    );
    expect(mocks.sendLineTextMessage).toHaveBeenCalledWith(
      conversation.user.lineUserId,
      pendingMessage.text,
    );
    expect(mocks.updateMessageStatus).toHaveBeenCalledWith(
      expect.anything(),
      pendingMessage.id,
      MessageStatus.SENT,
    );
  });

  it("marks the persisted message FAILED when LINE rejects the request", async () => {
    const lineError = new Error("LINE request failed");
    mocks.sendLineTextMessage.mockRejectedValue(lineError);
    mocks.updateMessageStatus.mockResolvedValue({
      ...pendingMessage,
      status: "FAILED",
    });

    await expect(
      sendMessage(conversation.id, pendingMessage.text),
    ).rejects.toBe(lineError);

    expect(mocks.updateMessageStatus).toHaveBeenCalledOnce();
    expect(mocks.updateMessageStatus).toHaveBeenCalledWith(
      expect.anything(),
      pendingMessage.id,
      MessageStatus.FAILED,
    );
  });

  it("rejects an unknown conversation before persisting or calling LINE", async () => {
    mocks.findConversationByIdWithUser.mockResolvedValue(null);

    await expect(
      sendMessage("missing-conversation-id", pendingMessage.text),
    ).rejects.toBeInstanceOf(ConversationNotFoundError);

    expect(mocks.createOutboundMessage).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.sendLineTextMessage).not.toHaveBeenCalled();
    expect(mocks.updateMessageStatus).not.toHaveBeenCalled();
  });

  it.each(["", "   ", "\n\t"])(
    "rejects empty message text %#",
    async (text) => {
      await expect(sendMessage(conversation.id, text)).rejects.toBeInstanceOf(
        InvalidMessageTextError,
      );

      expect(mocks.transaction).not.toHaveBeenCalled();
      expect(mocks.sendLineTextMessage).not.toHaveBeenCalled();
    },
  );
});

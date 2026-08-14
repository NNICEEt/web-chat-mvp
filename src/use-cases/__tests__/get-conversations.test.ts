import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  database: { database: true },
  listConversations: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  db: mocks.database,
}));

vi.mock("@/repositories/conversation-repository", () => ({
  listConversations: mocks.listConversations,
}));

import { getConversations } from "../get-conversations";

describe("getConversations", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns conversation summaries in repository order", async () => {
    mocks.listConversations.mockResolvedValue([
      {
        id: "recent-conversation-id",
        status: "ACTIVE",
        lastMessageAt: new Date("2026-08-14T09:00:00.000Z"),
        messages: [{ text: "Latest customer message" }],
        user: {
          lineUserId: "U-not-exposed",
          displayName: "Alice",
          pictureUrl: "https://example.com/alice.jpg",
        },
      },
      {
        id: "older-conversation-id",
        status: "CLOSED",
        lastMessageAt: null,
        messages: [],
        user: {
          lineUserId: "U-also-not-exposed",
          displayName: null,
          pictureUrl: null,
        },
      },
    ]);

    await expect(getConversations()).resolves.toEqual([
      {
        conversationId: "recent-conversation-id",
        status: "ACTIVE",
        lastMessageAt: "2026-08-14T09:00:00.000Z",
        latestMessage: {
          text: "Latest customer message",
        },
        user: {
          displayName: "Alice",
          pictureUrl: "https://example.com/alice.jpg",
        },
      },
      {
        conversationId: "older-conversation-id",
        status: "CLOSED",
        lastMessageAt: null,
        latestMessage: null,
        user: {
          displayName: null,
          pictureUrl: null,
        },
      },
    ]);
    expect(mocks.listConversations).toHaveBeenCalledWith(mocks.database);
  });

  it("returns an empty list when there are no conversations", async () => {
    mocks.listConversations.mockResolvedValue([]);

    await expect(getConversations()).resolves.toEqual([]);
  });
});

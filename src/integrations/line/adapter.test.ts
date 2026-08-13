import { describe, expect, it } from "vitest";

import { adaptLineWebhook } from "./adapter";

const textMessageEvent = {
  type: "message",
  message: {
    type: "text",
    id: "468789577898262530",
    text: "Hello, world!",
  },
  webhookEventId: "01H810YECXQQZ37VAXPF6H9E6T",
  deliveryContext: {
    isRedelivery: false,
  },
  timestamp: 1_692_251_666_727,
  source: {
    type: "user",
    userId: "U4af4980629b14c0872cc3e7c54fb9e11",
  },
  replyToken: "38ef843bde154d9b91c21320ffd17a0f",
  mode: "active",
};

describe("adaptLineWebhook", () => {
  it("maps a LINE text message into an internal inbound event", () => {
    expect(adaptLineWebhook({ events: [textMessageEvent] })).toEqual([
      {
        providerUserId: "U4af4980629b14c0872cc3e7c54fb9e11",
        providerMessageId: "468789577898262530",
        webhookEventId: "01H810YECXQQZ37VAXPF6H9E6T",
        text: "Hello, world!",
        occurredAt: new Date(1_692_251_666_727),
      },
    ]);
  });

  it("maps multiple supported events in their original order", () => {
    const secondEvent = {
      ...textMessageEvent,
      message: {
        ...textMessageEvent.message,
        id: "468789577898262531",
        text: "Second message",
      },
      webhookEventId: "01H810YECXQQZ37VAXPF6H9E6V",
      timestamp: 1_692_251_666_728,
    };

    const result = adaptLineWebhook({
      events: [textMessageEvent, secondEvent],
    });

    expect(result.map((event) => event.text)).toEqual([
      "Hello, world!",
      "Second message",
    ]);
  });

  it("accepts a webhook with no events", () => {
    expect(adaptLineWebhook({ events: [] })).toEqual([]);
  });

  it.each([
    ["non-message event", { ...textMessageEvent, type: "follow" }],
    [
      "non-text message",
      {
        ...textMessageEvent,
        message: { ...textMessageEvent.message, type: "image" },
      },
    ],
    [
      "group message",
      {
        ...textMessageEvent,
        source: {
          type: "group",
          groupId: "C4af4980629b14c0872cc3e7c54fb9e11",
          userId: textMessageEvent.source.userId,
        },
      },
    ],
    [
      "room message",
      {
        ...textMessageEvent,
        source: {
          type: "room",
          roomId: "R4af4980629b14c0872cc3e7c54fb9e11",
          userId: textMessageEvent.source.userId,
        },
      },
    ],
  ])("ignores an unsupported %s", (_description, event) => {
    expect(adaptLineWebhook({ events: [event] })).toEqual([]);
  });

  it("rejects a payload without an events array", () => {
    expect(() => adaptLineWebhook({ events: null })).toThrowError(
      "Invalid LINE webhook payload: events must be an array",
    );
  });

  it("rejects a supported event with missing required fields", () => {
    const eventWithoutWebhookId = {
      ...textMessageEvent,
      webhookEventId: undefined,
    };

    expect(() =>
      adaptLineWebhook({ events: [eventWithoutWebhookId] }),
    ).toThrowError(
      "Invalid LINE webhook payload: text message is missing required fields",
    );
  });
});

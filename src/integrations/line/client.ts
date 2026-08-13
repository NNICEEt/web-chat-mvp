const LINE_PUSH_MESSAGE_URL = "https://api.line.me/v2/bot/message/push";

export class LineMessagingApiError extends Error {
  constructor(public readonly status: number) {
    super(`LINE Messaging API request failed with status ${status}`);
    this.name = "LineMessagingApiError";
  }
}

export async function sendLineTextMessage(
  recipientId: string,
  text: string,
): Promise<void> {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    throw new Error(
      "LINE_CHANNEL_ACCESS_TOKEN is required to send LINE messages",
    );
  }

  const response = await fetch(LINE_PUSH_MESSAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: recipientId,
      messages: [{ type: "text", text }],
    }),
  });

  if (!response.ok) {
    throw new LineMessagingApiError(response.status);
  }
}

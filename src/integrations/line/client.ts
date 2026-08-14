const LINE_PUSH_MESSAGE_URL = "https://api.line.me/v2/bot/message/push";
const LINE_PROFILE_URL = "https://api.line.me/v2/bot/profile";

export type LineUserProfile = {
  displayName: string;
  pictureUrl: string | null;
};

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
  const channelAccessToken = getChannelAccessToken();

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

export async function getLineUserProfile(
  userId: string,
): Promise<LineUserProfile> {
  const channelAccessToken = getChannelAccessToken();
  const response = await fetch(
    `${LINE_PROFILE_URL}/${encodeURIComponent(userId)}`,
    {
      headers: { Authorization: `Bearer ${channelAccessToken}` },
    },
  );

  if (!response.ok) {
    throw new LineMessagingApiError(response.status);
  }

  const profile: unknown = await response.json();

  if (!isLineUserProfile(profile)) {
    throw new Error("LINE Messaging API returned an invalid user profile");
  }

  return {
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl ?? null,
  };
}

function getChannelAccessToken(): string {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is required for LINE requests");
  }

  return channelAccessToken;
}

function isLineUserProfile(
  value: unknown,
): value is { displayName: string; pictureUrl?: string } {
  if (!value || typeof value !== "object") return false;

  const profile = value as Record<string, unknown>;

  return (
    typeof profile.displayName === "string" &&
    (profile.pictureUrl === undefined || typeof profile.pictureUrl === "string")
  );
}

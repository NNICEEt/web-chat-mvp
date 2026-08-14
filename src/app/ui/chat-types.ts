export type Conversation = {
  conversationId: string;
  status: "ACTIVE" | "CLOSED";
  lastMessageAt: string | null;
  latestMessage: {
    text: string;
  } | null;
  user: {
    displayName: string | null;
    pictureUrl: string | null;
  };
};

export type Message = {
  messageId: string;
  direction: "INBOUND" | "OUTBOUND";
  type: "TEXT";
  text: string;
  status: "RECEIVED" | "PENDING" | "SENT" | "FAILED";
  occurredAt: string;
};

export type ConversationsResponse = {
  conversations: Conversation[];
};

export type MessagesResponse = {
  messages: Message[];
};

export type SendMessageResponse = {
  message: Message;
};

import type { Message } from "../chat-types";

export function formatConversationTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatMessageStatus(status: Message["status"]) {
  if (status === "FAILED") return "ส่งไม่สำเร็จ";
  if (status === "PENDING") return "กำลังส่ง";
  return "ส่งแล้ว";
}

import type { Message } from "../chat-types";
import {
  formatMessageStatus,
  formatMessageTime,
} from "../utils/chat-formatters";

export function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === "OUTBOUND";

  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] sm:max-w-[70%] ${
          isOutbound ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-2.5 text-[15px] leading-6 shadow-sm ${
            isOutbound
              ? "rounded-br-md bg-[#06c755] text-white"
              : "rounded-bl-md border border-[#e2e7e2] bg-white text-[#263129]"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        </div>
        <div
          className={`mt-1 flex items-center gap-1.5 px-1 text-[11px] ${
            isOutbound ? "justify-end" : "justify-start"
          } ${
            message.status === "FAILED"
              ? "text-[#c0443a]"
              : "text-[#89948c]"
          }`}
        >
          <span>{formatMessageTime(message.occurredAt)}</span>
          {isOutbound ? (
            <span>· {formatMessageStatus(message.status)}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

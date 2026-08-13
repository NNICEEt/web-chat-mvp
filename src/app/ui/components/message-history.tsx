import type { RefObject } from "react";

import type { Message } from "../chat-types";
import { ErrorState } from "../shared/error-state";
import { ChatIcon } from "../shared/icons";
import { MessageBubble } from "./message-bubble";

export function MessageHistory({
  messages,
  isLoading,
  error,
  messageEndRef,
  onRetry,
}: {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  messageEndRef: RefObject<HTMLDivElement | null>;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-7">
      {isLoading ? (
        <MessageSkeleton />
      ) : error && messages.length === 0 ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : messages.length === 0 ? (
        <EmptyMessages />
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageBubble key={message.messageId} message={message} />
          ))}
          <div ref={messageEndRef} />
        </div>
      )}
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-14 w-2/3 rounded-2xl bg-[#e7ebe7]" />
      <div className="ml-auto h-16 w-1/2 rounded-2xl bg-[#d8ebde]" />
      <div className="h-12 w-1/2 rounded-2xl bg-[#e7ebe7]" />
    </div>
  );
}

function EmptyMessages() {
  return (
    <div className="grid h-full place-items-center text-center">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e7eee8] text-[#66746a]">
          <ChatIcon />
        </div>
        <p className="mt-4 font-semibold text-[#354039]">ยังไม่มีข้อความ</p>
        <p className="mt-1 text-sm text-[#849087]">
          เริ่ม conversation ด้วยข้อความด้านล่าง
        </p>
      </div>
    </div>
  );
}

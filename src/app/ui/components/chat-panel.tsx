import type { FormEvent, RefObject } from "react";

import { ChatHeader } from "./chat-header";
import { MessageComposer } from "./message-composer";
import { MessageHistory } from "./message-history";
import type { Conversation, Message } from "../chat-types";
import { ChatIcon } from "../shared/icons";

type ChatPanelProps = {
  conversation: Conversation | undefined;
  messages: Message[];
  draft: string;
  isLoading: boolean;
  isSending: boolean;
  messageError: string | null;
  sendError: string | null;
  isMobileChatOpen: boolean;
  messageEndRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onDraftChange: (value: string) => void;
  onRetry: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ChatPanel({
  conversation,
  messages,
  draft,
  isLoading,
  isSending,
  messageError,
  sendError,
  isMobileChatOpen,
  messageEndRef,
  onBack,
  onDraftChange,
  onRetry,
  onSubmit,
}: ChatPanelProps) {
  return (
    <section
      className={`${isMobileChatOpen ? "flex" : "hidden"} min-w-0 flex-1 flex-col bg-[#f7f8f5] md:flex`}
    >
      {conversation ? (
        <>
          <ChatHeader conversation={conversation} onBack={onBack} />
          <MessageHistory
            messages={messages}
            isLoading={isLoading}
            error={messageError}
            messageEndRef={messageEndRef}
            onRetry={onRetry}
          />
          <MessageComposer
            draft={draft}
            isSending={isSending}
            error={sendError}
            onDraftChange={onDraftChange}
            onSubmit={onSubmit}
          />
        </>
      ) : (
        <NoConversationSelected />
      )}
    </section>
  );
}

function NoConversationSelected() {
  return (
    <div className="grid h-full place-items-center px-6 text-center">
      <div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-[#e5eee7] text-[#617067]">
          <ChatIcon />
        </div>
        <h2 className="mt-5 text-xl font-bold text-[#253129]">
          เลือก conversation
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[#7b877f]">
          เลือกรายการทางซ้ายเพื่อดู message history และตอบกลับลูกค้า
        </p>
      </div>
    </div>
  );
}

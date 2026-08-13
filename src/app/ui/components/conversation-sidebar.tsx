import type { Conversation } from "../chat-types";
import { Avatar } from "../shared/avatar";
import { ErrorState } from "../shared/error-state";
import { ChatIcon } from "../shared/icons";
import { formatConversationTime } from "../utils/chat-formatters";

type ConversationSidebarProps = {
  conversations: Conversation[];
  selectedConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  isMobileChatOpen: boolean;
  onSelect: (conversationId: string) => void;
  onRetry: () => void;
};

export function ConversationSidebar({
  conversations,
  selectedConversationId,
  isLoading,
  error,
  isMobileChatOpen,
  onSelect,
  onRetry,
}: ConversationSidebarProps) {
  return (
    <aside
      className={`${isMobileChatOpen ? "hidden" : "flex"} w-full shrink-0 flex-col border-r border-[#e5ebe6] bg-[#fbfcfa] md:flex md:w-[360px] lg:w-[410px]`}
    >
      <header className="border-b border-[#e5ebe6] px-6 pb-5 pt-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a887f]">
              Operator inbox
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#17221b]">
              Conversations
            </h1>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#06c755] text-white shadow-[0_8px_20px_rgba(6,199,85,0.24)]">
            <ChatIcon />
          </span>
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#e2e8e3] bg-white px-3.5 py-2.5 text-sm text-[#7a887f]">
          <span className="h-2 w-2 rounded-full bg-[#06c755]" />
          Syncing with LINE every 3 seconds
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <ConversationSkeleton />
        ) : error && conversations.length === 0 ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : conversations.length === 0 ? (
          <EmptyConversations />
        ) : (
          <div className="space-y-1.5">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.conversationId}
                conversation={conversation}
                isSelected={
                  conversation.conversationId === selectedConversationId
                }
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (conversationId: string) => void;
}) {
  const name = conversation.user.displayName ?? "LINE Customer";

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.conversationId)}
      className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
        isSelected
          ? "bg-[#eaf9ef] shadow-[inset_3px_0_0_#06c755]"
          : "hover:bg-[#f1f5f1]"
      }`}
    >
      <Avatar name={name} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-[15px] font-semibold text-[#202a23]">
            {name}
          </span>
          <span className="shrink-0 text-[11px] text-[#8a968e]">
            {formatConversationTime(conversation.lastMessageAt)}
          </span>
        </span>
        <span className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-sm text-[#758179]">
            LINE conversation
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${
              conversation.status === "ACTIVE"
                ? "bg-[#dff6e7] text-[#168943]"
                : "bg-[#edf0ed] text-[#788179]"
            }`}
          >
            {conversation.status}
          </span>
        </span>
      </span>
    </button>
  );
}

function ConversationSkeleton() {
  return (
    <div className="space-y-2 p-1">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="flex animate-pulse gap-3 rounded-2xl p-3">
          <div className="h-12 w-12 rounded-2xl bg-[#e8ece8]" />
          <div className="flex-1 py-1">
            <div className="h-3.5 w-2/3 rounded bg-[#e8ece8]" />
            <div className="mt-3 h-3 w-1/2 rounded bg-[#eef1ee]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyConversations() {
  return (
    <div className="grid h-full place-items-center px-8 text-center">
      <div>
        <p className="font-semibold text-[#354039]">ยังไม่มี conversation</p>
        <p className="mt-2 text-sm leading-6 text-[#849087]">
          เมื่อมีข้อความจาก LINE รายการจะปรากฏที่นี่
        </p>
      </div>
    </div>
  );
}

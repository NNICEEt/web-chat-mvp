import type { Conversation } from "../chat-types";
import { Avatar } from "../shared/avatar";
import { BackIcon } from "../shared/icons";

export function ChatHeader({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  const name = conversation.user.displayName ?? "LINE Customer";

  return (
    <header className="flex h-[82px] shrink-0 items-center gap-3 border-b border-[#e3e8e3] bg-white px-4 sm:px-6">
      <button
        type="button"
        aria-label="Back to conversations"
        onClick={onBack}
        className="grid h-10 w-10 place-items-center rounded-xl text-[#536058] hover:bg-[#f0f4f0] md:hidden"
      >
        <BackIcon />
      </button>
      <Avatar
        name={name}
        pictureUrl={conversation.user.pictureUrl}
        compact
      />
      <div className="min-w-0">
        <h2 className="truncate font-semibold text-[#1d2921]">{name}</h2>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#7b887f]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#06c755]" />
          LINE Official Account
        </p>
      </div>
    </header>
  );
}

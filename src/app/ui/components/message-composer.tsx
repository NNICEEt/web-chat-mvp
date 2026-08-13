import type { FormEvent } from "react";

import { SendIcon, Spinner } from "../shared/icons";

export function MessageComposer({
  draft,
  isSending,
  error,
  onDraftChange,
  onSubmit,
}: {
  draft: string;
  isSending: boolean;
  error: string | null;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <footer className="shrink-0 border-t border-[#e3e8e3] bg-white p-3 sm:p-5">
      {error ? <p className="mb-2 text-sm text-[#b53b32]">{error}</p> : null}
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 rounded-2xl border border-[#dfe6df] bg-[#fafbf9] p-2 shadow-[0_4px_18px_rgba(37,57,44,0.05)] focus-within:border-[#86dba8] focus-within:ring-4 focus-within:ring-[#06c755]/10"
      >
        <textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={1}
          maxLength={5_000}
          placeholder="พิมพ์ข้อความ..."
          className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] text-[#202a23] outline-none placeholder:text-[#9aa49d]"
        />
        <button
          type="submit"
          disabled={isSending || draft.trim().length === 0}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#06c755] text-white transition hover:bg-[#05b84e] disabled:cursor-not-allowed disabled:bg-[#b8c8bd]"
          aria-label="Send message"
        >
          {isSending ? <Spinner /> : <SendIcon />}
        </button>
      </form>
      <p className="mt-2 hidden text-center text-[11px] text-[#929d95] sm:block">
        Enter to send · Shift + Enter for a new line
      </p>
    </footer>
  );
}

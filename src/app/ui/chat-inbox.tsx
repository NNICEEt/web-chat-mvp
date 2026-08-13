"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  Conversation,
  ConversationsResponse,
  Message,
  MessagesResponse,
  SendMessageResponse,
} from "./chat-types";
import { ChatPanel } from "./components/chat-panel";
import { ConversationSidebar } from "./components/conversation-sidebar";

const POLLING_INTERVAL_MS = 3_000;

export function ChatInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(
    null,
  );
  const [messageError, setMessageError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/conversations", {
        cache: "no-store",
        signal,
      });

      if (!response.ok) throw new Error("Unable to load conversations");

      const data = (await response.json()) as ConversationsResponse;
      setConversations(data.conversations);
      setSelectedConversationId((currentId) => {
        const stillExists = data.conversations.some(
          (conversation) => conversation.conversationId === currentId,
        );

        return stillExists
          ? currentId
          : (data.conversations[0]?.conversationId ?? null);
      });
      setConversationError(null);
    } catch (error) {
      if (!isAbortError(error)) {
        setConversationError("โหลดรายการสนทนาไม่สำเร็จ");
      }
    } finally {
      if (!signal?.aborted) setIsLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(
    async (
      conversationId: string,
      signal?: AbortSignal,
      showLoading = false,
    ) => {
      if (showLoading) setIsLoadingMessages(true);

      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/messages`,
          { cache: "no-store", signal },
        );

        if (!response.ok) throw new Error("Unable to load messages");

        const data = (await response.json()) as MessagesResponse;
        setMessages(data.messages);
        setMessageError(null);
      } catch (error) {
        if (!isAbortError(error)) setMessageError("โหลดข้อความไม่สำเร็จ");
      } finally {
        if (!signal?.aborted) setIsLoadingMessages(false);
      }
    },
    [],
  );

  usePolling(loadConversations);

  useEffect(() => {
    if (!selectedConversationId) return;

    let stopped = false;
    let isFirstRequest = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    async function poll() {
      if (document.visibilityState === "visible") {
        controller = new AbortController();
        await loadMessages(
          selectedConversationId as string,
          controller.signal,
          isFirstRequest,
        );
        isFirstRequest = false;
      }

      if (!stopped) timer = setTimeout(poll, POLLING_INTERVAL_MS);
    }

    void poll();

    return () => {
      stopped = true;
      controller?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [loadMessages, selectedConversationId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations.find(
    (conversation) =>
      conversation.conversationId === selectedConversationId,
  );

  function selectConversation(conversationId: string) {
    if (conversationId !== selectedConversationId) {
      setMessages([]);
      setMessageError(null);
      setIsLoadingMessages(true);
    }

    setSelectedConversationId(conversationId);
    setShowMobileChat(true);
    setSendError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedConversationId || !draft.trim() || isSending) return;

    const text = draft;
    setDraft("");
    setSendError(null);
    setIsSending(true);

    try {
      const response = await fetch(
        `/api/conversations/${selectedConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        },
      );

      if (!response.ok) throw new Error("Unable to send message");

      const data = (await response.json()) as SendMessageResponse;
      setMessages((currentMessages) => [
        ...currentMessages.filter(
          (message) => message.messageId !== data.message.messageId,
        ),
        data.message,
      ]);
      void loadConversations();
    } catch {
      setDraft(text);
      setSendError("ส่งข้อความไม่สำเร็จ กรุณาลองอีกครั้ง");
      void loadMessages(selectedConversationId);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef1ed] p-0 sm:p-5 lg:p-8">
      <section className="mx-auto flex h-screen max-w-[1440px] overflow-hidden bg-white shadow-[0_28px_80px_rgba(28,48,37,0.12)] sm:h-[calc(100vh-2.5rem)] sm:rounded-[28px] lg:h-[calc(100vh-4rem)]">
        <ConversationSidebar
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          isLoading={isLoadingConversations}
          error={conversationError}
          isMobileChatOpen={showMobileChat}
          onSelect={selectConversation}
          onRetry={() => void loadConversations()}
        />
        <ChatPanel
          conversation={selectedConversation}
          messages={messages}
          draft={draft}
          isLoading={isLoadingMessages}
          isSending={isSending}
          messageError={messageError}
          sendError={sendError}
          isMobileChatOpen={showMobileChat}
          messageEndRef={messageEndRef}
          onBack={() => setShowMobileChat(false)}
          onDraftChange={setDraft}
          onRetry={() => {
            if (selectedConversationId) void loadMessages(selectedConversationId);
          }}
          onSubmit={handleSubmit}
        />
      </section>
    </main>
  );
}

function usePolling(load: (signal?: AbortSignal) => Promise<void>) {
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    async function poll() {
      if (document.visibilityState === "visible") {
        controller = new AbortController();
        await load(controller.signal);
      }

      if (!stopped) timer = setTimeout(poll, POLLING_INTERVAL_MS);
    }

    void poll();

    return () => {
      stopped = true;
      controller?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [load]);
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

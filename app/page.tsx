"use client";
// ────────────────────────────────────────────────────────────
// Main page — Landing + Viewer (single-page with view mode)
// ────────────────────────────────────────────────────────────
import React, { useEffect, useCallback } from "react";
import { useChatStore } from "./state/useChatStore";
import ImportDropzone from "./components/ImportDropzone";
import ChatLayout from "./components/ChatLayout";
import LightboxModal from "./components/LightboxModal";
import PdfViewerModal from "./components/PdfViewerModal";
import Toasts from "./components/Toasts";
import { loadChatMetaList, loadChatMessages, deleteChat } from "./lib/idb";
import { StoredChatMeta } from "./lib/types";

export default function Home() {
  const viewMode = useChatStore((s) => s.viewMode);
  const isParsing = useChatStore((s) => s.isParsing);
  const parseProgress = useChatStore((s) => s.parseProgress);
  const storedChats = useChatStore((s) => s.storedChats);
  const setStoredChats = useChatStore((s) => s.setStoredChats);
  const setMessages = useChatStore((s) => s.setMessages);
  const setViewMode = useChatStore((s) => s.setViewMode);
  const addToast = useChatStore((s) => s.addToast);

  // Load stored chats from IDB on mount
  useEffect(() => {
    loadChatMetaList().then((chats) => {
      setStoredChats(chats.sort((a, b) => b.importedAt - a.importedAt));
    });
  }, [setStoredChats]);

  const handleOpenStored = useCallback(
    async (meta: StoredChatMeta) => {
      const messages = await loadChatMessages(meta.chatId);
      if (messages) {
        setMessages(messages, meta.title, meta.participants);
        setViewMode("viewer");
        addToast(
          "Restored from cache. Re-import for media previews.",
          "info"
        );
      } else {
        addToast("Failed to load cached chat", "error");
      }
    },
    [setMessages, setViewMode, addToast]
  );

  const handleDeleteStored = useCallback(
    async (chatId: string) => {
      await deleteChat(chatId);
      const chats = await loadChatMetaList();
      setStoredChats(chats.sort((a, b) => b.importedAt - a.importedAt));
    },
    [setStoredChats]
  );

  // ── Viewer mode ──
  if (viewMode === "viewer") {
    return (
      <div className="h-screen flex flex-col">
        <ChatLayout />
        <LightboxModal />
        <PdfViewerModal />
        <Toasts />
      </div>
    );
  }

  // ── Landing mode ──
  return (
    <div className="min-h-screen bg-[#111b21] flex flex-col">
      {/* WhatsApp-style header bar */}
      <div className="bg-[#00a884] h-32" />
      <div className="flex-1 -mt-16 px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Card */}
          <div className="bg-[#202c33] rounded-2xl shadow-2xl overflow-hidden">
            {/* Title section */}
            <div className="px-8 pt-8 pb-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#00a884]/10 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-[#00a884]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[#e9edef] mb-2">
                WhatsApp Chat Viewer
              </h1>
              <p className="text-[#8696a0] text-sm max-w-md mx-auto leading-relaxed">
                View your exported WhatsApp chats right in your browser.
                <br />
                <span className="inline-flex items-center gap-1 mt-1 text-[#00a884] text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  All processing happens in your browser — nothing is uploaded
                </span>
              </p>
            </div>

            {/* Import section */}
            <div className="px-8 pb-8">
              <ImportDropzone />
            </div>

            {/* Parsing progress */}
            {isParsing && (
              <div className="px-8 pb-6">
                <div className="bg-[#111b21] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#d1d7db] font-medium">
                      Parsing chat...
                    </span>
                    <span className="text-sm text-[#00a884] font-mono">
                      {parseProgress?.percent ?? 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#374045] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00a884] rounded-full transition-all duration-300"
                      style={{ width: `${parseProgress?.percent ?? 0}%` }}
                    />
                  </div>
                  {parseProgress && (
                    <p className="text-xs text-[#8696a0] mt-1.5">
                      {parseProgress.linesProcessed.toLocaleString()} /{" "}
                      {parseProgress.totalLines.toLocaleString()} lines
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recent chats */}
            {storedChats.length > 0 && (
              <div className="px-8 pb-8">
                <h2 className="text-sm font-semibold text-[#8696a0] uppercase tracking-wider mb-3">
                  Recent Chats
                </h2>
                <div className="space-y-2">
                  {storedChats.map((chat) => (
                    <div
                      key={chat.chatId}
                      className="bg-[#111b21] rounded-xl p-3 flex items-center gap-3 hover:bg-[#1a2a32] transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#374045] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-[#8696a0]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#d1d7db] font-medium truncate">
                          {chat.title}
                        </p>
                        <p className="text-xs text-[#8696a0]">
                          {chat.messageCount.toLocaleString()} messages
                          {chat.firstDate && ` · ${chat.firstDate}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenStored(chat)}
                          className="px-3 py-1.5 bg-[#00a884] text-white text-xs rounded-lg hover:bg-[#00a884]/80 transition-colors"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => handleDeleteStored(chat.chatId)}
                          className="p-1.5 text-[#8696a0] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-[#8696a0] text-xs mt-6">
            WhatsApp Chat Viewer · Privacy-first · Client-side only
          </p>
        </div>
      </div>
      <Toasts />
    </div>
  );
}

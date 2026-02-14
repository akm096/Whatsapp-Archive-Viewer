"use client";
// ────────────────────────────────────────────────────────────
// Zustand store for the WhatsApp chat viewer
// ────────────────────────────────────────────────────────────
import { create } from "zustand";
import {
    ChatMessage,
    MediaIndex,
    ParseProgress,
    Toast,
    RenderRow,
    StoredChatMeta,
} from "../lib/types";
import { toDateLabel } from "../lib/dateParse";

interface ChatState {
    // ── Chat data ──
    messages: ChatMessage[];
    title: string;
    participants: string[];
    mediaIndex: MediaIndex;
    renderRows: RenderRow[];

    // ── Identity ──
    mySender: string | null;

    // ── Parse state ──
    isParsing: boolean;
    parseProgress: ParseProgress | null;

    // ── Search ──
    searchQuery: string;
    searchResults: number[];
    searchCurrentIdx: number;

    // ── UI ──
    toasts: Toast[];
    lightboxUrl: string | null;
    pdfUrl: string | null;
    storedChats: StoredChatMeta[];
    viewMode: "landing" | "viewer";

    // ── Actions ──
    setMessages: (
        messages: ChatMessage[],
        title: string,
        participants: string[]
    ) => void;
    setMediaIndex: (index: MediaIndex) => void;
    setMySender: (name: string | null) => void;
    setIsParsing: (v: boolean) => void;
    setParseProgress: (p: ParseProgress | null) => void;
    setSearchQuery: (q: string) => void;
    nextSearchResult: () => void;
    prevSearchResult: () => void;
    addToast: (message: string, type: Toast["type"]) => void;
    removeToast: (id: string) => void;
    setLightboxUrl: (url: string | null) => void;
    setPdfUrl: (url: string | null) => void;
    setStoredChats: (chats: StoredChatMeta[]) => void;
    setViewMode: (mode: "landing" | "viewer") => void;
    reset: () => void;
}

let toastCounter = 0;

/**
 * Build render rows (date dividers + message indices) from a flat message array.
 * Uses indices instead of object refs to reduce memory overhead.
 */
function buildRenderRows(messages: ChatMessage[]): RenderRow[] {
    const rows: RenderRow[] = [];
    let lastDateKey = "";

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const dk = msg.dateKey || "";

        if (dk && dk !== lastDateKey) {
            rows.push({
                type: "date-divider",
                dateKey: dk,
                label: toDateLabel(dk),
            });
            lastDateKey = dk;
        }

        rows.push({ type: "message", message: msg, index: i });
    }

    return rows;
}

/**
 * Apply direction to messages based on selected sender name.
 * Mutates messages in-place for performance with large arrays.
 */
function applyDirection(messages: ChatMessage[], mySender: string | null): void {
    for (const msg of messages) {
        if (msg.sender === null) {
            msg.direction = "unknown";
        } else if (mySender && msg.sender === mySender) {
            msg.direction = "out";
        } else {
            msg.direction = "in";
        }
    }
}

export const useChatStore = create<ChatState>((set, get) => ({
    messages: [],
    title: "",
    participants: [],
    mediaIndex: new Map(),
    renderRows: [],
    mySender: null,
    isParsing: false,
    parseProgress: null,
    searchQuery: "",
    searchResults: [],
    searchCurrentIdx: -1,
    toasts: [],
    lightboxUrl: null,
    pdfUrl: null,
    storedChats: [],
    viewMode: "landing",

    setMessages: (messages, title, participants) => {
        const { mySender } = get();
        if (mySender) {
            applyDirection(messages, mySender);
        }
        const renderRows = buildRenderRows(messages);
        set({ messages, title, participants, renderRows });
    },

    setMediaIndex: (index) => set({ mediaIndex: index }),

    setMySender: (name) => {
        const { messages } = get();
        applyDirection(messages, name);
        const renderRows = buildRenderRows(messages);
        set({ mySender: name, messages: [...messages], renderRows });
    },

    setIsParsing: (v) => set({ isParsing: v }),

    setParseProgress: (p) => set({ parseProgress: p }),

    setSearchQuery: (q) => {
        const { messages } = get();
        if (!q.trim()) {
            set({ searchQuery: q, searchResults: [], searchCurrentIdx: -1 });
            return;
        }
        const lower = q.toLowerCase();
        const results: number[] = [];
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].text.toLowerCase().includes(lower)) {
                results.push(i);
            }
        }
        set({
            searchQuery: q,
            searchResults: results,
            searchCurrentIdx: results.length > 0 ? 0 : -1,
        });
    },

    nextSearchResult: () => {
        const { searchResults, searchCurrentIdx } = get();
        if (searchResults.length === 0) return;
        const next = (searchCurrentIdx + 1) % searchResults.length;
        set({ searchCurrentIdx: next });
    },

    prevSearchResult: () => {
        const { searchResults, searchCurrentIdx } = get();
        if (searchResults.length === 0) return;
        const prev =
            (searchCurrentIdx - 1 + searchResults.length) % searchResults.length;
        set({ searchCurrentIdx: prev });
    },

    addToast: (message, type) => {
        const id = `toast-${toastCounter++}`;
        const toast: Toast = { id, message, type };
        set((s) => ({ toasts: [...s.toasts, toast] }));
        // Auto-remove after 5 seconds
        setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 5000);
    },

    removeToast: (id) => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    },

    setLightboxUrl: (url) => set({ lightboxUrl: url }),
    setPdfUrl: (url) => set({ pdfUrl: url }),
    setStoredChats: (chats) => set({ storedChats: chats }),
    setViewMode: (mode) => set({ viewMode: mode }),

    reset: () =>
        set({
            messages: [],
            title: "",
            participants: [],
            mediaIndex: new Map(),
            renderRows: [],
            mySender: null,
            isParsing: false,
            parseProgress: null,
            searchQuery: "",
            searchResults: [],
            searchCurrentIdx: -1,
            lightboxUrl: null,
            pdfUrl: null,
        }),
}));

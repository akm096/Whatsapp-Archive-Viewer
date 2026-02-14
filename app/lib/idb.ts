// ────────────────────────────────────────────────────────────
// IndexedDB persistence for parsed chats
// ────────────────────────────────────────────────────────────
import { openDB, DBSchema, IDBPDatabase } from "idb";
import { ChatMessage, StoredChatMeta } from "./types";

const DB_NAME = "whatsapp-viewer";
const DB_VERSION = 1;

interface WhatsAppDB extends DBSchema {
    chatMeta: {
        key: string;
        value: StoredChatMeta;
    };
    chatMessages: {
        key: string;
        value: {
            chatId: string;
            messages: ChatMessage[];
        };
    };
}

let dbPromise: Promise<IDBPDatabase<WhatsAppDB>> | null = null;

function getDB(): Promise<IDBPDatabase<WhatsAppDB>> {
    if (!dbPromise) {
        dbPromise = openDB<WhatsAppDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains("chatMeta")) {
                    db.createObjectStore("chatMeta", { keyPath: "chatId" });
                }
                if (!db.objectStoreNames.contains("chatMessages")) {
                    db.createObjectStore("chatMessages", { keyPath: "chatId" });
                }
            },
        });
    }
    return dbPromise;
}

/**
 * Simple hash for chat text content (for dedup).
 */
export async function hashText(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text.slice(0, 10000)); // Hash first 10KB only
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Save chat metadata + messages to IndexedDB.
 */
export async function saveChat(
    meta: StoredChatMeta,
    messages: ChatMessage[]
): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(["chatMeta", "chatMessages"], "readwrite");
    await tx.objectStore("chatMeta").put(meta);
    await tx.objectStore("chatMessages").put({ chatId: meta.chatId, messages });
    await tx.done;
}

/**
 * Load chat metadata list from IndexedDB.
 */
export async function loadChatMetaList(): Promise<StoredChatMeta[]> {
    const db = await getDB();
    return db.getAll("chatMeta");
}

/**
 * Load chat messages by chatId.
 */
export async function loadChatMessages(
    chatId: string
): Promise<ChatMessage[] | null> {
    const db = await getDB();
    const record = await db.get("chatMessages", chatId);
    return record?.messages ?? null;
}

/**
 * Delete a chat from IndexedDB.
 */
export async function deleteChat(chatId: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(["chatMeta", "chatMessages"], "readwrite");
    await tx.objectStore("chatMeta").delete(chatId);
    await tx.objectStore("chatMessages").delete(chatId);
    await tx.done;
}

/**
 * Clear all chats from IndexedDB.
 */
export async function clearAllChats(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(["chatMeta", "chatMessages"], "readwrite");
    await tx.objectStore("chatMeta").clear();
    await tx.objectStore("chatMessages").clear();
    await tx.done;
}

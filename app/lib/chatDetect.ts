// ────────────────────────────────────────────────────────────
// Detect the WhatsApp chat text file from a list of files
// ────────────────────────────────────────────────────────────
import { FileEntry } from "./types";
import { LINE_START_REGEX } from "./dateParse";

/**
 * Common WhatsApp chat file name patterns (case-insensitive).
 */
const CHAT_FILE_PATTERNS = [
    /^_chat\.txt$/i,
    /^chat\.txt$/i,
    /^whatsapp chat/i,
    /\.txt$/i,
];

/**
 * From a list of file entries, find the most likely WhatsApp chat text file.
 *
 * Strategy:
 * 1. Filter to .txt files.
 * 2. Prefer files with known names (_chat.txt, chat.txt, "WhatsApp Chat with...").
 * 3. If multiple candidates, score them by how many of the first 50 lines match
 *    WhatsApp timestamp patterns.
 * 4. Return the best candidate, or null if none found.
 */
export function detectChatFile(files: FileEntry[]): FileEntry | null {
    // Only consider .txt files
    const txtFiles = files.filter((f) =>
        f.name.toLowerCase().endsWith(".txt")
    );

    if (txtFiles.length === 0) return null;
    if (txtFiles.length === 1) return txtFiles[0];

    // Score each candidate by known-name priority
    const scored = txtFiles.map((f) => {
        let priority = 0;
        const name = f.name.toLowerCase();
        if (name === "_chat.txt") priority = 100;
        else if (name === "chat.txt") priority = 90;
        else if (name.startsWith("whatsapp chat")) priority = 80;
        return { file: f, priority };
    });

    // Sort by priority descending
    scored.sort((a, b) => b.priority - a.priority);

    // If there's a clear winner by name, return it
    if (scored[0].priority > 0) return scored[0].file;

    // Otherwise we need to score by content — return the first txt file for now
    // (content-based scoring happens asynchronously in the worker)
    return scored[0].file;
}

/**
 * Score a text string by how many of its first N lines match a WhatsApp timestamp.
 * Used for tiebreaking when multiple .txt files exist.
 */
export function scoreAsWhatsAppChat(
    text: string,
    maxLines: number = 50
): number {
    const lines = text.split("\n").slice(0, maxLines);
    let matches = 0;
    for (const line of lines) {
        if (LINE_START_REGEX.test(line.trim())) {
            matches++;
        }
    }
    return matches / Math.max(lines.length, 1);
}

/**
 * Extract the chat title from the chat file name.
 * e.g., "WhatsApp Chat with John Doe.txt" → "John Doe"
 *        "_chat.txt" → "WhatsApp Chat"
 */
export function extractChatTitle(fileName: string): string {
    // "WhatsApp Chat with <name>.txt"
    const match = fileName.match(/whatsapp\s+chat\s+with\s+(.+)\.txt$/i);
    if (match) return match[1].trim();

    // "_chat.txt" or "chat.txt"
    if (
        fileName.toLowerCase() === "_chat.txt" ||
        fileName.toLowerCase() === "chat.txt"
    ) {
        return "WhatsApp Chat";
    }

    // Strip .txt
    return fileName.replace(/\.txt$/i, "").trim() || "WhatsApp Chat";
}

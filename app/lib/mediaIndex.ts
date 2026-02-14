// ────────────────────────────────────────────────────────────
// Media index builder — maps file basenames to Object URLs
// ────────────────────────────────────────────────────────────
import { FileEntry, MediaEntry, MediaIndex } from "./types";

/**
 * Common MIME type mapping by extension.
 */
const MIME_MAP: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    "3gp": "video/3gpp",
    webm: "video/webm",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
    opus: "audio/opus",
    wav: "audio/wav",
    m4a: "audio/mp4",
    aac: "audio/aac",
    wma: "audio/x-ms-wma",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    xml: "application/xml",
    vcf: "text/vcard",
    apk: "application/vnd.android.package-archive",
};

/**
 * Guess MIME type from filename extension.
 */
export function guessMime(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return MIME_MAP[ext] || "application/octet-stream";
}

/**
 * Determine the general category of a file based on MIME type.
 */
export function getMediaCategory(
    mime: string
): "image" | "video" | "audio" | "pdf" | "file" {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    if (mime === "application/pdf") return "pdf";
    return "file";
}

/**
 * Build a MediaIndex from a list of file entries.
 * Skips .txt files (they're chat text, not media).
 */
export function buildMediaIndex(files: FileEntry[]): MediaIndex {
    const index: MediaIndex = new Map();

    for (const entry of files) {
        // Skip text files
        if (entry.name.toLowerCase().endsWith(".txt")) continue;

        const objectURL = URL.createObjectURL(entry.blob);
        index.set(entry.name.toLowerCase(), {
            file: entry.blob,
            mime: entry.mime,
            size: entry.size,
            objectURL,
        });
    }

    return index;
}

/**
 * Revoke all Object URLs in a MediaIndex — call on cleanup.
 */
export function revokeMediaIndex(index: MediaIndex): void {
    for (const entry of index.values()) {
        URL.revokeObjectURL(entry.objectURL);
    }
    index.clear();
}

/**
 * Resolve an attachment filename against the media index.
 * Returns the matching MediaEntry or null.
 */
export function resolveMedia(
    index: MediaIndex,
    filename: string
): MediaEntry | null {
    // Try exact match (lowercased)
    const key = filename.toLowerCase();
    if (index.has(key)) return index.get(key)!;

    // Try without path prefixes
    const base = key.split("/").pop() || key;
    if (index.has(base)) return index.get(base)!;

    return null;
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

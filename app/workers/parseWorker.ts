// ────────────────────────────────────────────────────────────
// Web Worker for parsing WhatsApp chat text
// Runs off the main thread to avoid UI freezes
// ────────────────────────────────────────────────────────────

// Self-contained parsing logic (no imports in worker context)
// We duplicate the timestamp logic here to avoid bundling issues
export { };

const TIMESTAMP_PATTERNS: {
    regex: RegExp;
    parse: (m: RegExpMatchArray) => Date | null;
}[] = [
        // Pattern A: "12/31/23, 9:41 PM" (US MM/DD/YY)
        {
            regex:
                /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?\s*-\s*/,
            parse: (m) => {
                const [, mo, d, y, h, mi, s, ampm] = m;
                return buildDate(int(mo), int(d), normY(y), to24(int(h), ampm), int(mi), s ? int(s) : 0);
            },
        },
        // Pattern B: "31.12.23, 21:41" (EU DD.MM.YY)
        {
            regex:
                /^(\d{1,2})\.(\d{1,2})\.(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?\s*-\s*/,
            parse: (m) => {
                const [, d, mo, y, h, mi, s, ampm] = m;
                return buildDate(int(mo), int(d), normY(y), to24(int(h), ampm), int(mi), s ? int(s) : 0);
            },
        },
        // Pattern C: "31/12/2023, 21:41" (EU DD/MM/YYYY 4-digit year)
        {
            regex:
                /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?\s*-\s*/,
            parse: (m) => {
                const [, d, mo, y, h, mi, s, ampm] = m;
                return buildDate(int(mo), int(d), normY(y), to24(int(h), ampm), int(mi), s ? int(s) : 0);
            },
        },
        // Pattern D: "[31/12/2023, 21:41:00]" (iOS bracket)
        {
            regex:
                /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?\]\s*/,
            parse: (m) => {
                const [, d, mo, y, h, mi, s, ampm] = m;
                return buildDate(int(mo), int(d), normY(y), to24(int(h), ampm), int(mi), s ? int(s) : 0);
            },
        },
        // Pattern E: "2023-12-31, 21:41" (ISO-ish)
        {
            regex:
                /^(\d{4})-(\d{1,2})-(\d{1,2}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?\s*-\s*/,
            parse: (m) => {
                const [, y, mo, d, h, mi, s, ampm] = m;
                return buildDate(int(mo), int(d), int(y), to24(int(h), ampm), int(mi), s ? int(s) : 0);
            },
        },
    ];

function int(s: string): number {
    return parseInt(s, 10);
}

function normY(y: string): number {
    const n = parseInt(y, 10);
    return n < 100 ? 2000 + n : n;
}

function to24(h: number, ampm?: string): number {
    if (!ampm) return h;
    const u = ampm.toUpperCase();
    if (u === "PM" && h < 12) return h + 12;
    if (u === "AM" && h === 12) return 0;
    return h;
}

function buildDate(month: number, day: number, year: number, hour: number, minute: number, second: number): Date | null {
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const d = new Date(year, month - 1, day, hour, minute, second);
    return isNaN(d.getTime()) ? null : d;
}

function formatDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// Combined quick-check regex
const LINE_START_REGEX = /^(?:\[?\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{2,4}[,\s])/;

function parseTimestamp(line: string): { date: Date | null; rest: string } {
    for (const { regex, parse } of TIMESTAMP_PATTERNS) {
        const m = line.match(regex);
        if (m) {
            return { date: parse(m), rest: line.slice(m[0].length) };
        }
    }
    return { date: null, rest: line };
}

// System message patterns
const SYSTEM_PATTERNS = [
    /messages and calls are end-to-end encrypted/i,
    /messages to this chat and calls are now secured/i,
    /created group/i,
    /added you/i,
    /changed the subject/i,
    /changed this group/i,
    /changed the group/i,
    /left$/i,
    /removed /i,
    /joined using this group/i,
    /security code changed/i,
    /your security code with .+ changed/i,
    /disappeared messages/i,
    /turned on disappearing messages/i,
    /turned off disappearing messages/i,
    /you were added/i,
    /waiting for this message/i,
    /this message was deleted/i,
    /you deleted this message/i,
    /missed .+ call/i,
];

function isSystemMessage(text: string): boolean {
    return SYSTEM_PATTERNS.some((p) => p.test(text));
}

// Attachment detection patterns
const ATTACHMENT_PATTERNS = [
    // "<attached: filename>"
    /<attached:\s*(.+?)>/i,
    // "filename (file attached)"
    /^(.+?)\s*\(file attached\)\s*$/i,
    // Standalone media filename (IMG-..., VID-..., AUD-..., STK-..., DOC-..., PTT-...)
    /^((?:IMG|VID|AUD|STK|DOC|PTT)-\d{8}-WA\d+\.\w+)\s*$/i,
    // Generic media reference
    /^(\S+\.(?:jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv|3gp|webm|mp3|ogg|opus|wav|m4a|aac|pdf|doc|docx|xls|xlsx|ppt|pptx|vcf|apk))\s*$/i,
];

function detectAttachment(text: string): string | null {
    for (const pattern of ATTACHMENT_PATTERNS) {
        const m = text.match(pattern);
        if (m) return m[1].trim();
    }
    return null;
}

// Extract sender from text after timestamp
function extractSender(rest: string): { sender: string | null; body: string } {
    // "Name: message" pattern
    const colonIdx = rest.indexOf(": ");
    if (colonIdx > 0 && colonIdx < 60) {
        const candidate = rest.slice(0, colonIdx).trim();
        // Sender names should not contain newlines or be too long
        if (candidate.length > 0 && candidate.length < 50 && !candidate.includes("\n")) {
            return { sender: candidate, body: rest.slice(colonIdx + 2) };
        }
    }
    // No sender found — might be a system message
    return { sender: null, body: rest };
}

interface RawMessage {
    id: string;
    datetime: number | null;
    dateKey: string;
    sender: string | null;
    direction: "in" | "out" | "unknown";
    kind: "text" | "system" | "attachment";
    text: string;
    attachment?: {
        filename: string;
        mime: string;
        size?: number;
        url?: string;
        missing?: boolean;
    };
    raw: string;
}

function guessMimeFromFilename(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const map: Record<string, string> = {
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
        webp: "image/webp", bmp: "image/bmp", svg: "image/svg+xml",
        mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo",
        mkv: "video/x-matroska", "3gp": "video/3gpp", webm: "video/webm",
        mp3: "audio/mpeg", ogg: "audio/ogg", opus: "audio/opus",
        wav: "audio/wav", m4a: "audio/mp4", aac: "audio/aac",
        pdf: "application/pdf", doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        vcf: "text/vcard", apk: "application/vnd.android.package-archive",
    };
    return map[ext] || "application/octet-stream";
}

// ── Main parse function ────────────────────────────────────

function parseChat(chatText: string, chatFileName: string): void {
    const lines = chatText.split(/\r?\n/);
    const total = lines.length;
    const messages: RawMessage[] = [];
    let currentMsg: RawMessage | null = null;
    const PROGRESS_INTERVAL = 2000;
    const participants = new Set<string>();

    for (let i = 0; i < total; i++) {
        const line = lines[i];

        // Progress update
        if (i > 0 && i % PROGRESS_INTERVAL === 0) {
            self.postMessage({
                type: "progress",
                percent: Math.round((i / total) * 100),
                linesProcessed: i,
                totalLines: total,
            });
        }

        // Skip empty lines (but append to multiline if we're in a message)
        if (line.trim() === "") {
            if (currentMsg) {
                currentMsg.text += "\n";
                currentMsg.raw += "\n";
            }
            continue;
        }

        // Check if line starts with a timestamp
        if (LINE_START_REGEX.test(line)) {
            const { date, rest } = parseTimestamp(line);

            if (date) {
                // Flush previous message
                if (currentMsg) {
                    messages.push(currentMsg);
                }

                const { sender, body } = extractSender(rest);
                const attachmentFile = detectAttachment(body.trim());
                const isSystem = !sender && isSystemMessage(body.trim());

                if (sender) participants.add(sender);

                const kind: "text" | "system" | "attachment" = attachmentFile
                    ? "attachment"
                    : isSystem
                        ? "system"
                        : "text";

                currentMsg = {
                    id: String(messages.length),
                    datetime: date.getTime(),
                    dateKey: formatDateKey(date),
                    sender,
                    direction: "unknown",
                    kind,
                    text: body.trim(),
                    raw: line,
                };

                if (attachmentFile) {
                    currentMsg.attachment = {
                        filename: attachmentFile,
                        mime: guessMimeFromFilename(attachmentFile),
                    };
                    // Keep any text that isn't the attachment marker as caption
                    let caption = body.trim();
                    for (const pattern of ATTACHMENT_PATTERNS) {
                        caption = caption.replace(pattern, "").trim();
                    }
                    if (caption) {
                        currentMsg.text = caption;
                    }
                }

                continue;
            }
        }

        // Multi-line continuation
        if (currentMsg) {
            currentMsg.text += "\n" + line;
            currentMsg.raw += "\n" + line;
        } else {
            // Orphan line before first timestamp — treat as system message
            messages.push({
                id: String(messages.length),
                datetime: null,
                dateKey: "",
                sender: null,
                direction: "unknown",
                kind: "system",
                text: line,
                raw: line,
            });
        }
    }

    // Flush last message
    if (currentMsg) {
        messages.push(currentMsg);
    }

    // ── Direction ──
    // We do NOT guess the exporter here. All personal messages default to "in".
    // The UI will let the user pick their own name so directions are set correctly.
    for (const msg of messages) {
        if (msg.sender === null) {
            msg.direction = "unknown"; // system messages
        } else {
            msg.direction = "in"; // default; UI will flip to "out" when user picks their name
        }
    }

    // Extract title from filename
    let title = chatFileName.replace(/\.txt$/i, "").trim();
    const titleMatch = title.match(/whatsapp\s+chat\s+with\s+(.+)/i);
    if (titleMatch) title = titleMatch[1].trim();
    if (!title) title = "WhatsApp Chat";

    // Final progress
    self.postMessage({
        type: "progress",
        percent: 100,
        linesProcessed: total,
        totalLines: total,
    });

    // Post result
    self.postMessage({
        type: "result",
        messages,
        title,
        participants: Array.from(participants),
    });
}

// ── Worker message handler ──────────────────────────────────

self.onmessage = (e: MessageEvent) => {
    try {
        const { chatText, chatFileName } = e.data;
        parseChat(chatText, chatFileName);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        self.postMessage({ type: "error", message: `Parsing failed: ${message}` });
    }
};

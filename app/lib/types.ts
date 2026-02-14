// ────────────────────────────────────────────────────────────
// Core data types for the WhatsApp chat viewer
// ────────────────────────────────────────────────────────────

/** A single parsed chat message */
export interface ChatMessage {
  /** Unique id (index-based) */
  id: string;
  /** Epoch ms timestamp, null if unparseable */
  datetime: number | null;
  /** YYYY-MM-DD string for grouping, empty if unknown */
  dateKey: string;
  /** Sender display name, null for system messages */
  sender: string | null;
  /** Direction of the message */
  direction: "in" | "out" | "unknown";
  /** Message kind */
  kind: "text" | "system" | "attachment";
  /** Message body text */
  text: string;
  /** Attachment info if kind === "attachment" */
  attachment?: Attachment;
  /** Original raw line(s) for debugging */
  raw: string;
}

/** Attachment metadata */
export interface Attachment {
  filename: string;
  mime: string;
  size?: number;
  /** Object URL for in-browser preview, undefined if not yet resolved */
  url?: string;
  /** True if the media file was not found in the archive */
  missing?: boolean;
}

/** Stats about the parsed chat */
export interface ChatStats {
  totalMessages: number;
  participants: string[];
  firstDate: string | null;
  lastDate: string | null;
  mediaCount: number;
}

/** A fully parsed chat archive */
export interface ChatArchive {
  chatId: string;
  title: string;
  participants: string[];
  messages: ChatMessage[];
  stats: ChatStats;
}

/** Entry in the media index: basename → blob info */
export interface MediaEntry {
  file: File | Blob;
  mime: string;
  size: number;
  objectURL: string;
}

/** Media index: maps basename to media entry */
export type MediaIndex = Map<string, MediaEntry>;

/** A flat-list file entry from ZIP or folder */
export interface FileEntry {
  /** Full path inside archive */
  path: string;
  /** Just the filename */
  name: string;
  /** The file blob */
  blob: Blob;
  /** Inferred MIME type */
  mime: string;
  /** Size in bytes */
  size: number;
}

/** Progress update from the parse worker */
export interface ParseProgress {
  type: "progress";
  /** 0-100 */
  percent: number;
  /** Lines processed so far */
  linesProcessed: number;
  /** Total lines */
  totalLines: number;
}

/** Final result from the parse worker */
export interface ParseResult {
  type: "result";
  messages: ChatMessage[];
  title: string;
  participants: string[];
}

/** Error from the parse worker */
export interface ParseError {
  type: "error";
  message: string;
}

/** Messages sent by the worker */
export type WorkerMessage = ParseProgress | ParseResult | ParseError;

/** Message sent TO the worker */
export interface WorkerInput {
  chatText: string;
  chatFileName: string;
}

/** Toast notification */
export interface Toast {
  id: string;
  message: string;
  type: "info" | "error" | "success";
}

/** Render row types for the virtualized list */
export type RenderRow =
  | { type: "date-divider"; dateKey: string; label: string }
  | { type: "message"; message: ChatMessage; index: number };

/** IndexedDB stored chat metadata */
export interface StoredChatMeta {
  chatId: string;
  title: string;
  participants: string[];
  messageCount: number;
  firstDate: string | null;
  lastDate: string | null;
  importedAt: number;
  textHash: string;
}

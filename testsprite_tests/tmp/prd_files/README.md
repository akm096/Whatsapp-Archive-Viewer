# WhatsApp Chat Viewer

A privacy-first, fully client-side web application that renders WhatsApp exported chat archives (ZIP or extracted folder) into a WhatsApp-like conversation viewer with media support.

## Project Summary

- **Privacy-first**: All processing happens in the browser. Nothing is uploaded to any server.
- **Multiple import methods**: ZIP file, folder picker, or drag-and-drop.
- **WhatsApp-like UI**: Familiar message bubbles with sender colors, timestamps, read receipts, and date separators.
- **Media support**: Inline images (with lightbox), video player, audio player, PDF viewer, and file download cards.
- **Large chat support**: Web Worker parsing + virtualized scrolling handles 100k+ messages smoothly.
- **Search**: Case-insensitive substring search with match navigation and highlighting.
- **Persistence**: IndexedDB caches parsed messages for quick reload (media requires re-import).

## Tech Stack

| Tool | Purpose |
|---|---|
| Next.js 14+ (App Router) | Framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Zustand | State management |
| @tanstack/react-virtual | Virtualized list rendering |
| JSZip | ZIP file reading |
| date-fns | Date formatting |
| idb | IndexedDB wrapper |
| Web Worker | Off-thread parsing |

## Run Instructions

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Manual Test Steps

### 1. Landing Page
- [ ] Open the app — see the landing page with WhatsApp branding
- [ ] Verify the privacy notice is visible
- [ ] Verify Import ZIP and Import Folder buttons are present
- [ ] Verify the drag-and-drop area is interactive (highlight on drag-over)

### 2. Import a ZIP
- [ ] Export a WhatsApp chat with media (WhatsApp → Chat → Export Chat → Include Media)
- [ ] Click "Import ZIP" and select the exported `.zip` file
- [ ] Verify parsing progress bar appears and reaches 100%
- [ ] Verify the viewer opens and messages are displayed

### 3. Import a Folder
- [ ] Extract a WhatsApp export ZIP to a folder
- [ ] Click "Import Folder" and select the extracted folder
- [ ] Verify messages load correctly

### 4. Drag and Drop
- [ ] Drag a `.zip` file onto the drop zone
- [ ] Verify it imports and loads

### 5. Message Rendering
- [ ] Verify date separators appear between different days
- [ ] Verify sender names display with different colors in group chats
- [ ] Verify timestamps appear on each bubble
- [ ] Verify sent messages (most active sender) align right with teal background
- [ ] Verify received messages align left with dark background
- [ ] Verify system messages appear centered and dimmed

### 6. Media / Attachments
- [ ] Verify images display as inline thumbnails
- [ ] Click an image — verify lightbox opens (press Escape or click outside to close)
- [ ] Verify videos play inline with HTML5 video controls
- [ ] Verify audio/voice notes show an audio player
- [ ] Verify PDFs show a card; clicking opens a viewer modal
- [ ] Verify missing media shows "Missing file" indicator
- [ ] Verify generic files show a file card with download button

### 7. Search
- [ ] Click the search icon in the header
- [ ] Type a word — verify match count updates
- [ ] Verify matched text is highlighted in yellow
- [ ] Press next/prev arrows — verify the list jumps to matches
- [ ] Clear search — verify highlights disappear

### 8. Performance (Large Chat)
- [ ] Import a chat with 10k+ messages
- [ ] Verify the parsing does not freeze the UI (progress bar animates)
- [ ] Verify scrolling through messages is smooth (virtualized)

### 9. Persistence
- [ ] After importing a chat, reload the page
- [ ] Verify the chat appears in "Recent Chats" on the landing page
- [ ] Click "Open" — verify messages load from cache
- [ ] Verify "Re-import media for full preview" toast appears
- [ ] Click the delete button on a recent chat — verify it's removed

## Parsing Notes & Assumptions

### Timestamp Formats Supported
| Format | Example |
|---|---|
| US (MM/DD/YY) | `12/31/23, 9:41 PM - Name: message` |
| EU (DD.MM.YY) | `31.12.23, 21:41 - Name: message` |
| EU slash (DD/MM/YYYY) | `31/12/2023, 21:41 - Name: message` |
| iOS bracket | `[31/12/2023, 21:41:00] Name: message` |
| ISO-ish | `2023-12-31, 21:41 - Name: message` |

### Assumptions
1. **Direction heuristic**: The most active sender is assumed to be the exporter (messages shown on the right). This is a best-effort heuristic — in some chats it may be wrong.
2. **Multi-line messages**: Lines not starting with a recognized timestamp are appended to the previous message.
3. **Attachment detection**: Recognizes `<attached: filename>`, `filename (file attached)`, and standalone media filenames (IMG-*, VID-*, AUD-*, etc.).
4. **System messages**: Detected via keyword patterns (e.g., "end-to-end encrypted", "created group", etc.).
5. **Sender extraction**: The sender name is extracted as text before the first `: ` (colon-space) after the timestamp. Names longer than 50 characters are treated as part of the message body.
6. **Chat file detection**: The importer looks for `.txt` files, preferring `_chat.txt`, `chat.txt`, or files starting with "WhatsApp Chat with".
7. **Media matching**: Media files are matched to attachments by base filename (case-insensitive). If an attachment references a file not found in the archive, it shows as "Missing file".
8. **IndexedDB persistence**: Only parsed message JSON and metadata are stored. Raw media blobs are NOT persisted — you need to re-import the ZIP/folder to view media after a page reload.

## Known Limitations

- **Direction detection** may be incorrect for chats where the other person sent more messages than you.
- **PDF viewer** uses an iframe which depends on browser PDF support. Chrome and Edge work well; other browsers may download instead of preview.
- **Folder import** uses `webkitdirectory` which is not supported in all browsers (Chrome, Edge, Firefox support it; Safari has limited support).
- **Encrypted media** (WhatsApp export without "Include Media" option) obviously cannot be previewed.
- **Very large chats** (500k+ messages) may take significant time during parsing, but the UI remains responsive.

## Project Structure

```
app/
├── page.tsx              # Main page (landing + viewer)
├── layout.tsx            # Root layout
├── globals.css           # Global styles
├── components/
│   ├── ImportDropzone.tsx # Import UI (ZIP, folder, drag-drop)
│   ├── ChatLayout.tsx    # Chat viewer layout (header + messages)
│   ├── MessageList.tsx   # Virtualized message list
│   ├── MessageBubble.tsx # Individual message bubble
│   ├── AttachmentCard.tsx# Media/file attachment renderer
│   ├── LightboxModal.tsx # Full-screen image viewer
│   ├── PdfViewerModal.tsx# PDF viewer modal
│   ├── SearchBar.tsx     # Search input with navigation
│   └── Toasts.tsx        # Toast notifications
├── state/
│   └── useChatStore.ts   # Zustand state store
├── lib/
│   ├── types.ts          # TypeScript type definitions
│   ├── dateParse.ts      # Date parsing helpers
│   ├── chatDetect.ts     # Chat file auto-detection
│   ├── chatParser.ts     # Worker wrapper
│   ├── zip.ts            # ZIP file reader
│   ├── folder.ts         # Folder reader
│   ├── mediaIndex.ts     # Media index builder
│   ├── idb.ts            # IndexedDB persistence
│   └── mockChat.ts       # Mock data generator
└── workers/
    └── parseWorker.ts    # Web Worker for parsing
```

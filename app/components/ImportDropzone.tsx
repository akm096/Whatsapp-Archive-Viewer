"use client";
// ────────────────────────────────────────────────────────────
// Import dropzone — ZIP, folder, drag-and-drop import
// ────────────────────────────────────────────────────────────
import React, { useCallback, useRef, useState } from "react";
import { useChatStore } from "../state/useChatStore";
import { readZip } from "../lib/zip";
import { readFolder } from "../lib/folder";
import { detectChatFile } from "../lib/chatDetect";
import { buildMediaIndex, revokeMediaIndex } from "../lib/mediaIndex";
import { parseChatInWorker } from "../lib/chatParser";
import { saveChat, hashText } from "../lib/idb";
import { FileEntry, StoredChatMeta } from "../lib/types";

export default function ImportDropzone() {
    const {
        setMessages,
        setMediaIndex,
        setIsParsing,
        setParseProgress,
        addToast,
        setViewMode,
        mediaIndex: currentMediaIndex,
    } = useChatStore();

    const [isDragOver, setIsDragOver] = useState(false);
    const zipInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback(
        async (files: FileEntry[]) => {
            // 1. Detect chat file
            const chatFile = detectChatFile(files);
            if (!chatFile) {
                addToast("No chat text file found in the archive", "error");
                setIsParsing(false);
                return;
            }

            // 2. Read chat text
            const chatText = await chatFile.blob.text();
            if (!chatText.trim()) {
                addToast("Chat file is empty", "error");
                setIsParsing(false);
                return;
            }

            // 3. Build media index
            // Revoke previous object URLs
            if (currentMediaIndex.size > 0) {
                revokeMediaIndex(currentMediaIndex);
            }
            const newMediaIndex = buildMediaIndex(files);
            setMediaIndex(newMediaIndex);

            // 4. Parse in worker
            setIsParsing(true);
            setParseProgress(null);

            parseChatInWorker(chatText, chatFile.name, {
                onProgress: (progress) => {
                    setParseProgress(progress);
                },
                onResult: async ({ messages, title, participants }) => {
                    setMessages(messages, title, participants);
                    setIsParsing(false);
                    setParseProgress(null);

                    // Save to IndexedDB
                    try {
                        const textHash = await hashText(chatText);
                        const chatId = `chat-${textHash.slice(0, 12)}`;
                        const meta: StoredChatMeta = {
                            chatId,
                            title,
                            participants,
                            messageCount: messages.length,
                            firstDate: messages[0]?.dateKey || null,
                            lastDate: messages[messages.length - 1]?.dateKey || null,
                            importedAt: Date.now(),
                            textHash,
                        };
                        await saveChat(meta, messages);
                    } catch {
                        // Non-critical — don't block the user
                    }

                    addToast(
                        `Loaded ${messages.length.toLocaleString()} messages`,
                        "success"
                    );
                    setViewMode("viewer");
                },
                onError: (error) => {
                    addToast(error, "error");
                    setIsParsing(false);
                    setParseProgress(null);
                },
            });
        },
        [
            setMessages,
            setMediaIndex,
            setIsParsing,
            setParseProgress,
            addToast,
            setViewMode,
            currentMediaIndex,
        ]
    );

    const handleZipFile = useCallback(
        async (file: File) => {
            setIsParsing(true);
            try {
                const files = await readZip(file);
                await processFiles(files);
            } catch (err) {
                addToast(
                    `Failed to read ZIP: ${err instanceof Error ? err.message : "Unknown error"}`,
                    "error"
                );
                setIsParsing(false);
            }
        },
        [processFiles, addToast, setIsParsing]
    );

    const handleFolderFiles = useCallback(
        async (fileList: FileList) => {
            setIsParsing(true);
            try {
                const files = readFolder(fileList);
                await processFiles(files);
            } catch (err) {
                addToast(
                    `Failed to read folder: ${err instanceof Error ? err.message : "Unknown error"}`,
                    "error"
                );
                setIsParsing(false);
            }
        },
        [processFiles, addToast, setIsParsing]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);

            const file = e.dataTransfer.files[0];
            if (!file) return;

            if (
                file.name.toLowerCase().endsWith(".zip") ||
                file.type === "application/zip"
            ) {
                handleZipFile(file);
            } else {
                addToast("Please drop a .zip file", "error");
            }
        },
        [handleZipFile, addToast]
    );

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Drag & drop zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer ${isDragOver
                        ? "border-[#00a884] bg-[#00a884]/10 scale-[1.02]"
                        : "border-[#374045] bg-[#111b21]/50 hover:border-[#00a884]/50"
                    }`}
                onClick={() => zipInputRef.current?.click()}
            >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00a884]/10 flex items-center justify-center">
                    <svg
                        className="w-8 h-8 text-[#00a884]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                </div>
                <p className="text-[#d1d7db] font-medium mb-1">
                    Drop your WhatsApp export ZIP here
                </p>
                <p className="text-[#8696a0] text-sm">or click to browse</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-4">
                <button
                    onClick={() => zipInputRef.current?.click()}
                    className="flex-1 py-3 px-4 bg-[#00a884] text-white rounded-xl font-medium hover:bg-[#00a884]/90 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Import ZIP
                </button>
                <button
                    onClick={() => folderInputRef.current?.click()}
                    className="flex-1 py-3 px-4 bg-[#202c33] text-[#d1d7db] rounded-xl font-medium hover:bg-[#2a3942] transition-colors flex items-center justify-center gap-2 border border-[#374045]"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Import Folder
                </button>
            </div>

            {/* Hidden file inputs */}
            <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleZipFile(file);
                    e.target.value = "";
                }}
            />
            <input
                ref={folderInputRef}
                type="file"
                // @ts-expect-error — webkitdirectory is non-standard but widely supported
                webkitdirectory=""
                multiple
                className="hidden"
                onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) handleFolderFiles(files);
                    e.target.value = "";
                }}
            />
        </div>
    );
}

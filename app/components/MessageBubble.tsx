"use client";
// ────────────────────────────────────────────────────────────
// Message bubble — single message with sender, time, text
// ────────────────────────────────────────────────────────────
import React, { useMemo } from "react";
import { ChatMessage } from "../lib/types";
import { resolveMedia } from "../lib/mediaIndex";
import { useChatStore } from "../state/useChatStore";
import AttachmentCard from "./AttachmentCard";

interface MessageBubbleProps {
    message: ChatMessage;
    highlight?: boolean;
}

export default function MessageBubble({ message, highlight }: MessageBubbleProps) {
    const mediaIndex = useChatStore((s) => s.mediaIndex);
    const searchQuery = useChatStore((s) => s.searchQuery);
    const participants = useChatStore((s) => s.participants);

    const media = useMemo(() => {
        if (message.attachment) {
            return resolveMedia(mediaIndex, message.attachment.filename);
        }
        return null;
    }, [message.attachment, mediaIndex]);

    // System messages
    if (message.kind === "system") {
        return (
            <div className="flex justify-center my-1 px-4">
                <div className="bg-[#182229] text-[#8696a0] text-xs px-3 py-1.5 rounded-lg max-w-[85%] text-center shadow-sm">
                    {message.text}
                </div>
            </div>
        );
    }

    const isOut = message.direction === "out";
    const isGroup = participants.length > 2;

    // Format time
    const timeStr = message.datetime
        ? new Date(message.datetime).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })
        : "";

    // Highlight search matches in text
    const renderText = (text: string) => {
        if (!searchQuery) return text;
        const lower = text.toLowerCase();
        const queryLower = searchQuery.toLowerCase();
        const parts: React.ReactNode[] = [];
        let lastIdx = 0;
        let idx = lower.indexOf(queryLower);
        let key = 0;

        while (idx !== -1) {
            if (idx > lastIdx) {
                parts.push(text.slice(lastIdx, idx));
            }
            parts.push(
                <mark key={key++} className="bg-yellow-400/40 text-inherit rounded px-0.5">
                    {text.slice(idx, idx + searchQuery.length)}
                </mark>
            );
            lastIdx = idx + searchQuery.length;
            idx = lower.indexOf(queryLower, lastIdx);
        }

        if (lastIdx < text.length) {
            parts.push(text.slice(lastIdx));
        }

        return parts.length > 0 ? parts : text;
    };

    // Sender color for group chats
    const senderColors = [
        "#e06c75",
        "#e5c07b",
        "#61afef",
        "#c678dd",
        "#56b6c2",
        "#98c379",
        "#d19a66",
        "#ff6b81",
        "#7bed9f",
        "#70a1ff",
    ];

    const senderColor = message.sender
        ? senderColors[
        Math.abs(
            message.sender.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
        ) % senderColors.length
        ]
        : "#d1d7db";

    return (
        <div
            className={`flex px-[6%] my-[1px] ${isOut ? "justify-end" : "justify-start"
                } ${highlight ? "bg-[#00a884]/10" : ""}`}
        >
            <div
                className={`relative max-w-[65%] min-w-[120px] rounded-lg px-2.5 py-1 pb-4 shadow-sm ${isOut
                        ? "bg-[#005c4b] rounded-tr-none"
                        : "bg-[#202c33] rounded-tl-none"
                    }`}
            >
                {/* Sender name (group chats) */}
                {isGroup && message.sender && message.direction === "in" && (
                    <div
                        className="text-[13px] font-medium mb-0.5 leading-tight"
                        style={{ color: senderColor }}
                    >
                        {message.sender}
                    </div>
                )}

                {/* Attachment */}
                {message.kind === "attachment" && message.attachment && (
                    <AttachmentCard
                        attachment={{
                            ...message.attachment,
                            url: media?.objectURL,
                            missing: !media,
                            size: media?.size,
                        }}
                        media={media}
                    />
                )}

                {/* Text body */}
                {message.text &&
                    !(
                        message.kind === "attachment" &&
                        (message.text.startsWith("<attached:") ||
                            message.text.match(
                                /^(IMG|VID|AUD|STK|DOC|PTT)-\d+-WA\d+\.\w+$/
                            ))
                    ) && (
                        <div className="text-[#e9edef] text-[14.2px] leading-[19px] break-words whitespace-pre-wrap">
                            {renderText(message.text)}
                        </div>
                    )}

                {/* Timestamp */}
                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                    <span className="text-[11px] text-[#ffffff99] leading-none">
                        {timeStr}
                    </span>
                    {isOut && (
                        <svg
                            className="w-4 h-3 text-[#53bdeb]"
                            viewBox="0 0 16 11"
                            fill="currentColor"
                        >
                            <path d="M11.071.653a.457.457 0 00-.304-.102.493.493 0 00-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 00-.66.003.423.423 0 00.003.612l2.356 2.456a.469.469 0 00.66-.003l6.544-8.076a.417.417 0 00-.017-.609z" />
                            <path d="M14.757.653a.457.457 0 00-.305-.102.493.493 0 00-.38.178l-6.19 7.636-1.186-1.235a.463.463 0 00-.66.003.423.423 0 00.003.612l1.52 1.584a.469.469 0 00.66-.003L14.774 1.26a.417.417 0 00-.017-.609z" />
                        </svg>
                    )}
                </div>
            </div>
        </div>
    );
}

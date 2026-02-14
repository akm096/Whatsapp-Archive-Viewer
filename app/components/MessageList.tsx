"use client";
// ────────────────────────────────────────────────────────────
// Virtualized message list using @tanstack/react-virtual
// ────────────────────────────────────────────────────────────
import React, { useRef, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useChatStore } from "../state/useChatStore";
import MessageBubble from "./MessageBubble";

export default function MessageList() {
    const renderRows = useChatStore((s) => s.renderRows);
    const searchResults = useChatStore((s) => s.searchResults);
    const searchCurrentIdx = useChatStore((s) => s.searchCurrentIdx);

    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: renderRows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => {
            const row = renderRows[index];
            if (row.type === "date-divider") return 36;
            // Rough estimate based on message content
            const msg = row.message;
            if (msg.kind === "system") return 32;
            if (msg.kind === "attachment") return 200;
            const lineCount = Math.ceil((msg.text?.length || 0) / 50);
            return Math.max(52, 36 + lineCount * 20);
        },
        overscan: 5,
    });

    // Auto-scroll to bottom on initial load
    const hasScrolled = useRef(false);
    useEffect(() => {
        if (renderRows.length > 0 && !hasScrolled.current) {
            hasScrolled.current = true;
            setTimeout(() => {
                virtualizer.scrollToIndex(renderRows.length - 1, { align: "end" });
            }, 100);
        }
    }, [renderRows.length, virtualizer]);

    // Jump to search result
    const handleJumpToSearch = useCallback(() => {
        if (searchCurrentIdx >= 0 && searchResults.length > 0) {
            const targetMsgIdx = searchResults[searchCurrentIdx];
            // Find the render row index for this message
            const rowIdx = renderRows.findIndex(
                (r) => r.type === "message" && r.index === targetMsgIdx
            );
            if (rowIdx >= 0) {
                virtualizer.scrollToIndex(rowIdx, { align: "center" });
            }
        }
    }, [searchCurrentIdx, searchResults, renderRows, virtualizer]);

    useEffect(() => {
        handleJumpToSearch();
    }, [handleJumpToSearch]);

    const highlightedMsgIdx =
        searchCurrentIdx >= 0 ? searchResults[searchCurrentIdx] : -1;

    return (
        <div
            ref={parentRef}
            className="flex-1 overflow-y-auto"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: "#0b141a",
            }}
        >
            <div
                className="relative w-full"
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                }}
            >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                    const row = renderRows[virtualRow.index];

                    return (
                        <div
                            key={virtualRow.index}
                            ref={virtualizer.measureElement}
                            data-index={virtualRow.index}
                            className="absolute top-0 left-0 w-full"
                            style={{
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            {row.type === "date-divider" ? (
                                <div className="flex justify-center py-2">
                                    <div className="bg-[#182229] text-[#8696a0] text-xs px-3 py-1.5 rounded-lg shadow-sm font-medium">
                                        {row.label}
                                    </div>
                                </div>
                            ) : (
                                <MessageBubble
                                    message={row.message}
                                    highlight={
                                        row.index === highlightedMsgIdx
                                    }
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

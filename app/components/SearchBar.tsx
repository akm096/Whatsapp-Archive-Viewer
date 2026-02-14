"use client";
// ────────────────────────────────────────────────────────────
// Search bar component
// ────────────────────────────────────────────────────────────
import React from "react";
import { useChatStore } from "../state/useChatStore";

export default function SearchBar() {
    const searchQuery = useChatStore((s) => s.searchQuery);
    const setSearchQuery = useChatStore((s) => s.setSearchQuery);
    const searchResults = useChatStore((s) => s.searchResults);
    const searchCurrentIdx = useChatStore((s) => s.searchCurrentIdx);
    const nextSearchResult = useChatStore((s) => s.nextSearchResult);
    const prevSearchResult = useChatStore((s) => s.prevSearchResult);

    return (
        <div className="flex items-center gap-2 bg-[#202c33] rounded-lg px-3 py-1.5">
            <svg
                className="w-4 h-4 text-[#8696a0] shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="bg-transparent text-[#d1d7db] text-sm outline-none placeholder-[#8696a0] flex-1 min-w-0"
            />
            {searchQuery && (
                <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-[#8696a0]">
                        {searchResults.length > 0
                            ? `${searchCurrentIdx + 1}/${searchResults.length}`
                            : "0/0"}
                    </span>
                    <button
                        onClick={prevSearchResult}
                        className="p-0.5 text-[#8696a0] hover:text-[#d1d7db]"
                        title="Previous"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={nextSearchResult}
                        className="p-0.5 text-[#8696a0] hover:text-[#d1d7db]"
                        title="Next"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setSearchQuery("")}
                        className="p-0.5 text-[#8696a0] hover:text-[#d1d7db]"
                        title="Clear"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}

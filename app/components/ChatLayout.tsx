"use client";
// ────────────────────────────────────────────────────────────
// Chat layout — main viewer with header + messages + search
// Includes "I am" participant selector for direction assignment
// ────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { useChatStore } from "../state/useChatStore";
import MessageList from "./MessageList";
import SearchBar from "./SearchBar";

export default function ChatLayout() {
    const title = useChatStore((s) => s.title);
    const participants = useChatStore((s) => s.participants);
    const messages = useChatStore((s) => s.messages);
    const mySender = useChatStore((s) => s.mySender);
    const setMySender = useChatStore((s) => s.setMySender);
    const setViewMode = useChatStore((s) => s.setViewMode);
    const reset = useChatStore((s) => s.reset);

    const [searchOpen, setSearchOpen] = useState(false);
    const [selectorOpen, setSelectorOpen] = useState(false);

    const stats = messages.length;

    const handleBack = () => {
        reset();
        setViewMode("landing");
    };

    const handleSelectSender = (name: string) => {
        setMySender(name);
        setSelectorOpen(false);
    };

    return (
        <div className="flex flex-col h-full bg-[#0b141a]">
            {/* Chat header */}
            <div className="bg-[#202c33] px-4 py-2 flex items-center gap-3 shadow-sm z-10">
                {/* Back button */}
                <button
                    onClick={handleBack}
                    className="p-1.5 text-[#8696a0] hover:text-[#d1d7db] hover:bg-[#374045] rounded-full transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#374045] flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-[#8696a0]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                </div>

                {/* Chat info */}
                <div className="flex-1 min-w-0">
                    <h1 className="text-[#e9edef] font-medium text-base truncate">
                        {title || "WhatsApp Chat"}
                    </h1>
                    <p className="text-[#8696a0] text-xs truncate">
                        {`${stats.toLocaleString()} messages`}
                    </p>
                </div>

                {/* "I am" selector */}
                {participants.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => setSelectorOpen(!selectorOpen)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${mySender
                                    ? "bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30"
                                    : "bg-[#374045] text-[#d1d7db] border border-[#374045] hover:border-[#00a884]/50"
                                }`}
                            title="Select your name to show your messages on the right"
                        >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            {mySender ? mySender : "I am..."}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown */}
                        {selectorOpen && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-20"
                                    onClick={() => setSelectorOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 z-30 bg-[#233138] rounded-lg shadow-xl border border-[#374045] py-1 min-w-[180px] max-h-[300px] overflow-y-auto">
                                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#8696a0] font-semibold">
                                        Select your name
                                    </div>
                                    {participants.map((name) => (
                                        <button
                                            key={name}
                                            onClick={() => handleSelectSender(name)}
                                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${mySender === name
                                                    ? "bg-[#00a884]/15 text-[#00a884]"
                                                    : "text-[#d1d7db] hover:bg-[#2a3942]"
                                                }`}
                                        >
                                            {mySender === name && (
                                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            <span className="truncate">{name}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Search toggle */}
                <button
                    onClick={() => setSearchOpen(!searchOpen)}
                    className={`p-2 rounded-full transition-colors ${searchOpen
                        ? "text-[#00a884] bg-[#00a884]/10"
                        : "text-[#8696a0] hover:text-[#d1d7db] hover:bg-[#374045]"
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </div>

            {/* Sender selection hint */}
            {!mySender && participants.length > 0 && (
                <div className="bg-[#182229] px-4 py-2 text-center border-b border-[#374045]">
                    <p className="text-xs text-[#8696a0]">
                        👆 Click <strong className="text-[#00a884]">&quot;I am...&quot;</strong> above to select your name and see your messages on the right side
                    </p>
                </div>
            )}

            {/* Search panel */}
            {searchOpen && (
                <div className="bg-[#111b21] px-4 py-2 border-b border-[#374045]">
                    <SearchBar />
                </div>
            )}

            {/* Messages */}
            {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-[#8696a0]">No messages to display</p>
                </div>
            ) : (
                <MessageList />
            )}
        </div>
    );
}

"use client";
// ────────────────────────────────────────────────────────────
// Toast notification system
// ────────────────────────────────────────────────────────────
import React from "react";
import { useChatStore } from "../state/useChatStore";

export default function Toasts() {
    const toasts = useChatStore((s) => s.toasts);
    const removeToast = useChatStore((s) => s.removeToast);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-in ${toast.type === "error"
                            ? "bg-red-600 text-white"
                            : toast.type === "success"
                                ? "bg-emerald-600 text-white"
                                : "bg-[#00a884] text-white"
                        }`}
                >
                    <span className="flex-1">{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-2 text-white/70 hover:text-white text-lg leading-none"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}

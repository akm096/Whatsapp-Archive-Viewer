"use client";
// ────────────────────────────────────────────────────────────
// Lightbox modal for full-screen image viewing
// ────────────────────────────────────────────────────────────
import React, { useEffect, useCallback } from "react";
import { useChatStore } from "../state/useChatStore";

export default function LightboxModal() {
    const lightboxUrl = useChatStore((s) => s.lightboxUrl);
    const setLightboxUrl = useChatStore((s) => s.setLightboxUrl);

    const close = useCallback(() => setLightboxUrl(null), [setLightboxUrl]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        if (lightboxUrl) {
            window.addEventListener("keydown", handler);
            return () => window.removeEventListener("keydown", handler);
        }
    }, [lightboxUrl, close]);

    if (!lightboxUrl) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={close}
        >
            <button
                onClick={close}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={lightboxUrl}
                alt="Full size"
                className="max-w-[90vw] max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

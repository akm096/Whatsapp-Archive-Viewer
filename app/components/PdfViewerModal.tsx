"use client";
// ────────────────────────────────────────────────────────────
// PDF viewer modal — renders PDFs using an iframe (simple)
// For full pdf.js integration, we'd need canvas rendering,
// but iframe with object URL works well for MVP.
// ────────────────────────────────────────────────────────────
import React, { useEffect, useCallback } from "react";
import { useChatStore } from "../state/useChatStore";

export default function PdfViewerModal() {
    const pdfUrl = useChatStore((s) => s.pdfUrl);
    const setPdfUrl = useChatStore((s) => s.setPdfUrl);

    const close = useCallback(() => setPdfUrl(null), [setPdfUrl]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        if (pdfUrl) {
            window.addEventListener("keydown", handler);
            return () => window.removeEventListener("keydown", handler);
        }
    }, [pdfUrl, close]);

    if (!pdfUrl) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">PDF Viewer</h3>
                <div className="flex items-center gap-2">
                    <a
                        href={pdfUrl}
                        download
                        className="px-3 py-1.5 bg-[#00a884] text-white text-sm rounded-lg hover:bg-[#00a884]/80 transition-colors"
                    >
                        Download
                    </a>
                    <button
                        onClick={close}
                        className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
            {/* PDF iframe */}
            <div className="w-full max-w-4xl flex-1 min-h-0 bg-white rounded-lg overflow-hidden">
                <iframe
                    src={pdfUrl}
                    className="w-full h-full"
                    title="PDF Viewer"
                    style={{ minHeight: "70vh" }}
                />
            </div>
        </div>
    );
}

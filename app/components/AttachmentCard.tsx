"use client";
// ────────────────────────────────────────────────────────────
// Attachment card — renders inline previews for media files
// ────────────────────────────────────────────────────────────
import React from "react";
import { Attachment, MediaEntry } from "../lib/types";
import { getMediaCategory, formatFileSize } from "../lib/mediaIndex";
import { useChatStore } from "../state/useChatStore";

interface AttachmentCardProps {
    attachment: Attachment;
    media: MediaEntry | null;
}

export default function AttachmentCard({
    attachment,
    media,
}: AttachmentCardProps) {
    const setLightboxUrl = useChatStore((s) => s.setLightboxUrl);
    const setPdfUrl = useChatStore((s) => s.setPdfUrl);

    const isMissing = attachment.missing || !media;
    const category = getMediaCategory(attachment.mime);
    const url = media?.objectURL;

    if (isMissing) {
        return (
            <div className="flex items-center gap-3 bg-[#1d2a30] rounded-lg p-3 mt-1">
                <div className="w-10 h-10 rounded-lg bg-[#374045] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5C2.57 17.333 3.53 19 5.07 19z" />
                    </svg>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#8696a0] truncate">{attachment.filename}</p>
                    <p className="text-xs text-[#8696a0]/60">Missing file</p>
                </div>
            </div>
        );
    }

    // Image
    if (category === "image" && url) {
        return (
            <div
                className="mt-1 cursor-pointer rounded-lg overflow-hidden max-w-[300px]"
                onClick={() => setLightboxUrl(url)}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={url}
                    alt={attachment.filename}
                    className="w-full h-auto max-h-[300px] object-cover"
                    loading="lazy"
                />
            </div>
        );
    }

    // Video
    if (category === "video" && url) {
        return (
            <div className="mt-1 rounded-lg overflow-hidden max-w-[300px]">
                <video
                    src={url}
                    controls
                    preload="metadata"
                    className="w-full max-h-[300px]"
                />
            </div>
        );
    }

    // Audio
    if (category === "audio" && url) {
        return (
            <div className="mt-1 flex items-center gap-2 bg-[#1d2a30] rounded-lg p-2">
                <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                </div>
                <audio src={url} controls preload="metadata" className="flex-1 h-8" />
            </div>
        );
    }

    // PDF
    if (category === "pdf" && url) {
        return (
            <div
                className="mt-1 flex items-center gap-3 bg-[#1d2a30] rounded-lg p-3 cursor-pointer hover:bg-[#233138] transition-colors"
                onClick={() => setPdfUrl(url)}
            >
                <div className="w-10 h-10 rounded-lg bg-red-700/30 flex items-center justify-center shrink-0">
                    <span className="text-red-400 text-xs font-bold">PDF</span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#d1d7db] truncate">{attachment.filename}</p>
                    {media && (
                        <p className="text-xs text-[#8696a0]">{formatFileSize(media.size)}</p>
                    )}
                </div>
                <svg className="w-5 h-5 text-[#8696a0] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            </div>
        );
    }

    // Generic file
    return (
        <div className="mt-1 flex items-center gap-3 bg-[#1d2a30] rounded-lg p-3">
            <div className="w-10 h-10 rounded-lg bg-[#374045] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm text-[#d1d7db] truncate">{attachment.filename}</p>
                {media && (
                    <p className="text-xs text-[#8696a0]">{formatFileSize(media.size)}</p>
                )}
            </div>
            {url && (
                <a
                    href={url}
                    download={attachment.filename}
                    className="p-1.5 text-[#00a884] hover:bg-[#00a884]/10 rounded-full transition-colors shrink-0"
                    title="Download"
                    onClick={(e) => e.stopPropagation()}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </a>
            )}
        </div>
    );
}

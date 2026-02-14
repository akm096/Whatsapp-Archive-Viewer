// ────────────────────────────────────────────────────────────
// Main-thread wrapper for the parse worker
// ────────────────────────────────────────────────────────────
import { ChatMessage, ParseProgress, ParseResult, ParseError, WorkerMessage } from "./types";

interface ParseCallbacks {
    onProgress: (progress: ParseProgress) => void;
    onResult: (result: { messages: ChatMessage[]; title: string; participants: string[] }) => void;
    onError: (error: string) => void;
}

/**
 * Parse chat text using a Web Worker.
 * Returns a cleanup function to terminate the worker.
 */
export function parseChatInWorker(
    chatText: string,
    chatFileName: string,
    callbacks: ParseCallbacks
): () => void {
    const worker = new Worker(
        new URL("../workers/parseWorker.ts", import.meta.url)
    );

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const msg = e.data;
        switch (msg.type) {
            case "progress":
                callbacks.onProgress(msg as ParseProgress);
                break;
            case "result": {
                const result = msg as ParseResult;
                callbacks.onResult({
                    messages: result.messages,
                    title: result.title,
                    participants: result.participants,
                });
                worker.terminate();
                break;
            }
            case "error": {
                callbacks.onError((msg as ParseError).message);
                worker.terminate();
                break;
            }
        }
    };

    worker.onerror = (e) => {
        callbacks.onError(`Worker error: ${e.message}`);
        worker.terminate();
    };

    worker.postMessage({ chatText, chatFileName });

    return () => worker.terminate();
}

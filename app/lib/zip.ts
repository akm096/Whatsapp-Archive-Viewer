// ────────────────────────────────────────────────────────────
// ZIP file reader — extracts all files from a WhatsApp ZIP
// ────────────────────────────────────────────────────────────
import JSZip from "jszip";
import { FileEntry } from "./types";
import { guessMime } from "./mediaIndex";

/**
 * Read a ZIP file and return a flat list of FileEntry objects.
 */
export async function readZip(file: File): Promise<FileEntry[]> {
    const zip = await JSZip.loadAsync(file);
    const entries: FileEntry[] = [];

    const promises: Promise<void>[] = [];

    zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;

        const promise = zipEntry.async("blob").then((blob) => {
            const name = basename(relativePath);
            const mime = guessMime(name);
            entries.push({
                path: relativePath,
                name,
                blob,
                mime,
                size: blob.size,
            });
        });

        promises.push(promise);
    });

    await Promise.all(promises);
    return entries;
}

function basename(path: string): string {
    const parts = path.split("/");
    return parts[parts.length - 1] || path;
}

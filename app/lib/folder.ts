// ────────────────────────────────────────────────────────────
// Folder reader — reads files from a directory picker FileList
// ────────────────────────────────────────────────────────────
import { FileEntry } from "./types";
import { guessMime } from "./mediaIndex";

/**
 * Convert a FileList (from directory picker / multiple file input) to FileEntry[].
 */
export function readFolder(fileList: FileList): FileEntry[] {
    const entries: FileEntry[] = [];

    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        // webkitRelativePath gives us the relative path from the selected directory
        const path =
            (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
            file.name;
        const name = file.name;
        const mime = guessMime(name) || file.type || "application/octet-stream";

        entries.push({
            path,
            name,
            blob: file,
            mime,
            size: file.size,
        });
    }

    return entries;
}

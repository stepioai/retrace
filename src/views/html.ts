import { flags } from "../flags";

export function esc(s: unknown): string {
    return String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * id + data-testid for an element, or nothing when STABLE_IDS is off. With
 * them off Retrace's recorded ids stop matching and it has to fall back to
 * role, text, position and finally to asking which element does the job.
 */
export function ids(name: string): string {
    return flags.stableIds ? `id="${name}" data-testid="${name}"` : "";
}

/** Class names change with STABLE_IDS too, so a recorded css path breaks. */
export function cls(stable: string, changed: string): string {
    return flags.stableIds ? stable : changed;
}

import { applyRemote } from "./flags";

/**
 * Settings edited by hand in Stepio's feature_flags table, read through the
 * public API endpoint in FLAGS_URL, e.g.
 *   https://<dev-api>/v1/feature-flags/retrace-test-app
 * The row's value uses env var names ({"UI_VERSION": "v3"}) and wins over
 * the real env vars. Without FLAGS_URL the app runs on env vars alone.
 *
 * Every Vercel instance reads it on its own, so they all agree within a few
 * seconds of an edit; no shared store is needed.
 */
const FLAGS_URL = process.env.FLAGS_URL;
// How long an instance trusts its last read.
const CACHE_MS = 3000;
const TIMEOUT_MS = 3000;

let readAt = 0;
let last: { values: Record<string, unknown>; updatedAt: string | null; error: string | null } = {
    values: {},
    updatedAt: null,
    error: null,
};

export const usesRemoteFlags = Boolean(FLAGS_URL);

/** Applies the remote row to the flags, at most once per CACHE_MS. */
export async function refreshFlags(): Promise<void> {
    if (!FLAGS_URL || Date.now() - readAt < CACHE_MS) return;
    readAt = Date.now();
    try {
        const res = await fetch(FLAGS_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { value?: Record<string, unknown>; updated_at?: string };
        last = { values: body.value ?? {}, updatedAt: body.updated_at ?? null, error: null };
    } catch (err) {
        // Keep serving the last known settings; a slow API shouldn't break the app.
        last = { ...last, error: String(err) };
        console.warn(`Could not read ${FLAGS_URL}: ${err}`);
    }
    applyRemote(last.values);
}

/** For /flags: where the settings came from. */
export function remoteStatus() {
    return { url: FLAGS_URL ?? null, values: last.values, updated_at: last.updatedAt, error: last.error };
}

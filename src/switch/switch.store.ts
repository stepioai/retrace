import { applySwitch, type Switch } from "../flags";

/**
 * Where the /switch choice lives. On Vercel every serverless instance has its
 * own memory, so the choice has to sit in a shared store: Upstash Redis over
 * its REST API (the Vercel integration sets these env vars). Without them,
 * e.g. a local run or a single Cloud Run instance, memory is enough.
 */
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const KEY = "retrace-test-app:switch";
// How long an instance trusts its last read. Short, so a switch shows up on
// every instance within a couple of seconds.
const CACHE_MS = 2000;

let memory: Switch = {};
let readAt = 0;

export const usesSharedStore = Boolean(REDIS_URL && REDIS_TOKEN);

async function redis(command: string[]): Promise<unknown> {
    const res = await fetch(REDIS_URL!, {
        method: "POST",
        headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(command),
    });
    if (!res.ok) throw new Error(`Redis ${command[0]} failed: ${res.status}`);
    return ((await res.json()) as { result: unknown }).result;
}

/** Applies the stored switch to the flags, at most once per CACHE_MS. */
export async function refreshFlags(): Promise<void> {
    if (!usesSharedStore || Date.now() - readAt < CACHE_MS) return;
    readAt = Date.now();
    try {
        const raw = await redis(["GET", KEY]);
        memory = typeof raw === "string" ? (JSON.parse(raw) as Switch) : {};
    } catch (err) {
        // Keep serving the last known version; a store hiccup shouldn't break the app.
        console.warn(String(err));
    }
    applySwitch(memory);
}

export function currentSwitch(): Switch {
    return memory;
}

export async function saveSwitch(sw: Switch): Promise<void> {
    if (usesSharedStore) await redis(["SET", KEY, JSON.stringify(sw)]);
    memory = sw;
    readAt = Date.now();
    applySwitch(sw);
}

import { createHmac } from "node:crypto";

// RFC 6238 time-based one-time codes, the same kind authenticator apps make.
// Small enough to keep here instead of adding a dependency.

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(secret: string): Buffer {
    let bits = "";
    for (const ch of secret.replace(/=+$/, "").toUpperCase()) {
        const v = ALPHABET.indexOf(ch);
        if (v >= 0) bits += v.toString(2).padStart(5, "0");
    }
    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
    return Buffer.from(bytes);
}

export function totp(secret: string, atMs = Date.now()): string {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(atMs / 30_000)));
    const h = createHmac("sha1", base32Decode(secret)).update(counter).digest();
    const offset = h[h.length - 1] & 0xf;
    return ((h.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
}

/** Accepts the previous, current and next 30-second code, like most apps. */
export function verifyTotp(secret: string, code: string): boolean {
    const clean = code.replace(/\s/g, "");
    return [-1, 0, 1].some((w) => totp(secret, Date.now() + w * 30_000) === clean);
}

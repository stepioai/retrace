import type { NextFunction, Request, Response } from "express";

// Fake sessions: a signed cookie holding the signed-in email. Good enough for
// a test app with one demo user; never use this pattern for real accounts.

const SESSION = "session";
const PENDING = "pending";   // email that passed one step but not the whole login

const cookieOpts = { signed: true, httpOnly: true, sameSite: "lax" as const, path: "/" };

export function signIn(res: Response, email: string): void {
    res.clearCookie(PENDING, cookieOpts);
    res.cookie(SESSION, email, cookieOpts);
}

export function signOut(res: Response): void {
    res.clearCookie(SESSION, cookieOpts);
    res.clearCookie(PENDING, cookieOpts);
}

export function currentUser(req: Request): string | null {
    return (req.signedCookies?.[SESSION] as string) || null;
}

export function setPending(res: Response, email: string): void {
    res.cookie(PENDING, email, { ...cookieOpts, maxAge: 10 * 60 * 1000 });
}

export function pendingEmail(req: Request): string | null {
    return (req.signedCookies?.[PENDING] as string) || null;
}

/** Everything under /app needs a signed-in user; others go to the login. */
export function requireLogin(req: Request, res: Response, next: NextFunction): void {
    if (currentUser(req)) return next();
    res.redirect("/login");
}

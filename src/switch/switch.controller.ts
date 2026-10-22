import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { flags, LOGIN_MODES, PRESET_NAMES } from "../flags";
import { esc } from "../views/html";
import { page } from "../views/layout";
import { currentSwitch, saveSwitch, usesSharedStore } from "./switch.store";

type Field = string | string[] | undefined;

/**
 * One-click version switch for testers: changes what the same URL serves, so
 * Retrace can check a guide against a changed app without a redeploy.
 */
@Controller("switch")
export class SwitchController {
    @Get()
    show(@Query("saved") saved: string | undefined, @Res() res: Response) {
        const sw = currentSwitch();
        const buttons = (field: string, values: readonly string[], live: string) => values.map((v) =>
            `<button class="btn${v === live ? "" : " secondary"}" type="submit" name="${field}" value="${esc(v)}">${esc(v)}</button>`,
        ).join(" ");
        res.send(page("Switch version", `<div class="main">
            <h1>Switch version</h1>
            <p class="muted">Changes the live app at this same address. No redeploy.</p>
            ${saved ? `<div class="ok">Switched. Live now: ${esc(flags.uiVersion)} / ${esc(flags.loginMode)}</div>` : ""}
            ${usesSharedStore ? "" : `<div class="error">No shared store set. On Vercel the switch only holds on one instance and will flicker. Add Upstash Redis (see README).</div>`}
            <form method="post" action="/switch" class="card" style="margin-top:16px">
                <input type="hidden" name="uiVersion" value="${esc(sw.uiVersion || "")}">
                <input type="hidden" name="loginMode" value="${esc(sw.loginMode || "")}">
                <h2>UI version</h2><div class="row" style="flex-wrap:wrap">${buttons("uiVersion", PRESET_NAMES, flags.uiVersion)}</div>
                <h2 style="margin-top:20px">Login</h2><div class="row" style="flex-wrap:wrap">${buttons("loginMode", LOGIN_MODES, flags.loginMode)}</div>
                <p style="margin-top:20px"><button class="btn secondary" type="submit" name="reset" value="1">Reset to env vars</button></p>
            </form>
            <p class="muted">Live now: <strong>${esc(flags.uiVersion)}</strong> / <strong>${esc(flags.loginMode)}</strong>.
               <a href="/login">Open login</a> · <a href="/flags">All flags</a></p>
        </div>`));
    }

    @Post()
    async save(@Body() body: Record<string, Field>, @Res() res: Response) {
        // The clicked button and its hidden field share a name; the button comes last.
        const last = (v: Field) => (Array.isArray(v) ? v[v.length - 1] : v) || undefined;
        await saveSwitch(body.reset ? {} : { uiVersion: last(body.uiVersion), loginMode: last(body.loginMode) });
        res.redirect("/switch?saved=1");
    }
}

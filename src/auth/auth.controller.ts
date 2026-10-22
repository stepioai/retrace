import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { demoUser, flags } from "../flags";
import * as views from "../views/login";
import { currentUser, pendingEmail, setPending, signIn, signOut } from "./session";
import { verifyTotp } from "./totp";

const WRONG = "Incorrect email or password.";

function matches(email?: string, password?: string): boolean {
    return (email || "").trim().toLowerCase() === demoUser.email.toLowerCase() && password === demoUser.password;
}

@Controller()
export class AuthController {
    @Get()
    root(@Req() req: Request, @Res() res: Response) {
        res.redirect(currentUser(req) ? "/app" : "/login");
    }

    @Get("login")
    loginPage(@Req() req: Request, @Res() res: Response) {
        if (currentUser(req)) return res.redirect("/app");
        switch (flags.loginMode) {
            case "two_step": return res.send(views.identifyStep());
            case "sso_only": return res.send(views.ssoOnly());
            case "captcha": return res.send(views.captchaLogin());
            default: return res.send(views.passwordLogin());
        }
    }

    /** Two-screen login, screen 1. Any email moves on, like real apps that don't reveal which accounts exist. */
    @Post("login/identify")
    identify(@Body() body: { email?: string }, @Res() res: Response) {
        const email = (body.email || "").trim();
        if (!email) return res.status(400).send(views.identifyStep("Enter your email."));
        setPending(res, email);
        res.redirect("/login/password");
    }

    @Get("login/password")
    passwordPage(@Req() req: Request, @Res() res: Response) {
        const email = pendingEmail(req);
        if (!email) return res.redirect("/login");
        res.send(views.passwordStep(email));
    }

    @Post("login")
    login(@Body() body: { email?: string; password?: string }, @Res() res: Response) {
        if (!matches(body.email, body.password)) {
            const page = flags.loginMode === "two_step"
                ? views.passwordStep(body.email || "", WRONG)
                : flags.loginMode === "captcha"
                    ? views.captchaLogin(WRONG)
                    : views.passwordLogin(WRONG, body.email);
            return res.status(401).send(page);
        }
        if (flags.loginMode === "otp") {
            setPending(res, demoUser.email);
            return res.redirect("/login/code");
        }
        signIn(res, demoUser.email);
        res.redirect("/app");
    }

    @Get("login/code")
    codePage(@Req() req: Request, @Res() res: Response) {
        if (!pendingEmail(req)) return res.redirect("/login");
        res.send(views.codeStep());
    }

    @Post("login/code")
    verifyCode(@Req() req: Request, @Body() body: { otp?: string }, @Res() res: Response) {
        const email = pendingEmail(req);
        if (!email) return res.redirect("/login");
        if (!verifyTotp(demoUser.totpSecret, body.otp || "")) {
            return res.status(401).send(views.codeStep("That code is not valid. Try the newest code."));
        }
        signIn(res, email);
        res.redirect("/app");
    }

    @Get("logout")
    logout(@Res() res: Response) {
        signOut(res);
        res.redirect("/login");
    }
}

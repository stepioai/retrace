import { esc, ids } from "./html";
import { page } from "./layout";

// Login screens. The field attributes are what Retrace's sign-in looks for:
// an email/username input, input[type=password], a submit button, errors in
// role=alert, and a one-time-code input with autocomplete=one-time-code.

function error(msg?: string): string {
    return msg ? `<div class="error" role="alert">${esc(msg)}</div>` : "";
}

function card(heading: string, inner: string): string {
    return page("Sign in", `<div class="auth"><div class="card">
        <h1 style="margin-bottom:6px">${esc(heading)}</h1>
        <p class="muted" style="margin-top:0">Acme Projects test app</p>
        ${inner}</div></div>`);
}

export function passwordLogin(msg?: string, email = ""): string {
    return card("Sign in", `<form method="post" action="/login">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" autocomplete="username" value="${esc(email)}" required>
        <label for="password">Password</label>
        <input type="password" id="password" name="password" autocomplete="current-password" required>
        ${error(msg)}
        <div style="margin-top:18px"><button class="btn" type="submit" ${ids("sign-in")}>Sign in</button></div>
      </form>`);
}

/** Screen 1 of a two-screen login: identifier only. */
export function identifyStep(msg?: string): string {
    return card("Sign in", `<form method="post" action="/login/identify">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" autocomplete="username" required>
        ${error(msg)}
        <div style="margin-top:18px"><button class="btn" type="submit">Continue</button></div>
      </form>`);
}

/** Screen 2 of a two-screen login. */
export function passwordStep(email: string, msg?: string): string {
    return card("Enter your password", `<form method="post" action="/login">
        <p>Signing in as <strong>${esc(email)}</strong> · <a href="/login">Change</a></p>
        <input type="hidden" name="email" value="${esc(email)}">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" autocomplete="current-password" required autofocus>
        ${error(msg)}
        <div style="margin-top:18px"><button class="btn" type="submit">Sign in</button></div>
      </form>`);
}

export function codeStep(msg?: string): string {
    return card("Two-step verification", `<form method="post" action="/login/code">
        <p class="muted">Enter the 6-digit code from your authenticator app.</p>
        <label for="otp">Code</label>
        <input type="text" id="otp" name="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required autofocus>
        ${error(msg)}
        <div style="margin-top:18px"><button class="btn" type="submit">Verify</button></div>
      </form>`);
}

/** No password form at all, only identity providers. Retrace should say sso_only. */
export function ssoOnly(): string {
    return card("Sign in", `
        <p class="muted">Your company signs in with single sign-on.</p>
        <p><a class="btn secondary" href="https://accounts.google.com/o/oauth2/v2/auth">Continue with Google</a></p>
        <p><a class="btn secondary" href="https://login.microsoftonline.com/common/oauth2/v2.0/authorize">Continue with Microsoft</a></p>`);
}

/** A password form behind a (simulated) Cloudflare challenge frame. Retrace should say captcha. */
export function captchaLogin(msg?: string): string {
    return card("Sign in", `<form method="post" action="/login">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" autocomplete="username" required>
        <label for="password">Password</label>
        <input type="password" id="password" name="password" autocomplete="current-password" required>
        <p class="muted" style="font-size:13px;margin:14px 0 6px">Verify you are human</p>
        <iframe title="Security check" src="https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/if/ov2/av0/rcv0/0/test"
                style="width:300px;height:65px;border:1px solid var(--border);border-radius:6px"></iframe>
        ${error(msg)}
        <div style="margin-top:18px"><button class="btn" type="submit">Sign in</button></div>
      </form>`);
}

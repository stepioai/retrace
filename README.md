# Retrace test app

A small fake SaaS app ("Acme Projects") for testing Stepio Retrace. It has a
login, a dashboard, projects, a team page and settings. Its UI changes when you
change **environment variables**, so you can record a guide on one version and
then check it against a changed version.

Nothing is real: one fake account, data kept in memory, reset on every restart.

## Run locally

```bash
npm install
cp .env.example .env      # optional
npm run dev               # http://localhost:3000
```

Sign in with `demo@example.com` / `demo1234`.

Retrace cannot open `localhost`. It only opens public addresses, so for a real
Retrace run, deploy it (below) or put a public tunnel in front of port 3000.

## Deploy to Vercel

1. Push this repo to GitHub, then import it at https://vercel.com/new.
   Keep the defaults: `vercel.json` already sets the build and routing.
2. Before the first deploy, add environment variables under
   **Settings > Environment Variables**: at least `SESSION_SECRET`, plus
   `UI_VERSION` and `LOGIN_MODE` (see below).
3. Use the **production domain** (`https://<project>.vercel.app`) in Retrace,
   not a per-deployment URL. Vercel puts its own login wall (Deployment
   Protection) in front of preview and per-deployment URLs, and Retrace would
   hit that instead of this app's login. If the production domain shows a
   Vercel login too, turn protection off under **Settings > Deployment Protection**.

**Changing the UI on Vercel:** edit the `retrace-test-app` row in Stepio's
`feature_flags` table (Supabase table editor). Its `value` uses the env var
names below, for example:

```json
{"UI_VERSION": "v3", "LOGIN_MODE": "password", "LABEL_SAVE": "Update"}
```

Every instance reads the row through the Stepio API every few seconds, so the
same address serves the new version within about 3 seconds, with no redeploy,
and Retrace keeps seeing the same app. Values in the row win over env vars;
an unknown `UI_VERSION` or `LOGIN_MODE` is ignored.

One-time setup: set `FLAGS_URL` to
`https://<stepio-dev-api>/v1/feature-flags/retrace-test-app` in **Settings >
Environment Variables** and redeploy once. `/flags` shows the live values and,
under `remote`, the row it read and any error. Without `FLAGS_URL` the app
runs on env vars alone.

**Data on Vercel resets often.** Each serverless instance keeps its own
in-memory copy and Vercel starts and stops them freely, so a project you just
created can be gone on the next request. Logins are unaffected (they live in a
signed cookie), and the seeded projects and members are always there. Record
guides that navigate and fill forms, and don't rely on data a previous step
created. If that becomes a problem, use Cloud Run with one instance instead.

## Deploy to Cloud Run

```bash
gcloud run deploy retrace-test-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --max-instances 1 \
  --set-env-vars UI_VERSION=v1,LOGIN_MODE=password,SESSION_SECRET=<long-random-string>
```

`--max-instances 1` matters: data lives in memory, and two instances would each
have their own copy.

Change the UI later without touching code:

```bash
gcloud run services update retrace-test-app --region us-central1 --update-env-vars UI_VERSION=v2
```

Open `https://<your-url>/flags` to confirm which settings are live. `FLAGS_URL` works here too.

## Settings

### Presets (`UI_VERSION`)

| Preset | What changes | Retrace should report |
|---|---|---|
| `v1` | Nothing. The baseline to record your guides on. | `same` |
| `cosmetic` | Green accent colour and an announcement bar. | `same` or `minor` |
| `v2` | Buttons renamed: "New project" to "Add project", "Create project" to "Create", "Save changes" to "Update profile", "Invite member" to "Send invite". Login text changes: "Sign in" to "Welcome back" / "Log in". | Steps still found (by meaning). `minor` or `changed` |
| `v3` | Navigation moves to the top. "New project" moves into an "Actions" menu. Banner shown. | `changed` |
| `v4` | Project creation becomes a 2-step wizard, Settings moves to `/app/preferences`, the Team page is removed, and ids/test ids are gone. | `changed` or `not_reached` |

### Login (`LOGIN_MODE`)

| Mode | What the login looks like | Retrace sign-in result |
|---|---|---|
| `password` | Email and password on one screen | `ok` |
| `two_step` | Email first, then password on a second screen | `ok` |
| `otp` | Password, then a 6-digit authenticator code | `ok` with the 2-step key saved, `needs_code` without it |
| `sso_only` | Only "Continue with Google / Microsoft" | `sso_only` |
| `captcha` | Password form with a Cloudflare check frame | `captcha` |

Wrong password always shows "Incorrect email or password." (`wrong_login`).

For `otp`, the 2-step key is `TOTP_SECRET` (default `JBSWY3DPEHPK3PXP`).
Give that to Retrace, or add it to an authenticator app to sign in by hand.

### Single overrides

Each one overrides the preset. Leave it unset to use the preset's value.

| Variable | Values | Default |
|---|---|---|
| `NAV_LAYOUT` | `sidebar`, `topbar` | `sidebar` |
| `NEW_PROJECT_PLACEMENT` | `header`, `menu` | `header` |
| `LABEL_NEW_PROJECT` | any text | `New project` |
| `LABEL_CREATE` | any text | `Create project` |
| `LABEL_SAVE` | any text | `Save changes` |
| `LABEL_INVITE` | any text | `Invite member` |
| `LOGIN_HEADING` | any text | `Sign in` |
| `LOGIN_SUBTITLE` | any text | `Acme Projects test app` |
| `LABEL_SIGN_IN` | any text | `Sign in` |
| `STABLE_IDS` | `true`, `false` | `true` |
| `PROJECT_WIZARD` | `true`, `false` | `false` |
| `SETTINGS_PATH` | `/app/settings`, `/app/preferences` | `/app/settings` |
| `TEAM_PAGE` | `true`, `false` | `true` |
| `ACCENT_COLOR` | any CSS colour | `#2563eb` |
| `BANNER_TEXT` | any text | none |
| `DEMO_EMAIL`, `DEMO_PASSWORD` | the fake account | `demo@example.com`, `demo1234` |
| `TOTP_SECRET` | base32 key | `JBSWY3DPEHPK3PXP` |
| `SESSION_SECRET` | any long string | a fixed local value |

## Testing Retrace with it

1. Deploy with `UI_VERSION=v1` and `LOGIN_MODE=password`.
2. In Stepio, connect the app in Retrace: app URL, login page
   `https://<your-url>/login`, and the demo account.
3. Record guides on v1. Good ones to record:
   - **Create a project:** Projects, New project, type a name, pick visibility, Create project.
   - **Invite a team member:** Team, type an email, pick a role, Invite member.
   - **Change settings:** Settings, change display name and time zone, Save changes.
4. Run a check on v1. Every clip should be `same`. If not, that is a Retrace
   bug, because nothing changed.
5. Switch presets one at a time (`cosmetic`, `v2`, `v3`, `v4`), run a check
   after each, and compare with the tables above.
6. Try each `LOGIN_MODE` with the "test login" button in Retrace.
7. Go back to `v1` and check again. Everything should be `same` again.

Retrace locates "Save" and "Create" style buttons but may not click them,
because those steps change data. Expect those steps to be found rather than
performed.

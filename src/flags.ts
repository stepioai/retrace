/**
 * Every UI difference in this app comes from here, read once at startup from
 * environment variables. Change a variable and restart (or redeploy) to give
 * Retrace a changed app to find.
 *
 * UI_VERSION picks a preset; any single variable below overrides the preset.
 */

export type LoginMode = "password" | "two_step" | "otp" | "sso_only" | "captcha";

export interface Flags {
    uiVersion: string;
    loginMode: LoginMode;
    navLayout: "sidebar" | "topbar";
    newProjectPlacement: "header" | "menu";
    newProjectLabel: string;
    createLabel: string;
    saveLabel: string;
    inviteLabel: string;
    loginHeading: string;
    loginSubtitle: string;
    signInLabel: string;
    stableIds: boolean;
    projectWizard: boolean;
    settingsPath: string;
    teamPage: boolean;
    accent: string;
    banner: string;
}

const BASELINE: Flags = {
    uiVersion: "v1",
    loginMode: "password",
    navLayout: "sidebar",
    newProjectPlacement: "header",
    newProjectLabel: "New project",
    createLabel: "Create project",
    saveLabel: "Save changes",
    inviteLabel: "Invite member",
    loginHeading: "Sign in",
    loginSubtitle: "Acme Projects test app",
    signInLabel: "Sign in",
    stableIds: true,
    projectWizard: false,
    settingsPath: "/app/settings",
    teamPage: true,
    accent: "#2563eb",
    banner: "",
};

/** Each preset is one kind of change a real app goes through. */
const PRESETS: Record<string, Partial<Flags>> = {
    // Same app, nothing changed. Retrace should report "same".
    v1: {},
    // Only colour and an announcement bar. Expect "same" or "minor".
    cosmetic: {
        accent: "#16a34a",
        banner: "New: dark mode is coming soon.",
    },
    // Buttons renamed, same place. Retrace has to find them by meaning.
    v2: {
        newProjectLabel: "Add project",
        createLabel: "Create",
        saveLabel: "Update profile",
        inviteLabel: "Send invite",
        loginHeading: "Welcome back",
        loginSubtitle: "Log in to your Acme account",
        signInLabel: "Log in",
    },
    // Navigation moved to the top, "New project" hidden in a menu.
    v3: {
        navLayout: "topbar",
        newProjectPlacement: "menu",
        banner: "We moved things around. Look for the menu next to the page title.",
    },
    // The flow itself changed: extra wizard step, Settings moved to a new
    // address, Team page removed, and no stable ids to match on.
    v4: {
        projectWizard: true,
        settingsPath: "/app/preferences",
        teamPage: false,
        stableIds: false,
    },
};

function bool(v: string | undefined): boolean | undefined {
    if (v === undefined || v === "") return undefined;
    return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

function str(v: string | undefined): string | undefined {
    return v === undefined || v === "" ? undefined : v;
}

function readFlags(env: NodeJS.ProcessEnv): Flags {
    const version = env.UI_VERSION || "v1";
    const preset = PRESETS[version];
    if (!preset) {
        throw new Error(`Unknown UI_VERSION "${version}". Use one of: ${Object.keys(PRESETS).join(", ")}`);
    }
    const overrides: Partial<Flags> = {
        loginMode: str(env.LOGIN_MODE) as LoginMode | undefined,
        navLayout: str(env.NAV_LAYOUT) as Flags["navLayout"] | undefined,
        newProjectPlacement: str(env.NEW_PROJECT_PLACEMENT) as Flags["newProjectPlacement"] | undefined,
        newProjectLabel: str(env.LABEL_NEW_PROJECT),
        createLabel: str(env.LABEL_CREATE),
        saveLabel: str(env.LABEL_SAVE),
        inviteLabel: str(env.LABEL_INVITE),
        loginHeading: str(env.LOGIN_HEADING),
        loginSubtitle: str(env.LOGIN_SUBTITLE),
        signInLabel: str(env.LABEL_SIGN_IN),
        stableIds: bool(env.STABLE_IDS),
        projectWizard: bool(env.PROJECT_WIZARD),
        settingsPath: str(env.SETTINGS_PATH),
        teamPage: bool(env.TEAM_PAGE),
        accent: str(env.ACCENT_COLOR),
        banner: str(env.BANNER_TEXT),
    };
    const defined = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined));
    return { ...BASELINE, ...preset, ...defined, uiVersion: version };
}

export const flags: Flags = readFlags(process.env);

export const demoUser = {
    email: process.env.DEMO_EMAIL || "demo@example.com",
    password: process.env.DEMO_PASSWORD || "demo1234",
    name: process.env.DEMO_NAME || "Demo User",
    // The well-known RFC example key. Add it to an authenticator app, or give
    // it to Retrace as the 2-step key, when LOGIN_MODE=otp.
    totpSecret: process.env.TOTP_SECRET || "JBSWY3DPEHPK3PXP",
};

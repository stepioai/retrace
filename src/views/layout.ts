import { flags } from "../flags";
import { cls, esc, ids } from "./html";

// A function, not a constant: the accent can change at runtime through the feature_flags row.
const style = () => `
:root { --accent: ${flags.accent}; --bg: #f8fafc; --card: #fff; --text: #0f172a; --muted: #64748b; --border: #e2e8f0; }
* { box-sizing: border-box; }
body { margin: 0; font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); }
a { color: var(--accent); text-decoration: none; }
h1 { font-size: 22px; margin: 0; }
h2 { font-size: 17px; margin: 0 0 12px; }
.btn { display: inline-block; border: 1px solid var(--accent); background: var(--accent); color: #fff; padding: 8px 14px;
       border-radius: 8px; font: inherit; font-weight: 600; cursor: pointer; }
.btn.secondary { background: #fff; color: var(--text); border-color: var(--border); }
.card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
label { display: block; font-weight: 600; margin: 14px 0 6px; }
input[type=text], input[type=email], input[type=password], select, textarea {
  width: 100%; padding: 9px 11px; border: 1px solid var(--border); border-radius: 8px; font: inherit; background: #fff; }
.row { display: flex; gap: 12px; align-items: center; }
.muted { color: var(--muted); }
.error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; padding: 10px 12px; border-radius: 8px; margin-top: 14px; }
.ok { color: #166534; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 12px; border-radius: 8px; margin-bottom: 14px; }
.banner { background: #fef9c3; border-bottom: 1px solid #fde68a; padding: 10px 24px; font-size: 14px; }
.shell { display: flex; min-height: 100vh; }
.side { width: 220px; background: #fff; border-right: 1px solid var(--border); padding: 20px 12px; }
.side a, .top a { display: block; padding: 8px 12px; border-radius: 8px; color: var(--text); }
.side a.on, .top a.on { background: #eff6ff; color: var(--accent); font-weight: 600; }
.top { display: flex; gap: 4px; align-items: center; background: #fff; border-bottom: 1px solid var(--border); padding: 10px 24px; }
.top .brand, .side .brand { font-weight: 800; padding: 8px 12px; margin-right: 12px; }
.main { flex: 1; padding: 28px 32px; max-width: 980px; }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--border); }
details.menu { position: relative; }
details.menu summary { list-style: none; cursor: pointer; }
details.menu summary::-webkit-details-marker { display: none; }
details.menu .items { position: absolute; right: 0; top: 42px; background: #fff; border: 1px solid var(--border);
  border-radius: 10px; padding: 6px; min-width: 190px; box-shadow: 0 4px 12px rgba(0,0,0,.06); z-index: 5; }
details.menu .items a { display: block; padding: 8px 10px; border-radius: 6px; color: var(--text); }
details.menu .items a:hover { background: var(--bg); }
.auth { max-width: 400px; margin: 10vh auto; }
`;

export function page(title: string, body: string): string {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | Acme Projects</title><style>${style()}</style></head>
<body>${body}</body></html>`;
}

interface NavItem { href: string; label: string; key: string }

function navItems(): NavItem[] {
    const items: NavItem[] = [
        { href: "/app", label: "Dashboard", key: "nav-dashboard" },
        { href: "/app/projects", label: "Projects", key: "nav-projects" },
    ];
    if (flags.teamPage) items.push({ href: "/app/team", label: "Team", key: "nav-team" });
    items.push({ href: flags.settingsPath, label: "Settings", key: "nav-settings" });
    return items;
}

/** The signed-in shell: navigation (side or top) around the page content. */
export function appPage(title: string, activePath: string, content: string): string {
    const links = navItems()
        .map((i) => `<a href="${i.href}" ${ids(i.key)} class="${i.href === activePath ? "on" : ""}">${esc(i.label)}</a>`)
        .join("");
    const logout = `<a href="/logout" ${ids("nav-logout")}>Sign out</a>`;
    const banner = flags.banner ? `<div class="banner" role="status">${esc(flags.banner)}</div>` : "";

    const shell = flags.navLayout === "topbar"
        ? `${banner}<nav class="top ${cls("nav", "navigation-bar")}" aria-label="Main">
             <span class="brand">Acme</span>${links}<span style="flex:1"></span>${logout}</nav>
           <main class="main">${content}</main>`
        : `<div class="shell"><nav class="side ${cls("nav", "navigation-panel")}" aria-label="Main">
             <div class="brand">Acme</div>${links}<hr style="border:0;border-top:1px solid var(--border)">${logout}</nav>
           <div style="flex:1">${banner}<main class="main">${content}</main></div></div>`;

    return page(title, shell);
}

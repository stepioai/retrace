import { flags } from "../flags";
import { members, profile, projects, type Project } from "../pages/store";
import { cls, esc, ids } from "./html";
import { appPage } from "./layout";

export function dashboard(email: string): string {
    return appPage("Dashboard", "/app", `
      <div class="head"><h1>Welcome back</h1></div>
      <div class="row" style="align-items:stretch">
        <div class="card" style="flex:1"><div class="muted">Projects</div><div style="font-size:28px;font-weight:800">${projects.length}</div></div>
        <div class="card" style="flex:1"><div class="muted">Team members</div><div style="font-size:28px;font-weight:800">${members.length}</div></div>
      </div>
      <div class="card" style="margin-top:16px">
        <h2>Get started</h2>
        <p>Signed in as ${esc(email)}.</p>
        <a class="btn" href="/app/projects" ${ids("go-projects")}>View projects</a>
      </div>`);
}

function newProjectControl(): string {
    const link = `<a class="btn ${cls("new-project", "add-item")}" href="/app/projects/new" ${ids("new-project")}>${esc(flags.newProjectLabel)}</a>`;
    if (flags.newProjectPlacement === "header") return link;
    // Moved behind a menu: one extra click, and the button is no longer visible on the page.
    return `<details class="menu">
        <summary class="btn secondary" ${ids("project-actions")} aria-label="Project actions">Actions ▾</summary>
        <div class="items" role="menu">
          <a role="menuitem" href="/app/projects/new" ${ids("new-project")}>${esc(flags.newProjectLabel)}</a>
          <a role="menuitem" href="/app/projects">Import projects</a>
        </div>
      </details>`;
}

export function projectList(): string {
    const rows = projects
        .map((p) => `<tr><td><a href="/app/projects/${p.id}">${esc(p.name)}</a></td><td class="muted">${esc(p.description)}</td><td>${esc(p.visibility)}</td></tr>`)
        .join("");
    return appPage("Projects", "/app/projects", `
      <div class="head"><h1>Projects</h1>${newProjectControl()}</div>
      <div class="card"><table ${ids("project-table")}>
        <thead><tr><th>Name</th><th>Description</th><th>Visibility</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`);
}

function visibilitySelect(): string {
    return `<label for="visibility">Visibility</label>
      <select id="visibility" name="visibility" ${flags.stableIds ? 'data-testid="project-visibility"' : ""}>
        <option value="private">Only me</option><option value="team">Whole team</option>
      </select>`;
}

export function newProject(error?: string): string {
    const err = error ? `<div class="error" role="alert">${esc(error)}</div>` : "";
    if (flags.projectWizard) {
        // Wizard: step 1 asks only for the name, then "Next".
        return appPage("New project", "/app/projects", `
          <div class="head"><h1>New project</h1><span class="muted">Step 1 of 2</span></div>
          <form class="card" method="post" action="/app/projects/new/details">
            <label for="name">Project name</label>
            <input type="text" id="name" name="name" required>
            ${err}
            <div style="margin-top:18px" class="row">
              <button class="btn" type="submit" ${ids("wizard-next")}>Next</button>
              <a class="btn secondary" href="/app/projects">Cancel</a></div>
          </form>`);
    }
    return appPage("New project", "/app/projects", `
      <div class="head"><h1>New project</h1></div>
      <form class="card" method="post" action="/app/projects">
        <label for="name">Project name</label>
        <input type="text" id="name" name="name" ${flags.stableIds ? 'data-testid="project-name"' : ""} required>
        <label for="description">Description</label>
        <textarea id="description" name="description" rows="3"></textarea>
        ${visibilitySelect()}
        ${err}
        <div style="margin-top:18px" class="row">
          <button class="btn" type="submit" ${ids("create-project")}>${esc(flags.createLabel)}</button>
          <a class="btn secondary" href="/app/projects">Cancel</a></div>
      </form>`);
}

/** Wizard step 2: details, then create. */
export function newProjectDetails(name: string): string {
    return appPage("New project", "/app/projects", `
      <div class="head"><h1>New project</h1><span class="muted">Step 2 of 2</span></div>
      <form class="card" method="post" action="/app/projects">
        <input type="hidden" name="name" value="${esc(name)}">
        <p>Project: <strong>${esc(name)}</strong></p>
        <label for="description">Description</label>
        <textarea id="description" name="description" rows="3"></textarea>
        ${visibilitySelect()}
        <div style="margin-top:18px" class="row">
          <button class="btn" type="submit" ${ids("create-project")}>${esc(flags.createLabel)}</button>
          <a class="btn secondary" href="/app/projects/new">Back</a></div>
      </form>`);
}

export function projectDetail(p: Project, justCreated: boolean): string {
    const ok = justCreated ? `<div class="ok" role="status">Project created.</div>` : "";
    return appPage(p.name, "/app/projects", `
      ${ok}
      <div class="head"><h1>${esc(p.name)}</h1><a class="btn secondary" href="/app/projects">All projects</a></div>
      <div class="card">
        <p class="muted">${esc(p.description || "No description")}</p>
        <p>Visibility: <strong>${esc(p.visibility)}</strong></p>
        <p class="muted">Created ${p.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC</p>
      </div>`);
}

export function team(notice?: string): string {
    const ok = notice ? `<div class="ok" role="status">${esc(notice)}</div>` : "";
    const rows = members.map((m) => `<tr><td>${esc(m.email)}</td><td>${esc(m.role)}</td></tr>`).join("");
    return appPage("Team", "/app/team", `
      ${ok}
      <div class="head"><h1>Team</h1></div>
      <div class="card" style="margin-bottom:16px">
        <h2>Invite someone</h2>
        <form method="post" action="/app/team/invite" class="row" style="align-items:end">
          <div style="flex:2"><label for="invite-email">Email</label>
            <input type="email" id="invite-email" name="email" required></div>
          <div style="flex:1"><label for="role">Role</label>
            <select id="role" name="role"><option value="editor">Editor</option><option value="viewer">Viewer</option><option value="admin">Admin</option></select></div>
          <button class="btn" type="submit" ${ids("invite-member")}>${esc(flags.inviteLabel)}</button>
        </form>
      </div>
      <div class="card"><table><thead><tr><th>Email</th><th>Role</th></tr></thead><tbody>${rows}</tbody></table></div>`);
}

export function settings(saved: boolean): string {
    const ok = saved ? `<div class="ok" role="status">Settings saved.</div>` : "";
    const zones = ["UTC", "Europe/London", "America/New_York", "Asia/Kolkata", "Asia/Tokyo"]
        .map((z) => `<option ${z === profile.timezone ? "selected" : ""}>${z}</option>`).join("");
    return appPage("Settings", flags.settingsPath, `
      ${ok}
      <div class="head"><h1>Settings</h1></div>
      <form class="card" method="post" action="${flags.settingsPath}">
        <label for="displayName">Display name</label>
        <input type="text" id="displayName" name="displayName" value="${esc(profile.displayName)}">
        <label for="timezone">Time zone</label>
        <select id="timezone" name="timezone">${zones}</select>
        <label class="row" style="font-weight:400"><input type="checkbox" name="emailNotifications" ${profile.emailNotifications ? "checked" : ""}> Email me about project activity</label>
        <div style="margin-top:18px"><button class="btn" type="submit" ${ids("save-settings")}>${esc(flags.saveLabel)}</button></div>
      </form>`);
}

export function notFound(): string {
    return appPage("Not found", "", `<div class="head"><h1>Page not found</h1></div>
      <div class="card"><p>This page does not exist in this version of the app.</p><a href="/app">Go to the dashboard</a></div>`);
}

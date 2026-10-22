// In-memory data. Resets on every restart, which is what a test app wants:
// each run starts from the same seed. Run a single instance (Cloud Run
// --max-instances=1) or two instances will each have their own copy.

export interface Project {
    id: number;
    name: string;
    description: string;
    visibility: "private" | "team";
    createdAt: Date;
}

export interface Member {
    email: string;
    role: "admin" | "editor" | "viewer";
}

let nextId = 3;

export const projects: Project[] = [
    { id: 1, name: "Website redesign", description: "New marketing site", visibility: "team", createdAt: new Date() },
    { id: 2, name: "Mobile app", description: "iOS and Android release", visibility: "private", createdAt: new Date() },
];

export const members: Member[] = [
    { email: "demo@example.com", role: "admin" },
    { email: "sam@example.com", role: "editor" },
];

export const profile = {
    displayName: "Demo User",
    timezone: "UTC",
    emailNotifications: true,
};

export function addProject(name: string, description: string, visibility: Project["visibility"]): Project {
    const p: Project = { id: nextId++, name, description, visibility, createdAt: new Date() };
    projects.push(p);
    return p;
}

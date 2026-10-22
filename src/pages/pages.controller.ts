import { Body, Controller, Get, Param, Post, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { currentUser } from "../auth/session";
import { flags } from "../flags";
import * as views from "../views/app";
import { addProject, members, profile, projects, type Member, type Project } from "./store";

// Everything here sits under /app, which main.ts guards with requireLogin.

@Controller("app")
export class PagesController {
    @Get()
    dashboard(@Req() req: Request, @Res() res: Response) {
        res.send(views.dashboard(currentUser(req) || ""));
    }

    @Get("projects")
    projects(@Res() res: Response) {
        res.send(views.projectList());
    }

    @Get("projects/new")
    newProject(@Res() res: Response) {
        res.send(views.newProject());
    }

    @Post("projects/new/details")
    newProjectDetails(@Body() body: { name?: string }, @Res() res: Response) {
        const name = (body.name || "").trim();
        if (!name) return res.status(400).send(views.newProject("Give the project a name."));
        res.status(200).send(views.newProjectDetails(name));
    }

    @Post("projects")
    create(@Body() body: { name?: string; description?: string; visibility?: string }, @Res() res: Response) {
        const name = (body.name || "").trim();
        if (!name) return res.status(400).send(views.newProject("Give the project a name."));
        const visibility: Project["visibility"] = body.visibility === "team" ? "team" : "private";
        const p = addProject(name.slice(0, 120), (body.description || "").slice(0, 1000), visibility);
        res.redirect(`/app/projects/${p.id}?created=1`);
    }

    @Get("projects/:id")
    project(@Param("id") id: string, @Query("created") created: string | undefined, @Res() res: Response) {
        const p = projects.find((x) => x.id === Number(id));
        if (!p) return res.status(404).send(views.notFound());
        res.send(views.projectDetail(p, created === "1"));
    }

    @Get("team")
    team(@Query("invited") invited: string | undefined, @Res() res: Response) {
        if (!flags.teamPage) return res.status(404).send(views.notFound());
        res.send(views.team(invited ? `Invitation sent to ${invited}.` : undefined));
    }

    @Post("team/invite")
    invite(@Body() body: { email?: string; role?: string }, @Res() res: Response) {
        if (!flags.teamPage) return res.status(404).send(views.notFound());
        const email = (body.email || "").trim().slice(0, 200);
        const role: Member["role"] = body.role === "admin" || body.role === "viewer" ? body.role : "editor";
        if (email && !members.some((m) => m.email === email)) members.push({ email, role });
        res.redirect(`/app/team?invited=${encodeURIComponent(email)}`);
    }

    // Settings lives at SETTINGS_PATH. Both known addresses are routed so the
    // old one answers 404 once the setting moves, as a real renamed page would.
    @Get(["settings", "preferences"])
    settings(@Req() req: Request, @Query("saved") saved: string | undefined, @Res() res: Response) {
        if (req.path !== flags.settingsPath) return res.status(404).send(views.notFound());
        res.send(views.settings(saved === "1"));
    }

    @Post(["settings", "preferences"])
    saveSettings(
        @Req() req: Request,
        @Body() body: { displayName?: string; timezone?: string; emailNotifications?: string },
        @Res() res: Response,
    ) {
        if (req.path !== flags.settingsPath) return res.status(404).send(views.notFound());
        profile.displayName = (body.displayName || profile.displayName).slice(0, 80);
        profile.timezone = body.timezone || profile.timezone;
        profile.emailNotifications = body.emailNotifications === "on";
        res.redirect(`${flags.settingsPath}?saved=1`);
    }
}

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import { AppModule } from "./app.module";
import { requireLogin } from "./auth/session";

/**
 * Builds the app on a plain Express instance without listening. main.ts
 * listens on it for local and container runs; api/index.js hands it to
 * Vercel as a serverless function.
 */
export async function createServer(): Promise<Express> {
    const server = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), { logger: ["error", "warn"] });
    app.use(cookieParser(process.env.SESSION_SECRET || "local-test-only-secret"));
    app.use("/app", requireLogin);
    await app.init();
    return server;
}

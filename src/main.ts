import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { requireLogin } from "./auth/session";
import { flags } from "./flags";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser(process.env.SESSION_SECRET || "local-test-only-secret"));
    app.use("/app", requireLogin);
    const port = Number(process.env.PORT) || 3000;
    await app.listen(port, "0.0.0.0");
    console.log(`Retrace test app on http://localhost:${port}  flags=${JSON.stringify(flags)}`);
}

bootstrap();

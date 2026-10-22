import { Controller, Get, Module } from "@nestjs/common";
import { AuthController } from "./auth/auth.controller";
import { flags } from "./flags";
import { PagesController } from "./pages/pages.controller";

/** Public: which flags this instance is running with, so a tester can confirm a change landed. */
@Controller()
class FlagsController {
    @Get("flags")
    get() {
        return flags;
    }

    @Get("healthz")
    health() {
        return { ok: true };
    }
}

@Module({ controllers: [AuthController, PagesController, FlagsController] })
export class AppModule {}

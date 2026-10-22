import { flags } from "./flags";
import { createServer } from "./server";

async function bootstrap() {
    const server = await createServer();
    const port = Number(process.env.PORT) || 3000;
    server.listen(port, "0.0.0.0", () => {
        console.log(`Retrace test app on http://localhost:${port}  flags=${JSON.stringify(flags)}`);
    });
}

bootstrap();

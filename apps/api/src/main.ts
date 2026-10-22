import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { toNodeHandler } from "better-auth/node";
import { AppModule } from "./app.module.js";
import { AUTH, type Auth } from "./auth/auth.js";
import { env } from "./env.js";

async function bootstrap() {
  // Better Auth reads the raw request body, so JSON parsing is added after its handler.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const auth = app.get<Auth>(AUTH);
  app
    .getHttpAdapter()
    .getInstance()
    .all("/api/auth/*splat", toNodeHandler(auth));
  app.useBodyParser("json");
  // Traefik routes /api to Nest in production, and Vite proxies it in dev.
  app.setGlobalPrefix("api");
  app.enableShutdownHooks();
  await app.listen(env.PORT);
}
await bootstrap();

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { env } from "./env.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Traefik routes /api to Nest in production, and Vite proxies it in dev.
  app.setGlobalPrefix("api");
  app.enableShutdownHooks();
  await app.listen(env.PORT);
}
await bootstrap();

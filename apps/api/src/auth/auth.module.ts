import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { DB } from "../db/db.module.js";
import { AuthGuard } from "./auth.guard.js";
import { AUTH, createAuth } from "./auth.js";

// main.ts mounts AUTH's handler on /api/auth; AuthGuard protects every other route.
@Global()
@Module({
  exports: [AUTH],
  providers: [
    { inject: [DB], provide: AUTH, useFactory: createAuth },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AuthModule {}

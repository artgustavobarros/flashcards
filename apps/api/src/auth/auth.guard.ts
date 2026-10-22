import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { AUTH, type Auth, type AuthSession } from "./auth.js";

const IS_PUBLIC = "isPublic";

// Every route needs a session unless marked @Public().
export const Public = () => SetMetadata(IS_PUBLIC, true);

type AuthedRequest = Request & { session?: AuthSession };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    @Inject(Reflector) private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      throw new UnauthorizedException();
    }
    req.session = session;
    return true;
  }
}

// The session AuthGuard attached. Only valid on routes that are not @Public().
export const CurrentSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthSession => {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (!req.session) {
      throw new UnauthorizedException();
    }
    return req.session;
  }
);

import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";

// POST /api/auth/dev-login/sign-in { email, name? }: finds or creates the user and sets the
// session cookie, skipping Google. Only registered when DEV_LOGIN is on, which env.ts forbids
// in production.
export const devLogin = () =>
  ({
    endpoints: {
      devSignIn: createAuthEndpoint(
        "/dev-login/sign-in",
        {
          body: z.object({
            email: z.email(),
            name: z.string().trim().min(1).optional(),
          }),
          method: "POST",
        },
        async (ctx) => {
          const { email, name } = ctx.body;
          const { internalAdapter } = ctx.context;
          const found = await internalAdapter.findUserByEmail(email);
          const user =
            found?.user ??
            (await internalAdapter.createUser(
              {
                email,
                emailVerified: true,
                name: name ?? email.split("@")[0] ?? email,
              },
              { method: "dev-login" }
            ));
          const session = await internalAdapter.createSession(user.id);
          await setSessionCookie(ctx, { session, user });
          // The web sends a new account to the empty Início, like Google's newUserCallbackURL.
          return ctx.json({ isNewUser: !found, user });
        }
      ),
    },
    id: "dev-login",
  }) satisfies BetterAuthPlugin;

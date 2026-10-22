import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Db } from "../db/db.module.js";
import { userSettings } from "../db/domain-schema.js";
import { authUrl, env, googleCredentials } from "../env.js";
import { devLogin } from "./dev-login.js";

export const AUTH = Symbol("AUTH");

// Google is only used to sign in; the app never calls a Google API afterwards, so its tokens
// are not kept. The privacy page promises this.
const withoutGoogleTokens = <T extends object>(account: T) => ({
  data: {
    ...account,
    accessToken: null,
    accessTokenExpiresAt: null,
    idToken: null,
    refreshToken: null,
    refreshTokenExpiresAt: null,
  },
});

// Google is the only way in: the first sign-in creates the account. Sessions live in Postgres
// behind an httpOnly cookie on the app's own origin.
export function createAuth(db: Db) {
  return betterAuth({
    // Later sign-ins would write fresh tokens back into the account row.
    account: { updateAccountOnSignIn: false },
    advanced: { database: { generateId: "uuid" } },
    appName: "Daruma",
    // Passed explicitly so Better Auth gets the values t3-env validated (and the dev URL default).
    baseURL: authUrl,
    database: drizzleAdapter(db, { provider: "pg", usePlural: true }),
    databaseHooks: {
      account: {
        create: { before: async (account) => withoutGoogleTokens(account) },
      },
      // Every account has a settings row from the start; the columns hold the defaults.
      user: {
        create: {
          after: async (user) => {
            await db
              .insert(userSettings)
              .values({ userId: user.id })
              .onConflictDoNothing();
          },
        },
      },
    },
    plugins: env.DEV_LOGIN ? [devLogin()] : [],
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: googleCredentials
      ? {
          // Lets someone with several Google accounts pick one instead of reusing the last.
          google: { ...googleCredentials, prompt: "select_account" },
        }
      : {},
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = NonNullable<
  Awaited<ReturnType<Auth["api"]["getSession"]>>
>;

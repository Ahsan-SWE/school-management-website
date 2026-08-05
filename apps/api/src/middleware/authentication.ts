import type { User } from "@supabase/supabase-js";
import type { Context, Next } from "hono";
import { supabaseAuth } from "../lib/supabase";

export type AuthVariables = {
  authUser: User;
  accessToken: string;
};

type AuthContext = Context<{ Variables: AuthVariables }>;

function readBearerToken(authorizationHeader: string | undefined) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export async function requireAuthentication(context: AuthContext, next: Next) {
  const accessToken = readBearerToken(context.req.header("authorization"));

  if (!accessToken) {
    return context.json(
      {
        type: "https://school-platform.local/problems/authentication-required",
        title: "Authentication required",
        status: 401,
      },
      401,
    );
  }

  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser(accessToken);

  if (error || !user) {
    return context.json(
      {
        type: "https://school-platform.local/problems/invalid-session",
        title: "The session is invalid or expired",
        status: 401,
      },
      401,
    );
  }

  context.set("authUser", user);
  context.set("accessToken", accessToken);
  await next();
}

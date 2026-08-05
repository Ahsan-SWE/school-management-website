import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function requireAuthenticatedSession() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/auth/login");
  }

  return {
    user,
    accessToken: session.access_token,
  };
}

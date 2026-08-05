import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnvironment } from "./environment";

export function createClient() {
  const environment = getSupabasePublicEnvironment();

  return createBrowserClient(environment.url, environment.publishableKey);
}

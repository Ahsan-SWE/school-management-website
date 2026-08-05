import { getApiEnvironment } from "@school-platform/configuration";
import { createClient } from "@supabase/supabase-js";

const environment = getApiEnvironment();

export const supabaseAuth = createClient(
  environment.SUPABASE_URL,
  environment.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

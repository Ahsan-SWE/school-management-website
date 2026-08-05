export function getSupabasePublicEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and a Supabase publishable key are required");
  }

  return { url, publishableKey };
}

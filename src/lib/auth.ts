import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  // Supabase reads Date.now() to check token expiry, which can't run during prerendering.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims.sub;
  if (!id) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio")
    .eq("id", id)
    .single();

  return { id, email: data.claims.email, profile };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!user.profile?.username) redirect("/onboarding");
  return { ...user, username: user.profile.username };
}

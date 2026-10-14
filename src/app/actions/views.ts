"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { VIEWER_COOKIE } from "@/lib/supabase/proxy";

export async function recordView(postId: string) {
  const viewerKey = (await cookies()).get(VIEWER_COOKIE)?.value ?? "";
  const supabase = await createClient();
  await supabase.rpc("record_post_view", { p_post_id: postId, p_anon_key: viewerKey });
}

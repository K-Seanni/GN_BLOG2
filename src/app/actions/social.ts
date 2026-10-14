"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function setLike(postId: string, like: boolean) {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  if (like) {
    await supabase.from("post_likes").upsert(
      { post_id: postId, user_id: user.id },
      { onConflict: "post_id,user_id", ignoreDuplicates: true },
    );
  } else {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
  }

  refresh();
}

export async function setFollow(targetId: string, follow: boolean) {
  const user = await getCurrentUser();
  if (!user || user.id === targetId) return;

  const supabase = await createClient();
  if (follow) {
    await supabase.from("follows").upsert(
      { follower_id: user.id, following_id: targetId },
      { onConflict: "follower_id,following_id", ignoreDuplicates: true },
    );
  } else {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetId);
  }

  refresh();
}

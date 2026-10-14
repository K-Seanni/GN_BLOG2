"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error?: string } | undefined;

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export async function saveProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!USERNAME_PATTERN.test(username)) {
    return { error: "아이디는 영문 소문자, 숫자, _만 써서 3-20자로 정해 주세요." };
  }
  if (bio.length > 160) {
    return { error: "소개는 160자 이내로 써 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ username, full_name: fullName || null, bio: bio || null })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "이미 사용 중인 아이디예요." };
    return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  redirect(`/@${username}`);
}

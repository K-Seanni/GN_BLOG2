"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { cacheTags } from "@/lib/data/cache-tags";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error?: string; message?: string } | undefined;

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const MAX_LINKS = 5;

function invalidateProfile(username: string) {
  updateTag(cacheTags.user(username));
  updateTag(cacheTags.posts);
}

function parseUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && value.length <= 200 ? url.toString() : null;
  } catch {
    return null;
  }
}

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

  invalidateProfile(username);
  redirect(`/@${username}`);
}

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();

  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 50);
  const bio = String(formData.get("bio") ?? "").trim();
  const websiteRaw = String(formData.get("website_url") ?? "").trim();
  const linkLines = String(formData.get("social_links") ?? "")
    .split(/\s+/)
    .map((v) => v.trim())
    .filter(Boolean);

  if (bio.length > 160) return { error: "소개는 160자 이내로 써 주세요." };

  const websiteUrl = websiteRaw ? parseUrl(websiteRaw) : null;
  if (websiteRaw && !websiteUrl) return { error: "웹사이트는 https://로 시작하는 주소여야 해요." };

  const socialLinks = linkLines.map(parseUrl);
  if (socialLinks.some((v) => v === null)) {
    return { error: "소셜 링크는 한 줄에 하나씩, https://로 시작하는 주소로 넣어 주세요." };
  }
  if (socialLinks.length > MAX_LINKS) return { error: `소셜 링크는 ${MAX_LINKS}개까지 넣을 수 있어요.` };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      bio: bio || null,
      website_url: websiteUrl,
      social_links: [...new Set(socialLinks as string[])],
    })
    .eq("id", user.id);

  if (error) return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };

  invalidateProfile(user.username);
  return { message: "저장했어요." };
}

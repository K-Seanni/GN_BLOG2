import { createClient } from "@/lib/supabase/client";

export const POST_IMAGES_BUCKET = "post-images";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function isUploadableImage(file: File) {
  return ALLOWED_TYPES.includes(file.type);
}

export async function uploadImage(file: File, userId: string) {
  if (!isUploadableImage(file)) {
    throw new Error("PNG, JPG, GIF, WEBP 이미지만 올릴 수 있어요.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("이미지는 5MB 이하만 올릴 수 있어요.");
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(POST_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });

  if (error) throw new Error("이미지를 올리지 못했어요. 잠시 후 다시 시도해 주세요.");

  return supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

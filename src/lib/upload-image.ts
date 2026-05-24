import { getSupabaseBrowserClient } from "@/lib/supabase";

/** Must match the bucket name in Supabase Storage exactly (case-sensitive). */
export const IMAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "images";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
]);

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg"]);

function getExtension(filename: string) {
  const index = filename.lastIndexOf(".");
  return index === -1 ? "" : filename.slice(index).toLowerCase();
}

function createUniqueFilename(originalName: string) {
  const extension = getExtension(originalName) || ".jpg";
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${random}${extension}`;
}

function validateImageFile(file: File) {
  if (file.size === 0) {
    throw new Error("No file uploaded.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File size must not exceed 5MB.");
  }

  const extension = getExtension(file.name);
  const mimeAllowed = !file.type || ALLOWED_MIME_TYPES.has(file.type);

  if (!ALLOWED_EXTENSIONS.has(extension) || !mimeAllowed) {
    throw new Error("Only PNG, JPG, JPEG, WEBP, GIF, BMP, and SVG images are allowed.");
  }
}

export async function uploadImageToStorage(file: File): Promise<string> {
  validateImageFile(file);

  const supabase = getSupabaseBrowserClient();
  const filename = createUniqueFilename(file.name);

  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(filename, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    throw new Error(error.message || "Unable to upload image.");
  }

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filename);

  if (!data.publicUrl) {
    throw new Error("Unable to get public URL for uploaded image.");
  }

  return data.publicUrl;
}

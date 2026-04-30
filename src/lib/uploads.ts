import path from "path";
import { mkdir, writeFile } from "fs/promises";

const uploadDirectory = path.join(process.cwd(), "public", "uploads");

export async function saveUploadedFile(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeBaseName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${safeBaseName}`;

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, filename), bytes);

  return `/uploads/${filename}`;
}

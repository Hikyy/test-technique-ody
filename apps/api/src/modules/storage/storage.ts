import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config } from "../../config.js";

const ALLOWED_MIME = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export interface StoredFile {
  url: string;
  mime: string;
  bytes: number;
}

export interface StoreImageInput {
  file: File;
  category: "dishes";
}

export class UploadValidationError extends Error {
  constructor(
    readonly code: "INVALID_MIME" | "FILE_TOO_LARGE" | "EMPTY_FILE",
    message: string,
  ) {
    super(message);
  }
}

export async function storeImage({ file, category }: StoreImageInput): Promise<StoredFile> {
  const mime = file.type.toLowerCase();
  const ext = ALLOWED_MIME.get(mime);

  if (!ext) {
    throw new UploadValidationError("INVALID_MIME", "Only PNG, JPEG and WebP images are accepted");
  }

  if (file.size === 0) {
    throw new UploadValidationError("EMPTY_FILE", "Empty file");
  }

  if (file.size > config.UPLOAD_MAX_BYTES) {
    throw new UploadValidationError(
      "FILE_TOO_LARGE",
      `File exceeds ${Math.round(config.UPLOAD_MAX_BYTES / 1024 / 1024)} MB`,
    );
  }

  const filename = `${randomUUID()}.${ext}`;
  const dir = resolve(process.cwd(), config.STORAGE_DIR, category);

  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, filename), Buffer.from(await file.arrayBuffer()));

  return {
    url: `${config.STORAGE_PUBLIC_PATH}/${category}/${filename}`,
    mime,
    bytes: file.size,
  };
}

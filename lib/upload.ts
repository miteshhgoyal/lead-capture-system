import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
]);

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

export function sanitizeSvg(svgContent: string): string {
  // Strip <script> tags, onload, onerror, javascript: links, and dangerous XML directives
  return svgContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^>\s]+/gi, "")
    .replace(/javascript:/gi, "blocked:")
    .replace(/data:text\/html/gi, "blocked:")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<!ENTITY[^>]*>/gi, "");
}

export async function processAndSaveUpload(
  file: File
): Promise<{ url: string; filename: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds 2 MB limit");
  }

  const mimeType = file.type.toLowerCase();
  const originalExt = path.extname(file.name).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(mimeType) && !ALLOWED_EXTENSIONS.has(originalExt)) {
    throw new Error("Invalid file type. Allowed formats: PNG, JPG, WebP, SVG");
  }

  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  // If SVG, sanitize it
  if (mimeType === "image/svg+xml" || originalExt === ".svg") {
    const rawSvg = buffer.toString("utf-8");
    const sanitized = sanitizeSvg(rawSvg);
    buffer = Buffer.from(sanitized, "utf-8");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Cloudinary storage if configured
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "onestock/partners",
          resource_type: mimeType === "image/svg+xml" || originalExt === ".svg" ? "raw" : "image",
        },
        (error, result) => {
          if (error || !result) {
            reject(new Error(error?.message || "Cloudinary upload failed"));
          } else {
            resolve({
              url: result.secure_url,
              filename: result.public_id,
            });
          }
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Persistent local storage fallback (/public/uploads)
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const randomHash = crypto.randomBytes(8).toString("hex");
  const ext = originalExt || (mimeType === "image/svg+xml" ? ".svg" : ".png");
  const filename = `logo_${Date.now()}_${randomHash}${ext}`;
  const filePath = path.join(uploadsDir, filename);

  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${filename}`,
    filename,
  };
}

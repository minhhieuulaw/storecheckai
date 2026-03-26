/**
 * Object storage helper — S3-compatible (Cloudflare R2 or AWS S3)
 *
 * Required env vars:
 *   R2_ACCOUNT_ID        — Cloudflare account ID (R2 only)
 *   R2_ACCESS_KEY_ID     — Access key ID
 *   R2_SECRET_ACCESS_KEY — Secret access key
 *   R2_BUCKET_NAME       — Bucket name
 *   R2_PUBLIC_URL        — Public base URL, e.g. https://pub-xxx.r2.dev
 *
 * Falls back gracefully: if env vars are missing, upload returns null
 * and callers should fall back to storing base64 (legacy path).
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

function getClient(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  const endpoint = accountId.length > 0
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : undefined;

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * Upload a base64 data URL to object storage.
 * Returns the public URL string, or null if storage is not configured.
 */
export async function uploadBase64Image(
  base64DataUrl: string,
  folder = "scam-reports",
): Promise<string | null> {
  const client = getClient();
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!client || !bucket || !publicUrl) return null;

  // Parse data URL: data:<mime>;base64,<data>
  const match = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const [, mimeType, b64] = match;

  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
  const key = `${folder}/${crypto.randomUUID()}.${ext}`;
  const body = Buffer.from(b64, "base64");

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: mimeType,
    CacheControl: "public, max-age=31536000, immutable",
  }));

  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}

/**
 * Upload multiple base64 images. Skips entries that fail.
 * Returns an array of public URLs (or original base64 strings if storage unavailable).
 */
export async function uploadImages(images: string[], folder = "scam-reports"): Promise<string[]> {
  const results = await Promise.allSettled(
    images.map(img => uploadBase64Image(img, folder)),
  );
  return results.map((r, i) => {
    if (r.status === "fulfilled" && r.value) return r.value;
    return images[i]; // fall back to original base64
  });
}

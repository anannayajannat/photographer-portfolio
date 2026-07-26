import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * Upload a raw file buffer to Cloudinary. We store the ORIGINAL as an
 * authenticated (type: "authenticated") asset — this means Cloudinary
 * itself refuses to serve it without a signed URL, so even someone with
 * the public_id cannot pull the full-res file directly.
 *
 * Returns Cloudinary's own detected `format`, dimensions, and byte size —
 * not the client-supplied extension/MIME/size, which are unverified
 * claims about a file the client controls. This is what gets shown to
 * buyers on the photo page so "what am I actually buying" has a real,
 * server-verified answer instead of nothing.
 */
export function uploadOriginal(
  buffer: Buffer,
  folder: string
): Promise<{ publicId: string; format: string; width: number; height: number; bytes: number }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, type: "authenticated", resource_type: "image" },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve({
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      }
    );
    stream.end(buffer);
  });
}

/** Public, watermarked, size-capped preview — safe to expose to anyone. */
export function uploadPreview(buffer: Buffer, folder: string): Promise<string> {
  const watermarkText = process.env.WATERMARK_TEXT?.trim() || "PORTFOLIO";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        type: "upload",
        resource_type: "image",
        // Downscale + compress so the preview is unusable as a print-quality
        // asset even if someone right-click-saves it, plus a small brand
        // mark baked into the corner pixels — not a CSS overlay, so it
        // survives "view source", disabling styles, or a raw image save.
        // Corner placement (not a rotated diagonal through the center)
        // keeps the photo itself the focus, the way real stock/portfolio
        // sites mark previews.
        transformation: [
          { width: 1600, crop: "limit", quality: "auto:good" },
          {
            overlay: {
              font_family: "Arial",
              font_size: 22,
              font_weight: "bold",
              text: watermarkText,
            },
            opacity: 55,
            gravity: "south_east",
            x: 20,
            y: 16,
            color: "#ffffff",
          },
        ],
      },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve(result.public_id);
      }
    );
    stream.end(buffer);
  });
}

export function previewUrl(publicId: string): string {
  return cloudinary.url(publicId, { secure: true });
}

/**
 * Service photos are promotional, not sellable content — no watermark,
 * no authenticated/locked storage. Just a straightforward public upload
 * with a sane size cap.
 */
export function uploadServiceImage(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "services", type: "upload", resource_type: "image", transformation: [{ width: 1600, crop: "limit", quality: "auto:good" }] },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve(result.public_id);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Signed, short-lived URL for the real file. Only ever called from a
 * server route AFTER ownership/payment has been verified — never exposed
 * to the client ahead of time. `format` must be the format Cloudinary
 * actually stored (see uploadOriginal) — passing the wrong one triggers
 * an unwanted on-the-fly conversion instead of serving the original bytes.
 */
export function signedOriginalUrl(
  publicId: string,
  format: string,
  expirySeconds = 3600
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expirySeconds;
  return cloudinary.utils.private_download_url(publicId, format, {
    type: "authenticated",
    expires_at: expiresAt,
  } as any);
}

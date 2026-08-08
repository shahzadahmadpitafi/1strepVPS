import { Response } from "express";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ── Mode detection ────────────────────────────────────────────────────────────
// R2 mode activates when Cloudflare R2 credentials are present.
// Falls back to local disk storage otherwise (default for self-hosted deploys).

export function isR2Mode(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

// ── R2 / S3 client (lazy init) ────────────────────────────────────────────────
let _r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_r2Client) return _r2Client;
  _r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return _r2Client;
}

const r2Bucket = () => process.env.R2_BUCKET_NAME!;

// ── Local disk storage ─────────────────────────────────────────────────────────
const STORAGE_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), "object_storage");

const PUBLIC_DIR = path.join(STORAGE_ROOT, "public-objects");
const PRIVATE_DIR = path.join(STORAGE_ROOT, "private");

// Strip leading slashes/.. segments so keys can't escape the storage root
function safeJoin(root: string, key: string): string {
  const cleaned = path
    .normalize(key)
    .split(path.sep)
    .filter((seg) => seg !== "" && seg !== "..")
    .join(path.sep);
  return path.join(root, cleaned);
}

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".json": "application/json",
  ".csv": "text/csv",
};

function guessContentType(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

async function walkMediaFiles(
  dir: string,
  prefix = ""
): Promise<Array<{ name: string; rel: string; size: number; mtime: Date }>> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const results: Array<{ name: string; rel: string; size: number; mtime: Date }> = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkMediaFiles(full, rel)));
    } else if (/\.(jpg|jpeg|png|gif|webp|svg|avif|mp4|webm|mov|avi|mkv)$/i.test(entry.name)) {
      const stat = await fs.promises.stat(full);
      results.push({ name: entry.name, rel, size: stat.size, mtime: stat.mtime });
    }
  }
  return results;
}

// ── Error class ───────────────────────────────────────────────────────────────
export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// ── Main service ──────────────────────────────────────────────────────────────
export class ObjectStorageService {
  constructor() {}

  static isConfigured(): boolean {
    // Local disk storage needs no external configuration; R2 is opt-in via env vars.
    return true;
  }

  // ── Unified public upload ─────────────────────────────────────────────────
  // key can include a subdirectory, e.g. "influencer-avatars/abc/photo.jpg"
  async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
    const sanitized = key.replace(/[^a-zA-Z0-9._\-\/]/g, "_");

    if (isR2Mode()) {
      await getR2Client().send(
        new PutObjectCommand({
          Bucket: r2Bucket(),
          Key: `public-objects/${sanitized}`,
          Body: buffer,
          ContentType: contentType,
        })
      );
    } else {
      const filePath = safeJoin(PUBLIC_DIR, sanitized);
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, buffer);
    }

    return `/public-objects/${sanitized}`;
  }

  // ── Unified public serve ──────────────────────────────────────────────────
  // Returns false if the object doesn't exist; throws on other errors.
  async servePublicObject(filePath: string, res: Response, cacheTtl = 604800): Promise<boolean> {
    if (isR2Mode()) {
      try {
        const result = await getR2Client().send(
          new GetObjectCommand({ Bucket: r2Bucket(), Key: `public-objects/${filePath}` })
        );
        res.set({
          "Content-Type": result.ContentType || "application/octet-stream",
          "Cache-Control": `public, max-age=${cacheTtl}, immutable`,
        });
        if (result.ContentLength) res.set("Content-Length", String(result.ContentLength));
        (result.Body as Readable).pipe(res);
        return true;
      } catch (err: any) {
        if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) return false;
        throw err;
      }
    }

    const resolved = safeJoin(PUBLIC_DIR, filePath);
    try {
      const stat = await fs.promises.stat(resolved);
      res.set({
        "Content-Type": guessContentType(resolved),
        "Content-Length": String(stat.size),
        "Cache-Control": `public, max-age=${cacheTtl}, immutable`,
      });
      const stream = fs.createReadStream(resolved);
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) res.status(500).json({ error: "Error streaming file" });
      });
      stream.pipe(res);
      return true;
    } catch (err: any) {
      if (err.code === "ENOENT") return false;
      throw err;
    }
  }

  // ── Get raw buffer (for on-the-fly resize) ────────────────────────────────
  async getPublicBuffer(filePath: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    if (isR2Mode()) {
      try {
        const result = await getR2Client().send(
          new GetObjectCommand({ Bucket: r2Bucket(), Key: `public-objects/${filePath}` })
        );
        const chunks: Buffer[] = [];
        for await (const chunk of result.Body as Readable) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return { buffer: Buffer.concat(chunks), contentType: result.ContentType || "application/octet-stream" };
      } catch (err: any) {
        if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) return null;
        throw err;
      }
    }

    const resolved = safeJoin(PUBLIC_DIR, filePath);
    try {
      const buffer = await fs.promises.readFile(resolved);
      return { buffer, contentType: guessContentType(resolved) };
    } catch (err: any) {
      if (err.code === "ENOENT") return null;
      throw err;
    }
  }

  // ── Private file upload (documents, etc.) ─────────────────────────────────
  async uploadPrivateBuffer(key: string, buffer: Buffer, contentType: string): Promise<void> {
    if (isR2Mode()) {
      await getR2Client().send(
        new PutObjectCommand({ Bucket: r2Bucket(), Key: `private/${key}`, Body: buffer, ContentType: contentType })
      );
      return;
    }
    const filePath = safeJoin(PRIVATE_DIR, key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
  }

  // ── Private file download ─────────────────────────────────────────────────
  async downloadPrivateBuffer(key: string): Promise<Buffer | null> {
    if (isR2Mode()) {
      try {
        const result = await getR2Client().send(new GetObjectCommand({ Bucket: r2Bucket(), Key: `private/${key}` }));
        const chunks: Buffer[] = [];
        for await (const chunk of result.Body as Readable) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
      } catch (err: any) {
        if (err.name === "NoSuchKey" || err.$metadata?.httpStatusCode === 404) return null;
        throw err;
      }
    }
    try {
      return await fs.promises.readFile(safeJoin(PRIVATE_DIR, key));
    } catch (err: any) {
      if (err.code === "ENOENT") return null;
      throw err;
    }
  }

  // ── Private file delete ───────────────────────────────────────────────────
  async deletePrivateObject(key: string): Promise<void> {
    if (isR2Mode()) {
      try {
        await getR2Client().send(new DeleteObjectCommand({ Bucket: r2Bucket(), Key: `private/${key}` }));
      } catch (err) {
        console.warn("Could not delete from R2:", err);
      }
      return;
    }
    try {
      await fs.promises.unlink(safeJoin(PRIVATE_DIR, key));
    } catch (err) {
      console.warn("Could not delete from local storage:", err);
    }
  }

  // ── List public objects ───────────────────────────────────────────────────
  async listPublicObjects(
    searchQuery?: string
  ): Promise<Array<{ name: string; objectPath: string; size: number; updatedAt: Date; type?: string }>> {
    if (isR2Mode()) {
      try {
        const result = await getR2Client().send(
          new ListObjectsV2Command({ Bucket: r2Bucket(), Prefix: "public-objects/", MaxKeys: 1000 })
        );
        let items = (result.Contents || [])
          .filter((obj) =>
            /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|avi|mkv)$/i.test((obj.Key || "").split("/").pop() || "")
          )
          .map((obj) => {
            const name = (obj.Key || "").split("/").pop() || obj.Key || "";
            const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(name);
            return {
              name,
              objectPath: `/public-objects/${name}`,
              size: obj.Size || 0,
              updatedAt: obj.LastModified || new Date(),
              type: isVideo ? "video" : "image",
            };
          });
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          items = items.filter((i) => i.name.toLowerCase().includes(q));
        }
        return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 100);
      } catch (error) {
        console.error("Error listing R2 objects:", error);
        return [];
      }
    }

    try {
      let items = (await walkMediaFiles(PUBLIC_DIR)).map((f) => ({
        name: f.name,
        objectPath: `/public-objects/${f.rel}`,
        size: f.size,
        updatedAt: f.mtime,
        type: /\.(mp4|webm|mov|avi|mkv)$/i.test(f.name) ? "video" : "image",
      }));
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        items = items.filter((i) => i.name.toLowerCase().includes(q));
      }
      return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 100);
    } catch (error) {
      console.error("Error listing local objects:", error);
      return [];
    }
  }

  // ── Direct-upload URL. In R2 mode the client PUTs straight to Cloudflare;
  // in local mode it PUTs to our own server, which writes the bytes to disk. ──
  async getObjectEntityUploadURL(filename?: string): Promise<{ uploadURL: string; objectPath: string }> {
    const sanitizedFilename = filename ? filename.replace(/[^a-zA-Z0-9._-]/g, "_") : `image_${randomUUID()}`;

    if (isR2Mode()) {
      const key = `public-objects/${sanitizedFilename}`;
      const uploadURL = await getSignedUrl(getR2Client(), new PutObjectCommand({ Bucket: r2Bucket(), Key: key }), {
        expiresIn: 900,
      });
      return { uploadURL, objectPath: `/public-objects/${sanitizedFilename}` };
    }

    return {
      uploadURL: `/api/local-object-upload/${sanitizedFilename}`,
      objectPath: `/public-objects/${sanitizedFilename}`,
    };
  }

  // ── Private object lookup, used by GET /objects/:objectPath (local mode only;
  // R2 mode serves private objects via downloadPrivateBuffer instead) ────────
  async getObjectEntityFile(objectPath: string): Promise<{ localPath: string }> {
    if (isR2Mode()) throw new ObjectNotFoundError();
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const entityId = objectPath.slice("/objects/".length);
    const resolved = safeJoin(PRIVATE_DIR, entityId);
    try {
      await fs.promises.access(resolved, fs.constants.R_OK);
    } catch {
      throw new ObjectNotFoundError();
    }
    return { localPath: resolved };
  }

  async downloadObject(file: { localPath: string }, res: Response, cacheTtlSec = 3600) {
    try {
      const stat = await fs.promises.stat(file.localPath);
      res.set({
        "Content-Type": guessContentType(file.localPath),
        "Content-Length": String(stat.size),
        "Cache-Control": `private, max-age=${cacheTtlSec}`,
      });
      const stream = fs.createReadStream(file.localPath);
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) res.status(500).json({ error: "Error streaming file" });
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) res.status(500).json({ error: "Error downloading file" });
    }
  }

  getPublicUrl(objectPath: string, _requestHost?: string, _forwardedProto?: string): string {
    // Always relative — works on any domain
    return objectPath;
  }
}

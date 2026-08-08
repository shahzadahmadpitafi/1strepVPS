/**
 * Migration script: copy all public objects from Replit GCS → Cloudflare R2
 *
 * Run ONCE on the VPS (or on Replit before moving) after setting R2 credentials:
 *
 *   R2_ACCOUNT_ID=xxx
 *   R2_ACCESS_KEY_ID=xxx
 *   R2_SECRET_ACCESS_KEY=xxx
 *   R2_BUCKET_NAME=xxx
 *   PUBLIC_OBJECT_SEARCH_PATHS=xxx   (still needed to read from GCS)
 *
 * Usage:
 *   npx tsx scripts/migrate-to-r2.ts
 *
 * The script is idempotent — re-running it will skip files that already exist in R2.
 */

import { Storage } from "@google-cloud/storage";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

// ── Config ────────────────────────────────────────────────────────────────────

const REPLIT_SIDECAR = "http://127.0.0.1:1106";

const gcs = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME!;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) path = `/${path}`;
  const parts = path.split("/");
  return { bucketName: parts[1], objectName: parts.slice(2).join("/") };
}

async function existsInR2(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function migrate() {
  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.R2_BUCKET_NAME ||
    !process.env.PUBLIC_OBJECT_SEARCH_PATHS
  ) {
    console.error(
      "❌ Missing required env vars. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
        "R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and PUBLIC_OBJECT_SEARCH_PATHS."
    );
    process.exit(1);
  }

  const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS.split(",").map(
    (p) => p.trim()
  );

  let totalFiles = 0;
  let skipped = 0;
  let copied = 0;
  let failed = 0;

  for (const publicPath of publicPaths) {
    const { bucketName, objectName: prefix } = parseObjectPath(publicPath);
    console.log(`\n📦 Reading GCS bucket: ${bucketName}, prefix: ${prefix}`);

    const bucket = gcs.bucket(bucketName);
    const [files] = await bucket.getFiles({ prefix });

    console.log(`   Found ${files.length} objects`);
    totalFiles += files.length;

    for (const file of files) {
      const filename = file.name.split("/").pop() || file.name;
      const r2Key = `public-objects/${filename}`;

      // Skip if already in R2
      if (await existsInR2(r2Key)) {
        process.stdout.write(`  ⏭  ${filename} (already exists)\n`);
        skipped++;
        continue;
      }

      try {
        const [buffer] = await file.download();
        const [metadata] = await file.getMetadata();
        const contentType =
          (metadata.contentType as string) || "application/octet-stream";

        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: r2Key,
            Body: buffer,
            ContentType: contentType,
          })
        );

        process.stdout.write(`  ✅ ${filename} (${Math.round(buffer.length / 1024)}KB)\n`);
        copied++;
      } catch (err: any) {
        process.stdout.write(`  ❌ ${filename}: ${err.message}\n`);
        failed++;
      }
    }
  }

  console.log("\n─────────────────────────────────────");
  console.log(`Migration complete:`);
  console.log(`  Total files : ${totalFiles}`);
  console.log(`  Copied      : ${copied}`);
  console.log(`  Skipped     : ${skipped} (already in R2)`);
  console.log(`  Failed      : ${failed}`);
  console.log("─────────────────────────────────────");

  if (failed > 0) {
    console.log("\n⚠️  Some files failed. Re-run the script to retry them.");
    process.exit(1);
  } else {
    console.log("\n🎉 All files migrated successfully!");
  }
}

migrate().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

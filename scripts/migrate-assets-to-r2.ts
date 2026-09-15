import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const OUT_DIR = path.join(ROOT, ".migration-output");
const TEMP_DIR = path.join(OUT_DIR, "temp-r2-assets");

const BUCKET = "omove-store-files";
const DB = "omove-store-db";

const isExecute = process.argv.includes("--execute");

// Ensure output directories exist
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TEMP_DIR, { recursive: true });

interface AssetTask {
  table: "products" | "digital_products" | "services" | "blogs";
  recordId: string;
  field: string;
  arrayIndex?: number;
  sourceType: "base64" | "local_file" | "external_url" | "already_r2" | "empty";
  sourceValue: string;
  targetKey: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  status: "pending" | "uploaded" | "skipped" | "missing" | "external" | "failed";
  reason?: string;
}

interface MigrationReport {
  timestamp: string;
  mode: "DRY_RUN" | "EXECUTE";
  bucket: string;
  summary: {
    total: number;
    uploaded: number;
    skipped: number;
    missing: number;
    external: number;
    failed: number;
  };
  details: {
    uploaded: AssetTask[];
    skipped: AssetTask[];
    missing: AssetTask[];
    external: AssetTask[];
    failed: AssetTask[];
  };
}

// ─── UTILITIES ───

function safeReadJson(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Execute a read-only query on remote production D1.
 * Uses shell redirection to avoid Node.js / libuv pipe assertions on Windows.
 */
function queryD1(sql: string): any[] {
  const tempOutFile = path.join(OUT_DIR, `query_out_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.json`);
  try {
    const cmd = `npx wrangler d1 execute ${DB} --remote --json --command "${sql.replace(/"/g, '\\"')}" -y > "${tempOutFile}" 2>&1`;
    execSync(cmd, { cwd: ROOT, shell: "cmd.exe", stdio: "ignore" });
    if (fs.existsSync(tempOutFile)) {
      const raw = fs.readFileSync(tempOutFile, "utf8");
      fs.unlinkSync(tempOutFile);
      const start = raw.indexOf("[");
      const end = raw.lastIndexOf("]");
      if (start !== -1 && end !== -1 && end > start) {
        const parsed = JSON.parse(raw.substring(start, end + 1));
        if (Array.isArray(parsed) && parsed[0]?.results) {
          return parsed[0].results;
        }
      }
    }
    return [];
  } catch (err: any) {
    if (fs.existsSync(tempOutFile)) fs.unlinkSync(tempOutFile);
    console.warn(`[D1 QUERY WARN] Failed to query remote D1: ${err?.message || err}`);
    return [];
  }
}

/**
 * Execute a SQL mutation on remote production D1 via a temporary SQL file with -y flag.
 * Only executes if isExecute is true.
 */
function executeD1(sql: string): boolean {
  if (!isExecute) return true;
  const tempSqlFile = path.join(TEMP_DIR, `exec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.sql`);
  const tempLogFile = path.join(TEMP_DIR, `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.log`);
  try {
    fs.writeFileSync(tempSqlFile, sql, "utf8");
    const cmd = `npx wrangler d1 execute ${DB} --remote --file="${tempSqlFile}" -y > "${tempLogFile}" 2>&1`;
    execSync(cmd, { cwd: ROOT, shell: "cmd.exe", stdio: "ignore" });
    if (fs.existsSync(tempSqlFile)) fs.unlinkSync(tempSqlFile);
    if (fs.existsSync(tempLogFile)) fs.unlinkSync(tempLogFile);
    return true;
  } catch (err: any) {
    if (fs.existsSync(tempSqlFile)) fs.unlinkSync(tempSqlFile);
    let logMsg = "";
    if (fs.existsSync(tempLogFile)) {
      logMsg = fs.readFileSync(tempLogFile, "utf8");
      fs.unlinkSync(tempLogFile);
    }
    console.error(`[D1 UPDATE ERROR] ${err?.message || err}\n${logMsg}`);
    return false;
  }
}

function isExternalUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const s = url.trim().toLowerCase();
  return (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("//")
  ) && !s.includes("localhost") && !s.includes("127.0.0.1");
}

function isR2Url(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const s = url.trim().toLowerCase();
  return s.startsWith("/api/r2/") || s.startsWith("r2://");
}

function parseDataUrl(dataUrl: string): { mimeType: string; extension: string; buffer: Buffer } | null {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/s);
  if (!match) return null;
  const mimeType = match[1].toLowerCase().trim();
  const base64Data = match[2].trim();

  // Safety check: Prevent excessive memory blowup (> 50MB)
  if (base64Data.length > 50 * 1024 * 1024) {
    return null;
  }

  const buffer = Buffer.from(base64Data, "base64");
  let extension = "bin";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) extension = "jpg";
  else if (mimeType.includes("png")) extension = "png";
  else if (mimeType.includes("webp")) extension = "webp";
  else if (mimeType.includes("gif")) extension = "gif";
  else if (mimeType.includes("svg")) extension = "svg";
  else if (mimeType.includes("pdf")) extension = "pdf";
  else if (mimeType.includes("zip")) extension = "zip";

  return { mimeType, extension, buffer };
}

function resolveLocalFile(rawPath: string): string | null {
  if (!rawPath || typeof rawPath !== "string") return null;
  const clean = rawPath.trim();
  if (isExternalUrl(clean) || isR2Url(clean) || clean.startsWith("data:")) return null;

  const candidates = [
    path.resolve(ROOT, clean.replace(/^\//, "")),
    path.resolve(ROOT, "public", clean.replace(/^\//, "")),
    path.resolve(ROOT, "public", clean),
    path.resolve(ROOT, clean)
  ];

  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return c;
    }
  }
  return null;
}

function getMimeTypeFromPath(filePath: string): { mimeType: string; extension: string } {
  const ext = path.extname(filePath).toLowerCase().replace(".", "") || "bin";
  let mimeType = "application/octet-stream";
  if (ext === "png") mimeType = "image/png";
  else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
  else if (ext === "webp") mimeType = "image/webp";
  else if (ext === "svg") mimeType = "image/svg+xml";
  else if (ext === "gif") mimeType = "image/gif";
  else if (ext === "pdf") mimeType = "application/pdf";
  else if (ext === "zip") mimeType = "application/zip";
  return { mimeType, extension: ext };
}

function checkR2ObjectExists(key: string): boolean {
  if (!isExecute) return false;
  const tempCheck = path.join(TEMP_DIR, `check_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.tmp`);
  const tempLog = path.join(TEMP_DIR, `check_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.log`);
  try {
    const cmd = `npx wrangler r2 object get ${BUCKET}/${key} --file="${tempCheck}" --remote > "${tempLog}" 2>&1`;
    execSync(cmd, { cwd: ROOT, shell: "cmd.exe", stdio: "ignore" });
    if (fs.existsSync(tempCheck)) fs.unlinkSync(tempCheck);
    if (fs.existsSync(tempLog)) fs.unlinkSync(tempLog);
    return true;
  } catch {
    if (fs.existsSync(tempCheck)) fs.unlinkSync(tempCheck);
    if (fs.existsSync(tempLog)) fs.unlinkSync(tempLog);
    return false;
  }
}

function uploadToR2(key: string, localFilePath: string, mimeType: string): boolean {
  if (!isExecute) return true;
  const tempLogFile = path.join(TEMP_DIR, `r2_up_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.log`);
  try {
    const cmd = `npx wrangler r2 object put ${BUCKET}/${key} --file="${localFilePath}" --remote --content-type="${mimeType}" -y > "${tempLogFile}" 2>&1`;
    execSync(cmd, { cwd: ROOT, shell: "cmd.exe", stdio: "ignore" });
    if (fs.existsSync(tempLogFile)) fs.unlinkSync(tempLogFile);
    return true;
  } catch (err: any) {
    let logMsg = "";
    if (fs.existsSync(tempLogFile)) {
      logMsg = fs.readFileSync(tempLogFile, "utf8");
      fs.unlinkSync(tempLogFile);
    }
    console.error(`[R2 UPLOAD ERROR] Key: ${key} - ${err?.message || err}\n${logMsg}`);
    return false;
  }
}

function updateD1Record(task: AssetTask, newApiUrl: string): boolean {
  if (!isExecute) return true;
  if (task.field === "screenshots" && task.arrayIndex !== undefined) {
    const rows = queryD1(`SELECT screenshots FROM ${task.table} WHERE id='${task.recordId}';`);
    let curScreenshots: any[] = [];
    if (rows.length > 0 && rows[0].screenshots) {
      try { curScreenshots = JSON.parse(rows[0].screenshots); } catch {}
    }
    while (curScreenshots.length <= task.arrayIndex) curScreenshots.push(null);
    if (curScreenshots[task.arrayIndex] === newApiUrl) return true;
    curScreenshots[task.arrayIndex] = newApiUrl;
    const serialized = JSON.stringify(curScreenshots).replace(/'/g, "''");
    return executeD1(`UPDATE ${task.table} SET screenshots='${serialized}' WHERE id='${task.recordId}';`);
  } else {
    return executeD1(`UPDATE ${task.table} SET ${task.field}='${newApiUrl}' WHERE id='${task.recordId}';`);
  }
}

// ─── MAIN MIGRATION WORKFLOW ───

async function main() {
  console.log("==========================================================");
  console.log("📦 OMOVE STORE R2 CATALOG ASSET MIGRATION");
  console.log("==========================================================");
  console.log(`Mode:    ${isExecute ? "🚨 EXECUTE (Real Upload to R2 & D1 Update)" : "ℹ️ DRY-RUN (Validation & Planning Only)"}`);
  console.log(`Bucket:  ${BUCKET}`);
  console.log(`D1 DB:   ${DB}`);
  console.log("==========================================================\n");

  if (!isExecute) {
    console.log("⚠️ DRY RUN MODE: No files will be uploaded, and no D1 records will be altered.");
    console.log("   To perform the actual migration, rerun with the flag: --execute\n");
  }

  // 1. Fetch D1 authoritative records (with JSON fallback context)
  console.log("🔍 Fetching catalog records from D1...");
  let d1Products = queryD1("SELECT id, name, image, screenshots, file_url, google_drive_url FROM products;");
  let d1DigitalProducts = queryD1("SELECT id, name, image, preview_image, screenshots, file_url FROM digital_products;");
  let d1Services = queryD1("SELECT id, title, icon_name FROM services;");
  let d1Blogs = queryD1("SELECT id, title, image FROM blogs;");

  // Fallback to local JSON files if D1 query was empty or offline
  const localProducts = safeReadJson(path.join(DATA_DIR, "products.json"));
  const localDigitalProducts = safeReadJson(path.join(DATA_DIR, "digital_products.json"));
  const localServices = safeReadJson(path.join(DATA_DIR, "services.json"));
  const localBlogs = safeReadJson(path.join(DATA_DIR, "blogs.json"));

  if (d1Products.length === 0 && localProducts.length > 0) d1Products = localProducts;
  if (d1DigitalProducts.length === 0 && localDigitalProducts.length > 0) d1DigitalProducts = localDigitalProducts;
  if (d1Services.length === 0 && localServices.length > 0) d1Services = localServices;
  if (d1Blogs.length === 0 && localBlogs.length > 0) d1Blogs = localBlogs;

  console.log(`Found:`);
  console.log(`- Products:         ${d1Products.length}`);
  console.log(`- Digital Products: ${d1DigitalProducts.length}`);
  console.log(`- Services:         ${d1Services.length}`);
  console.log(`- Blogs:            ${d1Blogs.length}\n`);

  const tasks: AssetTask[] = [];

  // Helper to cross-reference D1 record with original JSON (to recover base64 if D1 has null)
  function getRawValue(d1Record: any, field: string, jsonList: any[]): any {
    const val = d1Record[field];
    if (val && typeof val === "string" && val.trim() !== "") return val;
    // Cross-reference original JSON
    const orig = jsonList.find((j: any) => j.id === d1Record.id);
    if (orig && orig[field]) return orig[field];
    return null;
  }

  // Helper to cross-reference screenshot arrays
  function getRawScreenshots(d1Record: any, jsonList: any[]): any[] {
    let arr: any[] = [];
    if (d1Record.screenshots) {
      if (Array.isArray(d1Record.screenshots)) arr = d1Record.screenshots;
      else if (typeof d1Record.screenshots === "string") {
        try { arr = JSON.parse(d1Record.screenshots); } catch {}
      }
    }
    const hasValid = arr.some(s => s && typeof s === "string" && s.trim() !== "");
    if (!hasValid) {
      const orig = jsonList.find((j: any) => j.id === d1Record.id);
      if (orig && Array.isArray(orig.screenshots)) return orig.screenshots;
    }
    return arr;
  }

  // 2. Process Store Products
  for (const prod of d1Products) {
    const pId = prod.id;
    const rawImage = getRawValue(prod, "image", localProducts);

    if (rawImage) {
      if (isR2Url(rawImage)) {
        tasks.push({
          table: "products",
          recordId: pId,
          field: "image",
          sourceType: "already_r2",
          sourceValue: rawImage,
          targetKey: rawImage.replace(/^\/api\/r2\//, "").replace(/^r2:\/\//, ""),
          mimeType: "application/octet-stream",
          extension: "",
          sizeBytes: 0,
          status: "skipped",
          reason: "Already migrated to R2 in D1"
        });
      } else {
        const dataUrl = parseDataUrl(rawImage);
        if (dataUrl) {
          tasks.push({
            table: "products",
            recordId: pId,
            field: "image",
            sourceType: "base64",
            sourceValue: rawImage.substring(0, 50) + "...",
            targetKey: `products/${pId}/image.${dataUrl.extension}`,
            mimeType: dataUrl.mimeType,
            extension: dataUrl.extension,
            sizeBytes: dataUrl.buffer.byteLength,
            status: "pending"
          });
        } else if (isExternalUrl(rawImage)) {
          tasks.push({
            table: "products",
            recordId: pId,
            field: "image",
            sourceType: "external_url",
            sourceValue: rawImage,
            targetKey: `products/${pId}/image`,
            mimeType: "text/uri-list",
            extension: "",
            sizeBytes: 0,
            status: "external",
            reason: "External URL not modified"
          });
        } else {
          const localPath = resolveLocalFile(rawImage);
          if (localPath) {
            const { mimeType, extension } = getMimeTypeFromPath(localPath);
            tasks.push({
              table: "products",
              recordId: pId,
              field: "image",
              sourceType: "local_file",
              sourceValue: localPath,
              targetKey: `products/${pId}/image.${extension}`,
              mimeType,
              extension,
              sizeBytes: fs.statSync(localPath).size,
              status: "pending"
            });
          } else {
            tasks.push({
              table: "products",
              recordId: pId,
              field: "image",
              sourceType: "local_file",
              sourceValue: rawImage,
              targetKey: `products/${pId}/image`,
              mimeType: "application/octet-stream",
              extension: "",
              sizeBytes: 0,
              status: "missing",
              reason: `Local file not found: ${rawImage}`
            });
          }
        }
      }
    }

    const screenshots = getRawScreenshots(prod, localProducts);
    screenshots.forEach((shot: any, idx: number) => {
      if (!shot) return;
      if (isR2Url(shot)) {
        tasks.push({
          table: "products",
          recordId: pId,
          field: "screenshots",
          arrayIndex: idx,
          sourceType: "already_r2",
          sourceValue: shot,
          targetKey: shot.replace(/^\/api\/r2\//, "").replace(/^r2:\/\//, ""),
          mimeType: "application/octet-stream",
          extension: "",
          sizeBytes: 0,
          status: "skipped",
          reason: "Already migrated to R2 in D1"
        });
      } else {
        const dataUrl = parseDataUrl(shot);
        if (dataUrl) {
          tasks.push({
            table: "products",
            recordId: pId,
            field: "screenshots",
            arrayIndex: idx,
            sourceType: "base64",
            sourceValue: shot.substring(0, 50) + "...",
            targetKey: `products/${pId}/screenshots/${idx}.${dataUrl.extension}`,
            mimeType: dataUrl.mimeType,
            extension: dataUrl.extension,
            sizeBytes: dataUrl.buffer.byteLength,
            status: "pending"
          });
        } else if (isExternalUrl(shot)) {
          tasks.push({
            table: "products",
            recordId: pId,
            field: "screenshots",
            arrayIndex: idx,
            sourceType: "external_url",
            sourceValue: shot,
            targetKey: `products/${pId}/screenshots/${idx}`,
            mimeType: "text/uri-list",
            extension: "",
            sizeBytes: 0,
            status: "external",
            reason: "External screenshot URL"
          });
        }
      }
    });
  }

  // 3. Process Digital Products
  for (const dp of d1DigitalProducts) {
    const pId = dp.id;
    const rawImage = getRawValue(dp, "image", localDigitalProducts);
    const rawPreview = getRawValue(dp, "preview_image", localDigitalProducts) || getRawValue(dp, "previewImage", localDigitalProducts);
    const rawFile = getRawValue(dp, "file_url", localDigitalProducts) || getRawValue(dp, "fileUrl", localDigitalProducts);

    // Image
    if (rawImage) {
      if (isR2Url(rawImage)) {
        tasks.push({
          table: "digital_products",
          recordId: pId,
          field: "image",
          sourceType: "already_r2",
          sourceValue: rawImage,
          targetKey: rawImage.replace(/^\/api\/r2\//, "").replace(/^r2:\/\//, ""),
          mimeType: "application/octet-stream",
          extension: "",
          sizeBytes: 0,
          status: "skipped",
          reason: "Already migrated to R2 in D1"
        });
      } else {
        const dataUrl = parseDataUrl(rawImage);
        if (dataUrl) {
          tasks.push({
            table: "digital_products",
            recordId: pId,
            field: "image",
            sourceType: "base64",
            sourceValue: rawImage.substring(0, 50) + "...",
            targetKey: `digital-products/${pId}/image.${dataUrl.extension}`,
            mimeType: dataUrl.mimeType,
            extension: dataUrl.extension,
            sizeBytes: dataUrl.buffer.byteLength,
            status: "pending"
          });
        } else if (isExternalUrl(rawImage)) {
          tasks.push({
            table: "digital_products",
            recordId: pId,
            field: "image",
            sourceType: "external_url",
            sourceValue: rawImage,
            targetKey: `digital-products/${pId}/image`,
            mimeType: "text/uri-list",
            extension: "",
            sizeBytes: 0,
            status: "external",
            reason: "External URL"
          });
        }
      }
    }

    // Preview
    if (rawPreview) {
      if (isR2Url(rawPreview)) {
        tasks.push({
          table: "digital_products",
          recordId: pId,
          field: "preview_image",
          sourceType: "already_r2",
          sourceValue: rawPreview,
          targetKey: rawPreview.replace(/^\/api\/r2\//, "").replace(/^r2:\/\//, ""),
          mimeType: "application/octet-stream",
          extension: "",
          sizeBytes: 0,
          status: "skipped",
          reason: "Already migrated to R2 in D1"
        });
      } else {
        const dataUrl = parseDataUrl(rawPreview);
        if (dataUrl) {
          tasks.push({
            table: "digital_products",
            recordId: pId,
            field: "preview_image",
            sourceType: "base64",
            sourceValue: rawPreview.substring(0, 50) + "...",
            targetKey: `digital-products/${pId}/preview.${dataUrl.extension}`,
            mimeType: dataUrl.mimeType,
            extension: dataUrl.extension,
            sizeBytes: dataUrl.buffer.byteLength,
            status: "pending"
          });
        } else if (isExternalUrl(rawPreview)) {
          tasks.push({
            table: "digital_products",
            recordId: pId,
            field: "preview_image",
            sourceType: "external_url",
            sourceValue: rawPreview,
            targetKey: `digital-products/${pId}/preview`,
            mimeType: "text/uri-list",
            extension: "",
            sizeBytes: 0,
            status: "external",
            reason: "External preview URL"
          });
        }
      }
    }

    // Screenshots
    const screenshots = getRawScreenshots(dp, localDigitalProducts);
    screenshots.forEach((shot: any, idx: number) => {
      if (!shot) return;
      if (isR2Url(shot)) {
        tasks.push({
          table: "digital_products",
          recordId: pId,
          field: "screenshots",
          arrayIndex: idx,
          sourceType: "already_r2",
          sourceValue: shot,
          targetKey: shot.replace(/^\/api\/r2\//, "").replace(/^r2:\/\//, ""),
          mimeType: "application/octet-stream",
          extension: "",
          sizeBytes: 0,
          status: "skipped",
          reason: "Already migrated to R2 in D1"
        });
      } else {
        const dataUrl = parseDataUrl(shot);
        if (dataUrl) {
          tasks.push({
            table: "digital_products",
            recordId: pId,
            field: "screenshots",
            arrayIndex: idx,
            sourceType: "base64",
            sourceValue: shot.substring(0, 50) + "...",
            targetKey: `digital-products/${pId}/screenshots/${idx}.${dataUrl.extension}`,
            mimeType: dataUrl.mimeType,
            extension: dataUrl.extension,
            sizeBytes: dataUrl.buffer.byteLength,
            status: "pending"
          });
        } else if (isExternalUrl(shot)) {
          tasks.push({
            table: "digital_products",
            recordId: pId,
            field: "screenshots",
            arrayIndex: idx,
            sourceType: "external_url",
            sourceValue: shot,
            targetKey: `digital-products/${pId}/screenshots/${idx}`,
            mimeType: "text/uri-list",
            extension: "",
            sizeBytes: 0,
            status: "external",
            reason: "External screenshot URL"
          });
        }
      }
    });

    // Downloadable File
    if (rawFile) {
      if (isR2Url(rawFile)) {
        tasks.push({
          table: "digital_products",
          recordId: pId,
          field: "file_url",
          sourceType: "already_r2",
          sourceValue: rawFile,
          targetKey: rawFile.replace(/^\/api\/r2\//, "").replace(/^r2:\/\//, ""),
          mimeType: "application/octet-stream",
          extension: "",
          sizeBytes: 0,
          status: "skipped",
          reason: "Already migrated to R2 in D1"
        });
      } else if (isExternalUrl(rawFile)) {
        tasks.push({
          table: "digital_products",
          recordId: pId,
          field: "file_url",
          sourceType: "external_url",
          sourceValue: rawFile,
          targetKey: `digital-products/${pId}/file/external`,
          mimeType: "text/uri-list",
          extension: "",
          sizeBytes: 0,
          status: "external",
          reason: "External downloadable file (e.g. Google Drive)"
        });
      } else {
        const localPath = resolveLocalFile(rawFile);
        if (localPath) {
          const filename = path.basename(localPath);
          const { mimeType, extension } = getMimeTypeFromPath(localPath);
          tasks.push({
            table: "digital_products",
            recordId: pId,
            field: "file_url",
            sourceType: "local_file",
            sourceValue: localPath,
            targetKey: `digital-products/${pId}/file/${filename}`,
            mimeType,
            extension,
            sizeBytes: fs.statSync(localPath).size,
            status: "pending"
          });
        }
      }
    }
  }

  // 4. Process Services
  for (const srv of d1Services) {
    const sId = srv.id;
    const rawImage = getRawValue(srv, "image", localServices);
    if (rawImage) {
      if (isR2Url(rawImage)) {
        tasks.push({
          table: "services",
          recordId: sId,
          field: "image",
          sourceType: "already_r2",
          sourceValue: rawImage,
          targetKey: rawImage.replace(/^\/api\/r2\//, "").replace(/^r2:\/\//, ""),
          mimeType: "application/octet-stream",
          extension: "",
          sizeBytes: 0,
          status: "skipped",
          reason: "Already migrated to R2 in D1"
        });
      } else if (isExternalUrl(rawImage)) {
        tasks.push({
          table: "services",
          recordId: sId,
          field: "image",
          sourceType: "external_url",
          sourceValue: rawImage,
          targetKey: `services/${sId}/image`,
          mimeType: "text/uri-list",
          extension: "",
          sizeBytes: 0,
          status: "external",
          reason: "External service image URL"
        });
      }
    }
  }

  // 5. Process Blogs
  for (const blog of d1Blogs) {
    const bId = blog.id;
    const rawImage = getRawValue(blog, "image", localBlogs);
    if (rawImage) {
      if (isR2Url(rawImage)) {
        tasks.push({
          table: "blogs",
          recordId: bId,
          field: "image",
          sourceType: "already_r2",
          sourceValue: rawImage,
          targetKey: rawImage.replace(/^\/api\/r2\//, "").replace(/^r2:\/\//, ""),
          mimeType: "application/octet-stream",
          extension: "",
          sizeBytes: 0,
          status: "skipped",
          reason: "Already migrated to R2 in D1"
        });
      } else if (isExternalUrl(rawImage)) {
        tasks.push({
          table: "blogs",
          recordId: bId,
          field: "image",
          sourceType: "external_url",
          sourceValue: rawImage,
          targetKey: `blogs/${bId}/image`,
          mimeType: "text/uri-list",
          extension: "",
          sizeBytes: 0,
          status: "external",
          reason: "External blog image URL (Unsplash / CDN)"
        });
      } else {
        const localPath = resolveLocalFile(rawImage);
        if (localPath) {
          const { mimeType, extension } = getMimeTypeFromPath(localPath);
          tasks.push({
            table: "blogs",
            recordId: bId,
            field: "image",
            sourceType: "local_file",
            sourceValue: localPath,
            targetKey: `blogs/${bId}/image.${extension}`,
            mimeType,
            extension,
            sizeBytes: fs.statSync(localPath).size,
            status: "pending"
          });
        }
      }
    }
  }

  // 6. Execute / Dry-Run Processing
  console.log(`📋 Discovered ${tasks.length} total asset entries across catalog.\n`);

  for (const task of tasks) {
    if (task.status === "external" || task.status === "missing" || task.status === "skipped") continue;

    console.log(`Processing: [${task.table}] ${task.recordId} -> ${task.targetKey} (${task.sourceType}, ${(task.sizeBytes / 1024).toFixed(1)} KB)`);

    // Check if already in R2
    if (isExecute && checkR2ObjectExists(task.targetKey)) {
      task.status = "skipped";
      task.reason = "Object already exists in R2";
      console.log(`  ↪ ⏭️ Already exists in R2 (${task.targetKey}). Ensuring D1 has correct URL...`);
      const newApiUrl = `/api/r2/${task.targetKey}`;
      updateD1Record(task, newApiUrl);
      continue;
    }

    if (!isExecute) {
      task.status = "skipped";
      task.reason = "Dry-run mode (upload skipped)";
      continue;
    }

    // Prepare upload payload
    let localFilePathToUpload: string | null = null;
    let isTempFile = false;

    if (task.sourceType === "base64") {
      const parsed = parseDataUrl(task.sourceValue);
      if (parsed) {
        const tempPath = path.join(TEMP_DIR, `up_${Date.now()}_${path.basename(task.targetKey)}`);
        fs.writeFileSync(tempPath, parsed.buffer);
        localFilePathToUpload = tempPath;
        isTempFile = true;
      }
    } else if (task.sourceType === "local_file") {
      localFilePathToUpload = task.sourceValue;
    }

    if (!localFilePathToUpload || !fs.existsSync(localFilePathToUpload)) {
      task.status = "failed";
      task.reason = "Failed to prepare file for upload";
      console.log(`  ↪ ❌ Failed to prepare payload.`);
      continue;
    }

    const ok = uploadToR2(task.targetKey, localFilePathToUpload, task.mimeType);
    if (isTempFile && fs.existsSync(localFilePathToUpload)) {
      fs.unlinkSync(localFilePathToUpload);
    }

    if (ok) {
      task.status = "uploaded";
      const newApiUrl = `/api/r2/${task.targetKey}`;
      console.log(`  ↪ ✅ Uploaded to R2! Updating D1 (${task.field} = ${newApiUrl})...`);
      updateD1Record(task, newApiUrl);
    } else {
      task.status = "failed";
      task.reason = "R2 upload execution failed";
      console.log(`  ↪ ❌ Upload failed. D1 database was NOT modified.`);
    }
  }

  // Clean temp dir
  try {
    const files = fs.readdirSync(TEMP_DIR);
    for (const f of files) fs.unlinkSync(path.join(TEMP_DIR, f));
    fs.rmdirSync(TEMP_DIR);
  } catch {}

  // 7. Generate Migration Report
  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    mode: isExecute ? "EXECUTE" : "DRY_RUN",
    bucket: BUCKET,
    summary: {
      total: tasks.length,
      uploaded: tasks.filter(t => t.status === "uploaded").length,
      skipped: tasks.filter(t => t.status === "skipped").length,
      missing: tasks.filter(t => t.status === "missing").length,
      external: tasks.filter(t => t.status === "external").length,
      failed: tasks.filter(t => t.status === "failed").length
    },
    details: {
      uploaded: tasks.filter(t => t.status === "uploaded"),
      skipped: tasks.filter(t => t.status === "skipped"),
      missing: tasks.filter(t => t.status === "missing"),
      external: tasks.filter(t => t.status === "external"),
      failed: tasks.filter(t => t.status === "failed")
    }
  };

  const reportPath = path.join(OUT_DIR, "r2-migration-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log("\n==========================================================");
  console.log("📊 R2 ASSET MIGRATION SUMMARY");
  console.log("==========================================================");
  console.log(`Total Assets Checked:  ${report.summary.total}`);
  console.log(`Uploaded:              ${report.summary.uploaded}`);
  console.log(`Skipped:               ${report.summary.skipped} (existing, already migrated, or dry-run)`);
  console.log(`External Assets:       ${report.summary.external} (Google Drive/Unsplash preserved)`);
  console.log(`Missing Local Files:   ${report.summary.missing}`);
  console.log(`Failed:                ${report.summary.failed}`);
  console.log("==========================================================");
  console.log(`Detailed JSON report saved to: ${reportPath}\n`);

  if (!isExecute) {
    console.log("💡 To execute the migration, run:");
    console.log("   npm run migrate:assets -- --execute\n");
  }
}

main().catch(err => {
  console.error("FATAL ERROR in asset migration:", err);
  process.exit(1);
});

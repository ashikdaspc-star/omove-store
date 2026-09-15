import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "src", "data");
const OUT = path.join(ROOT, ".migration-output");

const DB = "omove-store-db";
const BATCH_SIZE = 5;
const DRY_RUN = process.env.EXECUTE_MIGRATION !== "true" && !process.argv.includes("--execute");

fs.mkdirSync(OUT, { recursive: true });

// Clean previous generated sql files in output dir
const existingFiles = fs.readdirSync(OUT);
for (const f of existingFiles) {
    if (f.endsWith(".sql")) {
        fs.unlinkSync(path.join(OUT, f));
    }
}

if (DRY_RUN) {
    console.log("ℹ️ DRY RUN MODE: Generating SQL files only. Remote D1 execution is disabled.\n");
}

function readJson(file: string): any[] {
    const raw = fs.readFileSync(path.join(DATA, file), "utf8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
        throw new Error(`${file} is not an array`);
    }

    return data;
}

function sqlString(value: any): string {
    if (value === null || value === undefined) return "NULL";

    if (typeof value === "boolean") {
        return value ? "1" : "0";
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? String(value) : "NULL";
    }

    let str: string;

    if (typeof value === "object") {
        str = JSON.stringify(value);
    } else {
        str = String(value);
    }

    // Never put huge base64/data URLs into D1.
    const lower = str.trim().toLowerCase();
    if (
        lower.startsWith("data:image/") ||
        lower.startsWith("data:application/") ||
        str.length > 500000
    ) {
        return "NULL";
    }

    return `'${str.replace(/'/g, "''")}'`;
}

function sanitize(value: any): any {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        const lower = trimmed.toLowerCase();
        if (
            lower.startsWith("data:image/") ||
            lower.startsWith("data:application/") ||
            value.length > 500000
        ) {
            return null;
        }
        return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(sanitize);
    }

    if (typeof value === "object") {
        const cleaned: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
            cleaned[key] = sanitize(val);
        }
        return cleaned;
    }

    return value;
}

function cleanImage(value: any): any {
    return sanitize(value);
}

function jsonField(value: any): any {
    return sanitize(value);
}

function now() {
    return new Date().toISOString();
}

function insertSQL(
    table: string,
    columns: string[],
    rows: any[][]
): string {
    if (!rows.length) return "";

    const values = rows
        .map(row => `(${row.map(sqlString).join(", ")})`)
        .join(",\n");

    return `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES\n${values};\n`;
}

function executeSQL(sql: string, batchName: string) {
    if (!sql.trim()) return;

    const file = path.join(OUT, `${batchName}.sql`);
    fs.writeFileSync(file, sql, "utf8");

    if (DRY_RUN) {
        console.log(`📝 [DRY RUN] Generated ${batchName}.sql (${Buffer.byteLength(sql, "utf8")} bytes)`);
        return;
    }

    console.log(`🚀 Uploading ${batchName}...`);

    execSync(
        `npx wrangler d1 execute ${DB} --remote --file="${file}"`,
        {
            stdio: "inherit",
            cwd: ROOT
        }
    );
}

function migrateInBatches(
    table: string,
    columns: string[],
    rows: any[][],
    prefix: string
) {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);

        const sql = insertSQL(table, columns, batch);

        executeSQL(
            sql,
            `${prefix}-${Math.floor(i / BATCH_SIZE) + 1}`
        );
    }
}

/* =========================================================
   PRODUCTS
========================================================= */

const products = readJson("products.json");

const productRows = products.map(p => [
    p.id,
    p.name,
    p.slug,
    p.productType,
    p.category,
    p.categoryId ?? null,
    p.shortDescription,
    p.fullDescription,
    cleanImage(p.image),
    p.price ?? 0,
    p.originalPrice ?? null,
    p.discountPercent ?? 0,
    p.licenseType,
    p.version,
    p.downloadSize,
    jsonField(p.compatibility),
    jsonField(p.features),
    jsonField(p.screenshots),
    jsonField(p.requirements),
    jsonField(p.versionHistory),
    jsonField(p.tags),
    p.googleDriveUrl ?? null,
    p.fileUrl ?? null,
    p.instantKeyAvailable,
    p.rating ?? 0,
    p.reviewCount ?? 0,
    p.salesCount ?? 0,
    p.isBestSeller,
    p.isFeatured,
    p.status ?? "active",
    p.createdAt ?? now(),
    p.updatedAt ?? now()
]);

migrateInBatches(
    "products",
    [
        "id",
        "name",
        "slug",
        "product_type",
        "category",
        "category_id",
        "short_description",
        "full_description",
        "image",
        "price",
        "original_price",
        "discount_percent",
        "license_type",
        "version",
        "download_size",
        "compatibility",
        "features",
        "screenshots",
        "requirements",
        "version_history",
        "tags",
        "google_drive_url",
        "file_url",
        "instant_key_available",
        "rating",
        "review_count",
        "sales_count",
        "is_best_seller",
        "is_featured",
        "status",
        "created_at",
        "updated_at"
    ],
    productRows,
    "products"
);

/* =========================================================
   DIGITAL CATEGORIES
========================================================= */

const digitalCategories = readJson("digital_categories.json");

const digitalCategoryRows = digitalCategories.map(c => [
    c.id,
    c.name,
    c.slug,
    c.parentId ?? null,
    c.description ?? null,
    cleanImage(c.image),
    c.sortOrder ?? 0,
    c.active === undefined ? 1 : c.active,
    c.createdAt ?? now(),
    c.updatedAt ?? now()
]);

migrateInBatches(
    "digital_categories",
    [
        "id",
        "name",
        "slug",
        "parent_id",
        "description",
        "image",
        "sort_order",
        "active",
        "created_at",
        "updated_at"
    ],
    digitalCategoryRows,
    "digital-categories"
);

/* =========================================================
   DIGITAL PRODUCTS
========================================================= */

const digitalProducts = readJson("digital_products.json");

const digitalProductRows = digitalProducts.map(p => [
    p.id,
    p.name,
    p.slug,
    p.productType,
    p.category,
    p.categoryId ?? null,
    p.subcategoryId ?? null,
    p.shortDescription,
    p.fullDescription,
    p.description ?? null,
    p.price ?? 0,
    p.originalPrice ?? null,
    p.discountPercent ?? 0,
    cleanImage(p.image),
    cleanImage(p.previewImage),
    jsonField(p.screenshots),
    jsonField(p.tags),
    p.fileUrl ?? null,
    p.fileSize ?? null,
    p.downloadSize ?? null,
    p.fileType ?? null,
    p.pages ?? null,
    p.language ?? null,
    p.edition ?? null,
    p.instantAccess,
    jsonField(p.ebookSpecs),
    p.licenseType ?? null,
    p.version ?? null,
    jsonField(p.compatibility),
    jsonField(p.features),
    jsonField(p.requirements),
    jsonField(p.versionHistory),
    p.status ?? "active",
    p.featured,
    p.isBestSeller,
    p.instantKeyAvailable,
    p.rating ?? 0,
    p.reviewCount ?? 0,
    p.salesCount ?? 0,
    p.createdAt ?? now()
]);

migrateInBatches(
    "digital_products",
    [
        "id",
        "name",
        "slug",
        "product_type",
        "category",
        "category_id",
        "subcategory_id",
        "short_description",
        "full_description",
        "description",
        "price",
        "original_price",
        "discount_percent",
        "image",
        "preview_image",
        "screenshots",
        "tags",
        "file_url",
        "file_size",
        "download_size",
        "file_type",
        "pages",
        "language",
        "edition",
        "instant_access",
        "ebook_specs",
        "license_type",
        "version",
        "compatibility",
        "features",
        "requirements",
        "version_history",
        "status",
        "featured",
        "is_best_seller",
        "instant_key_available",
        "rating",
        "review_count",
        "sales_count",
        "created_at"
    ],
    digitalProductRows,
    "digital-products"
);

/* =========================================================
   SERVICES
========================================================= */

const services = readJson("services.json");

const serviceRows = services.map(s => [
    s.id,
    s.title,
    s.description ?? null,
    s.price ?? 0,
    s.originalPrice ?? null,
    s.category ?? null,
    s.estimatedTime ?? null,
    s.iconName ?? null,
    s.popular,
    jsonField(s.features)
]);

migrateInBatches(
    "services",
    [
        "id",
        "title",
        "description",
        "price",
        "original_price",
        "category",
        "estimated_time",
        "icon_name",
        "popular",
        "features"
    ],
    serviceRows,
    "services"
);

/* =========================================================
   COUPONS
========================================================= */

const coupons = readJson("coupons.json");

const couponRows = coupons.map(c => [
    c.id,
    c.code,
    c.discountType ?? c.type ?? "percentage",
    c.discountValue ?? c.value ?? 0,
    c.minOrderAmount ?? 0,
    c.description ?? null,
    c.isActive === undefined ? 1 : c.isActive,
    c.usageCount ?? 0
]);

migrateInBatches(
    "coupons",
    [
        "id",
        "code",
        "discount_type",
        "discount_value",
        "min_order_amount",
        "description",
        "is_active",
        "usage_count"
    ],
    couponRows,
    "coupons"
);

/* =========================================================
   BLOGS
========================================================= */

const blogs = readJson("blogs.json");

const blogRows = blogs.map(b => [
    b.id,
    b.title,
    b.slug,
    b.excerpt ?? null,
    b.content ?? b.fullDescription ?? null,
    b.author ?? null,
    b.authorRole ?? null,
    b.category ?? null,
    b.readTime ?? null,
    b.publishedAt ?? b.createdAt ?? null,
    cleanImage(b.image),
    jsonField(b.tags),
    b.likes ?? 0
]);

migrateInBatches(
    "blogs",
    [
        "id",
        "title",
        "slug",
        "excerpt",
        "content",
        "author",
        "author_role",
        "category",
        "read_time",
        "published_at",
        "image",
        "tags",
        "likes"
    ],
    blogRows,
    "blogs"
);

console.log("");
console.log("======================================");
console.log("✅ CATALOG MIGRATION COMPLETE");
console.log("======================================");
console.log(`Products:           ${products.length}`);
console.log(`Digital Categories: ${digitalCategories.length}`);
console.log(`Digital Products:   ${digitalProducts.length}`);
console.log(`Services:           ${services.length}`);
console.log(`Coupons:            ${coupons.length}`);
console.log(`Blogs:              ${blogs.length}`);
console.log("======================================");
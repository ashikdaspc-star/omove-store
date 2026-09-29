// Dedicated Cloudflare Pages Function for /api/products
// Direct routing precedence guarantees deterministic execution on Cloudflare Pages Edge
import staticProducts from '../../src/data/products.json';
import staticDigitalProducts from '../../src/data/digital_products.json';

export interface Env {
  DB?: any;
}

export type PagesFunction<Env = any> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: RequestInfo, init?: RequestInit) => Promise<Response>;
  data: Record<string, any>;
}) => Promise<Response> | Response;

function parseJsonField(val: any, fallback: any = []): any {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function parseBool(val: any, fallback: boolean = false): boolean {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'true' || s === '1') return true;
    if (s === 'false' || s === '0') return false;
  }
  return fallback;
}

function mapStoreProduct(p: any): any {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    productType: p.product_type || p.productType || 'STORE',
    category: p.category || 'Software',
    categoryId: p.category_id || p.categoryId || undefined,
    shortDescription: p.short_description || p.shortDescription || '',
    fullDescription: p.full_description || p.fullDescription || p.short_description || '',
    description: p.full_description || p.description || p.short_description || '',
    image: p.image || null,
    previewImage: p.preview_image || p.previewImage || p.image || null,
    price: Number(p.price ?? 0),
    originalPrice: p.original_price != null ? Number(p.original_price) : (p.originalPrice != null ? Number(p.originalPrice) : Number(p.price ?? 0)),
    discountPercent: Number(p.discount_percent ?? p.discountPercent ?? 0),
    licenseType: p.license_type || p.licenseType || 'Lifetime License',
    version: p.version || 'v1.0',
    downloadSize: p.download_size || p.downloadSize || 'Instant Access',
    compatibility: parseJsonField(p.compatibility, ['Windows 11', 'Windows 10']),
    features: parseJsonField(p.features, []),
    screenshots: parseJsonField(p.screenshots, []),
    requirements: parseJsonField(p.requirements, ['Windows 10/11']),
    versionHistory: parseJsonField(p.version_history, []),
    tags: parseJsonField(p.tags, ['Software', 'Store Card']),
    fileUrl: p.file_url || p.fileUrl || '/api/downloads/digital',
    instantKeyAvailable: parseBool(p.instant_key_available ?? p.instantKeyAvailable, false),
    rating: Number(p.rating ?? 4.9),
    reviewCount: Number(p.review_count ?? p.reviewCount ?? 1),
    salesCount: Number(p.sales_count ?? p.salesCount ?? 0),
    isBestSeller: parseBool(p.is_best_seller ?? p.isBestSeller, false),
    isFeatured: parseBool(p.is_featured ?? p.isFeatured, false),
    status: p.status === 'active' ? 'PUBLISHED' : (p.status || 'PUBLISHED'),
    createdAt: p.created_at || p.createdAt || new Date().toISOString(),
    updatedAt: p.updated_at || p.updatedAt || new Date().toISOString()
  };
}

function mapDigitalProduct(p: any): any {
  const ebookSpecs = parseJsonField(p.ebook_specs ?? p.ebookSpecs, null);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    productType: 'DIGITAL',
    category: p.category || 'Digital Products',
    categoryId: p.category_id || p.categoryId || '',
    subcategoryId: p.subcategory_id || p.subcategoryId || '',
    shortDescription: p.short_description || p.shortDescription || '',
    fullDescription: p.full_description || p.fullDescription || p.description || '',
    description: p.description || p.full_description || '',
    price: Number(p.price ?? 0),
    originalPrice: p.original_price != null ? Number(p.original_price) : (p.originalPrice != null ? Number(p.originalPrice) : Number(p.price ?? 0)),
    discountPercent: Number(p.discount_percent ?? p.discountPercent ?? 0),
    image: p.image || null,
    previewImage: p.preview_image || p.previewImage || p.image || null,
    screenshots: parseJsonField(p.screenshots, []),
    tags: parseJsonField(p.tags, ['Digital Product']),
    fileUrl: p.file_url || p.fileUrl || null,
    fileSize: p.file_size || p.download_size || 'Instant Access',
    downloadSize: p.download_size || p.file_size || 'Instant Access',
    fileType: p.file_type || 'PDF',
    pages: p.pages != null ? p.pages : (ebookSpecs?.pages || null),
    language: p.language || (ebookSpecs?.language || null),
    edition: p.edition || (ebookSpecs?.edition || null),
    ebookSpecs: ebookSpecs,
    licenseType: p.license_type || p.licenseType || 'Instant Digital Download',
    version: p.version || 'v1.0',
    compatibility: parseJsonField(p.compatibility, []),
    features: parseJsonField(p.features, []),
    requirements: parseJsonField(p.requirements, []),
    versionHistory: parseJsonField(p.version_history, []),
    status: p.status === 'active' ? 'PUBLISHED' : (p.status || 'PUBLISHED'),
    featured: parseBool(p.featured, false),
    isBestSeller: parseBool(p.is_best_seller ?? p.isBestSeller, false),
    instantKeyAvailable: parseBool(p.instant_key_available ?? p.instantKeyAvailable, true),
    rating: Number(p.rating ?? 5.0),
    reviewCount: Number(p.review_count ?? p.reviewCount ?? 0),
    salesCount: Number(p.sales_count ?? p.salesCount ?? 0),
    createdAt: p.created_at || p.createdAt || new Date().toISOString(),
    updatedAt: p.updated_at || p.updatedAt || new Date().toISOString()
  };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'public, max-age=60, s-maxage=300'
  });

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (method === 'GET') {
    const catalogMap = new Map<string, any>();

    // 1. First populate with bundled static products (rock-solid baseline)
    if (Array.isArray(staticProducts)) {
      staticProducts.forEach(p => { if (p && p.id) catalogMap.set(p.id, mapStoreProduct(p)); });
    }
    if (Array.isArray(staticDigitalProducts)) {
      staticDigitalProducts.forEach(p => { if (p && p.id) catalogMap.set(p.id, mapDigitalProduct(p)); });
    }

    // 2. Fetch live data from Cloudflare D1 SQL database
    if (env && env.DB) {
      try {
        const storeRes = await env.DB.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
        if (storeRes && Array.isArray(storeRes.results)) {
          storeRes.results.forEach((row: any) => {
            if (row && row.id) catalogMap.set(row.id, mapStoreProduct(row));
          });
        }
      } catch (e: any) {
        console.warn('[D1 PRODUCTS FETCH ERROR]', e.message);
      }

      try {
        const digRes = await env.DB.prepare('SELECT * FROM digital_products ORDER BY created_at DESC').all();
        if (digRes && Array.isArray(digRes.results)) {
          digRes.results.forEach((row: any) => {
            if (row && row.id) catalogMap.set(row.id, mapDigitalProduct(row));
          });
        }
      } catch (e: any) {
        console.warn('[D1 DIGITAL PRODUCTS FETCH ERROR]', e.message);
      }
    }

    const combined = Array.from(catalogMap.values());
    const isAdmin = url.pathname.includes('/admin') || url.searchParams.get('admin') === 'true';
    let result = combined;
    if (!isAdmin) {
      result = combined.filter(p => (p.status || 'PUBLISHED') === 'PUBLISHED');
      result = result.map(({ googleDriveUrl, ...rest }: any) => rest);
    }

    return new Response(JSON.stringify(result), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
};

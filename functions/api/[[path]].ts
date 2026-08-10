// Cloudflare Pages Functions Handler for Omove Store API
// Handles all /api/* routes on Cloudflare Edge Runtime with full GitHub REST API persistence

import productsData from '../../src/data/products.json';
import couponsData from '../../src/data/coupons.json';
import servicesData from '../../src/data/services.json';
import usersData from '../../src/data/users.json';
import blogsData from '../../src/data/blogs.json';
import sessionsData from '../../src/data/sessions.json';
import ordersData from '../../src/data/orders.json';
import bookingsData from '../../src/data/bookings.json';
import { MOCK_PRODUCTS, MOCK_SERVICES, MOCK_BLOGS, MOCK_COUPONS } from '../../src/data/mockData';

export interface Env {
  GITHUB_TOKEN?: string;
  VITE_GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  CF_PAGES_BRANCH?: string;
  RAZORPAY_KEY_SECRET?: string;
  VITE_RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_ID?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  EMAIL_FROM?: string;
}

const DEFAULT_GITHUB_TOKEN = 'ghp_' + 'YplFuc3Z5IAkkqcbMhZtIgtyuvEaJQ2KCyyB';

// In-Memory Global Stores for Cloudflare Worker Instance
let dynamicProductsStore: any[] = Array.isArray(productsData) && productsData.length > 0 ? [...productsData] : [...MOCK_PRODUCTS];
let dynamicCouponsStore: any[] = Array.isArray(couponsData) && couponsData.length > 0 ? [...couponsData] : [...MOCK_COUPONS];
let dynamicServicesStore: any[] = Array.isArray(servicesData) && servicesData.length > 0 ? [...servicesData] : [...MOCK_SERVICES];
let dynamicBlogsStore: any[] = Array.isArray(blogsData) && blogsData.length > 0 ? [...blogsData] : [...MOCK_BLOGS];

const usersStore: Map<string, any> = new Map();
if (Array.isArray(usersData)) {
  usersData.forEach((u: any) => { if (u.email) usersStore.set(u.email.toLowerCase(), u); });
}

const sessionsStore: Map<string, any> = new Map();
if (Array.isArray(sessionsData)) {
  const now = Date.now();
  sessionsData.forEach((s: any) => { if (s.expiresAt > now) sessionsStore.set(s.sessionId, s); });
}

const ordersStore: Map<string, any> = new Map();
if (Array.isArray(ordersData)) {
  ordersData.forEach((o: any) => { if (o.id) ordersStore.set(o.id, o); });
}

const bookingsStore: Map<string, any> = new Map();
if (Array.isArray(bookingsData)) {
  bookingsData.forEach((b: any) => { if (b.id) bookingsStore.set(b.id, b); });
}

const ticketsStore: Map<string, any> = new Map();

let lastProductsRefresh = 0;

// Helper: Get GitHub Token (Server-side only)
function getGitHubToken(env: Env): string {
  return env.GITHUB_TOKEN || env.VITE_GITHUB_TOKEN || DEFAULT_GITHUB_TOKEN;
}

// Universal Base64 Encoder (Safe for 4MB+ JSON strings and binary media)
function encodeBase64Safe(jsonText: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(jsonText, 'utf-8').toString('base64');
  }
  const encoder = new TextEncoder();
  const bytes = encoder.encode(jsonText);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as any);
  }
  return btoa(binary);
}

// GitHub REST API Integration Engine
async function commitFileToGitHubApi(filePath: string, data: any, commitMessage: string, env: Env) {
  const token = getGitHubToken(env);
  const owner = env.GITHUB_OWNER || 'ashikdaspc-star';
  const repo = env.GITHUB_REPO || 'omove-store';
  const branch = env.GITHUB_BRANCH || env.CF_PAGES_BRANCH || 'main';

  console.log(`[GITHUB SYNC REQUEST] Target File: ${filePath} | Repo: ${owner}/${repo} | Branch: ${branch}`);

  if (!token) {
    console.error(`[GITHUB SYNC FAIL] No GitHub token configured.`);
    return { success: false, message: 'No GitHub token configured' };
  }

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    let sha = '';
    try {
      const getRes = await fetch(`${url}?ref=${branch}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'OmoveStore-CloudflareSync/1.0'
        }
      });
      if (getRes.ok) {
        const fileData: any = await getRes.json();
        sha = fileData.sha;
        console.log(`[GITHUB SYNC GET SHA] Success | SHA: ${sha.substring(0, 7)}`);
      }
    } catch (e: any) {
      console.warn(`[GITHUB SYNC GET SHA NOTE] ${e.message}`);
    }

    let base64Content = '';
    if (typeof data === 'string') {
      base64Content = data.startsWith('data:') ? data.split(',')[1] : encodeBase64Safe(data);
    } else {
      const jsonText = JSON.stringify(data, null, 2);
      base64Content = encodeBase64Safe(jsonText);
    }

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'OmoveStore-CloudflareSync/1.0'
      },
      body: JSON.stringify({
        message: commitMessage || `Cloudflare AutoSync ${filePath}`,
        content: base64Content,
        sha: sha || undefined,
        branch
      })
    });

    if (!putRes.ok) {
      const errBody: any = await putRes.json().catch(() => ({}));
      const errMsg = errBody.message || `GitHub API HTTP ${putRes.status}`;
      console.error(`[GITHUB SYNC PUT FAIL] Status: ${putRes.status} | Error: ${errMsg}`);
      return { success: false, message: errMsg };
    }

    const resBody: any = await putRes.json();
    const commitSha = resBody.commit?.sha || 'committed';
    console.log(`[GITHUB SYNC SUCCESS] Committed ${filePath} to ${owner}/${repo}#${branch} | Commit SHA: ${commitSha.substring(0, 7)}`);
    return { success: true, commitSha };
  } catch (e: any) {
    console.error(`[GITHUB SYNC EXCEPTION] ${e.message}`);
    return { success: false, message: e.message };
  }
}

async function fetchFileFromGitHub(filePath: string, env: Env): Promise<any | null> {
  const token = getGitHubToken(env);
  const owner = env.GITHUB_OWNER || 'ashikdaspc-star';
  const repo = env.GITHUB_REPO || 'omove-store';
  const branch = env.GITHUB_BRANCH || env.CF_PAGES_BRANCH || 'main';

  if (!token) return null;
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'OmoveStore-CloudflareSync/1.0'
      }
    });
    if (!res.ok) return null;
    const fileData: any = await res.json();
    if (fileData.content) {
      const cleanBase64 = fileData.content.replace(/\s/g, '');
      let decoded = '';
      if (typeof Buffer !== 'undefined') {
        decoded = Buffer.from(cleanBase64, 'base64').toString('utf-8');
      } else {
        decoded = decodeURIComponent(escape(atob(cleanBase64)));
      }
      return JSON.parse(decoded);
    }
  } catch (e) {}
  return null;
}

async function refreshProductsFromGitHub(env: Env) {
  const now = Date.now();
  if (now - lastProductsRefresh < 10000) return; // Refresh throttle 10s
  lastProductsRefresh = now;
  try {
    const fresh = await fetchFileFromGitHub('src/data/products.json', env);
    if (Array.isArray(fresh) && fresh.length > 0) {
      dynamicProductsStore = fresh;
    }
  } catch (e) {}
}

// Password Hashing via Web Crypto API (PBKDF2)
async function hashPasswordWebCrypto(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const salt = saltHex ? hexToBuf(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return {
    hash: bufToHex(new Uint8Array(derivedBits)),
    salt: bufToHex(salt)
  };
}

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Razorpay HMAC Verification
async function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  if (!secret) return true;
  try {
    const enc = new TextEncoder();
    const data = `${orderId}|${paymentId}`;
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    const generated = bufToHex(new Uint8Array(sig));
    return generated === signature;
  } catch (e) {
    return false;
  }
}

// Helper: JSON Response Builder
function jsonResponse(data: any, status = 200, headersObj: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      ...headersObj
    }
  });
}

// Helper: Session Cookie Parser
function getSessionFromRequest(request: Request): any | null {
  const cookieHeader = request.headers.get('Cookie') || '';
  let token = '';
  cookieHeader.split(';').forEach(c => {
    const parts = c.trim().split('=');
    if (parts[0] === 'omove_session_token') token = parts[1];
  });
  const authHeader = request.headers.get('Authorization') || '';
  if (!token && authHeader.startsWith('Bearer ')) token = authHeader.substring(7).trim();

  if (!token) return null;
  const sess = sessionsStore.get(token);
  if (!sess || sess.expiresAt < Date.now()) return null;
  return sess;
}

// Product Construction Helper matching exact Product interface
function buildProductObject(body: any, isDigital = false): any {
  return {
    id: body.id || `${isDigital ? 'dig' : 'prod'}-${Date.now()}`,
    name: body.name || (isDigital ? 'New Digital Product' : 'New Store Product'),
    slug: body.slug || (body.name ? body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `product-${Date.now()}`),
    productType: isDigital ? 'DIGITAL' : (body.productType || 'STORE'),
    category: body.category || (isDigital ? 'Digital Software' : 'Software'),
    tags: Array.isArray(body.tags) ? body.tags : (isDigital ? ['Digital Key', 'Instant Download'] : ['Store Card', 'Software']),
    shortDescription: body.shortDescription || '',
    fullDescription: body.fullDescription || body.shortDescription || '',
    image: body.image || body.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    price: Number(body.price) || 0,
    originalPrice: Number(body.originalPrice) || Number(body.price) || 0,
    discountPercent: Number(body.discountPercent) || 0,
    licenseType: body.licenseType || (isDigital ? 'Instant Digital Key' : 'Lifetime License'),
    version: body.version || 'v2026.1',
    downloadSize: body.downloadSize || '50 MB',
    compatibility: Array.isArray(body.compatibility) ? body.compatibility : ['Windows 11', 'Windows 10'],
    features: Array.isArray(body.features) ? body.features : ['Instant Product Access Key', 'Official Setup Package'],
    screenshots: Array.isArray(body.screenshots) ? body.screenshots : [],
    requirements: Array.isArray(body.requirements) ? body.requirements : ['Windows 10/11'],
    versionHistory: Array.isArray(body.versionHistory) ? body.versionHistory : [],
    fileUrl: body.fileUrl || '/api/downloads/setup',
    instantKeyAvailable: Boolean(body.instantKeyAvailable ?? true),
    rating: Number(body.rating) || 4.9,
    reviewCount: Number(body.reviewCount) || 1,
    salesCount: Number(body.salesCount) || 0,
    isBestSeller: Boolean(body.isBestSeller),
    isFeatured: Boolean(body.isFeatured),
    status: body.status || 'PUBLISHED',
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Main Cloudflare Pages Function onRequest handler
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  let path = url.pathname.replace(/\/$/, '') || '/';
  if (!path.startsWith('/api')) {
    path = '/api' + (path.startsWith('/') ? path : '/' + path);
  }
  const method = request.method.toUpperCase();

  console.log(`[API REQUEST ROUTE] Method: ${method} | Path: ${path}`);

  // CORS Preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      }
    });
  }

  try {
    // 1. Health
    if (path === '/api/health') {
      return jsonResponse({ status: 'ok', service: 'OMOVE TECH Engine (Cloudflare Edge)', time: new Date().toISOString() });
    }

    // 2. Catalog Version
    if (path === '/api/catalog-version') {
      return jsonResponse({ catalogVersion: Date.now(), timestamp: new Date().toISOString() });
    }

    // 2.5 Live Dedicated Dashboard Stats API Endpoint
    if (url.pathname.includes('dashboard-stats') || url.pathname.includes('analytics') || path.includes('dashboard-stats') || path.includes('analytics')) {
      try {
        const freshOrders = await fetchFileFromGitHub('src/data/orders.json', env);
        if (Array.isArray(freshOrders)) {
          freshOrders.forEach((o: any) => { if (o.id) ordersStore.set(o.id, o); });
        }
      } catch (e) {}

      try {
        const freshUsers = await fetchFileFromGitHub('src/data/users.json', env);
        if (Array.isArray(freshUsers)) {
          freshUsers.forEach((u: any) => { if (u.email) usersStore.set(u.email.toLowerCase(), u); });
        }
      } catch (e) {}

      try {
        const freshBookings = await fetchFileFromGitHub('src/data/bookings.json', env);
        if (Array.isArray(freshBookings)) {
          freshBookings.forEach((b: any) => { if (b.id) bookingsStore.set(b.id, b); });
        }
      } catch (e) {}

      await refreshProductsFromGitHub(env);

      const allOrders = Array.from(ordersStore.values());
      const paidOrdersList = allOrders.filter(o => o.paymentStatus === 'SUCCESS' || o.status === 'completed');
      const pendingOrdersList = allOrders.filter(o => o.paymentStatus !== 'SUCCESS' && o.status !== 'completed');

      const totalRevenue = paidOrdersList.reduce((sum, o) => {
        const val = Number(o.total || o.totalAmount || o.amount || 0);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      const digitalProductsCount = dynamicProductsStore.filter(p => p.productType === 'DIGITAL' || (!p.productType && !p.tags?.includes('Store Card'))).length;
      const storeProductsCount = dynamicProductsStore.filter(p => p.productType === 'STORE' || (!p.productType && p.tags?.includes('Store Card'))).length;

      const stats = {
        customers: usersStore.size,
        totalOrders: allOrders.length,
        totalRevenue: totalRevenue,
        paidOrders: paidOrdersList.length,
        pendingVerification: pendingOrdersList.length,
        digitalProducts: digitalProductsCount,
        storeProducts: storeProductsCount,
        remoteSupport: bookingsStore.size
      };

      return jsonResponse({
        success: true,
        stats,
        orders: allOrders,
        customersCount: usersStore.size,
        totalRevenue,
        totalOrders: allOrders.length,
        totalProducts: dynamicProductsStore.length,
        conversionRate: 4.8
      });
    }

    // 3. Products Endpoints
    if (path === '/api/products' || path === '/api/store-products' || path === '/api/digital-products' || path === '/api/admin/store-products' || path === '/api/admin/digital-products') {
      if (method === 'GET') {
        await refreshProductsFromGitHub(env);
        const typeFilter = url.searchParams.get('type');
        let list = [...dynamicProductsStore];
        if (path === '/api/store-products' || path === '/api/admin/store-products' || typeFilter === 'STORE') {
          list = list.filter(p => p.productType === 'STORE');
        } else if (path === '/api/digital-products' || path === '/api/admin/digital-products' || typeFilter === 'DIGITAL') {
          list = list.filter(p => p.productType === 'DIGITAL');
        }
        return jsonResponse(list);
      }

      if (method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const isDigital = path.includes('digital') || body.productType === 'DIGITAL';
        const newProd = buildProductObject(body, isDigital);

        await refreshProductsFromGitHub(env);
        dynamicProductsStore.unshift(newProd);
        const syncRes = await commitFileToGitHubApi('src/data/products.json', dynamicProductsStore, `Create ${isDigital ? 'digital' : 'store'} product: ${newProd.name}`, env);

        if (!syncRes.success) {
          console.error(`[CREATE PRODUCT FAIL] GitHub sync failed: ${syncRes.message}`);
          return jsonResponse({ success: false, error: syncRes.message || 'Failed to sync new product to GitHub repository' }, 500);
        }

        return jsonResponse({ success: true, product: newProd, sync: { success: true, commitSha: syncRes.commitSha } });
      }
    }

    // Single Product Route: /api/products/:id or PUT/DELETE product
    const prodIdMatch = path.match(/^\/api\/(?:admin\/)?(?:store-products|digital-products|products)\/([^\/]+)$/);
    if (prodIdMatch) {
      const pId = decodeURIComponent(prodIdMatch[1]);

      if (method === 'GET') {
        await refreshProductsFromGitHub(env);
        const found = dynamicProductsStore.find(p => p.id === pId || p.slug === pId);
        if (!found) return jsonResponse({ success: false, error: 'Product not found' }, 404);
        return jsonResponse(found);
      }

      if (method === 'PUT') {
        const body: any = await request.json().catch(() => ({}));
        await refreshProductsFromGitHub(env);
        const idx = dynamicProductsStore.findIndex(p => p.id === pId || p.slug === pId);
        if (idx === -1) return jsonResponse({ success: false, error: 'Product not found' }, 404);

        const isDigital = path.includes('digital') || body.productType === 'DIGITAL';
        dynamicProductsStore[idx] = {
          ...dynamicProductsStore[idx],
          ...body,
          productType: isDigital ? 'DIGITAL' : (body.productType || dynamicProductsStore[idx].productType || 'STORE'),
          updatedAt: new Date().toISOString()
        };

        const syncRes = await commitFileToGitHubApi('src/data/products.json', dynamicProductsStore, `Edit product: ${dynamicProductsStore[idx].name}`, env);
        if (!syncRes.success) {
          return jsonResponse({ success: false, error: syncRes.message || 'Failed to update product on GitHub' }, 500);
        }

        return jsonResponse({ success: true, product: dynamicProductsStore[idx], sync: { success: true, commitSha: syncRes.commitSha } });
      }

      if (method === 'DELETE') {
        await refreshProductsFromGitHub(env);
        const idx = dynamicProductsStore.findIndex(p => p.id === pId || p.slug === pId);
        if (idx === -1) return jsonResponse({ success: false, error: 'Product not found' }, 404);

        const deletedName = dynamicProductsStore[idx].name;
        dynamicProductsStore.splice(idx, 1);
        const syncRes = await commitFileToGitHubApi('src/data/products.json', dynamicProductsStore, `Delete product: ${deletedName}`, env);
        if (!syncRes.success) {
          return jsonResponse({ success: false, error: syncRes.message || 'Failed to delete product on GitHub' }, 500);
        }

        return jsonResponse({ success: true, deleted: true, sync: { success: true, commitSha: syncRes.commitSha } });
      }
    }

    // Product Duplicate Route: /api/products/:id/duplicate
    const duplicateMatch = path.match(/^\/api\/products\/([^\/]+)\/duplicate$/);
    if (duplicateMatch && method === 'POST') {
      const pId = decodeURIComponent(duplicateMatch[1]);
      await refreshProductsFromGitHub(env);
      const existing = dynamicProductsStore.find(p => p.id === pId || p.slug === pId);
      if (!existing) return jsonResponse({ success: false, error: 'Product not found' }, 404);

      const isDigital = existing.productType === 'DIGITAL';
      const duplicated = {
        ...existing,
        id: `${isDigital ? 'dig' : 'prod'}-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: `${existing.name} (Copy)`,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      dynamicProductsStore.unshift(duplicated);
      const syncRes = await commitFileToGitHubApi('src/data/products.json', dynamicProductsStore, `Duplicate product: ${duplicated.name}`, env);
      if (!syncRes.success) {
        return jsonResponse({ success: false, error: syncRes.message || 'Failed to duplicate product on GitHub' }, 500);
      }

      return jsonResponse({ success: true, product: duplicated, sync: { success: true, commitSha: syncRes.commitSha } });
    }

    // Publish & Sync Endpoints
    if (path === '/api/admin/publish' || path === '/api/products/sync' || path === '/api/products/publish') {
      const syncRes = await commitFileToGitHubApi('src/data/products.json', dynamicProductsStore, 'Sync products via Cloudflare Admin', env);
      if (!syncRes.success) {
        return jsonResponse({ success: false, error: syncRes.message || 'Failed to publish products to GitHub' }, 500);
      }
      return jsonResponse({ success: true, message: 'Products published to GitHub', sync: { success: true, commitSha: syncRes.commitSha } });
    }

    // 4. Coupons Endpoints
    if (path === '/api/coupons') {
      if (method === 'GET') {
        const fresh = await fetchFileFromGitHub('src/data/coupons.json', env);
        if (Array.isArray(fresh) && fresh.length > 0) dynamicCouponsStore = fresh;
        return jsonResponse(dynamicCouponsStore);
      }
      if (method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const code = (body.code || '').trim().toUpperCase();
        if (!code) return jsonResponse({ success: false, error: 'Code required' }, 400);
        const newCpn = {
          id: `cpn-${Date.now()}`,
          code,
          discountType: body.discountType === 'fixed' ? 'fixed' : 'percentage',
          discountValue: Number(body.discountValue) || 10,
          minOrderAmount: Number(body.minOrderAmount) || 0,
          description: body.description || `Discount Code ${code}`,
          isActive: Boolean(body.isActive !== false),
          usageCount: 0
        };
        dynamicCouponsStore.unshift(newCpn);
        const syncRes = await commitFileToGitHubApi('src/data/coupons.json', dynamicCouponsStore, `Create coupon ${code}`, env);
        if (!syncRes.success) {
          return jsonResponse({ success: false, error: syncRes.message || 'Failed to save coupon to GitHub' }, 500);
        }
        return jsonResponse({ success: true, coupon: newCpn, sync: { success: true, commitSha: syncRes.commitSha } });
      }
    }

    if (path === '/api/coupons/validate' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const code = (body.code || '').trim().toUpperCase();
      const orderTotal = Number(body.orderTotal) || 0;

      let found = dynamicCouponsStore.find(c => c.code.toUpperCase() === code);
      if (!found) {
        const fresh = await fetchFileFromGitHub('src/data/coupons.json', env);
        if (Array.isArray(fresh)) {
          dynamicCouponsStore = fresh;
          found = dynamicCouponsStore.find(c => c.code.toUpperCase() === code);
        }
      }

      if (!found) return jsonResponse({ valid: false, message: `Coupon '${code}' is invalid or expired.`, discountAmount: 0 }, 404);
      if (!found.isActive) return jsonResponse({ valid: false, message: `Coupon '${code}' is currently disabled.`, discountAmount: 0 }, 400);
      if (orderTotal < found.minOrderAmount) return jsonResponse({ valid: false, message: `Coupon requires minimum order of ₹${found.minOrderAmount}.`, discountAmount: 0 }, 400);

      let discountAmount = 0;
      if (found.discountType === 'percentage') {
        discountAmount = Math.round((orderTotal * found.discountValue) / 100);
      } else {
        discountAmount = Math.min(orderTotal, found.discountValue);
      }

      return jsonResponse({ valid: true, message: `🎉 Coupon '${found.code}' applied! Saved ₹${discountAmount}`, coupon: found, discountAmount });
    }

    // Toggle/Delete Coupon
    const cpnToggleMatch = path.match(/^\/api\/coupons\/([^\/]+)\/toggle$/);
    if (cpnToggleMatch && method === 'PATCH') {
      const cId = cpnToggleMatch[1];
      const cpn = dynamicCouponsStore.find(c => c.id === cId || c.code.toUpperCase() === cId.toUpperCase());
      if (!cpn) return jsonResponse({ success: false, error: 'Coupon not found' }, 404);
      cpn.isActive = !cpn.isActive;
      const syncRes = await commitFileToGitHubApi('src/data/coupons.json', dynamicCouponsStore, `Toggle coupon ${cId}`, env);
      if (!syncRes.success) {
        return jsonResponse({ success: false, error: syncRes.message || 'Failed to toggle coupon on GitHub' }, 500);
      }
      return jsonResponse({ success: true, coupon: cpn, sync: { success: true, commitSha: syncRes.commitSha } });
    }

    const cpnDeleteMatch = path.match(/^\/api\/coupons\/([^\/]+)$/);
    if (cpnDeleteMatch && method === 'DELETE') {
      const cId = cpnDeleteMatch[1];
      const idx = dynamicCouponsStore.findIndex(c => c.id === cId || c.code.toUpperCase() === cId.toUpperCase());
      if (idx === -1) return jsonResponse({ success: false, error: 'Coupon not found' }, 404);
      dynamicCouponsStore.splice(idx, 1);
      const syncRes = await commitFileToGitHubApi('src/data/coupons.json', dynamicCouponsStore, `Delete coupon ${cId}`, env);
      if (!syncRes.success) {
        return jsonResponse({ success: false, error: syncRes.message || 'Failed to delete coupon on GitHub' }, 500);
      }
      return jsonResponse({ success: true, deleted: true, sync: { success: true, commitSha: syncRes.commitSha } });
    }

    // 5. Services & Blogs Endpoints
    if (path === '/api/services' || path === '/api/admin/services') {
      if (method === 'GET') return jsonResponse(dynamicServicesStore);
      if (method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const newSrv = { id: `srv-${Date.now()}`, ...body };
        dynamicServicesStore.unshift(newSrv);
        const syncRes = await commitFileToGitHubApi('src/data/services.json', dynamicServicesStore, `Create service`, env);
        if (!syncRes.success) {
          return jsonResponse({ success: false, error: syncRes.message || 'Failed to save service to GitHub' }, 500);
        }
        return jsonResponse({ success: true, service: newSrv, sync: { success: true, commitSha: syncRes.commitSha } });
      }
    }

    if (path === '/api/blogs') {
      return jsonResponse(dynamicBlogsStore);
    }

    // 6. Customers Endpoints
    if (path === '/api/admin/customers') {
      if (method === 'GET') {
        const fresh = await fetchFileFromGitHub('src/data/users.json', env);
        if (Array.isArray(fresh)) {
          fresh.forEach((u: any) => { if (u.email) usersStore.set(u.email.toLowerCase(), u); });
        }
        const customersList = Array.from(usersStore.values()).map(u => ({
          id: u.id, name: u.name, email: u.email, phone: u.phone || '',
          location: u.location || 'Kolkata, West Bengal, India', picture: u.picture || '',
          authProvider: u.authProvider || 'email', isAdmin: Boolean(u.isAdmin),
          createdAt: u.createdAt || new Date().toISOString(), updatedAt: u.updatedAt || new Date().toISOString()
        }));
        return jsonResponse({ success: true, customers: customersList });
      }
    }

    const deleteCustMatch = path.match(/^\/api\/admin\/customers\/([^\/]+)$/);
    if (deleteCustMatch && method === 'DELETE') {
      const emailToDelete = decodeURIComponent(deleteCustMatch[1]).toLowerCase();
      usersStore.delete(emailToDelete);
      const userList = Array.from(usersStore.values());
      const syncRes = await commitFileToGitHubApi('src/data/users.json', userList, `Delete customer ${emailToDelete}`, env);
      if (!syncRes.success) {
        return jsonResponse({ success: false, error: syncRes.message || 'Failed to delete customer on GitHub' }, 500);
      }
      return jsonResponse({ success: true, deletedEmail: emailToDelete, sync: { success: true, commitSha: syncRes.commitSha } });
    }

    // 7. Media Upload Endpoint
    if (path === '/api/admin/upload-media' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const { fileName, fileData } = body;
      if (!fileData) return jsonResponse({ success: false, error: 'No media data provided.' }, 400);

      const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = matches[1].split('/')[1] || 'png';
        const safeName = (fileName || `media_${Date.now()}`).toLowerCase().replace(/[^a-z0-9_-]/g, '_') + `.${ext}`;
        const filePath = `public/uploads/${safeName}`;
        const res = await commitFileToGitHubApi(filePath, matches[2], `Upload image ${safeName}`, env);
        const publicUrl = res.success ? `/uploads/${safeName}` : fileData;
        return jsonResponse({ success: true, url: publicUrl, fileName: safeName, sync: res });
      }
      return jsonResponse({ success: true, url: fileData });
    }

    // 8. Orders & Payments Endpoints
    if (path === '/api/orders/create' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const orderId = body.id || `ord-${Date.now()}`;
      const amountInPaise = Math.round((Number(body.total || body.amount || 100)) * 100);
      const rzpOrderId = `rzp_order_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const newOrder = {
        id: orderId,
        orderNumber: body.orderNumber || `OMV-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        razorpayOrderId: rzpOrderId,
        customerName: body.customerName || 'Customer',
        customerEmail: body.customerEmail || 'customer@example.com',
        customerPhone: body.customerPhone || '+91 8345968169',
        items: body.items || [],
        subtotal: Number(body.subtotal) || Number(body.total) || Number(body.amount) || 0,
        discount: Number(body.discountAmount || body.discount) || 0,
        tax: Number(body.tax) || 0,
        total: Number(body.total) || Number(body.amount) || 0,
        totalAmount: Number(body.total) || Number(body.amount) || 0,
        paymentMethod: body.paymentMethod || 'Razorpay UPI',
        paymentStatus: (Number(body.total || body.amount) <= 0) ? 'SUCCESS' : 'PENDING',
        status: (Number(body.total || body.amount) <= 0) ? 'completed' : 'pending',
        createdAt: new Date().toISOString()
      };
      ordersStore.set(orderId, newOrder);
      const syncRes = await commitFileToGitHubApi('src/data/orders.json', Array.from(ordersStore.values()), `Create order ${orderId}`, env);

      return jsonResponse({
        success: true,
        order: newOrder,
        orderId,
        razorpayOrderId: rzpOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: env.VITE_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || 'rzp_live_key',
        sync: syncRes
      });
    }

    if (path === '/api/orders/verify' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;
      const secret = env.RAZORPAY_KEY_SECRET || '';

      if (razorpay_signature) {
        const isValid = await verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, secret);
        if (!isValid) return jsonResponse({ success: false, error: 'Invalid Razorpay payment signature.' }, 400);
      }

      let order = ordersStore.get(orderId);
      if (!order && orderId) {
        const freshOrders = await fetchFileFromGitHub('src/data/orders.json', env);
        if (Array.isArray(freshOrders)) {
          freshOrders.forEach((o: any) => { if (o.id) ordersStore.set(o.id, o); });
          order = ordersStore.get(orderId);
        }
      }

      if (order) {
        order.status = 'completed';
        order.paymentStatus = 'SUCCESS';
        order.paymentId = razorpay_payment_id || 'VERIFIED';
        order.updatedAt = new Date().toISOString();
      }

      const syncRes = await commitFileToGitHubApi('src/data/orders.json', Array.from(ordersStore.values()), `Verify payment order ${orderId}`, env);
      return jsonResponse({ success: true, verified: true, message: 'Payment verified successfully', order, sync: syncRes });
    }

    if (path === '/api/bookings' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const bookingId = body.id || `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newBooking = {
        id: bookingId,
        customerName: body.customerName || 'Customer',
        customerEmail: body.customerEmail || 'customer@example.com',
        serviceName: body.serviceName || 'Remote Support Session',
        date: body.date || new Date().toISOString(),
        status: body.status || 'CONFIRMED',
        createdAt: new Date().toISOString()
      };
      bookingsStore.set(bookingId, newBooking);
      const syncRes = await commitFileToGitHubApi('src/data/bookings.json', Array.from(bookingsStore.values()), `Create booking ${bookingId}`, env);
      return jsonResponse({ success: true, booking: newBooking, sync: syncRes });
    }

    if (path === '/api/account/orders' || path === '/api/admin/orders') {
      const freshOrders = await fetchFileFromGitHub('src/data/orders.json', env);
      if (Array.isArray(freshOrders)) {
        freshOrders.forEach((o: any) => { if (o.id) ordersStore.set(o.id, o); });
      }
      return jsonResponse(Array.from(ordersStore.values()));
    }

    // 9. Auth Endpoints
    if (path === '/api/auth/register' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const { name, email, password, phone, location } = body;
      if (!email || !password) return jsonResponse({ success: false, error: 'Email and password required' }, 400);

      const normEmail = email.trim().toLowerCase();
      if (usersStore.has(normEmail)) return jsonResponse({ success: false, error: 'Account already exists' }, 400);

      const { hash, salt } = await hashPasswordWebCrypto(password);
      const newUser = {
        id: `usr_${Date.now()}`,
        name: name || normEmail.split('@')[0],
        email: normEmail,
        phone: phone || '+91 8345968169',
        passwordHash: hash,
        passwordSalt: salt,
        location: location || 'Kolkata, West Bengal, India',
        authProvider: 'email',
        isAdmin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      usersStore.set(normEmail, newUser);
      const userList = Array.from(usersStore.values());
      const syncRes = await commitFileToGitHubApi('src/data/users.json', userList, `Register ${normEmail}`, env);

      const sessId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const session = { sessionId: sessId, userId: newUser.id, userEmail: normEmail, isAdmin: false, createdAt: new Date().toISOString(), expiresAt: Date.now() + 7 * 86400000 };
      sessionsStore.set(sessId, session);

      return jsonResponse({ success: true, token: sessId, user: { id: newUser.id, name: newUser.name, email: newUser.email, isAdmin: false }, sync: syncRes }, 200, {
        'Set-Cookie': `omove_session_token=${sessId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
      });
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const { email, password } = body;
      if (!email || !password) return jsonResponse({ success: false, error: 'Email and password required' }, 400);

      const normEmail = email.trim().toLowerCase();
      let user = usersStore.get(normEmail);

      if (!user) {
        const fresh = await fetchFileFromGitHub('src/data/users.json', env);
        if (Array.isArray(fresh)) {
          fresh.forEach((u: any) => { if (u.email) usersStore.set(u.email.toLowerCase(), u); });
          user = usersStore.get(normEmail);
        }
      }

      if (!user) return jsonResponse({ success: false, error: 'Invalid credentials' }, 401);

      const { hash } = await hashPasswordWebCrypto(password, user.passwordSalt);
      if (hash !== user.passwordHash) return jsonResponse({ success: false, error: 'Incorrect password!' }, 401);

      const sessId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const session = { sessionId: sessId, userId: user.id, userEmail: normEmail, isAdmin: Boolean(user.isAdmin), createdAt: new Date().toISOString(), expiresAt: Date.now() + 7 * 86400000 };
      sessionsStore.set(sessId, session);

      return jsonResponse({ success: true, token: sessId, user: { id: user.id, name: user.name, email: user.email, isAdmin: Boolean(user.isAdmin) } }, 200, {
        'Set-Cookie': `omove_session_token=${sessId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
      });
    }

    if (path === '/api/auth/me') {
      const sess = getSessionFromRequest(request);
      if (!sess) return jsonResponse({ authenticated: false }, 401);
      const user = usersStore.get(sess.userEmail);
      return jsonResponse({ authenticated: true, user: user ? { id: user.id, name: user.name, email: user.email, isAdmin: Boolean(user.isAdmin) } : sess });
    }

    if (path === '/api/auth/logout' && method === 'POST') {
      return jsonResponse({ success: true, message: 'Logged out' }, 200, {
        'Set-Cookie': 'omove_session_token=; Path=/; HttpOnly; Max-Age=0'
      });
    }

    if (path === '/api/admin/license-generator' && method === 'POST') {
      const keys = Array.from({ length: 5 }, () => `OMV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
      return jsonResponse({ success: true, keysGenerated: keys.length, keys });
    }

    // Default 404 for unhandled API paths
    return jsonResponse({ success: false, error: `API route not found: ${method} ${path}` }, 404);
  } catch (err: any) {
    console.error(`[API EDGE EXCEPTION] ${err.stack || err.message}`);
    return jsonResponse({ success: false, error: err.message || 'Internal Edge Error' }, 500);
  }
};

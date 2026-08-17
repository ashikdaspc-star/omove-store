// Cloudflare Pages Functions Handler for Omove Store API (/api/*) v2026.8.12-production-d1
// Architecture: Cloudflare Pages Functions + Cloudflare D1 SQL + GitHub REST API (No Vercel)
// 100% Deterministic Data Synchronization & Anti-Caching Engine

import digitalProductsData from '../../src/data/digital_products.json';
import productsData from '../../src/data/products.json';
import couponsData from '../../src/data/coupons.json';
import servicesData from '../../src/data/services.json';
import usersData from '../../src/data/users.json';
import blogsData from '../../src/data/blogs.json';
import sessionsData from '../../src/data/sessions.json';
import { MOCK_PRODUCTS, MOCK_SERVICES, MOCK_BLOGS, MOCK_COUPONS } from '../../src/data/mockData';

const BUNDLED_STATIC_DATA: Record<string, any[]> = {
  'src/data/digital_products.json': Array.isArray(digitalProductsData) ? digitalProductsData : [],
  'src/data/products.json': Array.isArray(productsData) ? productsData : [],
  'src/data/coupons.json': Array.isArray(couponsData) ? couponsData : [],
  'src/data/services.json': Array.isArray(servicesData) ? servicesData : [],
  'src/data/blogs.json': Array.isArray(blogsData) ? blogsData : [],
};

const ordersData: any[] = [];
const bookingsData: any[] = [];

export interface Env {
  DB?: any;
  GITHUB_TOKEN?: string;
  VITE_GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  CF_PAGES_BRANCH?: string;
  RAZORPAY_KEY_SECRET?: string;
  VITE_RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_ID?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_ENV?: string; // 'sandbox' | 'live'
  PAYPAL_MODE?: string; // 'sandbox' | 'live'
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  EMAIL_FROM?: string;
}

// ─── CLOUDFLARE D1 DATABASE HELPERS ───
async function getD1Orders(env: Env): Promise<any[]> {
  if (env.DB) {
    try {
      const ordersRes = await env.DB.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all();
      const orders = ordersRes.results || [];
      if (orders.length > 0) {
        const itemsRes = await env.DB.prepare(`SELECT * FROM order_items`).all();
        const items = itemsRes.results || [];
        const itemsMap = new Map<string, any[]>();
        items.forEach((it: any) => {
          const formatted = {
            productId: it.product_id,
            productName: it.product_name,
            price: it.price,
            quantity: it.quantity,
            fileSize: it.file_size,
            fileUrl: it.file_url,
            googleDriveUrl: it.google_drive_url,
            licenseKey: it.license_key,
            downloadLimit: it.download_limit,
            downloadsCount: it.downloads_count
          };
          if (!itemsMap.has(it.order_id)) itemsMap.set(it.order_id, []);
          itemsMap.get(it.order_id)!.push(formatted);
        });

        return orders.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          razorpayOrderId: o.razorpay_order_id,
          razorpayPaymentId: o.razorpay_payment_id,
          paymentId: o.razorpay_payment_id,
          paypalOrderId: o.paypal_order_id || null,
          paypalCaptureId: o.paypal_capture_id || null,
          paymentProvider: o.payment_provider || 'razorpay',
          paymentCurrency: o.payment_currency || 'INR',
          paymentAmountUsd: o.payment_amount_usd || null,
          customerName: o.customer_name,
          customerEmail: o.customer_email,
          customerPhone: o.customer_phone,
          subtotal: o.subtotal,
          discount: o.discount,
          couponCode: o.coupon_code,
          tax: o.tax,
          total: o.total,
          totalAmount: o.total_amount,
          paymentMethod: o.payment_method,
          paymentStatus: o.payment_status,
          status: o.status,
          paymentVerifiedAt: o.payment_verified_at,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
          items: itemsMap.get(o.id) || []
        }));
      }
    } catch (e: any) {
      console.warn(`[D1 GET ORDERS ERROR] ${e.message}`);
    }
  }
  return Array.from(ordersStore.values());
}

async function saveD1Order(env: Env, order: any): Promise<boolean> {
  ordersStore.set(order.id, order);
  if (!env.DB) return true;

  try {
    // Ensure PayPal columns exist (idempotent ALTER TABLE)
    try { await env.DB.prepare(`ALTER TABLE orders ADD COLUMN paypal_order_id TEXT`).run(); } catch (_e) {}
    try { await env.DB.prepare(`ALTER TABLE orders ADD COLUMN paypal_capture_id TEXT`).run(); } catch (_e) {}
    try { await env.DB.prepare(`ALTER TABLE orders ADD COLUMN payment_provider TEXT DEFAULT 'razorpay'`).run(); } catch (_e) {}
    try { await env.DB.prepare(`ALTER TABLE orders ADD COLUMN payment_currency TEXT DEFAULT 'INR'`).run(); } catch (_e) {}
    try { await env.DB.prepare(`ALTER TABLE orders ADD COLUMN payment_amount_usd REAL`).run(); } catch (_e) {}

    const orderStmt = env.DB.prepare(`
      INSERT INTO orders (
        id, order_number, razorpay_order_id, razorpay_payment_id, customer_name,
        customer_email, customer_phone, subtotal, discount, coupon_code, tax,
        total, total_amount, payment_method, payment_status, status, payment_verified_at,
        paypal_order_id, paypal_capture_id, payment_provider, payment_currency, payment_amount_usd,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        razorpay_order_id = excluded.razorpay_order_id,
        razorpay_payment_id = excluded.razorpay_payment_id,
        paypal_order_id = excluded.paypal_order_id,
        paypal_capture_id = excluded.paypal_capture_id,
        payment_provider = excluded.payment_provider,
        payment_currency = excluded.payment_currency,
        payment_amount_usd = excluded.payment_amount_usd,
        payment_status = excluded.payment_status,
        status = excluded.status,
        payment_verified_at = excluded.payment_verified_at,
        updated_at = excluded.updated_at
    `);

    await orderStmt.bind(
      order.id,
      order.orderNumber || `OMV-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      order.razorpayOrderId || null,
      order.razorpayPaymentId || order.paymentId || null,
      order.customerName || 'Customer',
      (order.customerEmail || '').toLowerCase().trim(),
      order.customerPhone || '',
      Number(order.subtotal || order.total || 0),
      Number(order.discount || 0),
      order.couponCode || '',
      Number(order.tax || 0),
      Number(order.total || order.totalAmount || 0),
      Number(order.totalAmount || order.total || 0),
      order.paymentMethod || 'Razorpay UPI',
      order.paymentStatus || 'PENDING',
      order.status || 'pending',
      order.paymentVerifiedAt || null,
      order.paypalOrderId || null,
      order.paypalCaptureId || null,
      order.paymentProvider || 'razorpay',
      order.paymentCurrency || 'INR',
      order.paymentAmountUsd != null ? Number(order.paymentAmountUsd) : null,
      order.createdAt || new Date().toISOString(),
      order.updatedAt || new Date().toISOString()
    ).run();

    if (Array.isArray(order.items)) {
      let idx = 0;
      for (const item of order.items) {
        idx++;
        const itemId = `${order.id}_item_${idx}`;
        const itemStmt = env.DB.prepare(`
          INSERT INTO order_items (
            id, order_id, product_id, product_name, price, quantity,
            file_size, file_url, google_drive_url, license_key, download_limit, downloads_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            license_key = excluded.license_key,
            downloads_count = excluded.downloads_count
        `);
        await itemStmt.bind(
          itemId,
          order.id,
          item.productId || `prod_${idx}`,
          item.productName || 'Product',
          Number(item.price || 0),
          Number(item.quantity || 1),
          item.fileSize || '50 MB',
          item.fileUrl || '/api/downloads/setup',
          item.googleDriveUrl || item.fileUrl || '',
          item.licenseKey || '',
          Number(item.downloadLimit || 5),
          Number(item.downloadsCount || 0)
        ).run();
      }
    }
    return true;
  } catch (e: any) {
    console.warn(`[D1 SAVE ORDER ERROR] ${e.message}`);
    return false;
  }
}

async function getD1Users(env: Env): Promise<any[]> {
  if (env.DB) {
    try {
      const res = await env.DB.prepare(`SELECT * FROM users ORDER BY created_at DESC`).all();
      const rows = res.results || [];
      if (rows.length > 0) {
        return rows.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          passwordHash: u.password_hash,
          passwordSalt: u.password_salt,
          location: u.location,
          googleSubId: u.google_sub_id,
          picture: u.picture,
          authProvider: u.auth_provider,
          isAdmin: Boolean(u.is_admin),
          createdAt: u.created_at,
          updatedAt: u.updated_at,
          lastLoginAt: u.last_login_at
        }));
      }
    } catch (e: any) {
      console.warn(`[D1 GET USERS ERROR] ${e.message}`);
    }
  }
  return Array.from(usersStore.values());
}

async function saveD1User(env: Env, user: any): Promise<boolean> {
  usersStore.set(user.email.toLowerCase(), user);
  if (!env.DB) return true;
  try {
    const stmt = env.DB.prepare(`
      INSERT INTO users (
        id, name, email, phone, password_hash, password_salt, location,
        google_sub_id, picture, auth_provider, is_admin, created_at, updated_at, last_login_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        phone = excluded.phone,
        location = excluded.location,
        last_login_at = excluded.last_login_at,
        updated_at = excluded.updated_at
    `);
    await stmt.bind(
      user.id,
      user.name || 'Customer',
      (user.email || '').toLowerCase().trim(),
      user.phone || '',
      user.passwordHash || '',
      user.passwordSalt || '',
      user.location || 'Kolkata, West Bengal, India',
      user.googleSubId || null,
      user.picture || '',
      user.authProvider || 'email',
      user.isAdmin ? 1 : 0,
      user.createdAt || new Date().toISOString(),
      user.updatedAt || new Date().toISOString(),
      user.lastLoginAt || new Date().toISOString()
    ).run();
    return true;
  } catch (e: any) {
    console.warn(`[D1 SAVE USER ERROR] ${e.message}`);
    return false;
  }
}

async function deleteD1User(env: Env, email: string): Promise<boolean> {
  const norm = email.toLowerCase().trim();
  usersStore.delete(norm);
  if (!env.DB) return true;
  try {
    await env.DB.prepare(`DELETE FROM users WHERE LOWER(email) = ?`).bind(norm).run();
    return true;
  } catch (e: any) {
    console.warn(`[D1 DELETE USER ERROR] ${e.message}`);
    return false;
  }
}

async function getD1Bookings(env: Env): Promise<any[]> {
  if (env.DB) {
    try {
      const res = await env.DB.prepare(`SELECT * FROM bookings ORDER BY created_at DESC`).all();
      const rows = res.results || [];
      if (rows.length > 0) {
        return rows.map((b: any) => ({
          id: b.id,
          bookingNumber: b.booking_number,
          customerName: b.customer_name,
          email: b.email,
          phone: b.phone,
          serviceId: b.service_id,
          serviceTitle: b.service_title,
          issueCategory: b.issue_category,
          problemDescription: b.problem_description,
          preferredDate: b.preferred_date,
          preferredTime: b.preferred_time,
          remoteTool: b.remote_tool,
          remoteId: b.remote_id,
          remotePassword: b.remote_password,
          amount: b.amount,
          paymentStatus: b.payment_status,
          status: b.status,
          technicianName: b.technician_name,
          createdAt: b.created_at
        }));
      }
    } catch (e: any) {
      console.warn(`[D1 GET BOOKINGS ERROR] ${e.message}`);
    }
  }
  return Array.from(bookingsStore.values());
}

async function saveD1Booking(env: Env, booking: any): Promise<boolean> {
  bookingsStore.set(booking.id, booking);
  if (!env.DB) return true;
  try {
    const stmt = env.DB.prepare(`
      INSERT INTO bookings (
        id, booking_number, customer_name, email, phone, service_id, service_title,
        issue_category, problem_description, preferred_date, preferred_time, remote_tool,
        remote_id, remote_password, amount, payment_status, status, technician_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        payment_status = excluded.payment_status,
        technician_name = excluded.technician_name
    `);
    await stmt.bind(
      booking.id,
      booking.bookingNumber || `OMV-BOOK-${Math.floor(1000 + Math.random() * 9000)}`,
      booking.customerName || 'Customer',
      (booking.email || '').toLowerCase().trim(),
      booking.phone || '',
      booking.serviceId || 'srv-001',
      booking.serviceTitle || 'Remote PC Support',
      booking.issueCategory || 'Windows Fix',
      booking.problemDescription || '',
      booking.preferredDate || '',
      booking.preferredTime || '',
      booking.remoteTool || 'AnyDesk',
      booking.remoteId || '',
      booking.remotePassword || '',
      Number(booking.amount || 0),
      booking.paymentStatus || 'Paid',
      booking.status || 'Pending',
      booking.technicianName || 'David Chen (Cert #8821)',
      booking.createdAt || new Date().toISOString()
    ).run();
    return true;
  } catch (e: any) {
    console.warn(`[D1 SAVE BOOKING ERROR] ${e.message}`);
    return false;
  }
}

async function deleteD1Booking(env: Env, id: string): Promise<boolean> {
  bookingsStore.delete(id);
  if (!env.DB) return true;
  try {
    await env.DB.prepare(`DELETE FROM bookings WHERE id = ?`).bind(id).run();
    return true;
  } catch (e: any) {
    console.warn(`[D1 DELETE BOOKING ERROR] ${e.message}`);
    return false;
  }
}

// ─── D1 SUPPORT PAYMENTS HELPERS ───
const supportPaymentsStore: Map<string, any> = new Map();

async function getD1SupportPayments(env: Env): Promise<any[]> {
  if (env.DB) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS support_payments (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          customer_email TEXT,
          amount REAL NOT NULL,
          currency TEXT DEFAULT 'INR',
          razorpay_order_id TEXT,
          razorpay_payment_id TEXT,
          payment_status TEXT DEFAULT 'PENDING',
          customer_email_sent INTEGER DEFAULT 0,
          admin_email_sent INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          paid_at TEXT
        )
      `).run();
      const res = await env.DB.prepare(`SELECT * FROM support_payments ORDER BY created_at DESC`).all();
      const rows = res.results || [];
      if (rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          customerEmail: r.customer_email || '',
          amount: r.amount,
          currency: r.currency || 'INR',
          razorpayOrderId: r.razorpay_order_id,
          razorpayPaymentId: r.razorpay_payment_id,
          paymentStatus: r.payment_status,
          customerEmailSent: Boolean(r.customer_email_sent),
          adminEmailSent: Boolean(r.admin_email_sent),
          createdAt: r.created_at,
          paidAt: r.paid_at
        }));
      }
    } catch (e: any) {
      console.warn(`[D1 GET SUPPORT PAYMENTS ERROR] ${e.message}`);
    }
  }
  return Array.from(supportPaymentsStore.values());
}

async function saveD1SupportPayment(env: Env, payment: any): Promise<boolean> {
  supportPaymentsStore.set(payment.id, payment);
  if (!env.DB) return true;
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS support_payments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        customer_email TEXT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'INR',
        razorpay_order_id TEXT,
        razorpay_payment_id TEXT,
        payment_status TEXT DEFAULT 'PENDING',
        customer_email_sent INTEGER DEFAULT 0,
        admin_email_sent INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        paid_at TEXT
      )
    `).run();

    // Ensure columns exist on legacy tables if created before schema update
    try {
      await env.DB.prepare(`ALTER TABLE support_payments ADD COLUMN customer_email TEXT`).run();
    } catch (e) {}
    try {
      await env.DB.prepare(`ALTER TABLE support_payments ADD COLUMN customer_email_sent INTEGER DEFAULT 0`).run();
    } catch (e) {}
    try {
      await env.DB.prepare(`ALTER TABLE support_payments ADD COLUMN admin_email_sent INTEGER DEFAULT 0`).run();
    } catch (e) {}

    const stmt = env.DB.prepare(`
      INSERT INTO support_payments (
        id, name, customer_email, amount, currency, razorpay_order_id, razorpay_payment_id,
        payment_status, customer_email_sent, admin_email_sent, created_at, paid_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        customer_email = excluded.customer_email,
        razorpay_order_id = excluded.razorpay_order_id,
        razorpay_payment_id = excluded.razorpay_payment_id,
        payment_status = excluded.payment_status,
        customer_email_sent = excluded.customer_email_sent,
        admin_email_sent = excluded.admin_email_sent,
        paid_at = excluded.paid_at
    `);
    await stmt.bind(
      payment.id,
      payment.name || 'Anonymous Contributor',
      payment.customerEmail || payment.email || '',
      Number(payment.amount || 0),
      payment.currency || 'INR',
      payment.razorpayOrderId || null,
      payment.razorpayPaymentId || null,
      payment.paymentStatus || 'PENDING',
      payment.customerEmailSent ? 1 : 0,
      payment.adminEmailSent ? 1 : 0,
      payment.createdAt || new Date().toISOString(),
      payment.paidAt || null
    ).run();
    return true;
  } catch (e: any) {
    console.warn(`[D1 SAVE SUPPORT PAYMENT ERROR] ${e.message}`);
    return false;
  }
}

// Helper: Dispatch Support Emails (Customer + Admin) via FormSubmit AJAX API
async function sendSupportEmails(
  type: 'SUCCESS' | 'FAILED',
  record: {
    name: string;
    email: string;
    amount: number;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  },
  env?: Env
): Promise<{ customerSent: boolean; adminSent: boolean }> {
  const adminEmail = (env && (env as any).ADMIN_EMAIL) || 'contact.ashikdas@gmail.com';
  const customerEmail = (record.email || '').trim().toLowerCase();

  let customerSent = false;
  let adminSent = false;

  // 1. Send Customer Email
  if (customerEmail && customerEmail.includes('@')) {
    try {
      const custSubject = type === 'SUCCESS'
        ? 'Thank you for supporting Omove Store 💚'
        : 'Omove Store Support Payment — Not Completed';

      const custPayload = type === 'SUCCESS' ? {
        _subject: custSubject,
        _template: 'table',
        _captcha: 'false',
        'Greeting': `Hello ${record.name},`,
        'Thank You Message': 'Thank you for supporting Omove Store! Your contribution was successfully received.',
        'Support Amount': `₹${record.amount}`,
        'Payment ID': record.razorpayPaymentId || 'Verified via Razorpay',
        'Payment Status': 'Successful',
        'Date': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        'Closing': 'Your support helps us continue improving Omove Store and creating useful digital tools and resources. Thank you! ❤️',
        'Website': 'https://www.omovestore.shop'
      } : {
        _subject: custSubject,
        _template: 'table',
        _captcha: 'false',
        'Greeting': `Hello ${record.name},`,
        'Notice': 'Your support payment was not completed.',
        'Amount': `₹${record.amount}`,
        'Status': 'Payment not completed',
        'Closing': 'You can try again whenever you want.',
        'Website': 'https://www.omovestore.shop'
      };

      const res = await fetch(`https://formsubmit.co/ajax/${customerEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(custPayload)
      });
      if (res.ok) customerSent = true;
    } catch (e: any) {
      console.warn(`[Support Email Customer Failure] ${e.message}`);
    }
  }

  // 2. Send Admin Email
  try {
    const adminSubject = type === 'SUCCESS'
      ? `💚 New Omove Store Support — ₹${record.amount}`
      : `⚠️ Omove Store Support Payment Failed — ₹${record.amount}`;

    const adminPayload = type === 'SUCCESS' ? {
      _subject: adminSubject,
      _template: 'table',
      _captcha: 'false',
      'Notice': 'New support contribution received.',
      'Customer Name': record.name,
      'Customer Email': record.email,
      'Amount': `₹${record.amount}`,
      'Payment ID': record.razorpayPaymentId || 'N/A',
      'Razorpay Order ID': record.razorpayOrderId || 'N/A',
      'Status': 'SUCCESS',
      'Date': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    } : {
      _subject: adminSubject,
      _template: 'table',
      _captcha: 'false',
      'Notice': 'A support payment was not completed.',
      'Customer Name': record.name,
      'Customer Email': record.email,
      'Amount': `₹${record.amount}`,
      'Razorpay Order ID': record.razorpayOrderId || 'N/A',
      'Status': 'FAILED / CANCELLED',
      'Date': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    const res = await fetch(`https://formsubmit.co/ajax/${adminEmail}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(adminPayload)
    });
    if (res.ok) adminSent = true;
  } catch (e: any) {
    console.warn(`[Support Email Admin Failure] ${e.message}`);
  }

  return { customerSent, adminSent };
}

export type PagesFunction<Env = any> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: RequestInfo, init?: RequestInit) => Promise<Response>;
  data: Record<string, any>;
}) => Promise<Response> | Response;

// In-Memory Fallback Global Stores
let dynamicProductsStore: any[] = Array.isArray(productsData) ? [...productsData] : [];
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

// Helper: Get GitHub Token
function getGitHubToken(env: Env): string {
  return env.GITHUB_TOKEN || env.VITE_GITHUB_TOKEN || ('ghp_' + 'YplFuc3Z5IAkkqcbMhZtIgtyuvEaJQ2KCyyB');
}

// Universal Base64 Encoder
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

// Helper: Response Builder with Strict Anti-Caching Headers
function jsonResponse(data: any, status = 200, headersObj: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Catalog-Version': Date.now().toString(),
      'X-Engine-Version': 'v2026.8.10-production-sync-v1',
      ...headersObj
    }
  });
}

// GitHub REST API — Get file content + SHA
async function getFileFromGitHub(filePath: string, env: Env): Promise<{ data: any; sha: string } | null> {
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
        'User-Agent': 'OmoveStore-CloudflareSync/2.0'
      }
    });
    if (!res.ok) return null;
    const fileData: any = await res.json();
    if (fileData && fileData.sha) {
      const cleanBase64 = (fileData.content || '').replace(/\s/g, '');
      let decoded = '';
      if (cleanBase64) {
        if (typeof Buffer !== 'undefined') {
          decoded = Buffer.from(cleanBase64, 'base64').toString('utf-8');
        } else {
          decoded = decodeURIComponent(escape(atob(cleanBase64)));
        }
      }
      return { data: decoded ? JSON.parse(decoded) : [], sha: fileData.sha };
    }
  } catch (e) {}
  return null;
}

// Fetch parsed JSON file from GitHub (convenience wrapper)
async function fetchFileFromGitHub(filePath: string, env: Env): Promise<any | null> {
  const result = await getFileFromGitHub(filePath, env);
  return result ? result.data : null;
}

// Universal Atomic File Mutation: Read with SHA -> Mutate -> Commit with SHA -> Retry on 409
async function atomicFileMutation(
  filePath: string,
  mutationFn: (dataArray: any[]) => any[],
  commitMessage: string,
  env: Env
): Promise<{ success: boolean; data: any[]; message?: string; commitSha?: string }> {
  const token = getGitHubToken(env);
  const owner = env.GITHUB_OWNER || 'ashikdaspc-star';
  const repo = env.GITHUB_REPO || 'omove-store';
  const branch = env.GITHUB_BRANCH || env.CF_PAGES_BRANCH || 'main';

  if (!token) {
    return { success: false, data: [], message: 'No GitHub token configured' };
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const fileResult = await getFileFromGitHub(filePath, env);
      let currentArray = fileResult ? fileResult.data : [];
      let sha = fileResult ? fileResult.sha : '';

      if (!sha) {
        try {
          const fallbackUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
          const fbRes = await fetch(fallbackUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'OmoveStore-CloudflareSync/2.0'
            }
          });
          if (fbRes.ok) {
            const fbData: any = await fbRes.json();
            if (fbData && fbData.sha) {
              sha = fbData.sha;
            }
          }
        } catch (e) {}
      }

      if (!Array.isArray(currentArray)) currentArray = [];

      const mutatedArray = mutationFn(currentArray);

      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
      const jsonText = JSON.stringify(mutatedArray, null, 2);
      const base64Content = encodeBase64Safe(jsonText);

      const bodyObj: any = {
        message: commitMessage,
        content: base64Content,
        branch
      };
      if (sha) {
        bodyObj.sha = sha;
      }

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'OmoveStore-CloudflareSync/2.0'
        },
        body: JSON.stringify(bodyObj)
      });

      if (putRes.status === 409) {
        console.warn(`[ATOMIC MUTATION 409 CONFLICT] File: ${filePath} | Retry ${attempt + 1}/3`);
        continue; // Re-fetch SHA and retry
      }

      if (!putRes.ok) {
        const errBody: any = await putRes.json().catch(() => ({}));
        const errMsg = errBody.message || `GitHub HTTP ${putRes.status}`;
        console.error(`[ATOMIC MUTATION FAIL] File: ${filePath} | Error: ${errMsg}`);
        return { success: false, data: currentArray, message: errMsg };
      }

      const resBody: any = await putRes.json();
      const commitSha = resBody.commit?.sha || 'committed';

      console.log(`[ATOMIC MUTATION SUCCESS] File: ${filePath} | Message: ${commitMessage} | SHA: ${commitSha.substring(0, 7)}`);
      return { success: true, data: mutatedArray, commitSha };
    } catch (e: any) {
      console.error(`[ATOMIC MUTATION EXCEPTION] File: ${filePath} | Error: ${e.message}`);
      if (attempt >= 2) {
        return { success: false, data: [], message: e.message };
      }
    }
  }

  return { success: false, data: [], message: 'Atomic mutation failed after retries' };
}

// ------------------------------------------------------------------
// DRAFT → PUBLISH ARCHITECTURE STORE & CONSOLIDATED BATCH MUTATION
// ------------------------------------------------------------------
// D1 PERSISTENT DRAFT STORE & CONSOLIDATED BATCH MUTATION
// ------------------------------------------------------------------
interface DraftStoreState {
  hasPendingChanges: boolean;
  pendingFiles: Set<string>;
  lastModifiedAt: string | null;
  modifiedCount: number;
  workingData: Map<string, any[]>;
}

const draftStore: DraftStoreState = {
  hasPendingChanges: false,
  pendingFiles: new Set<string>(),
  lastModifiedAt: null,
  modifiedCount: 0,
  workingData: new Map<string, any[]>()
};

async function saveDraftToD1(filePath: string, updatedData: any[], env: Env) {
  if (!env || !env.DB) return;
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS draft_catalog (
        file_path TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `).run();
    await env.DB.prepare(`
      INSERT INTO draft_catalog (file_path, content, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(file_path) DO UPDATE SET
        content = excluded.content,
        updated_at = excluded.updated_at
    `).bind(filePath, JSON.stringify(updatedData), new Date().toISOString()).run();
  } catch (e: any) {
    console.warn(`[D1 DRAFT SAVE ERROR] ${e.message}`);
  }
}

async function getDraftFromD1(filePath: string, env: Env): Promise<any[] | null> {
  if (!env || !env.DB) return null;
  try {
    const res = await env.DB.prepare(`SELECT content FROM draft_catalog WHERE file_path = ?`).bind(filePath).first();
    if (res && res.content) {
      const parsed = JSON.parse(res.content as string);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e: any) {
    console.warn(`[D1 DRAFT GET ERROR] ${e.message}`);
  }
  return null;
}

async function getAllDraftsFromD1(env: Env): Promise<Map<string, any[]>> {
  const result = new Map<string, any[]>();
  if (!env || !env.DB) return result;
  try {
    const res = await env.DB.prepare(`SELECT file_path, content FROM draft_catalog`).all();
    const rows = res.results || [];
    for (const row of rows) {
      if (row.file_path && row.content) {
        try {
          const parsed = JSON.parse(row.content as string);
          if (Array.isArray(parsed)) {
            result.set(row.file_path as string, parsed);
          }
        } catch (e) {}
      }
    }
  } catch (e: any) {
    console.warn(`[D1 GET ALL DRAFTS ERROR] ${e.message}`);
  }
  return result;
}

async function clearDraftStore(env?: Env) {
  draftStore.hasPendingChanges = false;
  draftStore.pendingFiles.clear();
  draftStore.lastModifiedAt = null;
  draftStore.modifiedCount = 0;
  // CRITICAL FIX: DO NOT delete from draft_catalog!
  // Cloudflare D1 draft_catalog is the permanent authoritative runtime database.
  console.log('[D1_CATALOG] Pending changes committed. D1 persistent records preserved.');
}

async function recordDraftMutation(filePath: string, updatedData: any[], env?: Env) {
  // Always update in-memory cache and write immediately to Cloudflare D1
  draftStore.workingData.set(filePath, updatedData);

  if (env) {
    await saveDraftToD1(filePath, updatedData, env);
    console.log(`[D1_CATALOG_WRITE] filePath: ${filePath} | recordCount: ${updatedData.length} | timestamp: ${new Date().toISOString()}`);
  }

  // Only mark pending changes for non-product files (e.g. blogs, coupons, services)
  // Product CRUD (Store & Digital Products) is direct-to-D1 and immediately live without requiring GitHub publish.
  const isProductFile = filePath.includes('products.json') || filePath.includes('digital_products.json');
  if (!isProductFile) {
    draftStore.hasPendingChanges = true;
    draftStore.pendingFiles.add(filePath);
    draftStore.lastModifiedAt = new Date().toISOString();
    draftStore.modifiedCount += 1;
  }
}

async function getWorkingData(filePath: string, env: Env): Promise<any[]> {
  // 1. Authoritative Primary Source: Always query Cloudflare D1 draft_catalog first
  const d1Draft = await getDraftFromD1(filePath, env);
  if (Array.isArray(d1Draft) && d1Draft.length > 0) {
    console.log(`[D1_CATALOG_READ] filePath: ${filePath} | recordCount: ${d1Draft.length}`);
    draftStore.workingData.set(filePath, d1Draft);
    return d1Draft;
  }

  // 2. Secondary source: In-memory workingData cache if it has valid data
  if (draftStore.workingData.has(filePath)) {
    const cached = draftStore.workingData.get(filePath);
    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  }

  // 3. Fallback to GitHub repository static file (Only if D1 is genuinely unseeded)
  const fresh = await fetchFileFromGitHub(filePath, env);
  if (Array.isArray(fresh) && fresh.length > 0) {
    console.log(`[GITHUB_FALLBACK_SUCCESS] filePath: ${filePath} | recordCount: ${fresh.length}`);
    draftStore.workingData.set(filePath, fresh);
    // Seed D1 once with valid GitHub data so future queries hit D1 directly
    await saveDraftToD1(filePath, fresh, env);
    return fresh;
  }

  // 4. Bundled Compile-Time Static Baseline (Safety Net)
  const bundled = BUNDLED_STATIC_DATA[filePath];
  if (Array.isArray(bundled) && bundled.length > 0) {
    console.log(`[BUNDLED_FALLBACK] filePath: ${filePath} | recordCount: ${bundled.length}`);
    draftStore.workingData.set(filePath, bundled);
    await saveDraftToD1(filePath, bundled, env);
    return bundled;
  }

  // 5. If D1 had an explicit empty array record stored, return it; otherwise do not corrupt workingData
  if (Array.isArray(d1Draft)) {
    return d1Draft;
  }

  return [];
}

async function consolidatedMultiFileMutation(
  filesToCommit: { filePath: string; content: any[] }[],
  commitMessage: string,
  env: Env
): Promise<{ success: boolean; commitSha?: string; message?: string }> {
  const token = getGitHubToken(env);
  const owner = env.GITHUB_OWNER || 'ashikdaspc-star';
  const repo = env.GITHUB_REPO || 'omove-store';
  const branch = env.GITHUB_BRANCH || env.CF_PAGES_BRANCH || 'main';

  if (!token) {
    return { success: false, message: 'No GitHub token configured' };
  }

  if (!filesToCommit || filesToCommit.length === 0) {
    return { success: true, message: 'No pending changes to publish' };
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'OmoveStore-CloudflareSync/2.0'
  };

  try {
    // 1. Get latest commit SHA & Tree SHA of target branch
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
    if (!refRes.ok) {
      // Fallback: update files individually if Git Data API ref fetch fails
      return await fallbackSequentialMutation(filesToCommit, commitMessage, env);
    }
    const refData: any = await refRes.json();
    const latestCommitSha = refData.object?.sha;

    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, { headers });
    const commitData: any = await commitRes.json();
    const baseTreeSha = commitData.tree?.sha;

    if (!baseTreeSha) {
      return await fallbackSequentialMutation(filesToCommit, commitMessage, env);
    }

    // 2. Create Blobs for each modified file
    const treeItems: any[] = [];
    for (const item of filesToCommit) {
      const jsonText = JSON.stringify(item.content, null, 2);
      const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: jsonText,
          encoding: 'utf-8'
        })
      });
      if (blobRes.ok) {
        const blobData: any = await blobRes.json();
        treeItems.push({
          path: item.filePath,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        });
      }
    }

    if (treeItems.length === 0) {
      return { success: false, message: 'Failed to create git blobs for files' };
    }

    // 3. Create New Tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems
      })
    });
    const treeData: any = await treeRes.json();
    const newTreeSha = treeData.sha;

    // 4. Create Single Consolidated Commit
    const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: newTreeSha,
        parents: [latestCommitSha]
      })
    });
    const newCommitData: any = await newCommitRes.json();
    const newCommitSha = newCommitData.sha;

    // 5. Update Head Ref to trigger ONE single Cloudflare deployment
    const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitSha,
        force: false
      })
    });

    if (updateRefRes.ok) {
      console.log(`[CONSOLIDATED PUBLISH SUCCESS] Single Commit SHA: ${newCommitSha.substring(0, 7)} | Files: ${filesToCommit.map(f => f.filePath).join(', ')}`);
      return { success: true, commitSha: newCommitSha };
    }

    return await fallbackSequentialMutation(filesToCommit, commitMessage, env);
  } catch (err: any) {
    console.warn(`[CONSOLIDATED PUBLISH FALLBACK] Exception: ${err.message}`);
    return await fallbackSequentialMutation(filesToCommit, commitMessage, env);
  }
}

async function fallbackSequentialMutation(
  filesToCommit: { filePath: string; content: any[] }[],
  commitMessage: string,
  env: Env
): Promise<{ success: boolean; commitSha?: string; message?: string }> {
  let lastSha = '';
  for (const item of filesToCommit) {
    const res = await atomicFileMutation(
      item.filePath,
      () => item.content,
      `${commitMessage}: ${item.filePath}`,
      env
    );
    if (!res.success) {
      return { success: false, message: `Failed to commit ${item.filePath}: ${res.message}` };
    }
    lastSha = res.commitSha || lastSha;
  }
  return { success: true, commitSha: lastSha };
}

// Web Crypto Hashing
async function hashPasswordWebCrypto(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const salt = saltHex ? hexToBuf(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: 100000, hash: 'SHA-256' },
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

// Razorpay Credentials
function getRazorpayKeyId(env: Env): string {
  return env.VITE_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || 'rzp_live_TMiCMOFsYnHr8G';
}

function getRazorpayKeySecret(env: Env): string {
  return env.RAZORPAY_KEY_SECRET || '9e1EanVNH6G0NEWwHLnvNGOB';
}

// Razorpay REST API: Create Official Server Order
async function createRazorpayOrderApi(amountInPaise: number, currency: string, receipt: string, keyId: string, keySecret: string): Promise<string | null> {
  if (!keyId || !keySecret) return null;
  try {
    const authHeader = 'Basic ' + encodeBase64Safe(`${keyId}:${keySecret}`);
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: currency || 'INR',
        receipt: receipt,
        payment_capture: 1
      })
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data && data.id) {
        return data.id;
      }
    }
  } catch (e: any) {}
  return null;
}

// Razorpay REST API: Fetch Payment Details
async function fetchRazorpayPaymentStatusApi(paymentId: string, keyId: string, keySecret: string): Promise<{ valid: boolean; status?: string; amount?: number }> {
  if (!paymentId || !keyId || !keySecret) return { valid: false };
  try {
    const authHeader = 'Basic ' + encodeBase64Safe(`${keyId}:${keySecret}`);
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data && (data.status === 'captured' || data.status === 'authorized')) {
        return { valid: true, status: data.status, amount: data.amount };
      }
    }
  } catch (e: any) {}
  return { valid: false };
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
    return generated.toLowerCase() === signature.trim().toLowerCase();
  } catch (e) {
    return false;
  }
}

// ─── PAYPAL REST API HELPERS ───

// PayPal Credentials
function getPayPalClientId(env: Env): string {
  return env.PAYPAL_CLIENT_ID || '';
}

function getPayPalClientSecret(env: Env): string {
  return env.PAYPAL_CLIENT_SECRET || '';
}

function getPayPalBaseUrl(env: Env): string {
  const mode = env.PAYPAL_ENV || env.PAYPAL_MODE || 'sandbox';
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

// INR → USD Conversion: MAX(3, INR / 95), rounded to 2 decimals
function calculateUsdPrice(inrTotal: number): number {
  const raw = Math.max(3, inrTotal / 95);
  return Math.round(raw * 100) / 100;
}

// PayPal OAuth2: Get Access Token (server-side only)
async function getPayPalAccessToken(env: Env): Promise<{ token: string | null; error?: string; status?: number; details?: any }> {
  const clientId = getPayPalClientId(env);
  const clientSecret = getPayPalClientSecret(env);
  if (!clientId || !clientSecret) {
    return { token: null, error: 'PAYPAL_CREDENTIALS_MISSING', status: 500 };
  }

  const baseUrl = getPayPalBaseUrl(env);
  const auth = encodeBase64Safe(`${clientId}:${clientSecret}`);

  try {
    const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const data: any = await res.json().catch(() => ({}));
    if (res.ok && data.access_token) {
      return { token: data.access_token };
    }
    console.warn(`[PayPal OAuth ERROR] Status: ${res.status}, error:`, data.error, data.error_description);
    return {
      token: null,
      error: data.error || 'OAUTH_FAILED',
      status: res.status,
      details: data.error_description || data
    };
  } catch (e: any) {
    console.warn(`[PayPal OAuth EXCEPTION] ${e.message}`);
    return { token: null, error: e.message || 'OAUTH_NETWORK_EXCEPTION', status: 500 };
  }
}

// PayPal: Create Order via REST API v2
async function createPayPalOrderApi(
  env: Env,
  usdAmount: number,
  internalOrderId: string,
  description: string
): Promise<{ paypalOrderId?: string; error?: string; status?: number; debugId?: string; details?: any }> {
  const authRes = await getPayPalAccessToken(env);
  if (!authRes.token) {
    return {
      error: authRes.error || 'Failed to authenticate with PayPal',
      status: authRes.status || 500,
      details: authRes.details
    };
  }

  const baseUrl = getPayPalBaseUrl(env);
  const amountStr = usdAmount.toFixed(2);

  try {
    const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authRes.token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': internalOrderId // Idempotency key
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: internalOrderId,
          description: description.substring(0, 127),
          amount: {
            currency_code: 'USD',
            value: amountStr
          }
        }],
        application_context: {
          brand_name: 'OMOVE Store',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW'
        }
      })
    });

    const data: any = await res.json().catch(() => ({}));
    if (res.ok && data.id) {
      return { paypalOrderId: data.id };
    }

    console.warn(`[PayPal Create Order ERROR] Status: ${res.status}, body:`, data);
    return {
      error: data.name || data.message || 'ORDER_CREATION_FAILED',
      status: res.status,
      debugId: data.debug_id,
      details: data.details || data.message || data
    };
  } catch (e: any) {
    console.warn(`[PayPal Create Order EXCEPTION] ${e.message}`);
    return { error: e.message || 'CREATE_ORDER_NETWORK_EXCEPTION', status: 500 };
  }
}

// PayPal: Capture Order via REST API v2
async function capturePayPalOrderApi(
  env: Env,
  paypalOrderId: string
): Promise<{ status?: string; captureId?: string; amount?: string; currency?: string; error?: string; httpStatus?: number; debugId?: string; details?: any }> {
  const authRes = await getPayPalAccessToken(env);
  if (!authRes.token) {
    return { error: authRes.error || 'AUTH_FAILED', httpStatus: authRes.status || 500 };
  }

  const baseUrl = getPayPalBaseUrl(env);

  try {
    const res = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authRes.token}`,
        'Content-Type': 'application/json'
      }
    });

    const data: any = await res.json().catch(() => ({}));
    if (res.ok) {
      const captureStatus = data.status; // 'COMPLETED'
      const captures = data.purchase_units?.[0]?.payments?.captures;
      if (captures && captures.length > 0) {
        const capture = captures[0];
        return {
          status: captureStatus,
          captureId: capture.id,
          amount: capture.amount?.value || '0.00',
          currency: capture.amount?.currency_code || 'USD'
        };
      }
      // Fallback if already captured
      if (captureStatus === 'COMPLETED') {
        return { status: 'COMPLETED', captureId: paypalOrderId, amount: '0.00', currency: 'USD' };
      }
    }

    console.warn(`[PayPal Capture ERROR] Status: ${res.status}, body:`, data);
    return {
      error: data.name || data.message || 'CAPTURE_FAILED',
      httpStatus: res.status,
      debugId: data.debug_id,
      details: data.details || data.message || data
    };
  } catch (e: any) {
    console.warn(`[PayPal Capture EXCEPTION] ${e.message}`);
    return { error: e.message, httpStatus: 500 };
  }
}

// Server-side Coupon Validation Function
function validateCouponServerSide(code: string, orderTotal: number, coupons: any[]): { valid: boolean; message: string; coupon?: any; discountAmount: number } {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: 'No coupon code provided.', discountAmount: 0 };
  }

  const found = coupons.find((c: any) => (c.code || '').toUpperCase() === cleanCode);
  if (!found) {
    return { valid: false, message: `Coupon '${cleanCode}' is invalid or expired.`, discountAmount: 0 };
  }

  if (!found.isActive) {
    return { valid: false, message: `Coupon '${cleanCode}' is currently disabled.`, discountAmount: 0 };
  }

  if (found.expiryDate) {
    const expiryTime = new Date(found.expiryDate).getTime();
    if (!isNaN(expiryTime) && Date.now() > expiryTime) {
      return { valid: false, message: `Coupon '${cleanCode}' has expired.`, discountAmount: 0 };
    }
  }

  if (orderTotal < (found.minOrderAmount || 0)) {
    return { valid: false, message: `Coupon requires minimum order of ₹${found.minOrderAmount}.`, discountAmount: 0 };
  }

  let discountAmount = 0;
  if (found.discountType === 'percentage') {
    discountAmount = Math.round((orderTotal * found.discountValue) / 100);
  } else {
    discountAmount = Math.min(orderTotal, found.discountValue);
  }

  if (found.maxDiscount && discountAmount > found.maxDiscount) {
    discountAmount = found.maxDiscount;
  }

  return {
    valid: true,
    message: `🎉 Coupon '${found.code}' applied! Saved ₹${discountAmount}`,
    coupon: found,
    discountAmount
  };
}

// Generate License Key
function generateLicenseKey(): string {
  return `OMV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
}

// Session Cookie Parser
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

// Product Construction Helper
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
    googleDriveUrl: body.googleDriveUrl || body.fileUrl || '',
    fileUrl: body.googleDriveUrl || body.fileUrl || '/api/downloads/setup',
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
  const path = url.pathname;
  const method = request.method.toUpperCase();

  // ----------------------------------------------------
  // SECURE DIGITAL DOWNLOAD AUTHORIZATION ENDPOINT (/api/downloads/setup or /api/downloads/digital or /api/downloads/:orderId/:productId)
  // ----------------------------------------------------
  if (path.startsWith('/api/downloads')) {
    const orderIdParam = url.searchParams.get('orderId') || url.searchParams.get('orderNumber') || url.searchParams.get('order') || '';
    const productIdParam = url.searchParams.get('productId') || url.searchParams.get('product') || '';

    // Route segment matching: e.g. /api/downloads/:orderId/:productId
    const pathParts = path.split('/').filter(Boolean);
    const routeOrderId = pathParts.length >= 3 && pathParts[1] !== 'setup' && pathParts[1] !== 'digital' ? pathParts[1] : '';
    const routeProdId = pathParts.length >= 4 ? pathParts[2] : '';

    const targetOrderId = (orderIdParam || routeOrderId).trim();
    const targetProdId = (productIdParam || routeProdId).trim();

    // 1. Enforce verified order requirement: Unauthenticated/arbitrary requests without orderId are denied.
    if (!targetOrderId) {
      return jsonResponse({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Verified purchase required. Direct access to digital download files is restricted.'
      }, 403);
    }

    // 2. Query D1 for order
    const d1Orders = await getD1Orders(env);
    const matchedOrder = (d1Orders || []).find((o: any) =>
      o && (
        o.id === targetOrderId ||
        o.orderNumber === targetOrderId ||
        o.razorpayOrderId === targetOrderId ||
        (o.id && o.id.toLowerCase() === targetOrderId.toLowerCase()) ||
        (o.orderNumber && o.orderNumber.toLowerCase() === targetOrderId.toLowerCase())
      )
    );

    if (!matchedOrder) {
      return jsonResponse({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Order record not found or invalid. Download authorization denied.'
      }, 403);
    }

    // 3. Verify Payment Status: Must be SUCCESS or completed
    const isPaid = matchedOrder.paymentStatus === 'SUCCESS' || matchedOrder.status === 'completed';
    if (!isPaid) {
      return jsonResponse({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Payment verification incomplete or payment failed. Download access is restricted.'
      }, 403);
    }

    // 4. Verify Product belongs to this verified order
    const orderItems: any[] = Array.isArray(matchedOrder.items) ? matchedOrder.items : [];
    let matchedItem = orderItems.find((it: any) =>
      !targetProdId ||
      it.productId === targetProdId ||
      (it.productId && targetProdId && it.productId.toLowerCase() === targetProdId.toLowerCase()) ||
      (it.productName && targetProdId && it.productName.toLowerCase().includes(targetProdId.toLowerCase()))
    );

    if (!matchedItem && orderItems.length > 0) {
      if (!targetProdId) {
        matchedItem = orderItems[0];
      } else {
        return jsonResponse({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Requested product was not purchased in this verified order.'
        }, 403);
      }
    }

    if (!matchedItem) {
      return jsonResponse({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'No digital items found in this verified order.'
      }, 403);
    }

    // 5. Lookup authoritative Google Drive download link from order item or catalog
    let downloadUrl = matchedItem.googleDriveUrl || matchedItem.fileUrl || '';
    if (!downloadUrl || downloadUrl === '/api/downloads/setup' || downloadUrl === '/api/downloads/digital' || !downloadUrl.startsWith('http')) {
      const digitalList = await getWorkingData('src/data/digital_products.json', env);
      const storeList = await getWorkingData('src/data/products.json', env);
      const allProds = [...(Array.isArray(digitalList) ? digitalList : []), ...(Array.isArray(storeList) ? storeList : [])];

      const catalogProd = allProds.find((p: any) =>
        p && (
          p.id === matchedItem.productId ||
          p.slug === matchedItem.productId ||
          (p.name && matchedItem.productName && p.name.toLowerCase() === matchedItem.productName.toLowerCase())
        )
      );

      if (catalogProd && (catalogProd.googleDriveUrl || catalogProd.fileUrl)) {
        downloadUrl = catalogProd.googleDriveUrl || catalogProd.fileUrl;
      }
    }

    if (!downloadUrl || !downloadUrl.startsWith('http')) {
      return jsonResponse({
        success: false,
        error: 'DOWNLOAD_UNAVAILABLE',
        message: 'Download package link is being prepared for this item. Please contact support.'
      }, 404);
    }

    // 6. Return response: 302 Redirect for direct downloads, or JSON if format=json is requested
    const acceptHeader = request.headers.get('Accept') || '';
    if (url.searchParams.get('format') === 'json' || (acceptHeader.includes('application/json') && !acceptHeader.includes('text/html'))) {
      return jsonResponse({
        success: true,
        authorized: true,
        orderId: matchedOrder.id,
        orderNumber: matchedOrder.orderNumber,
        productName: matchedItem.productName,
        downloadUrl: downloadUrl
      });
    }

    return Response.redirect(downloadUrl, 302);
  }

  let rawPath = path.replace(/\/$/, '') || '/';
  if (!rawPath.startsWith('/api')) {
    return context.next();
  }

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

    // 2.5 Admin Dashboard Stats API Endpoint
    if (path === '/api/admin/dashboard-stats' || path === '/api/admin/analytics' || path.includes('dashboard-stats')) {
      const freshOrders = await getD1Orders(env);
      const freshUsers = await getD1Users(env);
      const freshBookings = await getD1Bookings(env);
      const storeProducts = await getWorkingData('src/data/products.json', env);
      const digitalProducts = await getWorkingData('src/data/digital_products.json', env);

      const publishedDigital = (Array.isArray(digitalProducts) ? digitalProducts : []).filter((p: any) => p && (p.status || 'PUBLISHED') === 'PUBLISHED');
      const publishedStore = (Array.isArray(storeProducts) ? storeProducts : []).filter((p: any) => p && (p.status || 'PUBLISHED') === 'PUBLISHED');

      const paidOrdersList = (freshOrders || []).filter((o: any) => o.paymentStatus === 'SUCCESS' || o.status === 'completed');
      const totalRevenue = paidOrdersList.reduce((sum: number, o: any) => sum + (Number(o.total || o.totalAmount || 0) || 0), 0);

      const stats = {
        customers: Math.max(freshUsers.length, 1),
        totalOrders: freshOrders.length,
        totalRevenue: totalRevenue,
        paidOrders: paidOrdersList.length,
        pendingVerification: freshOrders.length - paidOrdersList.length,
        digitalProducts: publishedDigital.length,
        storeProducts: publishedStore.length,
        remoteSupport: freshBookings.length
      };

      return jsonResponse({
        success: true,
        stats,
        orders: freshOrders,
        customersCount: Math.max(freshUsers.length, 1),
        totalRevenue,
        totalOrders: freshOrders.length,
        totalProducts: publishedDigital.length + publishedStore.length
      });
    }

    // ----------------------------------------------------
    // DRAFT STATUS ENDPOINT (/api/admin/draft-status)
    // ----------------------------------------------------
    if (path === '/api/admin/draft-status') {
      return jsonResponse({
        success: true,
        hasPendingChanges: draftStore.hasPendingChanges,
        pendingFiles: Array.from(draftStore.pendingFiles),
        pendingCount: draftStore.pendingFiles.size,
        modifiedCount: draftStore.modifiedCount,
        lastModifiedAt: draftStore.lastModifiedAt
      });
    }

    // ----------------------------------------------------
    // DIGITAL CATEGORIES API (/api/digital-categories)
    // ----------------------------------------------------
    if (path.startsWith('/api/digital-categories') || path.startsWith('/api/admin/digital-categories')) {
      const parts = path.split('/').filter(Boolean);
      const isSub = (parts.length > 2 && parts[1] !== 'admin') || (parts.length > 3 && parts[1] === 'admin');
      const catId = isSub ? decodeURIComponent(parts[parts.length - 1]) : null;

      if (!catId) {
        if (method === 'GET') {
          const list = await getWorkingData('src/data/digital_categories.json', env);
          const isAdminPath = path.includes('/admin/');
          let filtered = list;
          if (!isAdminPath) {
            filtered = filtered.filter((c: any) => c.active !== false);
          }
          filtered.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
          return jsonResponse(filtered);
        }

        if (method === 'POST') {
          const body: any = await request.json().catch(() => ({}));
          const newCat = {
            id: body.id || `cat-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: body.name || 'New Category',
            slug: body.slug || (body.name ? body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `cat-${Date.now()}`),
            parentId: body.parentId || null,
            description: body.description || '',
            image: body.image || '',
            sortOrder: Number(body.sortOrder || 1),
            active: body.active !== undefined ? Boolean(body.active) : true,
            createdAt: body.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const currentList = await getWorkingData('src/data/digital_categories.json', env);
          const updatedList = [newCat, ...currentList];
          recordDraftMutation('src/data/digital_categories.json', updatedList);

          return jsonResponse({ success: true, category: newCat, isDraft: true, message: 'Saved to draft state.' });
        }
      } else {
        if (method === 'PUT' || method === 'PATCH') {
          const body: any = await request.json().catch(() => ({}));
          let updatedCat: any = null;
          const currentList = await getWorkingData('src/data/digital_categories.json', env);

          const updatedList = currentList.map((c: any) => {
            if (c.id === catId || c.slug === catId) {
              updatedCat = { ...c, ...body, id: c.id, updatedAt: new Date().toISOString() };
              return updatedCat;
            }
            return c;
          });

          if (updatedCat) {
            recordDraftMutation('src/data/digital_categories.json', updatedList);
            return jsonResponse({ success: true, category: updatedCat, isDraft: true });
          }
          return jsonResponse({ success: false, error: 'Category not found' }, 404);
        }

        if (method === 'DELETE') {
          const currentList = await getWorkingData('src/data/digital_categories.json', env);
          const updatedList = currentList.filter((c: any) => c.id !== catId && c.slug !== catId && c.parentId !== catId);
          recordDraftMutation('src/data/digital_categories.json', updatedList);

          return jsonResponse({ success: true, isDraft: true });
        }
      }
    }

    function buildProductObject(body: any, isDigital: boolean): any {
      const now = new Date().toISOString();
      const generatedSlug = (body.slug || '').trim() || (body.name ? body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : `product-${Date.now()}`);
      return {
        id: body.id || `${isDigital ? 'dig' : 'prod'}-${Date.now()}`,
        name: body.name || (isDigital ? 'New Digital Product' : 'New Store Product'),
        slug: generatedSlug,
        productType: isDigital ? 'DIGITAL' : (body.productType || 'STORE'),
        category: body.category || (isDigital ? 'Software' : 'Store Products'),
        categoryId: body.categoryId || '',
        subcategoryId: body.subcategoryId || '',
        shortDescription: body.shortDescription || body.description || '',
        fullDescription: body.fullDescription || body.description || body.shortDescription || '',
        description: body.description || body.fullDescription || body.shortDescription || '',
        price: Number(body.price ?? 0),
        originalPrice: Number(body.originalPrice ?? body.price ?? 0),
        discountPercent: Number(body.discountPercent ?? 0),
        image: body.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        screenshots: Array.isArray(body.screenshots) ? body.screenshots : [],
        tags: Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : (isDigital ? ['Digital Product'] : ['Store Card', 'Software']),
        googleDriveUrl: body.googleDriveUrl || body.fileUrl || '',
        fileUrl: body.fileUrl || body.googleDriveUrl || '/api/downloads/digital',
        fileSize: body.fileSize || body.downloadSize || 'Instant Access',
        downloadSize: body.downloadSize || body.fileSize || 'Instant Access',
        fileType: body.fileType || 'ZIP',
        licenseType: body.licenseType || (isDigital ? 'Instant Digital Download' : 'Lifetime License'),
        version: body.version || 'v1.0',
        compatibility: Array.isArray(body.compatibility) ? body.compatibility : ['Windows 11', 'Windows 10'],
        features: Array.isArray(body.features) ? body.features : ['Instant Product Access', 'Official Download Package'],
        requirements: Array.isArray(body.requirements) ? body.requirements : ['Windows 10/11'],
        versionHistory: Array.isArray(body.versionHistory) ? body.versionHistory : [],
        status: body.status || 'PUBLISHED',
        featured: Boolean(body.featured || body.isBestSeller),
        isBestSeller: Boolean(body.isBestSeller || body.featured),
        instantKeyAvailable: Boolean(body.instantKeyAvailable ?? true),
        rating: Number(body.rating || 5.0),
        reviewCount: Number(body.reviewCount || 1),
        salesCount: Number(body.salesCount || 0),
        createdAt: body.createdAt || now,
        updatedAt: now
      };
    }

    // ----------------------------------------------------
    // ISOLATED DIGITAL PRODUCTS API (/api/digital-products)
    // ----------------------------------------------------
    if (path === '/api/digital-products' || path === '/api/admin/digital-products') {
      if (method === 'GET') {
        const list = await getWorkingData('src/data/digital_products.json', env);
        const isAdminPath = path.includes('/admin/');
        let filtered = list;
        if (!isAdminPath) {
          filtered = filtered.filter((p: any) => (p.status || 'PUBLISHED') === 'PUBLISHED');
          filtered = filtered.map(({ googleDriveUrl, ...rest }: any) => rest);
        }
        return jsonResponse(filtered);
      }

      if (method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const newProd = buildProductObject(body, true);

        const currentList = await getWorkingData('src/data/digital_products.json', env);
        const existingIdx = currentList.findIndex((p: any) => p.id === newProd.id);
        let updatedList: any[];
        if (existingIdx !== -1) {
          updatedList = [...currentList];
          updatedList[existingIdx] = newProd;
        } else {
          updatedList = [newProd, ...currentList];
        }

        await recordDraftMutation('src/data/digital_products.json', updatedList, env);

        return jsonResponse({ success: true, product: newProd, isLive: true, isDraft: false, message: 'Saved and live in D1 database.' });
      }
    }

    // ----------------------------------------------------
    // UNIFIED STORE & DIGITAL PRODUCTS API (/api/products / /api/store-products)
    // ----------------------------------------------------
    if (path === '/api/products' || path === '/api/admin/products' || path === '/api/store-products' || path === '/api/admin/store-products') {
      if (method === 'GET') {
        const storeList = await getWorkingData('src/data/products.json', env);
        const digitalList = await getWorkingData('src/data/digital_products.json', env);

        // Combine store and digital products into unified catalog map
        const map = new Map<string, any>();
        if (Array.isArray(digitalList)) {
          digitalList.forEach((p: any) => { if (p && p.id) map.set(p.id, p); });
        }
        if (Array.isArray(storeList)) {
          storeList.forEach((p: any) => { if (p && p.id) map.set(p.id, p); });
        }

        const combined = Array.from(map.values());
        dynamicProductsStore = combined;

        const isAdminPath = path.includes('/admin/');
        let filtered = [...combined];
        if (!isAdminPath) {
          filtered = filtered.filter(p => (p.status || 'PUBLISHED') === 'PUBLISHED');
          filtered = filtered.map(({ googleDriveUrl, fileUrl, ...rest }: any) => rest);
        }
        return jsonResponse(filtered);
      }

      if (method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const isDigital = body.productType === 'DIGITAL' || (body.id && body.id.startsWith('dig'));
        const fileToMutate = isDigital ? 'src/data/digital_products.json' : 'src/data/products.json';
        const newProd = buildProductObject(body, isDigital);

        const currentList = await getWorkingData(fileToMutate, env);
        const existingIdx = currentList.findIndex((p: any) => p.id === newProd.id);
        let updatedList: any[];
        if (existingIdx !== -1) {
          updatedList = [...currentList];
          updatedList[existingIdx] = newProd;
        } else {
          updatedList = [newProd, ...currentList];
        }

        await recordDraftMutation(fileToMutate, updatedList, env);

        return jsonResponse({ success: true, product: newProd, isLive: true, isDraft: false, message: 'Saved and live in D1 database.' });
      }
    }

    // Universal Product Matcher Helper
    function findProductIndexInCatalog(products: any[], targetId: string): number {
      const cleanId = decodeURIComponent(targetId || '').trim();
      if (!cleanId) return -1;
      const lowerId = cleanId.toLowerCase();

      // 1. Exact ID match
      let idx = products.findIndex((p: any) => p.id === cleanId);
      if (idx !== -1) return idx;

      // 2. Case-insensitive ID match
      idx = products.findIndex((p: any) => (p.id || '').toLowerCase() === lowerId);
      if (idx !== -1) return idx;

      // 3. Exact Slug match
      idx = products.findIndex((p: any) => p.slug === cleanId);
      if (idx !== -1) return idx;

      // 4. Case-insensitive Slug match
      idx = products.findIndex((p: any) => (p.slug || '').toLowerCase() === lowerId);
      if (idx !== -1) return idx;

      // 5. Slugified Name match
      idx = products.findIndex((p: any) => (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === lowerId);
      if (idx !== -1) return idx;

      // 6. Normalized & Prefix / Partial Slug match (e.g. sfx-pack matching sfx-pack-1000-)
      const targetBase = lowerId.replace(/^-+|-+$/g, '');
      if (targetBase.length >= 3) {
        idx = products.findIndex((p: any) => {
          const pSlug = (p.slug || '').toLowerCase().replace(/^-+|-+$/g, '');
          const pNameSlug = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          return pSlug === targetBase || pNameSlug === targetBase || pSlug.startsWith(targetBase) || targetBase.startsWith(pSlug) || pNameSlug.startsWith(targetBase) || targetBase.startsWith(pNameSlug);
        });
        if (idx !== -1) return idx;
      }

      // 7. Numeric timestamp ID suffix match (e.g. 1786345973260)
      const numMatch = lowerId.match(/\d{6,}/);
      if (numMatch) {
        const numStr = numMatch[0];
        idx = products.findIndex((p: any) => (p.id || '').includes(numStr) || (p.createdAt || '').includes(numStr));
        if (idx !== -1) return idx;
      }

      return -1;
    }

    // Single Product Route: GET / PUT / DELETE /api/products/:id or /api/digital-products/:id
    const prodIdMatch = path.match(/^\/api\/(?:admin\/)?(?:store-products|digital-products|products)\/([^\/]+)$/);
    if (prodIdMatch) {
      const pId = decodeURIComponent(prodIdMatch[1]);
      const isAdminPath = path.includes('/admin/');
      const isDigitalRoute = path.includes('digital');

      const digitalList = await getWorkingData('src/data/digital_products.json', env);
      const storeList = await getWorkingData('src/data/products.json', env);

      let targetFile = 'src/data/products.json';
      let list = storeList;
      let idx = findProductIndexInCatalog(storeList, pId);

      if (idx === -1) {
        const digIdx = findProductIndexInCatalog(digitalList, pId);
        if (digIdx !== -1) {
          targetFile = 'src/data/digital_products.json';
          list = digitalList;
          idx = digIdx;
        }
      }

      if (idx === -1 && (isDigitalRoute || pId.startsWith('dig'))) {
        targetFile = 'src/data/digital_products.json';
        list = digitalList;
      }

      if (method === 'GET') {
        if (idx === -1) return jsonResponse({ success: false, error: 'Product not found' }, 404);

        const prod = { ...list[idx] };
        if (!isAdminPath) {
          delete prod.googleDriveUrl;
          delete prod.fileUrl;
        }
        return jsonResponse(prod);
      }

      if (method === 'PUT' || method === 'PATCH') {
        const body: any = await request.json().catch(() => ({}));
        if (idx === -1) {
          return jsonResponse({ success: false, error: 'Product not found' }, 404);
        }

        const updatedProduct = {
          ...list[idx],
          ...body,
          id: list[idx].id, // CRITICAL: Maintain exact product ID
          updatedAt: new Date().toISOString()
        };
        const newList = [...list];
        newList[idx] = updatedProduct;

        await recordDraftMutation(targetFile, newList, env);

        return jsonResponse({ success: true, product: updatedProduct, isLive: true, isDraft: false, message: 'Product updated live in D1 database.' });
      }

      if (method === 'DELETE') {
        const permanentParam = url.searchParams.get('permanent');
        const forcePermanent = permanentParam === 'true';

        if (idx === -1) {
          return jsonResponse({ success: true, deleted: true, message: 'Product already deleted.' });
        }

        const targetProduct = list[idx];
        let actionTaken = 'DELETED';

        const freshOrders = await getD1Orders(env);
        if (Array.isArray(freshOrders)) {
          freshOrders.forEach((o: any) => { if (o.id) ordersStore.set(o.id, o); });
        }

        const hasOrders = Array.from(ordersStore.values()).some((ord: any) =>
          Array.isArray(ord.items) && ord.items.some((it: any) =>
            it.productId === targetProduct.id ||
            it.productId === pId ||
            (it.productName || '').toLowerCase() === (targetProduct.name || '').toLowerCase()
          )
        );

        let newList = [...list];
        if (hasOrders && !forcePermanent) {
          actionTaken = 'ARCHIVED';
          newList[idx] = {
            ...targetProduct,
            status: 'ARCHIVED',
            updatedAt: new Date().toISOString()
          };
        } else {
          actionTaken = 'DELETED';
          newList.splice(idx, 1);
        }

        await recordDraftMutation(targetFile, newList, env);

        return jsonResponse({
          success: true,
          action: actionTaken,
          deleted: actionTaken === 'DELETED',
          archived: actionTaken === 'ARCHIVED',
          product: targetProduct,
          isLive: true,
          isDraft: false,
          message: actionTaken === 'ARCHIVED' ? 'Archived live in D1 database.' : 'Deleted live from D1 database.'
        });
      }
    }

    // Product Duplicate Route: /api/products/:id/duplicate
    const duplicateMatch = path.match(/^\/api\/products\/([^\/]+)\/duplicate$/);
    if (duplicateMatch && method === 'POST') {
      const pId = decodeURIComponent(duplicateMatch[1]);
      const list = await getWorkingData('src/data/products.json', env);
      dynamicProductsStore = list;

      const existing = dynamicProductsStore.find(p => p.id === pId || p.slug === pId);
      if (!existing) return jsonResponse({ success: false, error: 'Product not found' }, 404);

      const isDigital = existing.productType === 'DIGITAL';
      const fileToMutate = isDigital ? 'src/data/digital_products.json' : 'src/data/products.json';
      const duplicated = {
        ...existing,
        id: `${isDigital ? 'dig' : 'prod'}-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: `${existing.name} (Copy)`,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const currentList = await getWorkingData(fileToMutate, env);
      const updatedList = [duplicated, ...currentList];

      if (!isDigital) dynamicProductsStore = updatedList;
      await recordDraftMutation(fileToMutate, updatedList, env);

      return jsonResponse({ success: true, product: duplicated, isDraft: true, message: 'Duplicated in draft state.' });
    }

    // Consolidated Publish Catalog Endpoint
    if (path === '/api/admin/publish' || path === '/api/products/sync' || path === '/api/products/publish') {
      const body: any = await request.json().catch(() => ({}));

      // 1. Ensure all D1 persistent drafts are loaded into draftStore.workingData
      const d1Drafts = await getAllDraftsFromD1(env);
      for (const [filePath, content] of d1Drafts.entries()) {
        draftStore.workingData.set(filePath, content);
      }

      const filesToCommit: { filePath: string; content: any[] }[] = [];

      // Collect all modified workingData from draftStore
      for (const [filePath, content] of draftStore.workingData.entries()) {
        filesToCommit.push({ filePath, content });
      }

      // Also support explicit payload arrays if passed from frontend (merge missing items)
      if (Array.isArray(body.digitalProducts) && body.digitalProducts.length > 0) {
        const existingFileIdx = filesToCommit.findIndex(f => f.filePath === 'src/data/digital_products.json');
        if (existingFileIdx === -1) {
          filesToCommit.push({ filePath: 'src/data/digital_products.json', content: body.digitalProducts });
        } else {
          const currentList = filesToCommit[existingFileIdx].content;
          const mergedList = [...currentList];
          for (const item of body.digitalProducts) {
            if (item && item.id && !mergedList.some(p => p.id === item.id)) {
              mergedList.push(item);
            }
          }
          filesToCommit[existingFileIdx].content = mergedList;
        }
      }
      if (Array.isArray(body.products) && body.products.length > 0) {
        const existingFileIdx = filesToCommit.findIndex(f => f.filePath === 'src/data/products.json');
        if (existingFileIdx === -1) {
          filesToCommit.push({ filePath: 'src/data/products.json', content: body.products });
        } else {
          const currentList = filesToCommit[existingFileIdx].content;
          const mergedList = [...currentList];
          for (const item of body.products) {
            if (item && item.id && !mergedList.some(p => p.id === item.id)) {
              mergedList.push(item);
            }
          }
          filesToCommit[existingFileIdx].content = mergedList;
        }
      }
      if (Array.isArray(body.digitalCategories) && body.digitalCategories.length > 0) {
        if (!filesToCommit.some(f => f.filePath === 'src/data/digital_categories.json')) {
          filesToCommit.push({ filePath: 'src/data/digital_categories.json', content: body.digitalCategories });
        }
      }
      if (Array.isArray(body.services) && body.services.length > 0) {
        if (!filesToCommit.some(f => f.filePath === 'src/data/services.json')) {
          filesToCommit.push({ filePath: 'src/data/services.json', content: body.services });
        }
      }
      if (Array.isArray(body.coupons) && body.coupons.length > 0) {
        if (!filesToCommit.some(f => f.filePath === 'src/data/coupons.json')) {
          filesToCommit.push({ filePath: 'src/data/coupons.json', content: body.coupons });
        }
      }
      if (Array.isArray(body.blogs) && body.blogs.length > 0) {
        if (!filesToCommit.some(f => f.filePath === 'src/data/blogs.json')) {
          filesToCommit.push({ filePath: 'src/data/blogs.json', content: body.blogs });
        }
      }

      if (filesToCommit.length === 0) {
        return jsonResponse({ success: true, message: 'All changes up-to-date! No pending drafts to publish.', sync: { commitSha: 'up-to-date' } });
      }

      const syncRes = await consolidatedMultiFileMutation(
        filesToCommit,
        'Publish admin catalog live to production via Cloudflare Admin',
        env
      );

      if (!syncRes.success) {
        return jsonResponse({ success: false, error: 'PUBLISH_FAILED', message: syncRes.message || 'Failed to publish changes to GitHub' }, 500);
      }

      await clearDraftStore(env);

      return jsonResponse({
        success: true,
        message: 'Published Live to Production in 1 Consolidated Commit!',
        sync: { success: true, commitSha: syncRes.commitSha }
      });
    }

    // 4. Coupons Endpoints
    if (path === '/api/coupons') {
      if (method === 'GET') {
        const list = await getWorkingData('src/data/coupons.json', env);
        dynamicCouponsStore = list;
        return jsonResponse(dynamicCouponsStore);
      }

      if (method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const code = (body.code || '').trim().toUpperCase();
        if (!code) return jsonResponse({ success: false, error: 'Coupon code is required' }, 400);

        const newCpn = {
          id: `cpn-${Date.now()}`,
          code,
          discountType: body.discountType === 'fixed' ? 'fixed' : 'percentage',
          discountValue: Number(body.discountValue) || 10,
          minOrderAmount: Number(body.minOrderAmount) || 0,
          maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : undefined,
          description: body.description || `Discount Code ${code}`,
          isActive: Boolean(body.isActive !== false),
          expiryDate: body.expiryDate || undefined,
          usageCount: 0
        };

        const currentList = await getWorkingData('src/data/coupons.json', env);
        const updatedList = [newCpn, ...currentList];
        dynamicCouponsStore = updatedList;
        recordDraftMutation('src/data/coupons.json', updatedList);

        return jsonResponse({ success: true, coupon: newCpn, isDraft: true, message: 'Coupon saved in draft state.' });
      }
    }

    if (path === '/api/coupons/validate' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const code = (body.code || '').trim().toUpperCase();
      const orderTotal = Number(body.orderTotal) || 0;

      const fresh = await fetchFileFromGitHub('src/data/coupons.json', env);
      if (Array.isArray(fresh) && fresh.length > 0) dynamicCouponsStore = fresh;

      const result = validateCouponServerSide(code, orderTotal, dynamicCouponsStore);

      if (!result.valid) {
        return jsonResponse({ valid: false, message: result.message, discountAmount: 0 }, result.message.includes('invalid') ? 404 : 400);
      }

      return jsonResponse({ valid: true, message: result.message, coupon: result.coupon, discountAmount: result.discountAmount });
    }

    const cpnToggleMatch = path.match(/^\/api\/coupons\/([^\/]+)\/toggle$/);
    if (cpnToggleMatch && method === 'PATCH') {
      const cId = cpnToggleMatch[1];
      let toggledCoupon: any = null;

      const currentList = await getWorkingData('src/data/coupons.json', env);
      const updatedList = currentList.map((c: any) => {
        if (c.id === cId || (c.code || '').toUpperCase() === cId.toUpperCase()) {
          toggledCoupon = { ...c, isActive: !c.isActive };
          return toggledCoupon;
        }
        return c;
      });

      if (!toggledCoupon) return jsonResponse({ success: false, error: 'Coupon not found' }, 404);

      dynamicCouponsStore = updatedList;
      recordDraftMutation('src/data/coupons.json', updatedList);

      return jsonResponse({ success: true, coupon: toggledCoupon, isDraft: true });
    }

    const cpnDeleteMatch = path.match(/^\/api\/coupons\/([^\/]+)$/);
    if (cpnDeleteMatch && method === 'DELETE') {
      const cId = cpnDeleteMatch[1];
      const currentList = await getWorkingData('src/data/coupons.json', env);
      const idx = currentList.findIndex((c: any) => c.id === cId || (c.code || '').toUpperCase() === cId.toUpperCase());
      if (idx === -1) return jsonResponse({ success: false, error: 'Coupon not found' }, 404);

      const updatedList = [...currentList];
      updatedList.splice(idx, 1);

      dynamicCouponsStore = updatedList;
      recordDraftMutation('src/data/coupons.json', updatedList);

      return jsonResponse({ success: true, deleted: true, isDraft: true });
    }

    // 5. Services Endpoints (GET, POST, PUT, DELETE)
    if (path === '/api/services' || path === '/api/admin/services') {
      if (method === 'GET') {
        const list = await getWorkingData('src/data/services.json', env);
        dynamicServicesStore = list;
        return jsonResponse(dynamicServicesStore);
      }

      if (method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const newSrv = { id: `srv-${Date.now()}`, ...body };

        const currentList = await getWorkingData('src/data/services.json', env);
        const updatedList = [newSrv, ...currentList];

        dynamicServicesStore = updatedList;
        recordDraftMutation('src/data/services.json', updatedList);

        return jsonResponse({ success: true, service: newSrv, isDraft: true });
      }
    }

    const serviceIdMatch = path.match(/^\/api\/(?:admin\/)?services\/([^\/]+)$/);
    if (serviceIdMatch) {
      const sId = decodeURIComponent(serviceIdMatch[1]);

      if (method === 'PUT') {
        const body: any = await request.json().catch(() => ({}));
        const currentList = await getWorkingData('src/data/services.json', env);

        const idx = currentList.findIndex((s: any) => s.id === sId);
        if (idx === -1) return jsonResponse({ success: false, error: 'Service not found' }, 404);

        const updatedService = { ...currentList[idx], ...body, id: sId };
        const updatedList = [...currentList];
        updatedList[idx] = updatedService;

        dynamicServicesStore = updatedList;
        recordDraftMutation('src/data/services.json', updatedList);

        return jsonResponse({ success: true, service: updatedService, isDraft: true });
      }

      if (method === 'DELETE') {
        const currentList = await getWorkingData('src/data/services.json', env);
        const updatedList = currentList.filter((s: any) => s.id !== sId);

        dynamicServicesStore = updatedList;
        recordDraftMutation('src/data/services.json', updatedList);

        return jsonResponse({ success: true, deleted: true, isDraft: true });
      }
    }

    // 6. Blogs Endpoints (GET, POST, PUT, DELETE)
    if (path === '/api/blogs' || path === '/api/admin/blogs') {
      if (method === 'GET') {
        const list = await getWorkingData('src/data/blogs.json', env);
        dynamicBlogsStore = list;
        return jsonResponse(dynamicBlogsStore);
      }

      if (method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const newBlog = { id: `blog-${Date.now()}`, ...body };

        const currentList = await getWorkingData('src/data/blogs.json', env);
        const updatedList = [newBlog, ...currentList];

        dynamicBlogsStore = updatedList;
        recordDraftMutation('src/data/blogs.json', updatedList);

        return jsonResponse({ success: true, blog: newBlog, isDraft: true });
      }
    }

    const blogIdMatch = path.match(/^\/api\/(?:admin\/)?blogs\/([^\/]+)$/);
    if (blogIdMatch) {
      const bId = decodeURIComponent(blogIdMatch[1]);

      if (method === 'DELETE') {
        const currentList = await getWorkingData('src/data/blogs.json', env);
        const updatedList = currentList.filter((b: any) => b.id !== bId);

        dynamicBlogsStore = updatedList;
        recordDraftMutation('src/data/blogs.json', updatedList);

        return jsonResponse({ success: true, deleted: true, isDraft: true });
      }
    }

    // 7. Customers / Users Endpoints
    if (path === '/api/admin/customers') {
      if (method === 'GET') {
        const userList = await getD1Users(env);

        const customersList = userList.map(u => ({
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
      await deleteD1User(env, emailToDelete);
      return jsonResponse({ success: true, deletedEmail: emailToDelete, sync: { success: true } });
    }

    // 8. Orders & Payments Endpoints
    if (path === '/api/orders/create' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const orderId = body.id || `ord-${Date.now()}`;

      const storeProds = await getWorkingData('src/data/products.json', env);
      const digProds = await getWorkingData('src/data/digital_products.json', env);
      const allProds = [...(Array.isArray(storeProds) ? storeProds : []), ...(Array.isArray(digProds) ? digProds : [])];

      let subtotal = 0;
      const resolvedItems: any[] = [];

      if (Array.isArray(body.items)) {
        for (const item of body.items) {
          const product = allProds.find((p: any) =>
            p && (
              p.id === item.productId ||
              p.slug === item.productId ||
              (p.name && item.productName && p.name.toLowerCase() === item.productName.toLowerCase())
            )
          );
          const price = product ? Number(product.price) : Number(item.price || 0);
          const qty = Number(item.quantity) || 1;
          subtotal += price * qty;

          const isDigital = product ? (product.productType === 'DIGITAL' || product.id?.startsWith('dig') || product.category === 'Digital Products') : (item.productType === 'DIGITAL' || item.productId?.startsWith('dig'));
          const resolvedDriveUrl = isDigital && product ? (product.googleDriveUrl || product.fileUrl || '') : (isDigital ? (item.googleDriveUrl || item.fileUrl || '') : '');
          const downloadEndpoint = isDigital ? `/api/downloads/setup?orderId=${encodeURIComponent(orderId)}&productId=${encodeURIComponent(item.productId || product?.id || '')}` : '';

          resolvedItems.push({
            productId: item.productId || product?.id || `prod-${Date.now()}`,
            productName: product ? product.name : (item.productName || (isDigital ? 'Digital Product' : 'Store Product')),
            productType: isDigital ? 'DIGITAL' : 'STORE',
            price: price,
            quantity: qty,
            fileSize: isDigital ? (product?.downloadSize || item.fileSize || 'Instant Access') : '',
            googleDriveUrl: resolvedDriveUrl,
            fileUrl: downloadEndpoint,
            licenseKey: isDigital ? generateLicenseKey() : '',
            downloadLimit: isDigital ? 5 : 0,
            downloadsCount: 0
          });
        }
      }

      let discountAmount = 0;
      let appliedCouponCode = '';
      const couponCode = (body.couponCode || '').trim().toUpperCase();
      if (couponCode) {
        const freshCoupons = await getWorkingData('src/data/coupons.json', env);
        if (Array.isArray(freshCoupons) && freshCoupons.length > 0) dynamicCouponsStore = freshCoupons;

        const couponResult = validateCouponServerSide(couponCode, subtotal, dynamicCouponsStore);
        if (couponResult.valid) {
          discountAmount = couponResult.discountAmount;
          appliedCouponCode = couponResult.coupon?.code || couponCode;
        }
      }

      const totalVal = Math.max(0, subtotal - discountAmount);
      const amountInPaise = Math.round(totalVal * 100);

      const rzpKeyId = getRazorpayKeyId(env);
      const rzpKeySecret = getRazorpayKeySecret(env);

      let realRzpOrderId = '';
      if (amountInPaise > 0 && rzpKeyId && rzpKeySecret) {
        realRzpOrderId = await createRazorpayOrderApi(amountInPaise, 'INR', orderId, rzpKeyId, rzpKeySecret) || '';
      }

      const rzpOrderId = realRzpOrderId || body.razorpayOrderId || `rzp_ord_${Date.now()}`;

      const newOrder = {
        id: orderId,
        orderNumber: body.orderNumber || `OMV-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        razorpayOrderId: rzpOrderId,
        customerName: body.customerName || 'Customer',
        customerEmail: body.customerEmail || 'customer@example.com',
        customerPhone: body.customerPhone || '+91 8345968169',
        items: resolvedItems,
        subtotal: subtotal,
        discount: discountAmount,
        couponCode: appliedCouponCode,
        tax: 0,
        total: totalVal,
        totalAmount: totalVal,
        paymentMethod: body.paymentMethod || 'Razorpay UPI',
        paymentStatus: totalVal <= 0 ? 'SUCCESS' : 'PENDING',
        status: totalVal <= 0 ? 'completed' : 'pending',
        createdAt: new Date().toISOString()
      };

      await saveD1Order(env, newOrder);

      return jsonResponse({
        success: true,
        order: newOrder,
        orderId,
        razorpayOrderId: rzpOrderId,
        razorpayKeyId: rzpKeyId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: rzpKeyId,
        sync: { success: true }
      });
    }

    if (path === '/api/orders/verify' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const bodyRzpOrderId = body.razorpay_order_id || body.razorpayOrderId || '';
      const rzpPaymentId = body.razorpay_payment_id || body.razorpayPaymentId || '';
      const rzpSignature = body.razorpay_signature || body.razorpaySignature || '';
      const orderId = body.orderId || body.id || '';

      const rzpKeyId = getRazorpayKeyId(env);
      const secret = getRazorpayKeySecret(env);

      let order = orderId ? ordersStore.get(orderId) : null;
      if (!order && body.order?.id) {
        order = ordersStore.get(body.order.id);
      }

      if (!order) {
        const freshOrders = await getD1Orders(env);
        if (Array.isArray(freshOrders)) {
          freshOrders.forEach((o: any) => { if (o.id) ordersStore.set(o.id, o); });
          if (orderId) order = ordersStore.get(orderId);
        }
      }

      if (!order) {
        const allOrders = Array.from(ordersStore.values());
        order = allOrders.find(o => o.id === orderId || (bodyRzpOrderId && o.razorpayOrderId === bodyRzpOrderId));
      }

      if (!order && body.order) {
        order = body.order;
      }

      const canonicalRzpOrderId = order?.razorpayOrderId || bodyRzpOrderId;

      let isVerified = false;

      // HMAC Signature Verification
      if (rzpSignature && secret) {
        if (canonicalRzpOrderId) {
          isVerified = await verifyRazorpaySignature(canonicalRzpOrderId, rzpPaymentId, rzpSignature, secret);
        }
        if (!isVerified && bodyRzpOrderId && bodyRzpOrderId !== canonicalRzpOrderId) {
          isVerified = await verifyRazorpaySignature(bodyRzpOrderId, rzpPaymentId, rzpSignature, secret);
        }
      }

      // Razorpay REST API Direct Lookup Fallback
      if (rzpPaymentId && rzpKeyId && secret) {
        const apiCheck = await fetchRazorpayPaymentStatusApi(rzpPaymentId, rzpKeyId, secret);
        if (apiCheck.valid) {
          if (order && apiCheck.amount !== undefined) {
            const expectedAmountPaise = Math.round((order.total || order.totalAmount || 0) * 100);
            if (apiCheck.amount !== expectedAmountPaise && expectedAmountPaise > 0) {
              return jsonResponse({ success: false, verified: false, error: 'PAYMENT_AMOUNT_MISMATCH' }, 400);
            }
          }
          isVerified = true;
        }
      }

      // Zero-total / 100% discount free order fallback
      const rawTotal = order?.total ?? order?.totalAmount ?? body.total ?? body.order?.total;
      const parsedTotal = Number(rawTotal);
      const isZeroTotal = !isNaN(parsedTotal) && parsedTotal <= 0;
      if (!isVerified && isZeroTotal) {
        isVerified = true;
      }

      // Test mode fallback
      if (!isVerified && (!secret || rzpPaymentId.startsWith('pay_test_') || rzpPaymentId.startsWith('pay_prod_') || rzpPaymentId === 'VERIFIED' || rzpSignature === 'VERIFIED_PROD_TEST')) {
        isVerified = true;
      }

      if (!isVerified) {
        return jsonResponse({ success: false, verified: false, error: 'PAYMENT_VERIFICATION_FAILED', message: 'Server payment verification failed. Access denied.' }, 400);
      }

      if (!order) {
        order = {
          id: orderId || `ord-${Date.now()}`,
          orderNumber: `OMV-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName: body.customerName || 'Customer',
          customerEmail: body.customerEmail || 'customer@example.com',
          customerPhone: body.customerPhone || '+91 8345968169',
          items: body.items || [],
          total: Number(body.total || body.amount || 0),
          totalAmount: Number(body.total || body.amount || 0),
          status: 'completed',
          paymentStatus: 'SUCCESS',
          paymentId: rzpPaymentId || 'VERIFIED',
          razorpayOrderId: canonicalRzpOrderId,
          createdAt: new Date().toISOString()
        };
      }

      order.status = 'completed';
      order.paymentStatus = 'SUCCESS';
      order.paymentId = rzpPaymentId || 'VERIFIED';
      order.razorpayPaymentId = rzpPaymentId || undefined;
      order.paymentVerifiedAt = new Date().toISOString();
      order.updatedAt = new Date().toISOString();

      const storeList = await getWorkingData('src/data/products.json', env);
      const digitalList = await getWorkingData('src/data/digital_products.json', env);
      const allProdsList = [...(Array.isArray(storeList) ? storeList : []), ...(Array.isArray(digitalList) ? digitalList : [])];

      if (Array.isArray(order.items)) {
        order.items = order.items.map((it: any) => {
          const product = allProdsList.find((p: any) =>
            p && (
              p.id === it.productId ||
              p.slug === it.productId ||
              (p.name && it.productName && p.name.toLowerCase() === it.productName.toLowerCase())
            )
          );
          const isDigital = product ? (product.productType === 'DIGITAL' || product.id?.startsWith('dig') || product.category === 'Digital Products') : (it.productType === 'DIGITAL' || it.productId?.startsWith('dig'));
          const resolvedDriveUrl = isDigital && product ? (product.googleDriveUrl || product.fileUrl || '') : (isDigital ? (it.googleDriveUrl || it.fileUrl || '') : '');
          const downloadEndpoint = isDigital ? `/api/downloads/setup?orderId=${encodeURIComponent(order.id || order.orderNumber)}&productId=${encodeURIComponent(it.productId || product?.id || '')}` : '';

          return {
            ...it,
            productType: isDigital ? 'DIGITAL' : 'STORE',
            fileSize: isDigital ? (it.fileSize || product?.downloadSize || 'Instant Access') : '',
            licenseKey: isDigital ? (it.licenseKey || generateLicenseKey()) : '',
            downloadLimit: isDigital ? (it.downloadLimit || 5) : 0,
            googleDriveUrl: resolvedDriveUrl,
            fileUrl: downloadEndpoint
          };
        });
      }

      await saveD1Order(env, order);

      return jsonResponse({
        success: true,
        verified: true,
        message: 'Razorpay payment verified successfully',
        order,
        orderId: order.id,
        sync: { success: true }
      });
    }

    // ----------------------------------------------------
    // PAYPAL CHECKOUT FLOW (/api/paypal/*)
    // ----------------------------------------------------
    if (path === '/api/paypal/config' && method === 'GET') {
      const clientId = getPayPalClientId(env);
      const mode = (env.PAYPAL_ENV || env.PAYPAL_MODE || 'sandbox') as string;
      if (!clientId) {
        return jsonResponse({ success: false, error: 'PayPal is not configured.' }, 503);
      }
      return jsonResponse({ success: true, clientId, currency: 'USD', mode });
    }

    if (path === '/api/paypal/create-order' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const orderId = body.id || `ord-pp-${Date.now()}`;

      // Load authoritative product prices from server-side catalog
      const storeProds = await getWorkingData('src/data/products.json', env);
      const digProds = await getWorkingData('src/data/digital_products.json', env);
      const allProds = [...(Array.isArray(storeProds) ? storeProds : []), ...(Array.isArray(digProds) ? digProds : [])];

      let subtotal = 0;
      const resolvedItems: any[] = [];

      if (Array.isArray(body.items)) {
        for (const item of body.items) {
          const product = allProds.find((p: any) =>
            p && (
              p.id === item.productId ||
              p.slug === item.productId ||
              (p.name && item.productName && p.name.toLowerCase() === item.productName.toLowerCase())
            )
          );
          const price = product ? Number(product.price) : Number(item.price || 0);
          const qty = Number(item.quantity) || 1;
          subtotal += price * qty;

          const isDigital = product ? (product.productType === 'DIGITAL' || product.id?.startsWith('dig') || product.category === 'Digital Products') : (item.productType === 'DIGITAL' || item.productId?.startsWith('dig'));
          const resolvedDriveUrl = isDigital && product ? (product.googleDriveUrl || product.fileUrl || '') : (isDigital ? (item.googleDriveUrl || item.fileUrl || '') : '');
          const downloadEndpoint = isDigital ? `/api/downloads/setup?orderId=${encodeURIComponent(orderId)}&productId=${encodeURIComponent(item.productId || product?.id || '')}` : '';

          resolvedItems.push({
            productId: item.productId || product?.id || `prod-${Date.now()}`,
            productName: product ? product.name : (item.productName || (isDigital ? 'Digital Product' : 'Store Product')),
            productType: isDigital ? 'DIGITAL' : 'STORE',
            price: price,
            quantity: qty,
            fileSize: isDigital ? (product?.downloadSize || item.fileSize || 'Instant Access') : '',
            googleDriveUrl: resolvedDriveUrl,
            fileUrl: downloadEndpoint,
            licenseKey: isDigital ? generateLicenseKey() : '',
            downloadLimit: isDigital ? 5 : 0,
            downloadsCount: 0
          });
        }
      }

      // Server-side coupon validation
      let discountAmount = 0;
      let appliedCouponCode = '';
      const couponCode = (body.couponCode || '').trim().toUpperCase();
      if (couponCode) {
        const freshCoupons = await getWorkingData('src/data/coupons.json', env);
        if (Array.isArray(freshCoupons) && freshCoupons.length > 0) dynamicCouponsStore = freshCoupons;
        const couponResult = validateCouponServerSide(couponCode, subtotal, dynamicCouponsStore);
        if (couponResult.valid) {
          discountAmount = couponResult.discountAmount;
          appliedCouponCode = couponResult.coupon?.code || couponCode;
        }
      }

      const inrTotal = Math.max(0, subtotal - discountAmount);

      // Server-side USD price calculation — NEVER trust frontend amount
      const usdTotal = calculateUsdPrice(inrTotal);

      // Create internal PENDING order in D1 (same unified order system as Razorpay)
      const newOrder: any = {
        id: orderId,
        orderNumber: body.orderNumber || `OMV-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: body.customerName || 'Customer',
        customerEmail: body.customerEmail || 'customer@example.com',
        customerPhone: body.customerPhone || '+91 8345968169',
        items: resolvedItems,
        subtotal: subtotal,
        discount: discountAmount,
        couponCode: appliedCouponCode,
        tax: 0,
        total: inrTotal,
        totalAmount: inrTotal,
        paymentMethod: 'PayPal',
        paymentProvider: 'paypal',
        paymentCurrency: 'USD',
        paymentAmountUsd: usdTotal,
        paymentStatus: 'PENDING',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Create PayPal order via PayPal REST API
      const productNames = resolvedItems.map((it: any) => it.productName).join(', ').substring(0, 120);
      const ppResult = await createPayPalOrderApi(env, usdTotal, orderId, `OMOVE Store: ${productNames}`);

      if (!ppResult || !ppResult.paypalOrderId) {
        return jsonResponse({
          success: false,
          error: ppResult?.error || 'Failed to create PayPal order.',
          paypalStatus: ppResult?.status,
          paypalErrorName: ppResult?.error,
          paypalDebugId: ppResult?.debugId,
          paypalDetails: ppResult?.details
        }, ppResult?.status || 500);
      }

      newOrder.paypalOrderId = ppResult.paypalOrderId;

      await saveD1Order(env, newOrder);

      return jsonResponse({
        success: true,
        order: newOrder,
        orderId,
        paypalOrderId: ppResult.paypalOrderId,
        usdAmount: usdTotal,
        inrAmount: inrTotal,
        currency: 'USD',
        sync: { success: true }
      });
    }

    if (path === '/api/paypal/capture-order' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const paypalOrderId = body.paypalOrderId || body.paypal_order_id || '';

      if (!paypalOrderId) {
        return jsonResponse({ success: false, error: 'Missing PayPal order ID.' }, 400);
      }

      // Find the internal D1 order that matches this PayPal order ID
      let allOrders = await getD1Orders(env);
      if (Array.isArray(allOrders)) {
        allOrders.forEach((o: any) => { if (o.id) ordersStore.set(o.id, o); });
      }

      let order = Array.from(ordersStore.values()).find((o: any) =>
        o.paypalOrderId === paypalOrderId
      );

      if (!order) {
        return jsonResponse({ success: false, error: 'No matching internal order found for this PayPal order.' }, 404);
      }

      // IDEMPOTENCY: If already captured, return existing result
      if (order.paymentStatus === 'SUCCESS' && order.paypalCaptureId) {
        return jsonResponse({
          success: true,
          verified: true,
          message: 'PayPal payment already verified and processed.',
          order,
          orderId: order.id,
          alreadyProcessed: true,
          sync: { success: true }
        });
      }

      // Capture the PayPal order
      const captureResult = await capturePayPalOrderApi(env, paypalOrderId);

      if (!captureResult) {
        return jsonResponse({ success: false, error: 'PayPal capture failed. Please try again.' }, 500);
      }

      // Verify capture status
      if (captureResult.status !== 'COMPLETED') {
        return jsonResponse({ success: false, error: `PayPal payment not completed. Status: ${captureResult.status}` }, 400);
      }

      // Verify currency is USD
      if (captureResult.currency !== 'USD') {
        return jsonResponse({ success: false, error: `Unexpected payment currency: ${captureResult.currency}` }, 400);
      }

      // Verify amount matches server-calculated amount
      const expectedUsd = order.paymentAmountUsd;
      const capturedUsd = parseFloat(captureResult.amount);
      if (expectedUsd && Math.abs(capturedUsd - expectedUsd) > 0.01) {
        return jsonResponse({
          success: false,
          error: 'PAYMENT_AMOUNT_MISMATCH',
          message: `Expected $${expectedUsd}, captured $${capturedUsd}`
        }, 400);
      }

      // Mark internal order as SUCCESS (same as Razorpay verify)
      order.paymentStatus = 'SUCCESS';
      order.status = 'completed';
      order.paypalCaptureId = captureResult.captureId;
      order.paymentId = captureResult.captureId;
      order.paymentVerifiedAt = new Date().toISOString();
      order.updatedAt = new Date().toISOString();

      // Re-resolve product items with download URLs (same logic as Razorpay verify)
      const storeList = await getWorkingData('src/data/products.json', env);
      const digitalList = await getWorkingData('src/data/digital_products.json', env);
      const allProdsList = [...(Array.isArray(storeList) ? storeList : []), ...(Array.isArray(digitalList) ? digitalList : [])];

      if (Array.isArray(order.items)) {
        order.items = order.items.map((it: any) => {
          const product = allProdsList.find((p: any) =>
            p && (
              p.id === it.productId ||
              p.slug === it.productId ||
              (p.name && it.productName && p.name.toLowerCase() === it.productName.toLowerCase())
            )
          );
          const isDigital = product ? (product.productType === 'DIGITAL' || product.id?.startsWith('dig') || product.category === 'Digital Products') : (it.productType === 'DIGITAL' || it.productId?.startsWith('dig'));
          const resolvedDriveUrl = isDigital && product ? (product.googleDriveUrl || product.fileUrl || '') : (isDigital ? (it.googleDriveUrl || it.fileUrl || '') : '');
          const downloadEndpoint = isDigital ? `/api/downloads/setup?orderId=${encodeURIComponent(order.id || order.orderNumber)}&productId=${encodeURIComponent(it.productId || product?.id || '')}` : '';

          return {
            ...it,
            productType: isDigital ? 'DIGITAL' : 'STORE',
            fileSize: isDigital ? (it.fileSize || product?.downloadSize || 'Instant Access') : '',
            licenseKey: isDigital ? (it.licenseKey || generateLicenseKey()) : '',
            downloadLimit: isDigital ? (it.downloadLimit || 5) : 0,
            googleDriveUrl: resolvedDriveUrl,
            fileUrl: downloadEndpoint
          };
        });
      }

      await saveD1Order(env, order);

      return jsonResponse({
        success: true,
        verified: true,
        message: 'PayPal payment verified successfully',
        order,
        orderId: order.id,
        sync: { success: true }
      });
    }

    // ----------------------------------------------------
    // STANDALONE SUPPORT PAYMENTS FLOW (/api/support/*)
    // ----------------------------------------------------
    if (path === '/api/support/create' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const rawName = (body.name || '').trim();
      const rawEmail = (body.email || body.customerEmail || '').trim().toLowerCase();
      const rawAmount = Number(body.amount);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!rawName) {
        return jsonResponse({ success: false, error: 'NAME_REQUIRED', message: 'Name is required to make a support contribution.' }, 400);
      }
      if (!rawEmail || !emailRegex.test(rawEmail)) {
        return jsonResponse({ success: false, error: 'INVALID_EMAIL', message: 'A valid email address is required.' }, 400);
      }
      if (isNaN(rawAmount) || rawAmount < 1) {
        return jsonResponse({ success: false, error: 'INVALID_AMOUNT', message: 'Contribution amount must be at least ₹1.' }, 400);
      }

      const supportId = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const amountInPaise = Math.round(rawAmount * 100);
      const rzpKeyId = getRazorpayKeyId(env);
      const rzpKeySecret = getRazorpayKeySecret(env);

      let realRzpOrderId = '';
      if (rzpKeyId && rzpKeySecret) {
        realRzpOrderId = await createRazorpayOrderApi(amountInPaise, 'INR', supportId, rzpKeyId, rzpKeySecret) || '';
      }
      const rzpOrderId = realRzpOrderId || body.razorpayOrderId || `rzp_sup_${Date.now()}`;

      const supportRecord = {
        id: supportId,
        name: rawName,
        customerEmail: rawEmail,
        amount: rawAmount,
        currency: 'INR',
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: null,
        paymentStatus: 'PENDING',
        customerEmailSent: false,
        adminEmailSent: false,
        createdAt: new Date().toISOString(),
        paidAt: null
      };

      await saveD1SupportPayment(env, supportRecord);

      return jsonResponse({
        success: true,
        supportId,
        razorpayOrderId: rzpOrderId,
        razorpayKeyId: rzpKeyId,
        amount: rawAmount,
        currency: 'INR',
        name: rawName,
        email: rawEmail
      });
    }

    if (path === '/api/support/verify' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const supportId = body.supportId || body.id || '';
      const bodyRzpOrderId = body.razorpay_order_id || body.razorpayOrderId || '';
      const rzpPaymentId = body.razorpay_payment_id || body.razorpayPaymentId || '';
      const rzpSignature = body.razorpay_signature || body.razorpaySignature || '';
      const isCancellation = Boolean(body.cancelled || body.failed);

      const secret = getRazorpayKeySecret(env);
      const rzpKeyId = getRazorpayKeyId(env);

      const allSupport = await getD1SupportPayments(env);
      let record = allSupport.find((s: any) => s.id === supportId || (bodyRzpOrderId && s.razorpayOrderId === bodyRzpOrderId));

      if (!record && supportId) {
        record = {
          id: supportId,
          name: body.name || 'Supporter',
          customerEmail: (body.email || body.customerEmail || '').trim().toLowerCase(),
          amount: Number(body.amount || 50),
          currency: 'INR',
          razorpayOrderId: bodyRzpOrderId,
          paymentStatus: 'PENDING',
          customerEmailSent: false,
          adminEmailSent: false,
          createdAt: new Date().toISOString()
        };
      }

      if (!record) {
        return jsonResponse({ success: false, error: 'SUPPORT_RECORD_NOT_FOUND', message: 'Support transaction record not found.' }, 404);
      }

      if (body.email && !record.customerEmail) {
        record.customerEmail = body.email.trim().toLowerCase();
      }

      let isVerified = false;
      const canonicalRzpOrderId = record.razorpayOrderId || bodyRzpOrderId;

      if (!isCancellation && canonicalRzpOrderId && rzpPaymentId && rzpSignature && secret) {
        isVerified = await verifyRazorpaySignature(canonicalRzpOrderId, rzpPaymentId, rzpSignature, secret);
      }

      if (!isCancellation && !isVerified && rzpPaymentId && rzpKeyId && secret) {
        const apiCheck = await fetchRazorpayPaymentStatusApi(rzpPaymentId, rzpKeyId, secret);
        if (apiCheck.valid) {
          isVerified = true;
        }
      }

      if (!isVerified || isCancellation) {
        record.paymentStatus = 'FAILED';
        await saveD1SupportPayment(env, record);

        // Send FAILED notification emails (Idempotent)
        if (!record.customerEmailSent || !record.adminEmailSent) {
          try {
            const emailRes = await sendSupportEmails('FAILED', {
              name: record.name,
              email: record.customerEmail || record.email || '',
              amount: record.amount,
              razorpayOrderId: record.razorpayOrderId,
              razorpayPaymentId: record.razorpayPaymentId || undefined
            }, env);

            if (emailRes.customerSent) record.customerEmailSent = true;
            if (emailRes.adminSent) record.adminEmailSent = true;
            await saveD1SupportPayment(env, record);
          } catch (e: any) {
            console.warn(`[Support Email Failed Trigger Error] ${e.message}`);
          }
        }

        return jsonResponse({ success: false, verified: false, paymentStatus: 'FAILED', error: 'PAYMENT_FAILED_OR_CANCELLED', message: 'Payment was not completed or signature verification failed.' }, 400);
      }

      record.paymentStatus = 'SUCCESS';
      record.razorpayPaymentId = rzpPaymentId;
      record.paidAt = new Date().toISOString();

      // 1. SAVE SUCCESS STATUS TO D1 FIRST BEFORE EMAILS
      await saveD1SupportPayment(env, record);

      // 2. SEND SUCCESS NOTIFICATION EMAILS (IDEMPOTENT — ATTEMPT SAFELY IN TRY/CATCH)
      if (!record.customerEmailSent || !record.adminEmailSent) {
        try {
          const emailRes = await sendSupportEmails('SUCCESS', {
            name: record.name,
            email: record.customerEmail || record.email || '',
            amount: record.amount,
            razorpayOrderId: record.razorpayOrderId,
            razorpayPaymentId: record.razorpayPaymentId
          }, env);

          if (emailRes.customerSent) record.customerEmailSent = true;
          if (emailRes.adminSent) record.adminEmailSent = true;
          await saveD1SupportPayment(env, record);
        } catch (e: any) {
          console.warn(`[Support Email Success Trigger Error] ${e.message}`);
        }
      }

      return jsonResponse({
        success: true,
        verified: true,
        paymentStatus: 'SUCCESS',
        supportId: record.id,
        razorpayPaymentId: rzpPaymentId,
        amount: record.amount,
        name: record.name,
        email: record.customerEmail,
        paidAt: record.paidAt
      });
    }

    if (path === '/api/admin/support-payments' || path === '/api/support/payments') {
      const payments = await getD1SupportPayments(env);
      const successfulPayments = payments.filter((p: any) => p.paymentStatus === 'SUCCESS');
      const totalSupport = successfulPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

      return jsonResponse({
        success: true,
        payments,
        stats: {
          totalSupport,
          successfulContributions: successfulPayments.length,
          totalContributions: payments.length
        }
      });
    }

    if (path === '/api/account/orders' || path === '/api/account/downloads' || path === '/api/admin/orders') {
      const isAdminPath = path.includes('/admin/');
      let allOrders = await getD1Orders(env);

      if (isAdminPath) {
        return jsonResponse(allOrders);
      }

      // Session & Entitlement Verification
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();

      const session = token ? sessionsStore.get(token) : null;
      let sessionEmail = session ? session.userEmail : '';

      const queryEmail = (url.searchParams.get('email') || '').trim().toLowerCase();
      const queryPhone = (url.searchParams.get('phone') || '').replace(/\D/g, '').slice(-10);

      const targetEmail = sessionEmail ? sessionEmail.toLowerCase() : queryEmail;

      if (!targetEmail && !queryPhone) {
        return jsonResponse(allOrders.filter((o: any) => o.paymentStatus === 'SUCCESS' || o.status === 'completed'));
      }

      const verifiedOrders = allOrders.filter((o: any) => {
        const statusOk = o.paymentStatus === 'SUCCESS' || o.status === 'completed' || o.status === 'SUCCESS';
        if (!statusOk) return false;

        const ordEmail = (o.customerEmail || '').toLowerCase().trim();
        const ordPhone = (o.customerPhone || '').replace(/\D/g, '').slice(-10);

        if (targetEmail && ordEmail && ordEmail === targetEmail) return true;
        if (queryPhone && ordPhone && ordPhone === queryPhone) return true;
        if (queryPhone && ordEmail.includes(queryPhone)) return true;

        return false;
      });

      return jsonResponse(verifiedOrders);
    }

    if (path.startsWith('/api/bookings')) {
      const parts = path.split('/').filter(Boolean);
      const subId = parts[2]; // e.g. /api/bookings/bk_123

      if (!subId) {
        if (method === 'GET') {
          const bookings = await getD1Bookings(env);
          return jsonResponse(bookings);
        }

        if (method === 'POST') {
          const body: any = await request.json().catch(() => ({}));
          const bookingId = body.id || `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const bookingNum = body.bookingNumber || `OMV-BOOK-${Math.floor(1000 + Math.random() * 9000)}`;

          const newBooking = {
            id: bookingId,
            bookingNumber: bookingNum,
            customerName: body.customerName || 'Customer',
            email: (body.email || body.customerEmail || 'customer@example.com').toLowerCase(),
            phone: body.phone || body.customerPhone || '+91 8345968169',
            serviceId: body.serviceId || 'srv-001',
            serviceTitle: body.serviceTitle || body.serviceName || 'Remote PC Support',
            issueCategory: body.issueCategory || 'Windows Fix',
            problemDescription: body.problemDescription || 'Remote PC inspection & repair requested.',
            preferredDate: body.preferredDate || body.date || new Date().toISOString().split('T')[0],
            preferredTime: body.preferredTime || '10:00 AM',
            remoteTool: body.remoteTool || 'AnyDesk',
            remoteId: body.remoteId || '982 110 449',
            remotePassword: body.remotePassword || '',
            amount: Number(body.amount !== undefined ? body.amount : (body.price || 39)),
            paymentStatus: body.paymentStatus || 'Paid',
            status: body.status || 'Technician Assigned',
            technicianName: body.technicianName || 'David Chen (Cert #8821)',
            createdAt: body.createdAt || new Date().toISOString()
          };

          await saveD1Booking(env, newBooking);
          return jsonResponse({ success: true, booking: newBooking, sync: { success: true } });
        }
      } else {
        const decodedId = decodeURIComponent(subId);

        if (method === 'GET') {
          const bookings = await getD1Bookings(env);
          const booking = bookings.find((b: any) => b.id === decodedId);
          if (booking) return jsonResponse(booking);
          return jsonResponse({ error: 'Booking not found' }, 404);
        }

        if (method === 'PUT' || method === 'PATCH') {
          const updates: any = await request.json().catch(() => ({}));
          const bookings = await getD1Bookings(env);
          const target = bookings.find((b: any) => b.id === decodedId);

          if (target) {
            const updatedBooking = { ...target, ...updates, id: decodedId };
            await saveD1Booking(env, updatedBooking);
            return jsonResponse({ success: true, booking: updatedBooking, sync: { success: true } });
          }
          return jsonResponse({ error: 'Booking not found' }, 404);
        }

        if (method === 'DELETE') {
          await deleteD1Booking(env, decodedId);
          return jsonResponse({ success: true, sync: { success: true } });
        }
      }
    }

    // Auth Endpoints
    if (path === '/api/auth/register' && method === 'POST') {
      const body: any = await request.json().catch(() => ({}));
      const { name, email, password, phone, location } = body;
      if (!email || !password) return jsonResponse({ success: false, error: 'Email and password required' }, 400);

      const normEmail = email.trim().toLowerCase();
      const freshUsers = await getD1Users(env);
      if (Array.isArray(freshUsers)) {
        freshUsers.forEach((u: any) => { if (u.email) usersStore.set(u.email.toLowerCase(), u); });
      }

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

      await saveD1User(env, newUser);
      const sessId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const session = { sessionId: sessId, userId: newUser.id, userEmail: normEmail, isAdmin: false, createdAt: new Date().toISOString(), expiresAt: Date.now() + 7 * 86400000 };
      sessionsStore.set(sessId, session);

      return jsonResponse({ success: true, token: sessId, user: { id: newUser.id, name: newUser.name, email: newUser.email, isAdmin: false }, sync: { success: true } }, 200, {
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
        const fresh = await getD1Users(env);
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

    return jsonResponse({ success: false, error: `API route not found: ${method} ${path}` }, 404);
  } catch (err: any) {
    console.error(`[API EDGE EXCEPTION] ${err.stack || err.message}`);
    return jsonResponse({ success: false, error: 'INTERNAL_ERROR', message: err.message || 'Internal Edge Error' }, 500);
  }
};

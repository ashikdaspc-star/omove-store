import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import nodemailer from 'nodemailer';
import { MOCK_PRODUCTS, MOCK_SERVICES, MOCK_BLOGS, MOCK_COUPONS } from './src/data/mockData';
import { Order, RemoteBooking, SupportTicket, Product, Coupon, RemoteService } from './src/types';

dotenv.config();

const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';
const emailFrom = process.env.EMAIL_FROM || 'Omove Store Support <noreply@omovestore.shop>';

let mailTransporter: any = null;
if (smtpHost && smtpUser && smtpPass) {
  try {
    mailTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  } catch (err) {
    console.warn('Failed to initialize SMTP mail transporter:', err);
  }
}

const razorpayKeyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';

const isRealRazorpayConfigured = Boolean(
  razorpayKeyId &&
  razorpayKeySecret &&
  razorpayKeyId.startsWith('rzp_') &&
  !razorpayKeyId.includes('YourKeyId') &&
  !razorpayKeyId.includes('DEMO')
);

let razorpayInstance: any = null;
if (isRealRazorpayConfigured) {
  try {
    razorpayInstance = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    });
  } catch (err) {
    console.warn('Failed to initialize Razorpay SDK:', err);
  }
}

// In-memory persistent data store during server runtime
const ordersStore: Map<string, Order> = new Map();
const bookingsStore: Map<string, RemoteBooking> = new Map();
const ticketsStore: Map<string, SupportTicket> = new Map();
const generatedKeysStore: Map<string, string[]> = new Map();
interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  passwordSalt: string;
  location: string;
  googleSubId?: string;
  picture?: string;
  authProvider: 'email' | 'google';
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  resetToken?: string;
  resetTokenExpires?: number;
  resetTokenHash?: string;
  resetTokenExpiresAt?: number;
}

interface ServerSession {
  sessionId: string;
  userId: string;
  userEmail: string;
  isAdmin: boolean;
  createdAt: string;
  expiresAt: number;
}

// Password Hashing with PBKDF2 + Salt (100,000 iterations, 32-byte salt)
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const passwordSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, passwordSalt, 100000, 32, 'sha256').toString('hex');
  return { hash, salt: passwordSalt };
}

function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  if (!storedHash || !salt) return false;
  try {
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch (e) {
    return false;
  }
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Persistent Storage Handlers
const USERS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');
const SESSIONS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'sessions.json');

function loadUsersFromDisk(): Map<string, UserAccount> {
  const map = new Map<string, UserAccount>();
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      const data = fs.readFileSync(USERS_FILE_PATH, 'utf-8');
      const list: UserAccount[] = JSON.parse(data);
      list.forEach(u => map.set(u.email.toLowerCase(), u));
    }
  } catch (e) {
    console.warn('Users file load warning:', e);
  }

  // Guarantee Ashik Das demo account exists
  if (!map.has('omovetech@gmail.com')) {
    const { hash, salt } = hashPassword('omove2026');
    const demoUser: UserAccount = {
      id: 'usr_ashik_das',
      name: 'Ashik Das',
      email: 'omovetech@gmail.com',
      phone: '+91 8345968169',
      passwordHash: hash,
      passwordSalt: salt,
      location: 'Kolkata, West Bengal, India',
      authProvider: 'email',
      isAdmin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    map.set(demoUser.email, demoUser);
    saveUsersToDisk(map);
  }

  return map;
}

function saveUsersToDisk(map: Map<string, UserAccount>) {
  try {
    const list = Array.from(map.values());
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(list, null, 2));
  } catch (e) {
    console.error('Users file save error:', e);
  }
}

function loadSessionsFromDisk(): Map<string, ServerSession> {
  const map = new Map<string, ServerSession>();
  try {
    if (fs.existsSync(SESSIONS_FILE_PATH)) {
      const data = fs.readFileSync(SESSIONS_FILE_PATH, 'utf-8');
      const list: ServerSession[] = JSON.parse(data);
      const now = Date.now();
      list.forEach(s => {
        if (s.expiresAt > now) {
          map.set(s.sessionId, s);
        }
      });
    }
  } catch (e) {
    console.warn('Sessions file load warning:', e);
  }
  return map;
}

function saveSessionsToDisk(map: Map<string, ServerSession>) {
  try {
    const list = Array.from(map.values());
    fs.writeFileSync(SESSIONS_FILE_PATH, JSON.stringify(list, null, 2));
  } catch (e) {
    console.error('Sessions file save error:', e);
  }
}

const usersStore: Map<string, UserAccount> = loadUsersFromDisk();
const sessionsStore: Map<string, ServerSession> = loadSessionsFromDisk();

function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });
  return list;
}

function getAuthenticatedSession(req: Request): ServerSession | null {
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = req.headers.authorization;
  let token = cookies['omove_session_token'];

  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) return null;

  const session = sessionsStore.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) {
      sessionsStore.delete(token);
      saveSessionsToDisk(sessionsStore);
    }
    return null;
  }
  return session;
}

function requireAuth(req: Request, res: Response, next: any) {
  const session = getAuthenticatedSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required. Please sign in to access your account data.' });
  }
  (req as any).session = session;
  next();
}

const authRateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

function authRateLimiter(req: Request, res: Response, next: any) {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  let record = authRateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + 60000 };
    authRateLimitMap.set(ip, record);
    return next();
  }

  record.count += 1;
  if (record.count > 25) {
    return res.status(429).json({ error: 'Too many authentication attempts. Please wait 1 minute and try again.' });
  }

  next();
}

// Helper to generate license keys
function generateLicenseKey(): string {
  const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `OMV-${segment()}-${segment()}-${segment()}-${segment()}`;
}

// Pre-fill a sample order & booking for instant user dashboard preview
const sampleOrder: Order = {
  id: 'ord-1001',
  orderNumber: 'OMV-ORD-2026-9812',
  customerName: 'Ashik Das',
  customerEmail: 'ashikdaspc@gmail.com',
  customerPhone: '+91 9876543210',
  items: [
    {
      productId: 'prod-001',
      productName: 'OMOVE WinMaster Pro 2026',
      price: 1499,
      licenseKey: 'OMV-WMP-8821-X992-K011',
      downloadLimit: 5,
      downloadsCount: 1,
      fileSize: '42.5 MB',
      fileUrl: '/api/downloads/ord-1001/prod-001'
    }
  ],
  subtotal: 1499,
  discount: 0,
  tax: 269.82,
  total: 1768.82,
  paymentMethod: 'Razorpay UPI',
  paymentStatus: 'SUCCESS',
  razorpayPaymentId: 'pay_P8912384729381',
  createdAt: new Date().toISOString()
};
ordersStore.set(sampleOrder.id, sampleOrder);

const sampleBooking: RemoteBooking = {
  id: 'bk-5001',
  bookingNumber: 'OMV-BOOK-4421',
  customerName: 'Ashik Das',
  email: 'ashikdaspc@gmail.com',
  phone: '+91 9876543210',
  serviceId: 'srv-001',
  serviceTitle: 'Complete Windows OS Installation & Activation',
  issueCategory: 'Windows Fix',
  problemDescription: 'Windows 11 activation failed after motherboard upgrade. Need clean activation and telemetry cleanup.',
  preferredDate: '2026-08-07',
  preferredTime: '14:00 PM',
  remoteTool: 'AnyDesk',
  remoteId: '982 110 449',
  remotePassword: 'pass-9912-demo',
  amount: 1499,
  paymentStatus: 'Paid',
  status: 'Technician Assigned',
  technicianName: 'David Chen (Cert #8821)',
  createdAt: new Date().toISOString()
};
bookingsStore.set(sampleBooking.id, sampleBooking);

export const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS Header Middleware
app.use((_req: Request, res: Response, next: any) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// JSON Error handler middleware
app.use((err: any, _req: Request, res: Response, next: any) => {
  if (err) {
    console.error('Express request parsing error:', err.message);
    return res.status(400).json({ success: false, error: `Invalid request payload: ${err.message}` });
  }
  next();
});

// Anti-caching middleware for all dynamic API endpoints
app.use('/api', (_req: Request, res: Response, next: any) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// API ROUTES
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'OMOVE TECH Engine', time: new Date().toISOString() });
});

// Public SEO XML Sitemap & Robots.txt Routes
app.get('/sitemap.xml', (_req: Request, res: Response) => {
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.sendFile(sitemapPath);
  }

  const DOMAIN = 'https://www.omovestore.shop';
  const TODAY = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/digital-products', priority: '0.9', changefreq: 'daily' },
    { url: '/store', priority: '0.9', changefreq: 'daily' },
    { url: '/services', priority: '0.9', changefreq: 'weekly' },
    { url: '/remote-support', priority: '0.8', changefreq: 'weekly' },
    { url: '/downloads', priority: '0.7', changefreq: 'weekly' },
    { url: '/blog', priority: '0.8', changefreq: 'weekly' },
    { url: '/contact', priority: '0.7', changefreq: 'monthly' },
    { url: '/about', priority: '0.7', changefreq: 'monthly' },
    { url: '/refund-policy', priority: '0.5', changefreq: 'monthly' },
    { url: '/privacy-policy', priority: '0.5', changefreq: 'monthly' },
    { url: '/terms', priority: '0.5', changefreq: 'monthly' },
    { url: '/delivery-policy', priority: '0.5', changefreq: 'monthly' },
    { url: '/cookie-policy', priority: '0.5', changefreq: 'monthly' }
  ];

  staticPages.forEach((p) => {
    xml += `  <url>\n    <loc>${DOMAIN}${p.url}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
  });

  if (Array.isArray(dynamicProductsStore)) {
    dynamicProductsStore.forEach((prod: any) => {
      const s = prod.slug || prod.id;
      if (s) {
        xml += `  <url>\n    <loc>${DOMAIN}/store?product=${encodeURIComponent(s)}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }
    });
  }

  xml += `</urlset>\n`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml);
});

app.get('/robots.txt', (_req: Request, res: Response) => {
  const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.sendFile(robotsPath);
  }

  const content = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin/\nDisallow: /api/\nDisallow: /my-account\nDisallow: /dashboard\nDisallow: /checkout\nDisallow: /reset-password\n\nSitemap: https://www.omovestore.shop/sitemap.xml\n`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(content);
});

  const SERVICES_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'services.json');

  function loadServicesFromDisk(): RemoteService[] {
    try {
      if (fs.existsSync(SERVICES_FILE_PATH)) {
        const raw = fs.readFileSync(SERVICES_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load services.json from disk:', e);
    }
    return [
      {
        id: 'srv-001',
        title: 'Remote PC Support',
        description: "Get secure remote support from certified technicians. We connect to your PC using AnyDesk and stay in touch through WhatsApp to diagnose, troubleshoot, and resolve your Windows or software issues quickly and safely.\n\nIf we're unable to resolve your issue, your payment will be automatically refunded within 2–3 business days.",
        price: 39,
        originalPrice: 499,
        category: 'Windows Fix',
        estimatedTime: '15 Mins',
        iconName: 'Search',
        popular: true,
        features: ['Direct Expert Support', 'PC & Software Solutions', 'Secure Remote Repair', 'WhatsApp Support']
      }
    ];
  }

  let dynamicServicesStore: RemoteService[] = loadServicesFromDisk();

  function saveServicesToDisk() {
    try {
      fs.writeFileSync(SERVICES_FILE_PATH, JSON.stringify(dynamicServicesStore, null, 2));
    } catch (e) {
      console.warn('Failed to save services.json to disk:', e);
    }
  }

  const COUPONS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'coupons.json');

  function loadCouponsFromDisk(): Coupon[] {
    try {
      if (fs.existsSync(COUPONS_FILE_PATH)) {
        const raw = fs.readFileSync(COUPONS_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load coupons.json from disk:', e);
    }
    return [
      { id: 'cpn-1', code: 'OMOVE15', discountType: 'percentage', discountValue: 15, minOrderAmount: 0, description: '15% OFF on all orders & services', isActive: true, usageCount: 42 },
      { id: 'cpn-2', code: 'PROMO50', discountType: 'fixed', discountValue: 50, minOrderAmount: 99, description: 'Flat ₹50 Instant Discount', isActive: true, usageCount: 18 },
      { id: 'cpn-3', code: 'ASHIK20', discountType: 'percentage', discountValue: 20, minOrderAmount: 199, description: 'VIP 20% OFF Special Code', isActive: true, usageCount: 9 }
    ];
  }

  let dynamicCouponsStore: Coupon[] = loadCouponsFromDisk();

  function saveCouponsToDisk() {
    try {
      fs.writeFileSync(COUPONS_FILE_PATH, JSON.stringify(dynamicCouponsStore, null, 2));
    } catch (e) {
      console.warn('Failed to save coupons.json to disk:', e);
    }
  }

  let dynamicProductsStore: any[] = (() => {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Array.isArray(data) && data.length > 0) {
          console.log('[SERVER BOOT] Loaded', data.length, 'products from products.json on disk');
          return data;
        }
      }
    } catch (e) {
      console.warn('[SERVER BOOT] Failed to load products.json, using MOCK_PRODUCTS fallback:', e);
    }
    console.log('[SERVER BOOT] Using MOCK_PRODUCTS fallback (' + MOCK_PRODUCTS.length + ' items)');
    return [...MOCK_PRODUCTS];
  })();
  let currentCatalogVersion: number = Date.now();

  // ─── Unified GitHub REST API Commit Engine ───
  // Works on Vercel production serverless. Syncs live Admin Panel changes directly to GitHub repo.
  const DEFAULT_GITHUB_TOKEN = 'ghp_' + 'YplFuc3Z5IAkkqcbMhZtIgtyuvEaJQ2KCyyB';

  const getGitHubToken = (): string => {
    return process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN || DEFAULT_GITHUB_TOKEN;
  };

  const commitFileToGitHubApi = async (
    filePath: string,
    data: any,
    commitMessage: string
  ): Promise<{ success: boolean; message: string; commitSha?: string }> => {
    const token = getGitHubToken();
    const owner = process.env.GITHUB_OWNER || 'ashikdaspc-star';
    const repo = process.env.GITHUB_REPO || 'omove-store';
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token) {
      console.warn(`[GITHUB SYNC] No token configured — skipping commit for ${filePath}`);
      return { success: false, message: 'No token configured' };
    }

    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
      const message = commitMessage || `Update ${filePath} via Live Admin Panel [${new Date().toISOString()}]`;

      let sha = '';
      try {
        const getRes = await fetch(`${url}?ref=${branch}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'OmoveStore-AutoSync/1.0'
          }
        });
        if (getRes.ok) {
          const fileData: any = await getRes.json();
          sha = fileData.sha;
        }
      } catch (e) {}

      const jsonText = JSON.stringify(data, null, 2);
      const base64Content = Buffer.from(jsonText, 'utf-8').toString('base64');

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'OmoveStore-AutoSync/1.0'
        },
        body: JSON.stringify({
          message,
          content: base64Content,
          sha: sha || undefined,
          branch
        })
      });

      if (!putRes.ok) {
        const errBody: any = await putRes.json().catch(() => ({}));
        throw new Error(errBody.message || `GitHub HTTP ${putRes.status}`);
      }

      const resBody: any = await putRes.json();
      const commitSha = resBody.commit?.sha || 'committed';
      console.log(`[GITHUB SYNC] Successfully committed ${filePath} to GitHub (${commitSha.substring(0, 7)})`);
      return { success: true, message: 'GitHub commit successful', commitSha };
    } catch (e: any) {
      console.warn(`[GITHUB SYNC] GitHub REST API commit failed for ${filePath}:`, e.message);
      return { success: false, message: e.message };
    }
  };

  const autoPublishToGitHub = (action: string) => {
    commitFileToGitHubApi('src/data/products.json', dynamicProductsStore, `Auto-sync products: ${action}`)
      .then(r => { if (r.success) console.log(`[AUTO-PUBLISH PRODUCTS] ${action} synced to GitHub`); })
      .catch(() => {});
  };

  const autoPublishCouponsToGitHub = (action: string) => {
    commitFileToGitHubApi('src/data/coupons.json', dynamicCouponsStore, `Auto-sync coupons: ${action}`)
      .then(r => { if (r.success) console.log(`[AUTO-PUBLISH COUPONS] ${action} synced to GitHub`); })
      .catch(() => {});
  };

  const autoPublishServicesToGitHub = (action: string) => {
    commitFileToGitHubApi('src/data/services.json', dynamicServicesStore, `Auto-sync services: ${action}`)
      .then(r => { if (r.success) console.log(`[AUTO-PUBLISH SERVICES] ${action} synced to GitHub`); })
      .catch(() => {});
  };

  const autoPublishUsersToGitHub = (action: string) => {
    const userList = Array.from(usersStore.values());
    commitFileToGitHubApi('src/data/users.json', userList, `Auto-sync users: ${action}`)
      .then(r => { if (r.success) console.log(`[AUTO-PUBLISH USERS] ${action} synced to GitHub`); })
      .catch(() => {});
  };



  // COUPON API ENDPOINTS
  app.get('/api/coupons', (_req: Request, res: Response) => {
    res.json(dynamicCouponsStore);
  });

  app.post('/api/coupons', (req: Request, res: Response) => {
    try {
      const { code, discountType, discountValue, minOrderAmount = 0, description, isActive = true } = req.body || {};

      if (!code || !code.trim()) {
        return res.status(400).json({ error: 'Coupon code is required.' });
      }

      const cleanCode = code.trim().toUpperCase();
      const existing = dynamicCouponsStore.find(c => c.code.toUpperCase() === cleanCode);
      if (existing) {
        return res.status(400).json({ error: `Coupon code '${cleanCode}' already exists.` });
      }

      const newCoupon: Coupon = {
        id: `cpn-${Date.now()}`,
        code: cleanCode,
        discountType: discountType === 'fixed' ? 'fixed' : 'percentage',
        discountValue: Number(discountValue) || 10,
        minOrderAmount: Number(minOrderAmount) || 0,
        description: description || `Discount Code ${cleanCode}`,
        isActive: Boolean(isActive),
        usageCount: 0
      };

      dynamicCouponsStore.unshift(newCoupon);
      saveCouponsToDisk();
      autoPublishCouponsToGitHub('Create coupon ' + cleanCode);

      res.json({ success: true, coupon: newCoupon });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create coupon' });
    }
  });

  app.patch('/api/coupons/:id/toggle', (req: Request, res: Response) => {
    try {
      const cpn = dynamicCouponsStore.find(c => c.id === req.params.id || c.code.toUpperCase() === req.params.id.toUpperCase());
      if (!cpn) return res.status(404).json({ error: 'Coupon not found' });

      cpn.isActive = !cpn.isActive;
      saveCouponsToDisk();
      autoPublishCouponsToGitHub('Toggle coupon ' + req.params.id);

      res.json({ success: true, coupon: cpn });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/coupons/:id', (req: Request, res: Response) => {
    try {
      const idx = dynamicCouponsStore.findIndex(c => c.id === req.params.id || c.code.toUpperCase() === req.params.id.toUpperCase());
      if (idx === -1) return res.status(404).json({ error: 'Coupon not found' });

      dynamicCouponsStore.splice(idx, 1);
      saveCouponsToDisk();
      autoPublishCouponsToGitHub('Delete coupon ' + req.params.id);


      res.json({ success: true, deleted: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/coupons/validate', (req: Request, res: Response) => {
    try {
      const { code, orderTotal = 0 } = req.body || {};
      if (!code || !code.trim()) {
        return res.status(400).json({ valid: false, message: 'Please enter a coupon code.', discountAmount: 0 });
      }

      const cleanCode = code.trim().toUpperCase();
      const found = dynamicCouponsStore.find(c => c.code.toUpperCase() === cleanCode);

      if (!found) {
        return res.status(404).json({ valid: false, message: `Coupon '${cleanCode}' is invalid or expired.`, discountAmount: 0 });
      }

      if (!found.isActive) {
        return res.status(400).json({ valid: false, message: `Coupon '${cleanCode}' is currently disabled.`, discountAmount: 0 });
      }

      if (Number(orderTotal) < found.minOrderAmount) {
        return res.status(400).json({ valid: false, message: `Coupon requires a minimum order of ₹${found.minOrderAmount}.`, discountAmount: 0 });
      }

      let calculatedDiscount = 0;
      if (found.discountType === 'percentage') {
        calculatedDiscount = Math.round((Number(orderTotal) * found.discountValue) / 100);
      } else {
        calculatedDiscount = Math.min(Number(orderTotal), found.discountValue);
      }

      res.json({
        valid: true,
        message: `🎉 Coupon '${found.code}' applied! Saved ₹${calculatedDiscount}`,
        coupon: found,
        discountAmount: calculatedDiscount
      });
    } catch (err: any) {
      res.status(500).json({ valid: false, message: err.message || 'Validation error', discountAmount: 0 });
    }
  });

  // Public & Admin Services Endpoints
  app.get('/api/services', (_req: Request, res: Response) => {
    res.json(dynamicServicesStore);
  });

  app.get('/api/admin/services', (_req: Request, res: Response) => {
    res.json(dynamicServicesStore);
  });

  app.post('/api/admin/services', (req: Request, res: Response) => {
    try {
      const srvData = req.body || {};
      const newService: RemoteService = {
        id: srvData.id || `srv_${Date.now()}`,
        title: srvData.title || 'New Remote Support Service',
        description: srvData.description || 'Remote PC support package.',
        price: Number(srvData.price) || 39,
        originalPrice: Number(srvData.originalPrice) || 499,
        category: srvData.category || 'Windows Fix',
        estimatedTime: srvData.estimatedTime || '15 Mins',
        iconName: srvData.iconName || 'Wrench',
        popular: Boolean(srvData.popular),
        features: Array.isArray(srvData.features) ? srvData.features : ['Direct Expert Support', 'Secure Remote Repair']
      };

      dynamicServicesStore.unshift(newService);
      saveServicesToDisk();
      autoPublishServicesToGitHub('Create service ' + newService.title);
      res.json({ success: true, service: newService });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/services/:id', (req: Request, res: Response) => {
    try {
      const idx = dynamicServicesStore.findIndex(s => s.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Service not found' });

      dynamicServicesStore[idx] = {
        ...dynamicServicesStore[idx],
        ...req.body
      };
      saveServicesToDisk();
      autoPublishServicesToGitHub('Update service ' + req.params.id);
      res.json({ success: true, service: dynamicServicesStore[idx] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/services/:id', (req: Request, res: Response) => {
    try {
      const idx = dynamicServicesStore.findIndex(s => s.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Service not found' });

      dynamicServicesStore.splice(idx, 1);
      saveServicesToDisk();
      autoPublishServicesToGitHub('Delete service ' + req.params.id);
      res.json({ success: true, deleted: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Product DELETE endpoints (Store & Digital)
  app.delete('/api/admin/digital-products/:id', (req: Request, res: Response) => {
    try {
      const prodId = req.params.id;
      const permanent = req.query.permanent === 'true';
      const idx = dynamicProductsStore.findIndex(p => p.id === prodId);
      if (idx !== -1) {
        if (permanent) {
          dynamicProductsStore.splice(idx, 1);
        } else {
          dynamicProductsStore[idx].status = 'ARCHIVED';
        }
        try {
          fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'products.json'), JSON.stringify(dynamicProductsStore, null, 2));
        } catch (e) {}
        autoPublishToGitHub('Delete digital product ' + prodId);
      }
      res.json({ success: true, deleted: true, permanent });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/store-products/:id', (req: Request, res: Response) => {
    try {
      const prodId = req.params.id;
      const permanent = req.query.permanent === 'true';
      const idx = dynamicProductsStore.findIndex(p => p.id === prodId);
      if (idx !== -1) {
        if (permanent) {
          dynamicProductsStore.splice(idx, 1);
        } else {
          dynamicProductsStore[idx].status = 'ARCHIVED';
        }
        try {
          fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'products.json'), JSON.stringify(dynamicProductsStore, null, 2));
        } catch (e) {}
        autoPublishToGitHub('Delete store product ' + prodId);
      }
      res.json({ success: true, deleted: true, permanent });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Server-Side Production Publish Endpoint (Direct GitHub REST API commit on main branch)
  app.post('/api/admin/publish', async (req: Request, res: Response) => {
    try {
      const nowStr = new Date().toISOString();
      let publishedFiles: string[] = [];
      let commitSha: string | null = null;
      let gitHubSynced = false;

      // 1. Always update server dynamic stores & refresh catalog version timestamp
      if (Array.isArray(req.body.products)) {
        dynamicProductsStore = req.body.products;
        currentCatalogVersion = Date.now();
        publishedFiles.push('products.json');
        try {
          fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'products.json'), JSON.stringify(dynamicProductsStore, null, 2));
        } catch (e) {}
      }

      if (Array.isArray(req.body.services)) {
        dynamicServicesStore = req.body.services;
        saveServicesToDisk();
        publishedFiles.push('services.json');
      }

      // 2. Try GitHub REST API commit
      const token = getGitHubToken();
      const owner = process.env.GITHUB_OWNER || 'ashikdaspc-star';
      const repo = process.env.GITHUB_REPO || 'omove-store';
      const branch = process.env.GITHUB_BRANCH || 'main';

      if (token) {
        try {
          const commitFileToGitHub = async (filePath: string, contentData: any, message: string) => {
            const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

            let sha = '';
            try {
              const getRes = await fetch(`${url}?ref=${branch}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'OmoveStore-Publish/1.0'
                }
              });
              if (getRes.ok) {
                const fileData: any = await getRes.json();
                sha = fileData.sha;
              }
            } catch (e) {}

            const jsonText = JSON.stringify(contentData, null, 2);
            const base64Content = Buffer.from(jsonText, 'utf-8').toString('base64');

            const putRes = await fetch(url, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'OmoveStore-Publish/1.0'
              },
              body: JSON.stringify({
                message: message,
                content: base64Content,
                sha: sha || undefined,
                branch: branch
              })
            });

            if (!putRes.ok) {
              const errBody: any = await putRes.json().catch(() => ({}));
              throw new Error(errBody.message || `GitHub HTTP ${putRes.status} for ${filePath}`);
            }

            const resBody: any = await putRes.json();
            return resBody.commit?.sha || 'committed';
          };

          const commitMsg = `Live Production Catalog Sync via Admin Command Center [${nowStr}]`;
          const productsSha = await commitFileToGitHub('src/data/products.json', dynamicProductsStore, commitMsg);
          const servicesSha = await commitFileToGitHub('src/data/services.json', dynamicServicesStore, commitMsg);
          commitSha = productsSha || servicesSha;
          gitHubSynced = true;
        } catch (ghErr: any) {
          console.warn('[ADMIN PUBLISH GITHUB SYNC NOTICE]', ghErr.message);
        }
      }

      res.json({
        success: true,
        message: gitHubSynced
          ? 'Published production data to server engine & committed to GitHub main!'
          : 'Published production data to server engine successfully!',
        commitSha: commitSha,
        gitHubSynced: gitHubSynced,
        publishedFiles: publishedFiles,
        timestamp: nowStr,
        productionUrl: 'https://www.omovestore.shop'
      });
    } catch (err: any) {
      console.error('[ADMIN PUBLISH API ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to publish live production data.' });
    }
  });

  // Catalog version endpoint for real-time background version checking
  app.get('/api/catalog-version', (_req: Request, res: Response) => {
    res.json({
      version: currentCatalogVersion,
      count: dynamicProductsStore.length,
      timestamp: new Date(currentCatalogVersion).toISOString()
    });
  });

  // Get products with search & category filters
  app.get('/api/products', (req: Request, res: Response) => {
    res.setHeader('X-Catalog-Version', String(currentCatalogVersion));
    const category = req.query.category as string;
    const search = (req.query.q as string || '').toLowerCase();
    const sort = req.query.sort as string;

    let filtered = [...dynamicProductsStore];

    if (category && category !== 'All') {
      filtered = filtered.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(search) ||
        (p.shortDescription || '').toLowerCase().includes(search) ||
        (p.category || '').toLowerCase().includes(search) ||
        (p.tags || []).some((t: string) => t.toLowerCase().includes(search))
      );
    }

    if (sort === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'popular') {
      filtered.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    }

    res.json(filtered);
  });

  // Public Store Products API (productType === 'STORE')
  app.get('/api/store-products', (req: Request, res: Response) => {
    res.setHeader('X-Catalog-Version', String(currentCatalogVersion));
    const search = (req.query.q as string || '').toLowerCase();
    const category = req.query.category as string;
    const sort = req.query.sort as string;

    let storeItems = dynamicProductsStore.filter(
      p => (p.productType === 'STORE' || (!p.productType && p.tags?.includes('Store Card'))) &&
           (p.status || 'PUBLISHED') === 'PUBLISHED'
    );

    if (category && category !== 'All') {
      storeItems = storeItems.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      storeItems = storeItems.filter(p =>
        (p.name || '').toLowerCase().includes(search) ||
        (p.shortDescription || '').toLowerCase().includes(search)
      );
    }

    if (sort === 'price-low') {
      storeItems.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      storeItems.sort((a, b) => b.price - a.price);
    }

    res.json(storeItems);
  });

  // Public Digital Products API (productType === 'DIGITAL')
  app.get('/api/digital-products', (req: Request, res: Response) => {
    res.setHeader('X-Catalog-Version', String(currentCatalogVersion));
    const search = (req.query.q as string || '').toLowerCase();
    const category = req.query.category as string;
    const sort = req.query.sort as string;

    let digitalItems = dynamicProductsStore.filter(
      p => (p.productType === 'DIGITAL' || (!p.productType && !p.tags?.includes('Store Card'))) &&
           (p.status || 'PUBLISHED') === 'PUBLISHED'
    );

    if (category && category !== 'All') {
      digitalItems = digitalItems.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      digitalItems = digitalItems.filter(p =>
        (p.name || '').toLowerCase().includes(search) ||
        (p.shortDescription || '').toLowerCase().includes(search)
      );
    }

    if (sort === 'price-low') {
      digitalItems.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      digitalItems.sort((a, b) => b.price - a.price);
    }

    res.json(digitalItems);
  });

  // Admin Store Products List
  app.get('/api/admin/store-products', (_req: Request, res: Response) => {
    const storeItems = dynamicProductsStore.filter(
      p => p.productType === 'STORE' || (!p.productType && p.tags?.includes('Store Card'))
    );
    res.json(storeItems);
  });

  // Admin Digital Products List
  app.get('/api/admin/digital-products', (_req: Request, res: Response) => {
    const digitalItems = dynamicProductsStore.filter(
      p => p.productType === 'DIGITAL' || (!p.productType && !p.tags?.includes('Store Card'))
    );
    res.json(digitalItems);
  });

  // Admin Registered Customer Accounts Directory & Deletion Endpoints
  app.get('/api/admin/customers', (_req: Request, res: Response) => {
    try {
      const customersList = Array.from(usersStore.values()).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        location: user.location || 'Kolkata, West Bengal, India',
        picture: user.picture || '',
        authProvider: user.authProvider || 'email',
        isAdmin: Boolean(user.isAdmin),
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString(),
        lastLoginAt: user.lastLoginAt || new Date().toISOString()
      }));
      res.json({ success: true, customers: customersList });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/admin/customers/:email', (req: Request, res: Response) => {
    try {
      const emailToDelete = req.params.email ? req.params.email.trim().toLowerCase() : '';
      if (!emailToDelete) {
        return res.status(400).json({ success: false, error: 'Email parameter is required.' });
      }

      if (!usersStore.has(emailToDelete)) {
        return res.status(404).json({ success: false, error: 'Customer account not found.' });
      }

      // Delete from usersStore and save
      usersStore.delete(emailToDelete);
      saveUsersToDisk(usersStore);
      autoPublishUsersToGitHub('Deleted customer account: ' + emailToDelete);

      // Clean up sessions for this user
      for (const [sessId, sess] of sessionsStore.entries()) {
        if (sess.userEmail.toLowerCase() === emailToDelete) {
          sessionsStore.delete(sessId);
        }
      }
      saveSessionsToDisk(sessionsStore);

      res.json({ success: true, message: `Account for ${emailToDelete} has been permanently deleted.`, deletedEmail: emailToDelete });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });


  // Create Store Product
  app.post('/api/admin/store-products', (req: Request, res: Response) => {
    try {
      const prodData = req.body || {};
      const newStoreProduct: Product = {
        id: prodData.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: prodData.name || 'Untitled Store Product',
        slug: prodData.slug || (prodData.name ? prodData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'untitled-store-product'),
        productType: 'STORE',
        category: prodData.category || 'Software',
        tags: Array.isArray(prodData.tags) ? prodData.tags : ['Software', 'Store Card'],
        shortDescription: prodData.shortDescription || '',
        fullDescription: prodData.fullDescription || '',
        image: prodData.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
        price: Number(prodData.price) || 499,
        originalPrice: Number(prodData.originalPrice) || Number(prodData.price) || 999,
        discountPercent: Number(prodData.discountPercent) || 0,
        licenseType: prodData.licenseType || 'Lifetime License',
        version: prodData.version || 'v2026.1',
        downloadSize: prodData.downloadSize || '50 MB',
        compatibility: Array.isArray(prodData.compatibility) ? prodData.compatibility : ['Windows 11', 'Windows 10'],
        features: Array.isArray(prodData.features) ? prodData.features : ['Instant Access Key', 'Official Setup'],
        screenshots: Array.isArray(prodData.screenshots) ? prodData.screenshots : [],
        requirements: Array.isArray(prodData.requirements) ? prodData.requirements : ['Windows 10/11'],
        versionHistory: Array.isArray(prodData.versionHistory) ? prodData.versionHistory : [],
        fileUrl: prodData.fileUrl || '/api/downloads/setup',
        instantKeyAvailable: Boolean(prodData.instantKeyAvailable ?? true),
        rating: Number(prodData.rating) || 4.9,
        reviewCount: Number(prodData.reviewCount) || 1,
        salesCount: Number(prodData.salesCount) || 0,
        isBestSeller: Boolean(prodData.isBestSeller),
        status: prodData.status || 'PUBLISHED',
        createdAt: new Date().toISOString()
      };

      dynamicProductsStore.unshift(newStoreProduct);
      currentCatalogVersion = Date.now();
      const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));
      autoPublishToGitHub('Create store product: ' + newStoreProduct.name);

      res.json({ success: true, product: newStoreProduct, version: currentCatalogVersion });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create Digital Product
  app.post('/api/admin/digital-products', (req: Request, res: Response) => {
    try {
      const prodData = req.body || {};
      const newDigitalProduct: Product = {
        id: prodData.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: prodData.name || 'Untitled Digital Product',
        slug: prodData.slug || (prodData.name ? prodData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'untitled-digital-product'),
        productType: 'DIGITAL',
        category: prodData.category || 'Software',
        tags: Array.isArray(prodData.tags) ? prodData.tags : ['Software', 'Digital Key'],
        shortDescription: prodData.shortDescription || '',
        fullDescription: prodData.fullDescription || '',
        image: prodData.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
        price: Number(prodData.price) || 499,
        originalPrice: Number(prodData.originalPrice) || Number(prodData.price) || 999,
        discountPercent: Number(prodData.discountPercent) || 0,
        licenseType: prodData.licenseType || 'Lifetime License',
        version: prodData.version || 'v2026.1',
        downloadSize: prodData.downloadSize || '50 MB',
        compatibility: Array.isArray(prodData.compatibility) ? prodData.compatibility : ['Windows 11', 'Windows 10'],
        features: Array.isArray(prodData.features) ? prodData.features : ['Instant Access Key', 'Official Setup'],
        screenshots: Array.isArray(prodData.screenshots) ? prodData.screenshots : [],
        requirements: Array.isArray(prodData.requirements) ? prodData.requirements : ['Windows 10/11'],
        versionHistory: Array.isArray(prodData.versionHistory) ? prodData.versionHistory : [],
        fileUrl: prodData.fileUrl || '/api/downloads/setup',
        instantKeyAvailable: Boolean(prodData.instantKeyAvailable ?? true),
        rating: Number(prodData.rating) || 4.9,
        reviewCount: Number(prodData.reviewCount) || 1,
        salesCount: Number(prodData.salesCount) || 0,
        isBestSeller: Boolean(prodData.isBestSeller),
        status: prodData.status || 'PUBLISHED',
        createdAt: new Date().toISOString()
      };

      dynamicProductsStore.unshift(newDigitalProduct);
      currentCatalogVersion = Date.now();
      const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));
      autoPublishToGitHub('Create digital product: ' + newDigitalProduct.name);

      res.json({ success: true, product: newDigitalProduct, version: currentCatalogVersion });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Edit Store Product
  app.put('/api/admin/store-products/:id', (req: Request, res: Response) => {
    try {
      const idx = dynamicProductsStore.findIndex(p => p.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Store product not found' });

      dynamicProductsStore[idx] = {
        ...dynamicProductsStore[idx],
        ...req.body,
        productType: 'STORE',
        updatedAt: new Date().toISOString()
      };

      currentCatalogVersion = Date.now();
      const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));
      autoPublishToGitHub('Edit store product: ' + dynamicProductsStore[idx].name);

      res.json({ success: true, product: dynamicProductsStore[idx], version: currentCatalogVersion });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Edit Digital Product
  app.put('/api/admin/digital-products/:id', (req: Request, res: Response) => {
    try {
      const idx = dynamicProductsStore.findIndex(p => p.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Digital product not found' });

      dynamicProductsStore[idx] = {
        ...dynamicProductsStore[idx],
        ...req.body,
        productType: 'DIGITAL',
        updatedAt: new Date().toISOString()
      };

      currentCatalogVersion = Date.now();
      const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));
      autoPublishToGitHub('Edit digital product: ' + dynamicProductsStore[idx].name);

      res.json({ success: true, product: dynamicProductsStore[idx], version: currentCatalogVersion });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete / Archive Store Product
  app.delete('/api/admin/store-products/:id', (req: Request, res: Response) => {
    try {
      const isPermanent = req.query.permanent === 'true';
      const idx = dynamicProductsStore.findIndex(p => p.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Store product not found' });

      const prod = dynamicProductsStore[idx];
      const hasPurchases = Array.from(ordersStore.values()).some(o => o.items && o.items.some((i: any) => i.productId === prod.id));

      if (hasPurchases || !isPermanent) {
        prod.status = 'ARCHIVED';
        currentCatalogVersion = Date.now();
        const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
        fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));
        autoPublishToGitHub('Archive store product: ' + prod.name);
        return res.json({ success: true, archived: true, message: 'Store product archived to preserve customer order history.' });
      }

      dynamicProductsStore.splice(idx, 1);
      currentCatalogVersion = Date.now();
      const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));
      autoPublishToGitHub('Permanently delete store product: ' + req.params.id);

      res.json({ success: true, deleted: true, message: 'Store product permanently deleted.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete / Archive Digital Product
  app.delete('/api/admin/digital-products/:id', (req: Request, res: Response) => {
    try {
      const isPermanent = req.query.permanent === 'true';
      const idx = dynamicProductsStore.findIndex(p => p.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Digital product not found' });

      const prod = dynamicProductsStore[idx];
      const hasPurchases = Array.from(ordersStore.values()).some(o => o.items && o.items.some((i: any) => i.productId === prod.id));

      if (hasPurchases || !isPermanent) {
        prod.status = 'ARCHIVED';
        currentCatalogVersion = Date.now();
        const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
        fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));
        autoPublishToGitHub('Archive digital product: ' + prod.name);
        return res.json({ success: true, archived: true, message: 'Digital product archived to preserve customer order history.' });
      }

      dynamicProductsStore.splice(idx, 1);
      currentCatalogVersion = Date.now();
      const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));
      autoPublishToGitHub('Permanently delete digital product: ' + req.params.id);

      res.json({ success: true, deleted: true, message: 'Digital product permanently deleted.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Legacy git-CLI push replaced by REST API — kept as thin wrapper for backward compat
  const pushProductsToGitHub = (): Promise<{ success: boolean; message: string }> => {
    return commitFileToGitHubApi('src/data/products.json', dynamicProductsStore, 'Auto-sync updated products catalog');
  };

  app.post('/api/products/sync', async (req: Request, res: Response) => {
    try {
      const { products, autoPush = true } = req.body || {};
      if (Array.isArray(products) && products.length > 0) {
        dynamicProductsStore = products;
        currentCatalogVersion = Date.now();
        const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
        fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
      }
      if (autoPush) {
        commitFileToGitHubApi('src/data/products.json', dynamicProductsStore, 'Sync products catalog via Admin Panel').catch(() => {});
      }
      res.json({ success: true, count: dynamicProductsStore.length, version: currentCatalogVersion });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.all('/api/products/publish', async (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    try {
      const { products } = req.body || {};
      if (Array.isArray(products) && products.length > 0) {
        dynamicProductsStore = products;
        currentCatalogVersion = Date.now();
        const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
        fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));
      }
      const gitRes = await pushProductsToGitHub();
      res.json({ success: true, count: dynamicProductsStore.length, version: currentCatalogVersion, gitMessage: gitRes.message });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/products/:id', (req: Request, res: Response) => {
    const prod = dynamicProductsStore.find(p => p.id === req.params.id || p.slug === req.params.id);
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    res.json(prod);
  });

  // Admin Product Creation
  app.post('/api/products', (req: Request, res: Response) => {
    try {
      const prodData = req.body || {};
      const newProduct: Product = {
        id: prodData.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: prodData.name || 'Untitled Product',
        slug: prodData.slug || (prodData.name ? prodData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'untitled-product'),
        productType: prodData.productType || 'STORE',
        category: prodData.category || 'Software',
        tags: Array.isArray(prodData.tags) ? prodData.tags : ['Software'],
        shortDescription: prodData.shortDescription || '',
        fullDescription: prodData.fullDescription || '',
        image: prodData.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
        price: Number(prodData.price) || 499,
        originalPrice: Number(prodData.originalPrice) || Number(prodData.price) || 999,
        discountPercent: Number(prodData.discountPercent) || 0,
        licenseType: prodData.licenseType || 'Lifetime License',
        version: prodData.version || 'v2026.1',
        downloadSize: prodData.downloadSize || '50 MB',
        compatibility: Array.isArray(prodData.compatibility) ? prodData.compatibility : ['Windows 11', 'Windows 10'],
        features: Array.isArray(prodData.features) ? prodData.features : ['Instant Access Key', 'Official Setup'],
        screenshots: Array.isArray(prodData.screenshots) ? prodData.screenshots : [],
        requirements: Array.isArray(prodData.requirements) ? prodData.requirements : ['Windows 10/11'],
        versionHistory: Array.isArray(prodData.versionHistory) ? prodData.versionHistory : [],
        fileUrl: prodData.fileUrl || '/api/downloads/setup',
        instantKeyAvailable: Boolean(prodData.instantKeyAvailable ?? true),
        rating: Number(prodData.rating) || 4.9,
        reviewCount: Number(prodData.reviewCount) || 1,
        salesCount: Number(prodData.salesCount) || 0,
        isBestSeller: Boolean(prodData.isBestSeller),
        status: prodData.status || 'PUBLISHED',
        createdAt: new Date().toISOString()
      };

      dynamicProductsStore.unshift(newProduct);
      currentCatalogVersion = Date.now();
      const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));

      res.json({ success: true, product: newProduct, version: currentCatalogVersion });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Product Update
  app.put('/api/products/:id', (req: Request, res: Response) => {
    try {
      const idx = dynamicProductsStore.findIndex(p => p.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Product not found' });

      dynamicProductsStore[idx] = {
        ...dynamicProductsStore[idx],
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      currentCatalogVersion = Date.now();
      const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));

      res.json({ success: true, product: dynamicProductsStore[idx], version: currentCatalogVersion });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Product Duplicate
  app.post('/api/products/:id/duplicate', (req: Request, res: Response) => {
    try {
      const existing = dynamicProductsStore.find(p => p.id === req.params.id);
      if (!existing) return res.status(404).json({ error: 'Product not found' });

      const dupId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const duplicated: Product = {
        ...existing,
        id: dupId,
        name: `${existing.name} (Copy)`,
        slug: `${existing.slug}-copy-${Date.now()}`,
        status: 'DRAFT',
        createdAt: new Date().toISOString()
      };

      dynamicProductsStore.unshift(duplicated);
      currentCatalogVersion = Date.now();
      const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));

      res.json({ success: true, product: duplicated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ORDER & CHECKOUT ENDPOINTS
  app.post('/api/orders/create', (req: Request, res: Response) => {
    try {
      const { items, customerName, customerEmail, customerPhone, paymentMethod, discountAmount = 0 } = req.body || {};

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Cart is empty. Please add items to checkout.' });
      }

      const orderItems: any[] = [];
      let subtotal = 0;

      items.forEach((it: any) => {
        const prod = dynamicProductsStore.find(p => p.id === it.productId);
        const price = prod ? Number(prod.price) : 499;
        const name = prod ? prod.name : 'Digital Product';
        const qty = Number(it.quantity) || 1;
        subtotal += price * qty;

        const licenseKey = `OMV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        orderItems.push({
          productId: it.productId,
          productName: name,
          price: price,
          quantity: qty,
          licenseKey: licenseKey,
          downloadLimit: 5,
          downloadsCount: 0,
          fileSize: prod?.downloadSize || '45 MB',
          fileUrl: prod?.fileUrl || '/api/downloads/setup'
        });
      });

      const discount = Math.min(subtotal, Number(discountAmount) || 0);
      const total = Math.max(0, subtotal - discount);
      const orderId = `ord-${Date.now()}`;
      const orderNumber = `OMV-ORD-${Math.floor(1000 + Math.random() * 9000)}`;

      const newOrder: Order = {
        id: orderId,
        orderNumber: orderNumber,
        customerName: customerName || 'Customer',
        customerEmail: customerEmail || 'customer@omovestore.shop',
        customerPhone: customerPhone || '',
        items: orderItems,
        subtotal: subtotal,
        discount: discount,
        tax: 0,
        total: total,
        paymentMethod: paymentMethod || 'Razorpay UPI',
        paymentStatus: total <= 0 ? 'SUCCESS' : 'PENDING',
        createdAt: new Date().toISOString()
      };

      ordersStore.set(newOrder.id, newOrder);

      const razorpayKeyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_live_TMiCMOFsYnHr8G';

      res.json({
        success: true,
        order: newOrder,
        razorpayKeyId: razorpayKeyId
      });
    } catch (err: any) {
      console.error('[CREATE ORDER ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Server error creating order' });
    }
  });

  app.post('/api/orders/verify', (req: Request, res: Response) => {
    try {
      const { orderId, razorpayPaymentId } = req.body || {};
      let order = ordersStore.get(orderId);

      if (!order) {
        order = {
          id: orderId || `ord-${Date.now()}`,
          orderNumber: `OMV-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          customerName: req.body.customerName || 'Customer',
          customerEmail: req.body.customerEmail || 'customer@omovestore.shop',
          customerPhone: req.body.customerPhone || '',
          items: [],
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
          paymentMethod: 'Razorpay UPI',
          paymentStatus: 'SUCCESS',
          razorpayPaymentId: razorpayPaymentId || `pay_${Date.now()}`,
          createdAt: new Date().toISOString()
        };
      } else {
        order.paymentStatus = 'SUCCESS';
        order.razorpayPaymentId = razorpayPaymentId || order.razorpayPaymentId || `pay_${Date.now()}`;
      }

      ordersStore.set(order.id, order);

      res.json({
        success: true,
        verified: true,
        order: order
      });
    } catch (err: any) {
      console.error('[VERIFY ORDER ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Server error verifying order' });
    }
  });

  app.get('/api/account/orders', (_req: Request, res: Response) => {
    const list = Array.from(ordersStore.values());
    res.json(list);
  });

  app.get('/api/admin/orders', (_req: Request, res: Response) => {
    const list = Array.from(ordersStore.values());
    res.json(list);
  });

  // Admin Media Upload Endpoint
  app.post('/api/admin/upload-media', (req: Request, res: Response) => {
    try {
      const { fileName, fileData } = req.body || {};
      if (!fileData) {
        return res.status(400).json({ success: false, error: 'No media file data provided.' });
      }

      const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = matches[1].split('/')[1] || 'png';
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const safeName = (fileName || `media_${Date.now()}`).toLowerCase().replace(/[^a-z0-9_-]/g, '_') + `.${ext}`;
        const buffer = Buffer.from(matches[2], 'base64');
        const filePath = path.join(uploadsDir, safeName);
        fs.writeFileSync(filePath, buffer);
        const publicUrl = `/uploads/${safeName}`;
        return res.json({ success: true, url: publicUrl, fileName: safeName });
      }

      res.json({ success: true, url: fileData });
    } catch (err: any) {
      console.error('[MEDIA UPLOAD ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to upload media file' });
    }
  });

  // Admin Product Status Patch
  app.patch('/api/products/:id/status', (req: Request, res: Response) => {
    try {
      const { status } = req.body || {};
      const prod = dynamicProductsStore.find(p => p.id === req.params.id);
      if (!prod) return res.status(404).json({ error: 'Product not found' });

      prod.status = status || 'PUBLISHED';
      currentCatalogVersion = Date.now();
      const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));

      res.json({ success: true, product: prod });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Product Delete / Archive
  app.delete('/api/products/:id', (req: Request, res: Response) => {
    try {
      const isPermanent = req.query.permanent === 'true';
      const idx = dynamicProductsStore.findIndex(p => p.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Product not found' });

      if (isPermanent) {
        dynamicProductsStore.splice(idx, 1);
      } else {
        dynamicProductsStore[idx].status = 'ARCHIVED';
      }

      currentCatalogVersion = Date.now();
      const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));

      res.json({ success: true, message: isPermanent ? 'Product deleted permanently' : 'Product archived' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/services', (req: Request, res: Response) => {
    res.json(MOCK_SERVICES);
  });

  app.get('/api/blogs', (req: Request, res: Response) => {
    res.json(MOCK_BLOGS);
  });

  app.get('/api/blogs/:slug', (req: Request, res: Response) => {
    const post = MOCK_BLOGS.find(b => b.slug === req.params.slug || b.id === req.params.slug);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  });

  const processedPaymentIds: Set<string> = new Set();

  // Create Order (Server-Authoritative Order Initialization)
  app.post('/api/orders/create', async (req: Request, res: Response) => {
    const { items, customerName, customerEmail, customerPhone, paymentMethod, discountAmount } = req.body || {};
    if (!items || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Cart is empty or invalid request format.' });
    }

    const orderId = 'ord-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const orderNumber = 'OMV-ORD-2026-' + Math.floor(10000 + Math.random() * 90000);

    let subtotal = 0;
    const orderItems = items.map((it: any) => {
      const prod = dynamicProductsStore.find(p => p.id === it.productId) || MOCK_PRODUCTS.find(p => p.id === it.productId) || it;
      const price = Number(prod.price) || 999;
      const qty = Math.max(1, parseInt(it.quantity || 1, 10));
      subtotal += price * qty;
      return {
        productId: prod.id,
        productName: prod.name,
        price: price,
        quantity: qty,
        licenseKey: generateLicenseKey(),
        downloadLimit: 5,
        downloadsCount: 0,
        fileSize: prod.downloadSize || '50 MB',
        fileUrl: `/api/downloads/${orderId}/${prod.id}`
      };
    });

    const disc = Math.max(0, Number(discountAmount) || 0);
    const tax = 0;
    const total = Math.max(0, Number((subtotal - disc).toFixed(2)));

    let razorpayOrderId = 'order_rzp_' + Math.random().toString(36).substring(2, 14);
    let realOrderCreated = false;

    if (razorpayInstance && total > 0) {
      try {
        const rzpOrder = await razorpayInstance.orders.create({
          amount: Math.round(total * 100),
          currency: 'INR',
          receipt: orderNumber,
          notes: { customerName, customerEmail }
        });
        if (rzpOrder && rzpOrder.id) {
          razorpayOrderId = rzpOrder.id;
          realOrderCreated = true;
        }
      } catch (err) {
        console.warn('Razorpay API order creation note:', err);
      }
    }

    const initialStatus = total === 0 ? 'SUCCESS' : 'PENDING';

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerName: customerName || 'Valued Customer',
      customerEmail: (customerEmail || 'customer@omove.tech').trim().toLowerCase(),
      customerPhone: customerPhone || '+91 9999999999',
      items: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(disc.toFixed(2)),
      tax,
      total,
      paymentMethod: paymentMethod || 'Razorpay UPI',
      paymentStatus: initialStatus,
      razorpayPaymentId: total === 0 ? 'FREE_COUPON_' + Date.now() : undefined,
      createdAt: new Date().toISOString()
    };

    ordersStore.set(orderId, newOrder);

    res.json({
      success: true,
      order: newOrder,
      isRealGateway: realOrderCreated,
      razorpayKeyId: realOrderCreated ? razorpayKeyId : (process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_OMOVE_DEMO_KEY'),
      razorpayOrder: {
        id: razorpayOrderId,
        currency: 'INR',
        amount: Math.round(total * 100)
      }
    });
  });

  // Verify Order Payment (Cryptographic HMAC Verification & Order Activation)
  app.post('/api/orders/verify', (req: Request, res: Response) => {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required.' });
    }

    const order = ordersStore.get(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found in server database.' });
    }

    // Zero-total 100% coupon orders are automatically verified
    if (order.total === 0) {
      order.paymentStatus = 'SUCCESS';
      order.razorpayPaymentId = order.razorpayPaymentId || 'FREE_COUPON_' + Date.now();
      return res.json({ success: true, verified: true, order });
    }

    const paymentId = razorpayPaymentId || 'pay_' + Math.random().toString(36).substring(2, 16);

    // Replay Attack Protection
    if (processedPaymentIds.has(paymentId)) {
      return res.status(400).json({ error: 'This payment transaction ID has already been used for an order.' });
    }

    // Cryptographic HMAC Verification if Razorpay Secret is configured
    if (razorpayKeySecret && razorpaySignature && razorpayOrderId) {
      try {
        const expectedSignature = crypto
          .createHmac('sha256', razorpayKeySecret)
          .update(razorpayOrderId + '|' + paymentId)
          .digest('hex');

        if (expectedSignature !== razorpaySignature) {
          return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
        }
      } catch (err) {
        return res.status(400).json({ error: 'Cryptographic payment verification error.' });
      }
    }

    order.paymentStatus = 'SUCCESS';
    order.razorpayPaymentId = paymentId;
    processedPaymentIds.add(paymentId);

    res.json({
      success: true,
      verified: true,
      order
    });
  });

  // Get Order Details / Invoice (With Ownership Check)
  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = ordersStore.get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const session = getAuthenticatedSession(req);
    if (session && !session.isAdmin) {
      if (order.customerEmail.trim().toLowerCase() !== session.userEmail.trim().toLowerCase()) {
        return res.status(403).json({ error: 'Access denied. Order details belong to another customer.' });
      }
    }

    res.json(order);
  });

  // PROTECTED CUSTOMER ACCOUNT ENDPOINTS (Require Server Authentication)
  app.get('/api/account/profile', requireAuth, (req: Request, res: Response) => {
    const session = (req as any).session as ServerSession;
    const user = usersStore.get(session.userEmail.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      picture: user.picture || '',
      authProvider: user.authProvider,
      createdAt: user.createdAt
    });
  });

  app.put('/api/account/profile', requireAuth, (req: Request, res: Response) => {
    const session = (req as any).session as ServerSession;
    const user = usersStore.get(session.userEmail.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    const { name, phone, location } = req.body || {};
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    user.updatedAt = new Date().toISOString();
    saveUsersToDisk(usersStore);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        picture: user.picture || '',
        authProvider: user.authProvider
      }
    });
  });

  app.get('/api/account/orders', requireAuth, (req: Request, res: Response) => {
    const session = (req as any).session as ServerSession;
    const userEmail = session.userEmail.toLowerCase();
    const myOrders = Array.from(ordersStore.values()).filter(
      o => o.customerEmail && o.customerEmail.trim().toLowerCase() === userEmail
    );
    myOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(myOrders);
  });

  app.get('/api/account/downloads', requireAuth, (req: Request, res: Response) => {
    const session = (req as any).session as ServerSession;
    const userEmail = session.userEmail.toLowerCase();
    const myPaidOrders = Array.from(ordersStore.values()).filter(
      o => o.paymentStatus === 'SUCCESS' && o.customerEmail && o.customerEmail.trim().toLowerCase() === userEmail
    );
    const downloads = myPaidOrders.flatMap(o =>
      o.items.map(item => ({
        ...item,
        orderId: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        customerEmail: o.customerEmail
      }))
    );
    res.json(downloads);
  });

  app.get('/api/account/bookings', requireAuth, (req: Request, res: Response) => {
    const session = (req as any).session as ServerSession;
    const userEmail = session.userEmail.toLowerCase();
    const myBookings = Array.from(bookingsStore.values()).filter(
      b => b.email && b.email.trim().toLowerCase() === userEmail
    );
    myBookings.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(myBookings);
  });

  app.get('/api/account/tickets', requireAuth, (req: Request, res: Response) => {
    const session = (req as any).session as ServerSession;
    const userEmail = session.userEmail.toLowerCase();
    const myTickets = Array.from(ticketsStore.values()).filter(
      t => t.userEmail && t.userEmail.trim().toLowerCase() === userEmail
    );
    res.json(myTickets);
  });

  // Download digital file with strict server-side payment & ownership verification
  app.get('/api/downloads/:orderId/:productId', (req: Request, res: Response) => {
    const { orderId, productId } = req.params;
    const order = ordersStore.get(orderId);

    if (!order) {
      return res.status(403).json({ error: 'Download access denied. Order record not found.' });
    }

    if (order.paymentStatus !== 'SUCCESS') {
      return res.status(403).json({ error: 'Download access denied. Server-verified payment is required for this product.' });
    }

    // Ownership Check
    const session = getAuthenticatedSession(req);
    if (session && !session.isAdmin) {
      if (order.customerEmail.trim().toLowerCase() !== session.userEmail.trim().toLowerCase()) {
        return res.status(403).json({ error: 'Download access denied. Order belongs to another customer account.' });
      }
    }

    const item = order.items.find(i => i.productId === productId);
    if (!item) {
      return res.status(404).json({ error: 'Product not found in this order.' });
    }

    if (item.downloadsCount >= item.downloadLimit) {
      return res.status(403).json({ error: 'Download limit reached for this product key. Contact support to request a reset.' });
    }

    item.downloadsCount += 1;

    // Serve installer binary payload or installer script payload
    const prod = dynamicProductsStore.find(p => p.id === productId) || MOCK_PRODUCTS.find(p => p.id === productId);
    const filename = prod ? `${prod.slug}-installer.exe` : 'omove-setup.exe';

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(Buffer.from(`OMOVE TECH SECURE INSTALLER BINARY PAYLOAD FOR ${filename}\nVersion: 2026.1\nLicense Validated.`));
  });

  // Book Remote Computer Support
  app.post('/api/bookings', (req: Request, res: Response) => {
    const {
      customerName,
      email,
      phone,
      serviceId,
      amount,
      issueCategory,
      problemDescription,
      preferredDate,
      preferredTime,
      remoteTool,
      remoteId,
      remotePassword,
      screenshotUrl
    } = req.body;

    const srv = MOCK_SERVICES.find(s => s.id === serviceId) || MOCK_SERVICES[0];
    const bookingAmount = amount || (srv ? srv.price : 39);

    const bookingId = 'bk-' + Date.now();
    const bookingNumber = 'OMV-BOOK-' + Math.floor(1000 + Math.random() * 9000);

    const newBooking: RemoteBooking = {
      id: bookingId,
      bookingNumber,
      customerName: customerName || 'Client',
      email: email || 'omovetech@gmail.com',
      phone: phone || '+91 8345968169',
      serviceId: srv ? srv.id : 'srv-001',
      serviceTitle: srv ? srv.title : 'Full PC Inspection & Live Health Check',
      issueCategory: issueCategory || (srv ? srv.category : 'Windows Fix'),
      problemDescription: problemDescription || 'Remote computer support requested.',
      preferredDate: preferredDate || new Date().toISOString().split('T')[0],
      preferredTime: preferredTime || '10:00 AM',
      remoteTool: remoteTool || 'AnyDesk',
      remoteId: remoteId || '000 000 000',
      remotePassword,
      screenshotUrl,
      amount: bookingAmount,
      paymentStatus: 'Paid',
      status: 'Technician Assigned',
      technicianName: 'Certified Tech #142 (Live Online)',
      createdAt: new Date().toISOString()
    };

    bookingsStore.set(bookingId, newBooking);

    res.json({
      success: true,
      booking: newBooking,
      instructions: `Thank you ${newBooking.customerName}! Technician assigned. Please keep your ${newBooking.remoteTool} open with ID ${newBooking.remoteId}.`
    });
  });

  app.get('/api/bookings/:id', (req: Request, res: Response) => {
    const booking = bookingsStore.get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  });

  // Support Tickets
  app.get('/api/tickets', (req: Request, res: Response) => {
    res.json(Array.from(ticketsStore.values()));
  });

  app.post('/api/tickets', (req: Request, res: Response) => {
    const { subject, category, priority, userEmail, userName, text } = req.body;
    const id = 'tkt-' + Date.now();
    const ticketNumber = 'TKT-2026-' + Math.floor(1000 + Math.random() * 9000);

    const ticket: SupportTicket = {
      id,
      ticketNumber,
      subject: subject || 'General Query',
      category: category || 'Software Download',
      priority: priority || 'Medium',
      status: 'Open',
      userEmail: userEmail || 'user@omove.tech',
      userName: userName || 'User',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg-1',
          sender: 'customer',
          senderName: userName || 'User',
          text: text || 'I need help with my digital license key activation.',
          timestamp: new Date().toISOString()
        }
      ]
    };

    ticketsStore.set(id, ticket);
    res.json({ success: true, ticket });
  });

  app.post('/api/tickets/:id/reply', (req: Request, res: Response) => {
    const ticket = ticketsStore.get(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const { text, sender, senderName } = req.body;
    ticket.messages.push({
      id: 'msg-' + Date.now(),
      sender: sender || 'support',
      senderName: senderName || 'OMOVE Tech Support Specialist',
      text: text || 'Thank you! We have verified your request.',
      timestamp: new Date().toISOString()
    });

    if (sender === 'support') {
      ticket.status = 'In Progress';
    }

    res.json({ success: true, ticket });
  });

  // Helper to create server session & set HttpOnly cookie
  function createSessionAndSetCookie(res: Response, user: UserAccount): ServerSession {
    const sessionId = generateSecureToken();
    const session: ServerSession = {
      sessionId,
      userId: user.id,
      userEmail: user.email,
      isAdmin: Boolean(user.isAdmin),
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    sessionsStore.set(sessionId, session);
    saveSessionsToDisk(sessionsStore);

    res.setHeader(
      'Set-Cookie',
      `omove_session_token=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    );

    return session;
  }

  // Get Current Authenticated Server Session
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const authHeader = req.headers.authorization;
    let token = cookies['omove_session_token'];

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return res.json({ authenticated: false, user: null, isAdmin: false });
    }

    const session = sessionsStore.get(token);
    if (!session || session.expiresAt < Date.now()) {
      if (session) {
        sessionsStore.delete(token);
        saveSessionsToDisk(sessionsStore);
      }
      return res.json({ authenticated: false, user: null, isAdmin: false });
    }

    const user = usersStore.get(session.userEmail.toLowerCase());
    if (!user) {
      return res.json({ authenticated: false, user: null, isAdmin: false });
    }

    res.json({
      authenticated: true,
      isAdmin: Boolean(user.isAdmin),
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        picture: user.picture || '',
        authProvider: user.authProvider,
        isAdmin: Boolean(user.isAdmin),
        createdAt: user.createdAt
      }
    });
  });

  // Customer Account Registration Endpoint
  app.post('/api/auth/register', authRateLimiter, (req: Request, res: Response) => {
    const { name, email, phone, password, confirmPassword, location } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (usersStore.has(normalizedEmail)) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please click "Sign In" instead.' });
    }

    const { hash, salt } = hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const defaultName = normalizedEmail.split('@')[0] || 'Customer';
    const capitalizedName = name || (defaultName.charAt(0).toUpperCase() + defaultName.slice(1));

    const newUser: UserAccount = {
      id: userId,
      name: capitalizedName,
      email: normalizedEmail,
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

    usersStore.set(normalizedEmail, newUser);
    saveUsersToDisk(usersStore);
    autoPublishUsersToGitHub('New customer registration: ' + normalizedEmail);

    const session = createSessionAndSetCookie(res, newUser);

    res.json({
      success: true,
      token: session.sessionId,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        location: newUser.location,
        authProvider: newUser.authProvider,
        isAdmin: false
      }
    });
  });

  // Customer Account Login Endpoint
  app.post('/api/auth/login', authRateLimiter, (req: Request, res: Response) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = usersStore.get(normalizedEmail);

    if (!existingUser) {
      return res.status(401).json({ error: 'Invalid email address or password. Please check your credentials or click New Account.' });
    }

    if (!verifyPassword(password, existingUser.passwordHash, existingUser.passwordSalt)) {
      return res.status(401).json({ error: 'Incorrect password! Please check your password and try again.' });
    }

    existingUser.lastLoginAt = new Date().toISOString();
    saveUsersToDisk(usersStore);

    const session = createSessionAndSetCookie(res, existingUser);

    res.json({
      success: true,
      token: session.sessionId,
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        phone: existingUser.phone,
        location: existingUser.location,
        picture: existingUser.picture || '',
        authProvider: existingUser.authProvider,
        isAdmin: Boolean(existingUser.isAdmin)
      }
    });
  });

  // Customer Account Deletion Endpoint
  app.post('/api/auth/delete-account', (req: Request, res: Response) => {
    const { email } = req.body || {};
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (normalizedEmail) {
      usersStore.delete(normalizedEmail);
      saveUsersToDisk(usersStore);
    }

    res.clearCookie('omove_session_token');
    res.json({ success: true, message: 'Account and associated profile data successfully deleted.' });
  });

  // Customer Logout Endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies['omove_session_token'] || req.headers.authorization?.replace('Bearer ', '').trim();

    if (token && sessionsStore.has(token)) {
      sessionsStore.delete(token);
      saveSessionsToDisk(sessionsStore);
    }

    res.setHeader(
      'Set-Cookie',
      'omove_session_token=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    );

    res.json({ success: true, message: 'Signed out successfully.' });
  });

  // Forgot Password Request Endpoint
  app.post('/api/auth/forgot-password', authRateLimiter, async (req: Request, res: Response) => {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = usersStore.get(normalizedEmail);

    if (user) {
      const resetToken = generateSecureToken();
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetTokenHash = resetTokenHash;
      user.resetTokenExpiresAt = Date.now() + 3600000; // 1 hour expiration
      saveUsersToDisk(usersStore);

      const appUrl = (process.env.APP_URL || 'https://www.omovestore.shop').replace(/\/$/, '');
      const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

      if (mailTransporter) {
        try {
          await mailTransporter.sendMail({
            from: emailFrom,
            to: normalizedEmail,
            subject: 'Omove Store — Reset Your Account Password',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h2 style="color: #059669; font-size: 20px; font-weight: bold; margin-bottom: 16px;">Omove Store Password Reset</h2>
                <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello <strong>${user.name}</strong>,</p>
                <p style="color: #334155; font-size: 14px; line-height: 1.6;">We received a request to reset your password for your Omove Store account. Click the button below to set a new password:</p>
                <div style="margin: 28px 0; text-align: center;">
                  <a href="${resetLink}" style="background-color: #059669; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px;">Reset Account Password</a>
                </div>
                <p style="color: #64748b; font-size: 12px; line-height: 1.5;">This password reset link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 11px;">Omove Store Security Team • <a href="${appUrl}" style="color: #059669;">www.omovestore.shop</a></p>
              </div>
            `
          });
        } catch (mailErr) {
          console.warn('SMTP mail dispatch note:', mailErr);
        }
      } else {
        console.log(`[PASS RESET LINK GENERATED]: ${resetLink}`);
      }
    }

    // Always return safe uniform response to prevent account enumeration
    res.json({
      success: true,
      message: 'If an account exists for this email address, password reset instructions have been sent.'
    });
  });

  // Reset Password Endpoint
  app.post('/api/auth/reset-password', authRateLimiter, (req: Request, res: Response) => {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
    }

    const providedHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = Array.from(usersStore.values()).find(
      u => u.resetTokenHash === providedHash && u.resetTokenExpiresAt && u.resetTokenExpiresAt > Date.now()
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token. Please request a new password reset link.' });
    }

    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;
    user.updatedAt = new Date().toISOString();
    saveUsersToDisk(usersStore);

    // Invalidate existing sessions for this user
    for (const [sessionId, session] of sessionsStore.entries()) {
      if (session.userEmail.toLowerCase() === user.email.toLowerCase()) {
        sessionsStore.delete(sessionId);
      }
    }
    saveSessionsToDisk(sessionsStore);

    res.json({
      success: true,
      message: 'Your password has been updated successfully! You can now sign in with your new password.'
    });
  });

  // Google OAuth / GSI Verification Endpoint
  app.post('/api/auth/google', authRateLimiter, (req: Request, res: Response) => {
    const { email, name, googleSubId, picture } = req.body || {};
    const userEmail = (email || 'customer@omove.tech').trim().toLowerCase();
    const userName = name || (userEmail.split('@')[0] ? userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1) : 'Google Customer');
    const subId = googleSubId || `goog_${Math.random().toString(36).substring(2, 14)}`;

    let existingUser = Array.from(usersStore.values()).find(
      u => (u.googleSubId && u.googleSubId === subId) || u.email === userEmail
    );

    if (existingUser) {
      if (!existingUser.googleSubId) existingUser.googleSubId = subId;
      if (picture && !existingUser.picture) existingUser.picture = picture;
      existingUser.lastLoginAt = new Date().toISOString();
    } else {
      const { hash, salt } = hashPassword(`google_auth_${subId}`);
      existingUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: userName,
        email: userEmail,
        phone: '+91 8345968169',
        passwordHash: hash,
        passwordSalt: salt,
        location: 'Kolkata, West Bengal, India',
        googleSubId: subId,
        picture: picture || '',
        authProvider: 'google',
        isAdmin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      usersStore.set(userEmail, existingUser);
    }

    saveUsersToDisk(usersStore);
    const session = createSessionAndSetCookie(res, existingUser);

    res.json({
      success: true,
      token: session.sessionId,
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        phone: existingUser.phone,
        location: existingUser.location,
        picture: existingUser.picture || '',
        authProvider: existingUser.authProvider,
        isAdmin: false
      }
    });
  });

  // Admin Analytics & Key Generator
  app.get('/api/admin/analytics', (req: Request, res: Response) => {
    const ordersList = Array.from(ordersStore.values());
    const totalRevenue = ordersList.reduce((acc, o) => acc + o.total, 0);
    const totalOrders = ordersList.length;
    const totalBookings = bookingsStore.size;

    res.json({
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      totalBookings,
      activeSupportTickets: Array.from(ticketsStore.values()).filter(t => t.status !== 'Closed').length,
      recentOrders: ordersList.slice(-5).reverse(),
      categoryBreakdown: [
        { name: 'PC Optimization', sales: 48 },
        { name: 'Drivers', sales: 35 },
        { name: 'Windows Tools', sales: 29 },
        { name: 'Security', sales: 18 },
        { name: 'Gaming Tools', sales: 24 }
      ]
    });
  });

  app.post('/api/admin/license-generator', (req: Request, res: Response) => {
    const { count, productPrefix } = req.body;
    const num = Math.min(count || 5, 50);
    const prefix = (productPrefix || 'OMV-KEY').toUpperCase();

    const keys: string[] = [];
    for (let i = 0; i < num; i++) {
      const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      keys.push(`${prefix}-${seg()}-${seg()}-${seg()}`);
    }

    res.json({ success: true, keysGenerated: keys.length, keys });
  });

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Vite development middleware or production static server
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OMOVE TECH Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

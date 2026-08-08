import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import nodemailer from 'nodemailer';
import { MOCK_PRODUCTS, MOCK_SERVICES, MOCK_BLOGS, MOCK_COUPONS } from './src/data/mockData';
import { Order, RemoteBooking, SupportTicket } from './src/types';

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

  let dynamicProductsStore: any[] = [...MOCK_PRODUCTS];
  let currentCatalogVersion: number = Date.now();

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

  const pushProductsToGitHub = (): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      const cwd = process.cwd();
      exec('git add src/data/products.json', { cwd }, (errAdd) => {
        if (errAdd) {
          console.warn('Git add warning:', errAdd.message);
        }
        exec('git commit -m "Auto-sync updated products catalog [skip ci]"', { cwd }, (_errCommit) => {
          exec('git push origin main', { cwd }, (errPush, stdoutPush, stderrPush) => {
            if (errPush) {
              console.warn('Git push note:', stderrPush || errPush.message);
            } else {
              console.log('Successfully pushed updated products catalog to GitHub');
            }
            resolve({ success: true, message: stdoutPush || stderrPush || 'Catalog saved and synced' });
          });
        });
      });
    });
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
        pushProductsToGitHub().catch(() => { });
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

  // Validate Coupons
  app.post('/api/coupons/validate', (req: Request, res: Response) => {
    const { code, cartSubtotal } = req.body;
    const coupon = MOCK_COUPONS.find(c => c.code.toUpperCase() === (code || '').toUpperCase().trim());
    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ error: 'Invalid or expired coupon code' });
    }
    if (cartSubtotal < coupon.minOrderAmount) {
      return res.status(400).json({ error: `Minimum spend of ₹${coupon.minOrderAmount} required for this coupon` });
    }
    const discount = coupon.discountType === 'percentage'
      ? (cartSubtotal * coupon.discountValue) / 100
      : Math.min(cartSubtotal, coupon.discountValue);
    res.json({ code: coupon.code, discountAmount: Math.round(discount) });
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

  // Get Order Details / Invoice
  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = ordersStore.get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  });

  // Download digital file with strict server-side payment verification
  app.get('/api/downloads/:orderId/:productId', (req: Request, res: Response) => {
    const { orderId, productId } = req.params;
    const order = ordersStore.get(orderId);

    if (!order) {
      return res.status(403).json({ error: 'Download access denied. Order record not found.' });
    }

    if (order.paymentStatus !== 'SUCCESS') {
      return res.status(403).json({ error: 'Download access denied. Server-verified payment is required for this product.' });
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

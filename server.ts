import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import { createServer as createViteServer } from 'vite';
import { MOCK_PRODUCTS, MOCK_SERVICES, MOCK_BLOGS, MOCK_COUPONS } from './src/data/mockData';
import { Order, RemoteBooking, SupportTicket } from './src/types';

dotenv.config();

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
const usersStore: Map<string, { name: string; email: string; phone: string; password: string; location: string }> = new Map();

// Pre-register official demo account: Ashik Das / omovetech@gmail.com / omove2026
usersStore.set('omovetech@gmail.com', {
  name: 'Ashik Das',
  email: 'omovetech@gmail.com',
  phone: '+91 8345968169',
  password: 'omove2026',
  location: 'Kolkata, West Bengal, India'
});

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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API ROUTES
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'OMOVE TECH Engine', time: new Date().toISOString() });
  });

  let dynamicProductsStore: any[] = [...MOCK_PRODUCTS];

  // Get products with search & category filters
  app.get('/api/products', (req: Request, res: Response) => {
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
        const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
        fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
      }
      if (autoPush) {
        pushProductsToGitHub().catch(() => {});
      }
      res.json({ success: true, count: dynamicProductsStore.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/products/publish', async (req: Request, res: Response) => {
    try {
      const { products } = req.body || {};
      if (Array.isArray(products) && products.length > 0) {
        dynamicProductsStore = products;
      }
      const filePath = path.join(process.cwd(), 'src', 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(dynamicProductsStore, null, 2));
      const gitRes = await pushProductsToGitHub();
      res.json({ success: true, count: dynamicProductsStore.length, gitMessage: gitRes.message });
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

  // Create Order (Razorpay Order creation & store registration)
  app.post('/api/orders/create', async (req: Request, res: Response) => {
    const { items, customerName, customerEmail, customerPhone, paymentMethod, discountAmount } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    let subtotal = 0;
    const orderItems = items.map((it: any) => {
      const prod = MOCK_PRODUCTS.find(p => p.id === it.productId) || it;
      const price = prod.price || 999;
      subtotal += price;
      return {
        productId: prod.id,
        productName: prod.name,
        price: price,
        licenseKey: generateLicenseKey(),
        downloadLimit: 5,
        downloadsCount: 0,
        fileSize: prod.downloadSize || '50 MB',
        fileUrl: `/api/downloads/ORD-${Date.now()}/${prod.id}`
      };
    });

    const disc = discountAmount || 0;
    const tax = 0;
    const total = Math.max(0, Number((subtotal - disc).toFixed(2)));

    const orderId = 'ord-' + Date.now();
    const orderNumber = 'OMV-ORD-2026-' + Math.floor(1000 + Math.random() * 9000);
    let razorpayOrderId = 'order_rzp_' + Math.random().toString(36).substring(2, 12);
    let realOrderCreated = false;

    if (razorpayInstance) {
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
        console.warn('Razorpay API order creation failed, falling back to interactive demo mode:', err);
      }
    }

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerName: customerName || 'Valued Customer',
      customerEmail: customerEmail || 'customer@omove.tech',
      customerPhone: customerPhone || '+91 9999999999',
      items: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(disc.toFixed(2)),
      tax,
      total,
      paymentMethod: paymentMethod || 'Razorpay UPI',
      paymentStatus: 'SUCCESS',
      razorpayPaymentId: 'pay_' + Math.random().toString(36).substring(2, 16),
      createdAt: new Date().toISOString()
    };

    ordersStore.set(orderId, newOrder);

    res.json({
      success: true,
      order: newOrder,
      isMock: !realOrderCreated,
      razorpayKeyId: realOrderCreated ? razorpayKeyId : 'rzp_test_OMOVE_DEMO_KEY',
      razorpayOrder: {
        id: razorpayOrderId,
        currency: 'INR',
        amount: Math.round(total * 100) // INR in paise for Razorpay
      }
    });
  });

  // Get Order Details / Invoice
  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = ordersStore.get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  });

  // Download digital file with counter enforcement
  app.get('/api/downloads/:orderId/:productId', (req: Request, res: Response) => {
    const { orderId, productId } = req.params;
    const order = ordersStore.get(orderId);

    if (order) {
      const item = order.items.find(i => i.productId === productId);
      if (item) {
        if (item.downloadsCount >= item.downloadLimit) {
          return res.status(403).json({ error: 'Download limit reached for this key. Contact support to request reset.' });
        }
        item.downloadsCount += 1;
      }
    }

    // Serve installer binary payload or installer script payload
    const prod = MOCK_PRODUCTS.find(p => p.id === productId);
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

  // Customer Account Registration Endpoint
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, phone, password, location } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (usersStore.has(normalizedEmail)) {
      return res.status(400).json({ error: 'An account with this email already exists! Please click "Sign In" instead.' });
    }

    const newUser = {
      name: name || 'Customer',
      email: normalizedEmail,
      phone: phone || '+91 8345968169',
      password: password,
      location: location || 'Kolkata, West Bengal, India'
    };

    usersStore.set(normalizedEmail, newUser);

    res.json({
      success: true,
      user: {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        location: newUser.location
      }
    });
  });

  // Customer Account Login Endpoint
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = usersStore.get(normalizedEmail);

    if (!existingUser) {
      return res.status(404).json({ error: 'Account not found! You must click "New Account" to register first.' });
    }

    if (existingUser.password !== password) {
      return res.status(401).json({ error: 'Incorrect password! Please check your password and try again.' });
    }

    res.json({
      success: true,
      user: {
        name: existingUser.name,
        email: existingUser.email,
        phone: existingUser.phone,
        location: existingUser.location
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

  // Vite development middleware or production static server
  if (process.env.NODE_ENV !== 'production') {
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

startServer();

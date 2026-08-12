import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'omove.sqlite');
const SCHEMA_PATH = path.join(process.cwd(), 'scripts', 'schema.sql');

export function runMigration() {
  console.log('=== STARTING REPEATABLE D1 / SQLITE MIGRATION ===\n');

  const db = new DatabaseSync(DB_PATH);

  // 1. Apply Schema
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schemaSql);
  console.log('✓ D1 Database schema & indexes applied successfully.');

  let migratedUsers = 0;
  let migratedSessions = 0;
  let migratedOrders = 0;
  let migratedOrderItems = 0;
  let migratedBookings = 0;
  let migratedCoupons = 0;

  // 2. Migrate Users
  const usersPath = path.join(process.cwd(), 'src', 'data', 'users.json');
  if (fs.existsSync(usersPath)) {
    const users: any[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO users (
        id, name, email, phone, password_hash, password_salt, location,
        google_sub_id, picture, auth_provider, is_admin, created_at, updated_at, last_login_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const u of users) {
      stmt.run(
        u.id,
        u.name || 'Customer',
        (u.email || '').toLowerCase().trim(),
        u.phone || '',
        u.passwordHash || '',
        u.passwordSalt || '',
        u.location || 'Kolkata, West Bengal, India',
        u.googleSubId || null,
        u.picture || '',
        u.authProvider || 'email',
        u.isAdmin ? 1 : 0,
        u.createdAt || new Date().toISOString(),
        u.updatedAt || new Date().toISOString(),
        u.lastLoginAt || new Date().toISOString()
      );
      migratedUsers++;
    }
  }

  // 3. Migrate Sessions
  const sessionsPath = path.join(process.cwd(), 'src', 'data', 'sessions.json');
  if (fs.existsSync(sessionsPath)) {
    const sessions: any[] = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO sessions (
        session_id, user_id, user_email, is_admin, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const s of sessions) {
      stmt.run(
        s.sessionId,
        s.userId,
        (s.userEmail || '').toLowerCase().trim(),
        s.isAdmin ? 1 : 0,
        s.createdAt || new Date().toISOString(),
        s.expiresAt || Date.now() + 30 * 24 * 3600 * 1000
      );
      migratedSessions++;
    }
  }

  // 4. Migrate Orders & Order Items
  const ordersPath = path.join(process.cwd(), 'src', 'data', 'orders.json');
  if (fs.existsSync(ordersPath)) {
    const orders: any[] = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
    const orderStmt = db.prepare(`
      INSERT OR REPLACE INTO orders (
        id, order_number, razorpay_order_id, razorpay_payment_id, customer_name,
        customer_email, customer_phone, subtotal, discount, coupon_code, tax,
        total, total_amount, payment_method, payment_status, status, payment_verified_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const itemStmt = db.prepare(`
      INSERT OR REPLACE INTO order_items (
        id, order_id, product_id, product_name, price, quantity,
        file_size, file_url, google_drive_url, license_key, download_limit, downloads_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const o of orders) {
      orderStmt.run(
        o.id,
        o.orderNumber || `OMV-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        o.razorpayOrderId || null,
        o.razorpayPaymentId || o.paymentId || null,
        o.customerName || 'Customer',
        (o.customerEmail || '').toLowerCase().trim(),
        o.customerPhone || '',
        Number(o.subtotal || o.total || 0),
        Number(o.discount || 0),
        o.couponCode || '',
        Number(o.tax || 0),
        Number(o.total || o.totalAmount || 0),
        Number(o.totalAmount || o.total || 0),
        o.paymentMethod || 'Razorpay UPI',
        o.paymentStatus || 'PENDING',
        o.status || 'pending',
        o.paymentVerifiedAt || null,
        o.createdAt || new Date().toISOString(),
        o.updatedAt || o.createdAt || new Date().toISOString()
      );
      migratedOrders++;

      if (Array.isArray(o.items)) {
        let itemIndex = 0;
        for (const item of o.items) {
          itemIndex++;
          const itemId = `${o.id}_item_${itemIndex}`;
          itemStmt.run(
            itemId,
            o.id,
            item.productId || `prod_${itemIndex}`,
            item.productName || 'Product',
            Number(item.price || 0),
            Number(item.quantity || 1),
            item.fileSize || '50 MB',
            item.fileUrl || '/api/downloads/setup',
            item.googleDriveUrl || item.fileUrl || '',
            item.licenseKey || '',
            Number(item.downloadLimit || 5),
            Number(item.downloadsCount || 0)
          );
          migratedOrderItems++;
        }
      }
    }
  }

  // 5. Migrate Bookings
  const bookingsPath = path.join(process.cwd(), 'src', 'data', 'bookings.json');
  if (fs.existsSync(bookingsPath)) {
    const bookings: any[] = JSON.parse(fs.readFileSync(bookingsPath, 'utf-8'));
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO bookings (
        id, booking_number, customer_name, email, phone, service_id, service_title,
        issue_category, problem_description, preferred_date, preferred_time, remote_tool,
        remote_id, remote_password, amount, payment_status, status, technician_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const b of bookings) {
      stmt.run(
        b.id,
        b.bookingNumber || `OMV-BOOK-${Math.floor(1000 + Math.random() * 9000)}`,
        b.customerName || 'Customer',
        (b.email || '').toLowerCase().trim(),
        b.phone || '',
        b.serviceId || 'srv-001',
        b.serviceTitle || 'Remote PC Support',
        b.issueCategory || 'Windows Fix',
        b.problemDescription || '',
        b.preferredDate || '',
        b.preferredTime || '',
        b.remoteTool || 'AnyDesk',
        b.remoteId || '',
        b.remotePassword || '',
        Number(b.amount || 0),
        b.paymentStatus || 'Paid',
        b.status || 'Pending',
        b.technicianName || 'David Chen (Cert #8821)',
        b.createdAt || new Date().toISOString()
      );
      migratedBookings++;
    }
  }

  // 6. Migrate Coupon Usages
  const couponsPath = path.join(process.cwd(), 'src', 'data', 'coupons.json');
  if (fs.existsSync(couponsPath)) {
    const coupons: any[] = JSON.parse(fs.readFileSync(couponsPath, 'utf-8'));
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO coupon_usages (
        id, coupon_code, coupon_id, user_email, order_id, used_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const c of coupons) {
      if (c.usageCount && c.usageCount > 0) {
        for (let i = 0; i < Math.min(c.usageCount, 10); i++) {
          const usageId = `usg_${c.id}_${i}`;
          stmt.run(
            usageId,
            c.code,
            c.id,
            'system_migrated@omovestore.shop',
            null,
            new Date().toISOString()
          );
          migratedCoupons++;
        }
      }
    }
  }

  // Validation Check
  const usersCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as any).cnt;
  const ordersCount = (db.prepare('SELECT COUNT(*) as cnt FROM orders').get() as any).cnt;
  const itemsCount = (db.prepare('SELECT COUNT(*) as cnt FROM order_items').get() as any).cnt;
  const bookingsCount = (db.prepare('SELECT COUNT(*) as cnt FROM bookings').get() as any).cnt;

  console.log('\n=== MIGRATION SUMMARY REPORT ===');
  console.log(`Users:       JSON (${migratedUsers}) ──► D1 (${usersCount})`);
  console.log(`Sessions:    JSON (${migratedSessions}) ──► D1`);
  console.log(`Orders:      JSON (${migratedOrders}) ──► D1 (${ordersCount})`);
  console.log(`Order Items: JSON (${migratedOrderItems}) ──► D1 (${itemsCount})`);
  console.log(`Bookings:    JSON (${migratedBookings}) ──► D1 (${bookingsCount})`);
  console.log(`Coupons Usages: D1 (${migratedCoupons})`);
  console.log('=================================\n');

  db.close();
}

if (process.argv[1] && process.argv[1].includes('migrate-json-to-d1')) {
  runMigration();
}

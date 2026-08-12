import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const sqlPath = path.join(process.cwd(), 'scripts', 'remote-seed.sql');

let sqlStatements: string[] = [];

// 1. Users
const usersPath = path.join(process.cwd(), 'src', 'data', 'users.json');
if (fs.existsSync(usersPath)) {
  const users: any[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  for (const u of users) {
    const id = u.id.replace(/'/g, "''");
    const name = (u.name || 'Customer').replace(/'/g, "''");
    const email = (u.email || '').toLowerCase().trim().replace(/'/g, "''");
    const phone = (u.phone || '').replace(/'/g, "''");
    const pwdHash = (u.passwordHash || '').replace(/'/g, "''");
    const pwdSalt = (u.passwordSalt || '').replace(/'/g, "''");
    const location = (u.location || 'Kolkata, West Bengal, India').replace(/'/g, "''");
    const googleSubId = u.googleSubId ? `'${u.googleSubId.replace(/'/g, "''")}'` : 'NULL';
    const picture = (u.picture || '').replace(/'/g, "''");
    const authProvider = (u.authProvider || 'email').replace(/'/g, "''");
    const isAdmin = u.isAdmin ? 1 : 0;
    const createdAt = u.createdAt || new Date().toISOString();
    const updatedAt = u.updatedAt || new Date().toISOString();
    const lastLoginAt = u.lastLoginAt || new Date().toISOString();

    sqlStatements.push(`INSERT OR REPLACE INTO users (id, name, email, phone, password_hash, password_salt, location, google_sub_id, picture, auth_provider, is_admin, created_at, updated_at, last_login_at) VALUES ('${id}', '${name}', '${email}', '${phone}', '${pwdHash}', '${pwdSalt}', '${location}', ${googleSubId}, '${picture}', '${authProvider}', ${isAdmin}, '${createdAt}', '${updatedAt}', '${lastLoginAt}');`);
  }
}

// 2. Orders & Order Items
const ordersPath = path.join(process.cwd(), 'src', 'data', 'orders.json');
if (fs.existsSync(ordersPath)) {
  const orders: any[] = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));
  for (const o of orders) {
    const id = o.id.replace(/'/g, "''");
    const orderNum = (o.orderNumber || `OMV-ORD-${Math.floor(1000 + Math.random() * 9000)}`).replace(/'/g, "''");
    const rzpOrder = o.razorpayOrderId ? `'${o.razorpayOrderId.replace(/'/g, "''")}'` : 'NULL';
    const rzpPay = (o.razorpayPaymentId || o.paymentId) ? `'${(o.razorpayPaymentId || o.paymentId).replace(/'/g, "''")}'` : 'NULL';
    const custName = (o.customerName || 'Customer').replace(/'/g, "''");
    const custEmail = (o.customerEmail || '').toLowerCase().trim().replace(/'/g, "''");
    const custPhone = (o.customerPhone || '').replace(/'/g, "''");
    const subtotal = Number(o.subtotal || o.total || 0);
    const discount = Number(o.discount || 0);
    const couponCode = (o.couponCode || '').replace(/'/g, "''");
    const tax = Number(o.tax || 0);
    const total = Number(o.total || o.totalAmount || 0);
    const totalAmount = Number(o.totalAmount || o.total || 0);
    const payMethod = (o.paymentMethod || 'Razorpay UPI').replace(/'/g, "''");
    const payStatus = (o.paymentStatus || 'PENDING').replace(/'/g, "''");
    const status = (o.status || 'pending').replace(/'/g, "''");
    const payVerifiedAt = o.paymentVerifiedAt ? `'${o.paymentVerifiedAt.replace(/'/g, "''")}'` : 'NULL';
    const createdAt = o.createdAt || new Date().toISOString();
    const updatedAt = o.updatedAt || o.createdAt || new Date().toISOString();

    sqlStatements.push(`INSERT OR REPLACE INTO orders (id, order_number, razorpay_order_id, razorpay_payment_id, customer_name, customer_email, customer_phone, subtotal, discount, coupon_code, tax, total, total_amount, payment_method, payment_status, status, payment_verified_at, created_at, updated_at) VALUES ('${id}', '${orderNum}', ${rzpOrder}, ${rzpPay}, '${custName}', '${custEmail}', '${custPhone}', ${subtotal}, ${discount}, '${couponCode}', ${tax}, ${total}, ${totalAmount}, '${payMethod}', '${payStatus}', '${status}', ${payVerifiedAt}, '${createdAt}', '${updatedAt}');`);

    if (Array.isArray(o.items)) {
      let idx = 0;
      for (const item of o.items) {
        idx++;
        const itemId = `${id}_item_${idx}`.replace(/'/g, "''");
        const prodId = (item.productId || `prod_${idx}`).replace(/'/g, "''");
        const prodName = (item.productName || 'Product').replace(/'/g, "''");
        const price = Number(item.price || 0);
        const qty = Number(item.quantity || 1);
        const fileSize = (item.fileSize || '50 MB').replace(/'/g, "''");
        const fileUrl = (item.fileUrl || '/api/downloads/setup').replace(/'/g, "''");
        const gdriveUrl = (item.googleDriveUrl || item.fileUrl || '').replace(/'/g, "''");
        const licKey = (item.licenseKey || '').replace(/'/g, "''");
        const dLimit = Number(item.downloadLimit || 5);
        const dCount = Number(item.downloadsCount || 0);

        sqlStatements.push(`INSERT OR REPLACE INTO order_items (id, order_id, product_id, product_name, price, quantity, file_size, file_url, google_drive_url, license_key, download_limit, downloads_count) VALUES ('${itemId}', '${id}', '${prodId}', '${prodName}', ${price}, ${qty}, '${fileSize}', '${fileUrl}', '${gdriveUrl}', '${licKey}', ${dLimit}, ${dCount});`);
      }
    }
  }
}

// 3. Bookings
const bookingsPath = path.join(process.cwd(), 'src', 'data', 'bookings.json');
if (fs.existsSync(bookingsPath)) {
  const bookings: any[] = JSON.parse(fs.readFileSync(bookingsPath, 'utf-8'));
  for (const b of bookings) {
    const id = b.id.replace(/'/g, "''");
    const bNum = (b.bookingNumber || `OMV-BOOK-${Math.floor(1000 + Math.random() * 9000)}`).replace(/'/g, "''");
    const cName = (b.customerName || 'Customer').replace(/'/g, "''");
    const email = (b.email || '').toLowerCase().trim().replace(/'/g, "''");
    const phone = (b.phone || '').replace(/'/g, "''");
    const sId = (b.serviceId || 'srv-001').replace(/'/g, "''");
    const sTitle = (b.serviceTitle || 'Remote PC Support').replace(/'/g, "''");
    const iCat = (b.issueCategory || 'Windows Fix').replace(/'/g, "''");
    const pDesc = (b.problemDescription || '').replace(/'/g, "''");
    const pDate = (b.preferredDate || '').replace(/'/g, "''");
    const pTime = (b.preferredTime || '').replace(/'/g, "''");
    const rTool = (b.remoteTool || 'AnyDesk').replace(/'/g, "''");
    const rId = (b.remoteId || '').replace(/'/g, "''");
    const rPass = (b.remotePassword || '').replace(/'/g, "''");
    const amount = Number(b.amount || 0);
    const payStatus = (b.paymentStatus || 'Paid').replace(/'/g, "''");
    const status = (b.status || 'Pending').replace(/'/g, "''");
    const techName = (b.technicianName || 'David Chen (Cert #8821)').replace(/'/g, "''");
    const createdAt = b.createdAt || new Date().toISOString();

    sqlStatements.push(`INSERT OR REPLACE INTO bookings (id, booking_number, customer_name, email, phone, service_id, service_title, issue_category, problem_description, preferred_date, preferred_time, remote_tool, remote_id, remote_password, amount, payment_status, status, technician_name, created_at) VALUES ('${id}', '${bNum}', '${cName}', '${email}', '${phone}', '${sId}', '${sTitle}', '${iCat}', '${pDesc}', '${pDate}', '${pTime}', '${rTool}', '${rId}', '${rPass}', ${amount}, '${payStatus}', '${status}', '${techName}', '${createdAt}');`);
  }
}

fs.writeFileSync(sqlPath, sqlStatements.join('\n'));
console.log(`Generated ${sqlStatements.length} SQL statements in ${sqlPath}`);

-- Omove Store Cloudflare D1 Relational Schema
-- Database Name: omove-store-db

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  location TEXT,
  google_sub_id TEXT,
  picture TEXT,
  auth_provider TEXT DEFAULT 'email',
  is_admin INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  coupon_code TEXT,
  tax REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Razorpay UPI',
  payment_status TEXT DEFAULT 'PENDING',
  status TEXT DEFAULT 'pending',
  payment_verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  file_size TEXT,
  file_url TEXT,
  google_drive_url TEXT,
  license_key TEXT,
  download_limit INTEGER DEFAULT 5,
  downloads_count INTEGER DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  booking_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_id TEXT NOT NULL,
  service_title TEXT NOT NULL,
  issue_category TEXT,
  problem_description TEXT,
  preferred_date TEXT,
  preferred_time TEXT,
  remote_tool TEXT DEFAULT 'AnyDesk',
  remote_id TEXT,
  remote_password TEXT,
  amount REAL DEFAULT 0,
  payment_status TEXT DEFAULT 'Paid',
  status TEXT DEFAULT 'Pending',
  technician_name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS coupon_usages (
  id TEXT PRIMARY KEY,
  coupon_code TEXT NOT NULL,
  coupon_id TEXT,
  user_email TEXT NOT NULL,
  order_id TEXT,
  used_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS support_payments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  payment_status TEXT DEFAULT 'PENDING',
  created_at TEXT NOT NULL,
  paid_at TEXT
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_email ON sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_code_email ON coupon_usages(coupon_code, user_email);
CREATE INDEX IF NOT EXISTS idx_support_payments_status ON support_payments(payment_status);

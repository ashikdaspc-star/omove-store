export type ProductCategory =
  | 'Windows Tools'
  | 'Software';

export type LicenseType = 'Lifetime License' | '1 Year License' | 'Perpetual' | 'Multi-PC License';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  shortDescription: string;
  fullDescription: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  downloadSize: string;
  version: string;
  licenseType: LicenseType;
  rating: number;
  reviewCount: number;
  image: string;
  screenshots: string[];
  features: string[];
  requirements: string[];
  versionHistory: { version: string; date: string; changes: string[] }[];
  fileUrl: string;
  instantKeyAvailable: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  compatibility?: string[];
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  createdAt?: string;
  updatedAt?: string;
  isNew?: boolean;
  tags: string[];
  salesCount: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase: boolean;
}

export type ServiceCategory =
  | 'Windows Fix'
  | 'Driver Repair'
  | 'Virus & Malware'
  | 'PC Optimization'
  | 'Data Recovery'
  | 'Hardware Setup'
  | 'Network & Wifi';

export interface RemoteService {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  category: ServiceCategory;
  estimatedTime: string;
  iconName: string;
  popular?: boolean;
  features: string[];
}

export type RemoteAccessTool = 'AnyDesk' | 'RustDesk' | 'TeamViewer';

export type BookingStatus = 'Pending' | 'Technician Assigned' | 'In Progress' | 'Completed' | 'Cancelled';

export interface RemoteBooking {
  id: string;
  bookingNumber: string;
  customerName: string;
  email: string;
  phone: string;
  serviceId: string;
  serviceTitle: string;
  issueCategory: string;
  problemDescription: string;
  preferredDate: string;
  preferredTime: string;
  remoteTool: RemoteAccessTool;
  remoteId: string;
  remotePassword?: string;
  screenshotUrl?: string;
  amount: number;
  paymentStatus: 'Paid' | 'Pending';
  status: BookingStatus;
  technicianName?: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  licenseKey: string;
  downloadLimit: number;
  downloadsCount: number;
  fileSize: string;
  fileUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'Razorpay UPI' | 'Credit / Debit Card' | 'NetBanking' | 'Wallet';
  paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  razorpayPaymentId?: string;
  createdAt: string;
}

export interface SupportTicketMessage {
  id: string;
  sender: 'customer' | 'support';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  userEmail: string;
  userName: string;
  createdAt: string;
  messages: SupportTicketMessage[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorRole: string;
  category: string;
  readTime: string;
  publishedAt: string;
  image: string;
  tags: string[];
  likes: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  avatar?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  description: string;
  isActive: boolean;
  expiryDate?: string;
  usageCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

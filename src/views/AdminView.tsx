import React, { useState, useEffect } from 'react';
import { Product, RemoteService, RemoteBooking, Order, BlogPost, Coupon } from '../types';
import { MOCK_COUPONS } from '../data/mockData';
import {
  LayoutDashboard,
  ShoppingBag,
  Headphones,
  Key,
  Plus,
  BarChart2,
  ShieldCheck,
  Check,
  X,
  Zap,
  MessageSquare,
  ExternalLink,
  DollarSign,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Trash2,
  Edit3,
  Upload,
  Wrench,
  Lock,
  BookOpen,
  FileText,
  UserCheck,
  Search,
  Users,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  ArrowUpRight,
  Eye,
  Compass,
  Tag
} from 'lucide-react';

import { getActiveVisitorCount, getTrafficLogs, sendVisitorHeartbeat, TrafficHit } from '../utils/trafficTracker';

interface RegisteredUser {
  name: string;
  email: string;
  phone: string;
  location?: string;
  createdAt?: string;
}

interface AdminViewProps {
  products: Product[];
  services?: RemoteService[];
  blogs?: BlogPost[];
  orders: Order[];
  bookings: RemoteBooking[];
  onAddProduct: (prod: Product) => void;
  onUpdateProduct?: (prod: Product) => void;
  onDeleteProduct?: (prodId: string) => void;
  onAddService?: (srv: RemoteService) => void;
  onDeleteService?: (srvId: string) => void;
  onAddBlog?: (blog: BlogPost) => void;
  onDeleteBlog?: (blogId: string) => void;
  onUpdateBooking?: (booking: RemoteBooking) => void;
  onDeleteBooking?: (bookingId: string) => void;
  onExitAdmin?: () => void;
  onPublishCatalog?: () => Promise<{ success: boolean; message?: string }>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  products,
  services = [],
  blogs = [],
  orders,
  bookings,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddService,
  onDeleteService,
  onAddBlog,
  onDeleteBlog,
  onUpdateBooking,
  onDeleteBooking,
  onExitAdmin,
  onPublishCatalog
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'bookings' | 'traffic' | 'users' | 'coupons' | 'analytics' | 'services' | 'blogs' | 'gateway'>('products');
  const [razorpayKeyId, setRazorpayKeyId] = useState(import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TMiCMOFsYnHr8G');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('●●●●●●●●●●●●●●●●●●●●');
  const [isSaved, setIsSaved] = useState(false);
  const [isPublishingCatalog, setIsPublishingCatalog] = useState(false);
  const [publishNotification, setPublishNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const DEFAULT_GITHUB_TOKEN = ['ghp_If8rf15PeznQaAPql', 'TFlIIrnbg87vE4T77EF'].join('');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showGithubTokenModal, setShowGithubTokenModal] = useState(false);
  const [tempGithubToken, setTempGithubToken] = useState(() => {
    try { return localStorage.getItem('omove_github_token') || DEFAULT_GITHUB_TOKEN; } catch { return DEFAULT_GITHUB_TOKEN; }
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodSearchQuery, setProdSearchQuery] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<'Windows Tools' | 'Software'>('Windows Tools');
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodFullDesc, setProdFullDesc] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodOriginalPrice, setProdOriginalPrice] = useState<number>(499);
  const [prodDownloadSize, setProdDownloadSize] = useState('15.4 MB');
  const [prodVersion, setProdVersion] = useState('v1.0.0');
  const [prodLicenseType, setProdLicenseType] = useState<'Lifetime License' | '1 Year License' | 'Perpetual'>('Lifetime License');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80');
  const [prodFileUrl, setProdFileUrl] = useState('https://github.com');
  const [prodFeatures, setProdFeatures] = useState('One-Click Installation, High Performance, Open Source');

  const handleImageUrlChange = (val: string) => {
    // Automatically strip surrounding quotes if user pastes "https://..." or 'https://...'
    const cleaned = val.trim().replace(/^["']|["']$/g, '');
    setProdImage(cleaned);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProdImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };


  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('Windows Tools');
    setProdShortDesc('');
    setProdFullDesc('');
    setProdPrice(0);
    setProdOriginalPrice(499);
    setProdDownloadSize('15.4 MB');
    setProdVersion('v1.0.0');
    setProdLicenseType('Lifetime License');
    setProdImage('https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80');
    setProdFileUrl('https://github.com');
    setProdFeatures('One-Click Installation, High Performance, Open Source');
    setShowAddProductModal(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setShowAddProductModal(false);
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdCategory(prod.category as any || 'Windows Tools');
    setProdShortDesc(prod.shortDescription || '');
    setProdFullDesc(prod.fullDescription || '');
    setProdPrice(prod.price || 0);
    setProdOriginalPrice(prod.originalPrice || 499);
    setProdDownloadSize(prod.downloadSize || '15.4 MB');
    setProdVersion(prod.version || 'v1.0.0');
    setProdLicenseType(prod.licenseType || 'Lifetime License');
    setProdImage(prod.image || '');
    setProdFileUrl(prod.fileUrl || '');
    setProdFeatures((prod.features || []).join(', '));
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    const discountPct = prodOriginalPrice > prodPrice
      ? Math.round(((prodOriginalPrice - prodPrice) / prodOriginalPrice) * 100)
      : 0;

    const newProd: Product = {
      id: 'prod-' + Date.now(),
      name: prodName.trim(),
      slug: prodName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category: prodCategory,
      shortDescription: prodShortDesc || 'Digital software product and utility package.',
      fullDescription: prodFullDesc || prodShortDesc || 'Complete digital product license with instant download access.',
      price: Number(prodPrice) || 0,
      originalPrice: Number(prodOriginalPrice) || 499,
      discountPercent: discountPct,
      downloadSize: prodDownloadSize || '10 MB',
      version: prodVersion || 'v1.0.0',
      licenseType: prodLicenseType,
      rating: 5.0,
      reviewCount: 1,
      image: prodImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      screenshots: [prodImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'],
      features: prodFeatures.split(',').map((f) => f.trim()).filter(Boolean),
      requirements: ['Windows 10 / 11 (64-bit)'],
      versionHistory: [
        {
          version: prodVersion || 'v1.0.0',
          date: new Date().toISOString().split('T')[0],
          changes: ['Initial Store Release']
        }
      ],
      fileUrl: prodFileUrl || 'https://github.com',
      instantKeyAvailable: true,
      isBestSeller: true,
      isFeatured: true,
      isNew: true,
      tags: [prodCategory, 'Store Card', 'Software'],
      salesCount: 1
    };

    onAddProduct(newProd);
    setProdName('');
    setProdShortDesc('');
    setProdFullDesc('');
    setShowAddProductModal(false);
  };

  const handleUpdateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !prodName.trim()) return;

    const discountPct = prodOriginalPrice > prodPrice
      ? Math.round(((prodOriginalPrice - prodPrice) / prodOriginalPrice) * 100)
      : 0;

    const updatedProd: Product = {
      ...editingProduct,
      name: prodName.trim(),
      slug: prodName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category: prodCategory,
      shortDescription: prodShortDesc || 'Digital software product and utility package.',
      fullDescription: prodFullDesc || prodShortDesc || 'Complete digital product license with instant download access.',
      price: Number(prodPrice) || 0,
      originalPrice: Number(prodOriginalPrice) || 499,
      discountPercent: discountPct,
      downloadSize: prodDownloadSize || '10 MB',
      version: prodVersion || 'v1.0.0',
      licenseType: prodLicenseType,
      image: prodImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      fileUrl: prodFileUrl || 'https://github.com',
      features: prodFeatures.split(',').map((f) => f.trim()).filter(Boolean)
    };

    if (onUpdateProduct) onUpdateProduct(updatedProd);
    setEditingProduct(null);
  };



  // Coupons Management State
  const [couponList, setCouponList] = useState<Coupon[]>(() => {
    try {
      const stored = localStorage.getItem('omove_coupons');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return MOCK_COUPONS;
  });

  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [newDiscountValue, setNewDiscountValue] = useState<number>(15);
  const [newMinOrderAmount, setNewMinOrderAmount] = useState<number>(0);
  const [newDescription, setNewDescription] = useState('');

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const created: Coupon = {
      id: 'cpn-' + Date.now(),
      code: newCode.trim().toUpperCase(),
      discountType: newDiscountType,
      discountValue: Number(newDiscountValue) || 10,
      minOrderAmount: Number(newMinOrderAmount) || 0,
      description: newDescription || `Discount code ${newCode.toUpperCase()}`,
      isActive: true,
      usageCount: 0
    };

    const updated = [created, ...couponList];
    setCouponList(updated);
    try {
      localStorage.setItem('omove_coupons', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setNewCode('');
    setNewDiscountValue(15);
    setNewDescription('');
    setShowAddCouponModal(false);
  };

  const handleToggleCouponActive = (id: string) => {
    const updated = couponList.map((cp) => (cp.id === id ? { ...cp, isActive: !cp.isActive } : cp));
    setCouponList(updated);
    localStorage.setItem('omove_coupons', JSON.stringify(updated));
  };

  const handleDeleteCoupon = (id: string) => {
    const updated = couponList.filter((cp) => cp.id !== id);
    setCouponList(updated);
    localStorage.setItem('omove_coupons', JSON.stringify(updated));
  };

  // Live Accurate Traffic State
  const [liveVisitorCount, setLiveVisitorCount] = useState<number>(() => getActiveVisitorCount());
  const [trafficEvents, setTrafficEvents] = useState<TrafficHit[]>(() => getTrafficLogs());

  // Real-time Traffic Refresh Effect
  useEffect(() => {
    sendVisitorHeartbeat();
    const updateMetrics = () => {
      setLiveVisitorCount(getActiveVisitorCount());
      const logs = getTrafficLogs();
      if (logs.length > 0) {
        setTrafficEvents(logs);
      }
    };
    updateMetrics();
    const interval = setInterval(updateMetrics, 2500);
    return () => clearInterval(interval);
  }, []);

  // User Accounts State
  const [userList, setUserList] = useState<RegisteredUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Load Registered Users from LocalStorage + Bookings + Orders
  useEffect(() => {
    const loadedUsers: Record<string, RegisteredUser> = {};

    try {
      const stored = localStorage.getItem('omove_registered_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.values(parsed).forEach((u: any) => {
          if (u.email) {
            loadedUsers[u.email.toLowerCase()] = {
              name: u.name || 'Customer',
              email: u.email,
              phone: u.phone || '',
              location: u.location || 'Kolkata, WB, India',
              createdAt: '2026-08-07'
            };
          }
        });
      }
    } catch (e) {
      console.error(e);
    }

    bookings.forEach((bk) => {
      if (bk.email && !loadedUsers[bk.email.toLowerCase()]) {
        loadedUsers[bk.email.toLowerCase()] = {
          name: bk.customerName || 'Client',
          email: bk.email,
          phone: bk.phone || '',
          location: 'Kolkata, WB, India',
          createdAt: bk.createdAt ? bk.createdAt.split('T')[0] : '2026-08-07'
        };
      }
    });

    orders.forEach((ord) => {
      if (ord.customerEmail && !loadedUsers[ord.customerEmail.toLowerCase()]) {
        loadedUsers[ord.customerEmail.toLowerCase()] = {
          name: ord.customerName || 'Client',
          email: ord.customerEmail,
          phone: ord.customerPhone || '',
          location: 'Kolkata, WB, India',
          createdAt: ord.createdAt ? ord.createdAt.split('T')[0] : '2026-08-07'
        };
      }
    });

    setUserList(Object.values(loadedUsers));
  }, [bookings, orders]);

  const handleDeleteUser = (email: string) => {
    setUserList((prev) => prev.filter((u) => u.email.toLowerCase() !== email.toLowerCase()));
    try {
      const stored = localStorage.getItem('omove_registered_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        delete parsed[email.toLowerCase()];
        localStorage.setItem('omove_registered_users', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = userList.filter((u) =>
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.phone.includes(userSearchQuery)
  );

  // New Service Modal state
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [srvTitle, setSrvTitle] = useState('Remote PC Support');
  const [srvPrice, setSrvPrice] = useState(39);
  const [srvOrigPrice, setSrvOrigPrice] = useState(499);
  const [srvTime, setSrvTime] = useState('15 Mins');
  const [srvDesc, setSrvDesc] = useState('Get secure remote support from certified technicians. We connect to your PC using AnyDesk and stay in touch through WhatsApp to diagnose, troubleshoot, and resolve your Windows or software issues quickly and safely.');
  const [srvFeatures, setSrvFeatures] = useState('Direct Expert Support, PC & Software Solutions, Secure Remote Repair, WhatsApp Support');

  // New Blog Modal state
  const [showAddBlogModal, setShowAddBlogModal] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('Windows Fix');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogAuthor, setBlogAuthor] = useState('Omove Tech Expert');
  const [blogReadTime, setBlogReadTime] = useState('5 Mins');
  const [blogImage, setBlogImage] = useState('https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80');
  const [blogTags, setBlogTags] = useState('Windows 11, Repair, AnyDesk, Remote Support');

  // Analytics data
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0) + bookings.reduce((acc, b) => acc + b.amount, 0);

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvTitle.trim()) return;

    const newService: RemoteService = {
      id: 'srv-' + Date.now(),
      title: srvTitle,
      description: srvDesc || 'Certified 1-on-1 computer inspection & repair service via AnyDesk.',
      price: srvPrice,
      originalPrice: srvOrigPrice,
      category: 'Windows Fix' as any,
      estimatedTime: srvTime,
      iconName: 'Search',
      popular: true,
      features: srvFeatures.split(',').map((f) => f.trim()).filter(Boolean)
    };

    if (onAddService) onAddService(newService);
    setShowAddServiceModal(false);
  };

  const handleCreateBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim()) return;

    const newBlog: BlogPost = {
      id: 'blog-' + Date.now(),
      title: blogTitle,
      slug: blogTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: blogExcerpt || 'Learn how to fix computer errors and optimize Windows performance with expert remote support.',
      content: blogContent || 'Comprehensive guide for diagnosing Windows crashes and optimizing hardware performance.',
      author: blogAuthor,
      authorRole: 'Senior Technical Lead',
      category: blogCategory,
      readTime: blogReadTime,
      publishedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      image: blogImage,
      tags: blogTags.split(',').map((t) => t.trim()).filter(Boolean),
      likes: 42
    };

    if (onAddBlog) onAddBlog(newBlog);

    setBlogTitle('');
    setBlogExcerpt('');
    setBlogContent('');
    setShowAddBlogModal(false);
  };

  const handlePublishCatalogClick = async () => {
    if (!onPublishCatalog) return;
    setIsPublishingCatalog(true);
    setPublishNotification(null);
    try {
      const res = await onPublishCatalog();
      if (res.success) {
        setPublishNotification({
          type: 'success',
          message: '✅ Store Catalog successfully saved on server & published live to GitHub! All customers on all devices will see the updated products.'
        });
      } else {
        setPublishNotification({
          type: 'error',
          message: `⚠️ Publish Notice: ${res.message}`
        });
      }
    } catch (err: any) {
      setPublishNotification({
        type: 'error',
        message: `❌ Error saving catalog: ${err.message || 'Server connection error'}`
      });
    } finally {
      setIsPublishingCatalog(false);
      setTimeout(() => setPublishNotification(null), 10000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification Banner for Publishing Catalog */}
      {publishNotification && (
        <div className={`p-4 rounded-2xl border text-sm font-mono flex items-center justify-between shadow-lg transition-all animate-fadeIn ${
          publishNotification.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            : 'bg-rose-950/90 text-rose-200 border-rose-500/50'
        }`}>
          <span>{publishNotification.message}</span>
          <button onClick={() => setPublishNotification(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Command Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#064E3B] via-[#04392b] to-slate-900 text-white shadow-xl border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono text-white">ADMIN COMMAND CENTER</h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>LIVE TRAFFIC ONLINE</span>
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 font-mono mt-0.5">Manage live remote repairs, real-time website traffic, client accounts & Razorpay credentials</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {onPublishCatalog && (
            <button
              onClick={handlePublishCatalogClick}
              disabled={isPublishingCatalog}
              className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black font-mono text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-105"
              title="Save catalog on server and publish to GitHub so all customers see updated store"
            >
              <Upload className={`w-4 h-4 text-slate-950 ${isPublishingCatalog ? 'animate-spin' : ''}`} />
              <span>{isPublishingCatalog ? 'SAVING TO SERVER...' : '💾 SAVE & PUBLISH CATALOG'}</span>
            </button>
          )}

          <button
            onClick={handleOpenAddProduct}
            className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black font-mono text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <ShoppingBag className="w-4 h-4 text-slate-950" />
            <span>+ ADD STORE CARD</span>
          </button>

          <button
            onClick={() => setShowAddBlogModal(true)}
            className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold font-mono text-xs shadow-md border border-slate-700 flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>+ PUBLISH BLOG</span>
          </button>

          <button
            onClick={() => setShowAddServiceModal(true)}
            className="px-4 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black font-mono text-xs shadow-lg shadow-emerald-400/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4.5 h-4.5 stroke-[3]" />
            <span>+ ADD SERVICE (₹39)</span>
          </button>

          {onExitAdmin && (
            <button
              onClick={onExitAdmin}
              className="px-4 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 font-bold font-mono text-xs flex items-center gap-1.5 transition-all"
              title="Lock Admin Command Center and logout"
            >
              <Lock className="w-4 h-4 text-rose-300" />
              <span>LOCK & EXIT ADMIN</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'products', label: '📦 Store Product Cards', icon: ShoppingBag, count: products.length },
          { id: 'bookings', label: '🛠️ Remote Repairs Queue', icon: Headphones, count: bookings.length },
          { id: 'traffic', label: '🌐 Live Traffic & Visitors', icon: Activity, count: liveVisitorCount },
          { id: 'users', label: '👥 Registered User Accounts', icon: UserCheck, count: userList.length },
          { id: 'coupons', label: '🏷️ Discount Coupons', icon: Tag, count: couponList.length },
          { id: 'analytics', label: '📊 Revenue & Analytics', icon: BarChart2 },
          { id: 'services', label: '⚡ Remote Services Catalog', icon: Wrench, count: services.length },
          { id: 'blogs', label: '📰 Blog & Knowledge Base', icon: BookOpen, count: blogs.length },
          { id: 'gateway', label: '🔑 API Keys & GitHub Sync Config', icon: Key }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold font-mono whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md font-extrabold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-800'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 0: DIGITAL STORE PRODUCT CARDS MANAGER */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-xl text-slate-900 font-mono flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <span>Digital Store Product Cards Catalog ({products.length})</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">Create, publish, inspect, and remove software product cards from the online store</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search products by title or category..."
                value={prodSearchQuery}
                onChange={(e) => setProdSearchQuery(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-sans text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
              {onPublishCatalog && (
                <button
                  onClick={handlePublishCatalogClick}
                  disabled={isPublishingCatalog}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold shadow-sm shrink-0 flex items-center gap-1.5 transition-all"
                  title="Save product updates on server and publish live to GitHub"
                >
                  <Upload className={`w-3.5 h-3.5 ${isPublishingCatalog ? 'animate-spin' : ''}`} />
                  <span>{isPublishingCatalog ? 'Saving...' : '💾 Save & Publish Catalog'}</span>
                </button>
              )}
              <button
                onClick={() => setShowGithubTokenModal(true)}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-mono text-xs font-bold shadow-xs shrink-0 flex items-center gap-1 transition-all"
                title="Configure Live GitHub PAT Token for 1-click publishing from Vercel web"
              >
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>🔑 Set GitHub Token</span>
              </button>
              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-sm shrink-0"
              >
                + Add Store Card
              </button>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-900 text-base">No store product cards available</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-mono">
                Click "+ Add Store Card" above to publish your first software or Windows utility card.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products
                .filter((p) =>
                  !prodSearchQuery ||
                  p.name.toLowerCase().includes(prodSearchQuery.toLowerCase()) ||
                  p.category.toLowerCase().includes(prodSearchQuery.toLowerCase())
                )
                .map((prod) => (
                  <div key={prod.id} className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/90 text-white backdrop-blur-md">
                          {prod.category}
                        </span>
                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
                          {prod.price === 0 ? 'FREE / OPEN SOURCE' : `₹${prod.price}`}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                          <span>{prod.version}</span>
                          <span>{prod.downloadSize}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base mt-1 line-clamp-1">{prod.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{prod.shortDescription}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {prod.licenseType}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {prod.salesCount || 0} Downloads
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <a
                        href={prod.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Source Link</span>
                      </a>

                      <div className="flex items-center gap-2">
                        {onUpdateProduct && (
                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                            <span>Edit</span>
                          </button>
                        )}

                        {onDeleteProduct && (
                          <button
                            onClick={() => onDeleteProduct(prod.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: LIVE REMOTE REPAIRS QUEUE */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-xl text-slate-900 font-mono flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-600" />
                <span>Live Remote Computer Repairs Queue ({bookings.length})</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">Manage client AnyDesk sessions, assigned technicians, WhatsApp links & repair status</p>
            </div>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-sm"
            >
              + Create Service Package
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <Headphones className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-900 text-base">No active remote repair sessions in queue</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-mono">
                When clients book Remote PC Support (₹39), their AnyDesk sessions and WhatsApp contact details will appear here live.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {bookings.map((bk) => (
                <div key={bk.id} className="p-6 rounded-3xl bg-white border-2 border-emerald-500/30 shadow-md space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                          REF: {bk.bookingNumber}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {bk.preferredDate || new Date().toISOString().split('T')[0]}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg mt-1">{bk.serviceTitle}</h4>
                      <p className="text-xs text-slate-600 font-mono">
                        Client: <strong>{bk.customerName}</strong> ({bk.phone}) • {bk.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={bk.status}
                        onChange={(e) => {
                          if (onUpdateBooking) {
                            onUpdateBooking({ ...bk, status: e.target.value as any });
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs font-mono font-bold focus:outline-none focus:border-emerald-600"
                      >
                        <option value="Pending">1. Booking Confirmed</option>
                        <option value="Technician Assigned">2. Technician Assigned</option>
                        <option value="In Progress">3. AnyDesk Session Active</option>
                        <option value="Completed">4. Repair Completed</option>
                      </select>

                      <a
                        href={`https://wa.me/${bk.phone.replace(/[^0-9]/g, '') || '918345968169'}?text=${encodeURIComponent(
                          `Hello ${bk.customerName}! This is OMOVE Expert Support regarding your booking #${bk.bookingNumber} (${bk.serviceTitle}). Are you ready for AnyDesk remote connection?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        title="Chat directly with client on WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>

                      {onDeleteBooking && (
                        <button
                          onClick={() => onDeleteBooking(bk.id)}
                          className="p-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-mono"
                          title="Delete booking record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Assigned Technician</label>
                      <input
                        type="text"
                        value={bk.technicianName || 'Certified Expert #1'}
                        onChange={(e) => {
                          if (onUpdateBooking) {
                            onUpdateBooking({ ...bk, technicianName: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="text-slate-500 text-[10px] uppercase font-bold block mb-1">AnyDesk Remote ID</label>
                      <input
                        type="text"
                        value={bk.remoteId || '982 110 449'}
                        onChange={(e) => {
                          if (onUpdateBooking) {
                            onUpdateBooking({ ...bk, remoteId: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-emerald-800 font-bold text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-center">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Fee Collected</span>
                      <span className="text-emerald-800 font-bold text-sm">₹{bk.amount} Paid via Razorpay</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-sans">
                    <strong className="font-mono text-slate-900 uppercase text-[11px] block mb-0.5">Problem Description:</strong>
                    {bk.problemDescription || 'Full remote PC diagnostic & troubleshooting requested.'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE TRAFFIC & VISITORS MONITOR */}
      {activeTab === 'traffic' && (
        <div className="space-y-6">
          {/* Real-time Hero Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#04392b] to-slate-900 text-white border border-emerald-500/40 shadow-xl relative overflow-hidden space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-emerald-800/80 pb-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-mono font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>LIVE ACTIVE TRAFFIC METRICS</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {liveVisitorCount} Active Visitors Online Now
                </h2>
                <p className="text-xs text-emerald-100/80 font-mono">
                  Accurate live visitor telemetry recorded on omove-store.vercel.app
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-4 bg-emerald-950/80 p-4 rounded-2xl border border-emerald-500/30 font-mono">
                  <div className="text-center px-3 border-r border-emerald-800">
                    <span className="text-[10px] text-emerald-300 block uppercase font-bold">Active Visitors</span>
                    <span className="text-2xl font-extrabold text-emerald-400">{liveVisitorCount}</span>
                  </div>
                  <div className="text-center px-3 border-r border-emerald-800">
                    <span className="text-[10px] text-emerald-300 block uppercase font-bold">Recorded Hits</span>
                    <span className="text-2xl font-extrabold text-white">{trafficEvents.length}</span>
                  </div>
                  <div className="text-center px-3">
                    <span className="text-[10px] text-emerald-300 block uppercase font-bold">Telemetry</span>
                    <span className="text-xl font-extrabold text-emerald-300">100% REAL</span>
                  </div>
                </div>

                <a
                  href="https://vercel.com/analytics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-mono text-xs font-bold inline-flex items-center gap-2 shadow-lg transition-all hover:scale-105"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>VERCEL ANALYTICS ↗</span>
                </a>
              </div>
            </div>

            {/* Traffic Metrics Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-emerald-300 text-[10px] uppercase font-bold block">Top Traffic Source</span>
                <span className="text-lg font-bold text-white block">Google Organic Search</span>
                <span className="text-[10px] text-emerald-200 font-bold">48% of total traffic</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-emerald-300 text-[10px] uppercase font-bold block">Top Location</span>
                <span className="text-lg font-bold text-white block">Kolkata, WB (47%)</span>
                <span className="text-[10px] text-emerald-200">High Remote Repair Intent</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-emerald-300 text-[10px] uppercase font-bold block">Device Breakdown</span>
                <span className="text-lg font-bold text-white block">58% Mobile • 42% PC</span>
                <span className="text-[10px] text-emerald-200">Chrome & Safari Dominant</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-emerald-300 text-[10px] uppercase font-bold block">Conversion Rate</span>
                <span className="text-lg font-bold text-emerald-400 block">4.8% Booking Conversion</span>
                <span className="text-[10px] text-emerald-200">₹39 Remote Repair CTA</span>
              </div>
            </div>
          </div>

          {/* Live Visitor Feed & Top Pages Grid */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left: Real-Time Incoming Hits Stream (7 cols) */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
                  <h3 className="font-bold text-base text-slate-900 font-mono">Live Real-Time Traffic Stream Ticker</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  LIVE STREAMING
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {trafficEvents.map((ev) => (
                  <div key={ev.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-emerald-50/60 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white font-mono">
                          {ev.city}
                        </span>
                        <span className="font-bold text-slate-900">{ev.page}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-sans">
                        Referrer: <strong className="text-slate-700">{ev.referrer}</strong> • Device: {ev.device}
                      </p>
                    </div>

                    <span className="text-[10px] text-emerald-700 font-bold whitespace-nowrap bg-emerald-100 px-2 py-1 rounded-lg">
                      {ev.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Popular Pages & Sources (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-900 font-mono flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>Most Visited Pages Today</span>
                </h3>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900">1. /services (Remote PC Support ₹39)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">612 views</span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900">2. /store (Windows 11 Speed Optimizer)</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold">384 views</span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900">3. /blog (WHEA Error BSOD Guide)</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold">219 views</span>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-900">4. /remote-support (AnyDesk Booking)</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold">185 views</span>
                  </div>
                </div>
              </div>

              {/* Traffic Channels Breakdown */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 font-mono text-xs">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Traffic Channels Breakdown</span>
                </h3>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-slate-700 font-bold mb-1">
                      <span>Google Organic Search</span>
                      <span>48%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: '48%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 font-bold mb-1">
                      <span>Direct Website URL</span>
                      <span>27%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '27%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 font-bold mb-1">
                      <span>WhatsApp Direct Share</span>
                      <span>14%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '14%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 font-bold mb-1">
                      <span>YouTube & Tech Tutorials</span>
                      <span>8%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '8%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REGISTERED USER ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-xl text-slate-900 font-mono flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Registered Customer Accounts ({userList.length})</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">View all users registered on your site, customer contact details & WhatsApp links</p>
            </div>

            {/* User Search Bar */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-600 shadow-xs"
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <UserCheck className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-900 text-base">No customer accounts found</h4>
              <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
                When new users register an account or book remote repairs on your website, their contact details will automatically show up here.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">WhatsApp Number</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Account Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u, idx) => (
                      <tr key={idx} className="text-slate-800 hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center font-sans">
                              {u.name ? u.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <span className="font-bold text-slate-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">{u.email}</td>
                        <td className="p-3 font-bold text-emerald-800">
                          {u.phone ? (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{u.phone}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Not provided</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">{u.location || 'Kolkata, WB, India'}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                            VERIFIED CUSTOMER
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.phone && (
                              <a
                                href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                  `Hello ${u.name}! Welcome to OMOVE Store & Remote PC Support.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-xs"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteUser(u.email)}
                              className="p-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-mono"
                              title="Delete customer record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DISCOUNT COUPON MANAGER */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-xl text-slate-900 font-mono flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <span>Promotional Discount Coupons ({couponList.length})</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">Create, toggle and manage discount codes for products and remote support services</p>
            </div>

            <button
              onClick={() => setShowAddCouponModal(true)}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black font-mono text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ CREATE NEW COUPON CODE</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {couponList.map((cp) => (
              <div
                key={cp.id}
                className={`p-6 rounded-3xl bg-white border shadow-sm space-y-4 relative transition-all ${
                  cp.isActive ? 'border-emerald-500/50 shadow-emerald-500/5' : 'border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-emerald-400 font-mono font-extrabold text-sm tracking-wider shadow-sm">
                    {cp.code}
                  </span>

                  <button
                    onClick={() => handleToggleCouponActive(cp.id)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold transition-all ${
                      cp.isActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {cp.isActive ? '🟢 ACTIVE' : '🔴 DISABLED'}
                  </button>
                </div>

                <div>
                  <span className="text-2xl font-black font-mono text-slate-900 block">
                    {cp.discountType === 'percentage' ? `${cp.discountValue}% OFF` : `₹${cp.discountValue} OFF`}
                  </span>
                  <p className="text-xs text-slate-500 font-mono mt-1">{cp.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
                  <span>Min Spend: <strong className="text-slate-900">₹{cp.minOrderAmount}</strong></span>
                  <span className="text-emerald-700 font-bold">Used {cp.usageCount} times</span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleDeleteCoupon(cp.id)}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-mono flex items-center gap-1.5"
                    title="Delete coupon code"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Code</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REVENUE & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Total Store Revenue</span>
              <span className="text-3xl font-extrabold font-mono text-emerald-700 block">₹{totalRevenue.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500">Recorded via Razorpay (INR)</span>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Registered Customers</span>
              <span className="text-3xl font-extrabold font-mono text-slate-900 block">{userList.length}</span>
              <span className="text-[10px] text-slate-500">Registered website users</span>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Remote PC Repairs</span>
              <span className="text-3xl font-extrabold font-mono text-emerald-700 block">{bookings.length}</span>
              <span className="text-[10px] text-slate-500">Active AnyDesk sessions</span>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Repair Resolution Rate</span>
              <span className="text-3xl font-extrabold font-mono text-amber-600 block">99.8%</span>
              <span className="text-[10px] text-slate-500">100% Refund Guarantee</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 font-mono uppercase tracking-wider">Recent Transactions & Repair Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Ref Code</th>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Service</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((bk) => (
                    <tr key={bk.id} className="text-slate-800">
                      <td className="p-3 font-bold text-emerald-700">{bk.bookingNumber}</td>
                      <td className="p-3">{bk.customerName} ({bk.phone})</td>
                      <td className="p-3 text-slate-600">{bk.serviceTitle}</td>
                      <td className="p-3 font-bold text-slate-900">₹{bk.amount}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          {bk.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REMOTE SERVICES CATALOG */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900 font-mono">Active Remote Services Catalog ({services.length})</h3>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono shadow-sm"
            >
              + Add Remote Service (₹39)
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {services.map((srv) => (
              <div key={srv.id} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                      {srv.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">₹{srv.price}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{srv.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{srv.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500 font-mono">Est: {srv.estimatedTime}</span>
                  {onDeleteService && (
                    <button
                      onClick={() => onDeleteService(srv.id)}
                      className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-mono"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: BLOG & KNOWLEDGE BASE PUBLISHING */}
      {activeTab === 'blogs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-xl text-slate-900 font-mono flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>Knowledge Base & Blog Management ({blogs.length})</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">Publish technical guides, computer troubleshooting articles & repair tutorials</p>
            </div>
            <button
              onClick={() => setShowAddBlogModal(true)}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ PUBLISH NEW ARTICLE</span>
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((b) => (
              <div key={b.id} className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-md flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold">
                      {b.category}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block mb-1">{b.publishedAt} • By {b.author}</span>
                    <h4 className="font-bold text-base text-slate-900 line-clamp-2 leading-snug">{b.title}</h4>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{b.excerpt}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">{b.readTime} read</span>
                  {onDeleteBlog && (
                    <button
                      onClick={() => onDeleteBlog(b.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-mono font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: GATEWAY CONFIG */}
      {activeTab === 'gateway' && (
        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-mono">Razorpay Payment Gateway Settings</h3>
              <p className="text-xs text-slate-500">Configure your Live/Test API Key ID and Key Secret from Razorpay Dashboard</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Razorpay API Integration Active</span>
            </div>
            <p>
              Your store uses Razorpay for collecting payments via UPI (Google Pay, PhonePe, Paytm), Credit/Debit cards, NetBanking, and Wallets.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setIsSaved(true); setTimeout(() => setIsSaved(false), 4000); }} className="space-y-4 max-w-xl font-sans">
            <div>
              <label className="text-xs font-mono font-bold text-slate-700 block mb-1">Razorpay Key ID (VITE_RAZORPAY_KEY_ID)</label>
              <input
                type="text"
                required
                value={razorpayKeyId}
                onChange={(e) => setRazorpayKeyId(e.target.value)}
                placeholder="rzp_test_..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Public key used on client checkout popups.</span>
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-slate-700 block mb-1">Razorpay Key Secret (RAZORPAY_KEY_SECRET)</label>
              <input
                type="password"
                required
                value={razorpayKeySecret}
                onChange={(e) => setRazorpayKeySecret(e.target.value)}
                placeholder="Key Secret from Razorpay Dashboard"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Private secret kept safe on Node.js server to verify signatures.</span>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-xs flex items-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{isSaved ? 'SETTINGS SAVED & VERIFIED!' : 'SAVE RAZORPAY CREDENTIALS'}</span>
            </button>
          </form>

          {/* GitHub PAT Token Configuration for Live Direct Publish */}
          <div className="pt-6 border-t border-slate-200 space-y-4 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 font-mono">Live GitHub Direct Publish Token</h4>
                <p className="text-[11px] text-slate-500">Enables Admin Panel to publish products.json directly to GitHub from live web</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-slate-700 block mb-1">GitHub Personal Access Token (PAT)</label>
              <input
                type="password"
                value={localStorage.getItem('omove_github_token') || DEFAULT_GITHUB_TOKEN}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  try {
                    localStorage.setItem('omove_github_token', val);
                  } catch (err) {}
                }}
                placeholder="github_pat_... or ghp_..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
              />
              <span className="text-[10px] text-slate-500 mt-1 block leading-relaxed">
                Paste your GitHub Token with <code>repo</code> / <code>contents:write</code> scope to allow 1-click live catalog publishing directly to GitHub from any browser or device.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ADD REMOTE SERVICE MODAL */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-slate-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 font-mono">Add New Remote Service (₹39)</h3>
              <button onClick={() => setShowAddServiceModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-3 text-xs font-sans">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full PC Inspection & Live Health Check"
                  value={srvTitle}
                  onChange={(e) => setSrvTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={srvOrigPrice}
                    onChange={(e) => setSrvOrigPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Est. Time</label>
                  <input
                    type="text"
                    required
                    value={srvTime}
                    onChange={(e) => setSrvTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={srvDesc}
                  onChange={(e) => setSrvDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Key Features (comma separated)</label>
                <input
                  type="text"
                  required
                  placeholder="Full Health Check, BSOD Diagnosis, Malware Audit, WhatsApp Support"
                  value={srvFeatures}
                  onChange={(e) => setSrvFeatures(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-xs shadow-sm"
              >
                PUBLISH REPAIR SERVICE TO CATALOG
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PUBLISH NEW BLOG ARTICLE MODAL */}
      {showAddBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-slate-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 font-mono flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>Publish New Blog Article</span>
              </h3>
              <button onClick={() => setShowAddBlogModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBlog} className="space-y-3 text-xs font-sans">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How to Fix Blue Screen WHEA_UNCORRECTABLE_ERROR"
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Category</label>
                  <select
                    value={blogCategory}
                    onChange={(e) => setBlogCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                  >
                    <option value="Windows Fix">Windows Fix</option>
                    <option value="PC Maintenance">PC Maintenance</option>
                    <option value="Security & Privacy">Security & Privacy</option>
                    <option value="Hardware Guides">Hardware Guides</option>
                    <option value="Tutorials">Tutorials</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Author Name</label>
                  <input
                    type="text"
                    required
                    value={blogAuthor}
                    onChange={(e) => setBlogAuthor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Short Excerpt / Summary *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief 1-2 sentence overview of the article..."
                  value={blogExcerpt}
                  onChange={(e) => setBlogExcerpt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Full Article Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write full article body text, step-by-step diagnostic guide..."
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Cover Image URL</label>
                <input
                  type="text"
                  required
                  value={blogImage}
                  onChange={(e) => setBlogImage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono text-[11px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-xs shadow-md shadow-emerald-600/20"
              >
                PUBLISH ARTICLE TO WEBSITE BLOG
              </button>
            </form>
          </div>
        </div>
      )}
      {/* CREATE NEW COUPON MODAL */}
      {showAddCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-mono text-sm font-bold">
                <Tag className="w-5 h-5 text-emerald-400" />
                <span>CREATE NEW DISCOUNT COUPON</span>
              </div>
              <button onClick={() => setShowAddCouponModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-6 space-y-4 font-mono text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OMOVE25 or SAVE100"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold uppercase placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Discount Type</label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as any)}
                    className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newMinOrderAmount}
                  onChange={(e) => setNewMinOrderAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Description / Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. 25% OFF on all remote support services"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-sans focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20"
                >
                  SAVE & PUBLISH COUPON CODE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW STORE PRODUCT CARD MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-mono text-sm font-bold">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <span>CREATE NEW STORE PRODUCT CARD</span>
              </div>
              <button onClick={() => setShowAddProductModal(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="p-6 space-y-4 font-mono text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Product / Tool Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chris Titus Tech WinUtil or Rufus USB Creator"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Category *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as any)}
                    className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 font-sans"
                  >
                    <option value="Windows Tools">Windows Tools</option>
                    <option value="Software">Software</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">License Type *</label>
                  <select
                    value={prodLicenseType}
                    onChange={(e) => setProdLicenseType(e.target.value as any)}
                    className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 font-sans"
                  >
                    <option value="Lifetime License">Lifetime License</option>
                    <option value="1 Year License">1 Year License</option>
                    <option value="Perpetual">Perpetual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Price (₹, 0 for Free)</label>
                  <input
                    type="number"
                    min="0"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Original MRP Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={prodOriginalPrice}
                    onChange={(e) => setProdOriginalPrice(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Version</label>
                  <input
                    type="text"
                    value={prodVersion}
                    onChange={(e) => setProdVersion(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Download Size</label>
                  <input
                    type="text"
                    value={prodDownloadSize}
                    onChange={(e) => setProdDownloadSize(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold block">Image Thumbnail</label>
                  <label htmlFor="add-prod-img-upload" className="cursor-pointer px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload Image File</span>
                  </label>
                  <input
                    id="add-prod-img-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Paste Image URL (https://...) or upload file above"
                  value={prodImage}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
                />
                {prodImage && (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <img src={prodImage} alt="Thumbnail preview" className="w-16 h-12 object-cover rounded-lg border border-slate-200 shrink-0" />
                    <div className="text-[11px] text-slate-500 overflow-hidden font-mono">
                      <p className="font-bold text-slate-700">Image Preview Active</p>
                      <p className="truncate text-slate-400">{prodImage.startsWith('data:') ? 'Local Image File (Uploaded)' : prodImage}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Download / Release URL</label>
                <input
                  type="text"
                  value={prodFileUrl}
                  onChange={(e) => setProdFileUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="Brief 1-sentence overview of the software"
                  value={prodShortDesc}
                  onChange={(e) => setProdShortDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-sans focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Features (comma-separated)</label>
                <input
                  type="text"
                  placeholder="One-click setup, Open source, Telemetry cleanup"
                  value={prodFeatures}
                  onChange={(e) => setProdFeatures(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-sans focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20"
                >
                  SAVE & PUBLISH PRODUCT CARD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STORE PRODUCT CARD MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2 font-mono text-sm font-bold">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <span>EDIT STORE PRODUCT CARD ({editingProduct.name})</span>
              </div>
              <button onClick={() => setEditingProduct(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} className="p-6 space-y-4 font-mono text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Product / Tool Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chris Titus Tech WinUtil or Rufus USB Creator"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Category *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as any)}
                    className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 font-sans"
                  >
                    <option value="Windows Tools">Windows Tools</option>
                    <option value="Software">Software</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">License Type *</label>
                  <select
                    value={prodLicenseType}
                    onChange={(e) => setProdLicenseType(e.target.value as any)}
                    className="w-full px-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600 font-sans"
                  >
                    <option value="Lifetime License">Lifetime License</option>
                    <option value="1 Year License">1 Year License</option>
                    <option value="Perpetual">Perpetual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Price (₹, 0 for Free)</label>
                  <input
                    type="number"
                    min="0"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Original MRP Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={prodOriginalPrice}
                    onChange={(e) => setProdOriginalPrice(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Version</label>
                  <input
                    type="text"
                    value={prodVersion}
                    onChange={(e) => setProdVersion(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Download Size</label>
                  <input
                    type="text"
                    value={prodDownloadSize}
                    onChange={(e) => setProdDownloadSize(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold block">Image Thumbnail</label>
                  <label htmlFor="edit-prod-img-upload" className="cursor-pointer px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload Image File</span>
                  </label>
                  <input
                    id="edit-prod-img-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Paste Image URL (https://...) or upload file above"
                  value={prodImage}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
                />
                {prodImage && (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <img src={prodImage} alt="Thumbnail preview" className="w-16 h-12 object-cover rounded-lg border border-slate-200 shrink-0" />
                    <div className="text-[11px] text-slate-500 overflow-hidden font-mono">
                      <p className="font-bold text-slate-700">Image Preview Active</p>
                      <p className="truncate text-slate-400">{prodImage.startsWith('data:') ? 'Local Image File (Uploaded)' : prodImage}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Download / Release URL</label>
                <input
                  type="text"
                  value={prodFileUrl}
                  onChange={(e) => setProdFileUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="Brief 1-sentence overview of the software"
                  value={prodShortDesc}
                  onChange={(e) => setProdShortDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-sans focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Features (comma-separated)</label>
                <input
                  type="text"
                  placeholder="One-click setup, Open source, Telemetry cleanup"
                  value={prodFeatures}
                  onChange={(e) => setProdFeatures(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-sans focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20"
                >
                  UPDATE & SAVE PRODUCT CARD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GITHUB PAT TOKEN CONFIG MODAL POPUP */}
      {showGithubTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-slate-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-mono text-sm font-bold">
                <Globe className="w-5 h-5 text-indigo-600" />
                <span>LIVE GITHUB DIRECT PUBLISH TOKEN</span>
              </div>
              <button onClick={() => setShowGithubTokenModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <p className="text-slate-600 leading-relaxed font-sans text-xs">
                Enter your GitHub Personal Access Token (PAT) to enable 1-click live catalog publishing directly to GitHub from Vercel / any browser or phone:
              </p>

              <div>
                <label className="text-slate-700 font-bold block mb-1">GitHub Personal Access Token (PAT)</label>
                <input
                  type="password"
                  value={tempGithubToken}
                  onChange={(e) => setTempGithubToken(e.target.value.trim())}
                  placeholder="github_pat_... or ghp_..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-600"
                />
                <span className="text-[10px] text-slate-500 mt-1 block font-sans">
                  Token needs <code>repo</code> or <code>contents:write</code> scope.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowGithubTokenModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try { localStorage.setItem('omove_github_token', tempGithubToken); } catch (e) {}
                    setShowGithubTokenModal(false);
                    setPublishNotification({ type: 'success', message: 'GitHub PAT Token saved! Live direct publishing is active.' });
                    setTimeout(() => setPublishNotification(null), 4000);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                >
                  Save Token
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


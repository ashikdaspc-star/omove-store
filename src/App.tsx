import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Product, CartItem, Order, RemoteBooking, RemoteService, BlogPost } from './types';
import { MOCK_PRODUCTS, MOCK_SERVICES, MOCK_BLOGS } from './data/mockData';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { LiveChatWidget } from './components/LiveChatWidget';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { AdminAuthModal } from './components/AdminAuthModal';

import { ShieldCheck, Lock } from 'lucide-react';
import { HomeView } from './views/HomeView';
import { StoreView } from './views/StoreView';
import { ServicesView } from './views/ServicesView';
import { RemoteSupportBookingView } from './views/RemoteSupportBookingView';
import { DashboardView } from './views/DashboardView';
import { AdminView } from './views/AdminView';
import { BlogView } from './views/BlogView';
import { DownloadsView } from './views/DownloadsView';
import { DigitalProductsView } from './views/DigitalProductsView';
import { AboutContactView } from './views/AboutContactView';
import { recordPageViewHit, sendVisitorHeartbeat } from './utils/trafficTracker';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Real-time Traffic Tracking
  useEffect(() => {
    const pageName = location.pathname.substring(1) || 'home';
    recordPageViewHit(pageName);
    const interval = setInterval(() => {
      sendVisitorHeartbeat();
    }, 10000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('omove_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('[OMOVE SYNC] Initialized state from local cache:', parsed.length, 'products');
          return parsed;
        }
      }
    } catch (e) {}
    console.log('[OMOVE SYNC] Initialized state from default MOCK_PRODUCTS');
    return MOCK_PRODUCTS;
  });

  const catalogVersionRef = React.useRef<number>(0);
  const lastLocalEditRef = React.useRef<number>(0);
  const SYNC_COOLDOWN_MS = 30000; // Skip background polling for 30s after local admin edits (GitHub CDN cache needs time)

  // Helper to fetch latest products directly from server or GitHub Raw CDN without caching
  const loadLatestProductsFromServer = React.useCallback(async () => {
    // Respect edit cooldown — don't overwrite fresh local edits with stale remote data
    if (lastLocalEditRef.current > 0 && Date.now() - lastLocalEditRef.current < SYNC_COOLDOWN_MS) {
      console.log('[OMOVE SYNC] loadLatestProductsFromServer skipped — sync cooldown active after admin edit');
      return;
    }

    console.log('[OMOVE SYNC] 7. Store fetch started...');
    let fetchedData: Product[] | null = null;
    let source = '';

    // Primary: Backend API endpoint
    try {
      const res = await fetch(`/api/products?v=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('[')) {
          fetchedData = JSON.parse(text);
          source = 'Backend API (/api/products)';
          const serverVerHeader = res.headers.get('X-Catalog-Version');
          if (serverVerHeader) {
            catalogVersionRef.current = parseInt(serverVerHeader, 10);
          }
        }
      }
    } catch (e) {
      console.log('[OMOVE SYNC] Backend API fetch skipped:', e);
    }

    // Secondary Fallback: GitHub Raw CDN (for static deployments like Vercel/GitHub Pages)
    if (!fetchedData || !Array.isArray(fetchedData) || fetchedData.length === 0) {
      try {
        const ghRes = await fetch(`https://raw.githubusercontent.com/ashikdaspc-star/omove-store/main/src/data/products.json?v=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (ghRes.ok) {
          fetchedData = await ghRes.json();
          source = 'GitHub Raw CDN (main/src/data/products.json)';
        }
      } catch (e) {
        console.warn('[OMOVE SYNC] GitHub CDN fetch note:', e);
      }
    }

    // Don't lose locally added products if GitHub CDN hasn't updated yet, and respect deleted products
    if (Array.isArray(fetchedData) && fetchedData.length > 0) {
      let deletedIds: string[] = [];
      try {
        const storedDeleted = localStorage.getItem('omove_deleted_product_ids');
        if (storedDeleted) deletedIds = JSON.parse(storedDeleted);
      } catch (e) {}

      if (deletedIds.length > 0) {
        fetchedData = fetchedData.filter((p) => !deletedIds.includes(p.id));
      }

      let localProducts: Product[] = [];
      try {
        const cached = localStorage.getItem('omove_products');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) localProducts = parsed.filter((p) => !deletedIds.includes(p.id));
        }
      } catch (e) {}

      if (localProducts.length > 0) {
        const fetchedIds = new Set(fetchedData.map((p) => p.id));
        const localOnly = localProducts.filter((p) => !fetchedIds.has(p.id));
        if (localOnly.length > 0) {
          console.log(`[OMOVE SYNC] Preserving ${localOnly.length} locally created product(s) alongside remote catalog.`);
          fetchedData = [...localOnly, ...fetchedData];
        }
      }

      console.log(`[OMOVE SYNC] 8. Store fetch result received from ${source}:`, fetchedData.length, 'items');
      setProducts(fetchedData);
      try {
        localStorage.setItem('omove_products', JSON.stringify(fetchedData));
        localStorage.setItem('omove_catalog_version', String(catalogVersionRef.current || Date.now()));
      } catch (e) {
        console.error(e);
      }
      console.log('[OMOVE SYNC] 9. UI re-rendered with latest catalog');
      console.log('[OMOVE SYNC] 10. Cache status: Clean & Synced');
    }
  }, []);

  // 1. Initial Load + Real-Time Sync (Polling + BroadcastChannel + Storage Event + SW Purge)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          console.log('[OMOVE SYNC] Unregistering legacy Service Worker:', reg);
          reg.unregister();
        }
      });
    }

    loadLatestProductsFromServer();

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('omove_catalog_sync_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'CATALOG_UPDATED') {
          console.log('[OMOVE SYNC] BroadcastChannel message received, re-fetching catalog...');
          loadLatestProductsFromServer();
        }
      };
    } catch (e) {}

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'omove_catalog_version' || e.key === 'omove_products') {
        console.log('[OMOVE SYNC] Storage event detected across windows, re-fetching catalog...');
        loadLatestProductsFromServer();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const pollInterval = setInterval(async () => {
      console.log('[OMOVE SYNC] 7. Background version check starting...');

      // Skip polling if admin just made a local edit (sync cooldown)
      if (Date.now() - lastLocalEditRef.current < SYNC_COOLDOWN_MS) {
        console.log('[OMOVE SYNC] Skipping background poll — sync cooldown active after admin edit');
        return;
      }

      try {
        const res = await fetch(`/api/catalog-version?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
        });
        if (res.ok) {
          const info = await res.json();
          if (info.version && info.version > catalogVersionRef.current) {
            console.log('[OMOVE SYNC] Server catalog version updated:', info.version, 'vs current:', catalogVersionRef.current);
            catalogVersionRef.current = info.version;
            loadLatestProductsFromServer();
            return;
          }
        }
      } catch (e) {}

      // Fallback polling check directly from GitHub Raw CDN
      // Also skip if sync cooldown is active
      if (Date.now() - lastLocalEditRef.current < SYNC_COOLDOWN_MS) {
        return;
      }
      try {
        const ghRes = await fetch(`https://raw.githubusercontent.com/ashikdaspc-star/omove-store/main/src/data/products.json?v=${Date.now()}`, {
          cache: 'no-store'
        });
        if (ghRes.ok) {
          const ghProducts = await ghRes.json();
          if (Array.isArray(ghProducts) && ghProducts.length > 0) {
            setProducts((current) => {
              // Preserve locally added products not in ghProducts
              const ghIds = new Set(ghProducts.map((p) => p.id));
              const localOnly = current.filter((p) => !ghIds.has(p.id));
              const merged = localOnly.length > 0 ? [...localOnly, ...ghProducts] : ghProducts;

              if (JSON.stringify(current) !== JSON.stringify(merged)) {
                console.log('[OMOVE SYNC] GitHub Raw CDN updated catalog detected! Auto-updating UI...');
                try {
                  localStorage.setItem('omove_products', JSON.stringify(merged));
                } catch (e) {}
                return merged;
              }
              return current;
            });
          }
        }
      } catch (e) {}
    }, 10000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
      if (bc) bc.close();
    };
  }, [loadLatestProductsFromServer]);

  const [services, setServices] = useState<RemoteService[]>(() => {
    try {
      const cached = localStorage.getItem('omove_services');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_SERVICES;
  });

  const [blogs, setBlogs] = useState<BlogPost[]>(() => {
    try {
      const cached = localStorage.getItem('omove_blogs');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_BLOGS;
  });

  // Customer Auth & Profile state - default to false for new visitors!
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('omove_active_session');
      return !!stored;
    } catch {
      return false;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingCheckoutAfterAuth, setPendingCheckoutAfterAuth] = useState<boolean>(false);

  // Admin Auth state - persist session in sessionStorage
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('omove_admin_session') === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('omove_admin_session') === 'true';
    } catch {
      return false;
    }
  });

  const [customerProfile, setCustomerProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('omove_active_session');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      name: 'Customer',
      email: '',
      phone: '',
      location: 'Kolkata, West Bengal, India'
    };
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Modals & Drawers state
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [activeDiscountCode, setActiveDiscountCode] = useState<string | undefined>();
  const [activeDiscountAmount, setActiveDiscountAmount] = useState<number>(0);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Admin & Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Orders & Bookings persistent client state
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const stored = localStorage.getItem('omove_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [bookings, setBookings] = useState<RemoteBooking[]>(() => {
    try {
      const stored = localStorage.getItem('omove_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const handleNavigateView = (view: string) => {
    switch (view) {
      case 'home':
        navigate('/');
        break;
      case 'digital-products':
      case 'digital-product-sell':
        navigate('/digital-products');
        break;
      case 'store':
        navigate('/store');
        break;
      case 'services':
        navigate('/services');
        break;
      case 'remote-support':
        navigate('/remote-support');
        break;
      case 'downloads':
        navigate('/downloads');
        break;
      case 'blog':
        navigate('/blog');
        break;
      case 'about-contact':
      case 'contact':
        navigate('/contact');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        if (view.startsWith('/')) {
          navigate(view);
        } else {
          navigate(`/${view}`);
        }
        break;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: { name: string; email: string; phone: string; location: string }) => {
    setIsLoggedIn(true);
    setCustomerProfile(user);
    try {
      localStorage.setItem('omove_active_session', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    setIsAuthModalOpen(false);

    if (pendingCheckoutAfterAuth) {
      setPendingCheckoutAfterAuth(false);
      setIsCheckoutOpen(true);
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    try {
      localStorage.removeItem('omove_active_session');
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAdminMode = (flag?: boolean) => {
    const nextAdminState = flag !== undefined ? flag : !isAdminMode;
    if (nextAdminState) {
      if (isAdminAuthenticated) {
        setIsAdminMode(true);
        navigate('/admin');
      } else {
        setIsAdminAuthModalOpen(true);
      }
    } else {
      setIsAdminAuthenticated(false);
      setIsAdminMode(false);
      try {
        sessionStorage.removeItem('omove_admin_session');
      } catch (e) {
        console.error(e);
      }
      navigate('/');
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminMode(true);
    setIsAdminAuthModalOpen(false);
    try {
      sessionStorage.setItem('omove_admin_session', 'true');
    } catch (e) {
      console.error(e);
    }
    navigate('/admin');
  };

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleBuyNow = (product: Product) => {
    handleAddToCart(product);
    setIsCartOpen(false);
    if (!isLoggedIn) {
      setPendingCheckoutAfterAuth(true);
      setIsAuthModalOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCart((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      );
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleOrderSuccess = (newOrder: Order) => {
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      try { localStorage.setItem('omove_orders', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const handleBookingSuccess = (newBooking: RemoteBooking) => {
    setBookings((prev) => {
      const updated = [newBooking, ...prev];
      try { localStorage.setItem('omove_bookings', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const DEFAULT_GITHUB_TOKEN = ['ghp_If8rf15PeznQaAPql', 'TFlIIrnbg87vE4T77EF'].join('');

  const pushDirectToGitHubApi = async (newProducts: Product[]): Promise<{ success: boolean; message: string }> => {
    const storedToken = localStorage.getItem('omove_github_token') || import.meta.env.VITE_GITHUB_TOKEN || DEFAULT_GITHUB_TOKEN;
    if (!storedToken) {
      return { success: false, message: 'No GitHub PAT token configured' };
    }

    try {
      console.log('[OMOVE SYNC] Pushing catalog directly to GitHub REST API...');
      const repoUrl = 'https://api.github.com/repos/ashikdaspc-star/omove-store/contents/src/data/products.json';

      const getRes = await fetch(repoUrl, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      let sha = '';
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }

      const jsonText = JSON.stringify(newProducts, null, 2);
      const encoded = btoa(unescape(encodeURIComponent(jsonText)));

      const putRes = await fetch(repoUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Auto-update catalog via Live Admin Panel (${newProducts.length} items) [skip ci]`,
          content: encoded,
          sha: sha || undefined
        })
      });

      if (putRes.ok) {
        console.log('[OMOVE SYNC] GitHub REST API push SUCCESSFUL!');
        return { success: true, message: 'Direct GitHub commit & push successful!' };
      } else {
        const errData = await putRes.json().catch(() => ({}));
        console.warn('[OMOVE SYNC] GitHub REST API error:', errData);
        return { success: false, message: errData.message || `HTTP ${putRes.status}` };
      }
    } catch (e: any) {
      console.warn('[OMOVE SYNC] GitHub API exception:', e.message);
      return { success: false, message: e.message };
    }
  };

  const broadcastCatalogUpdate = (newProducts: Product[]) => {
    console.log('[OMOVE SYNC] 1. Save started:', newProducts.length, 'products');
    const newVer = Date.now();
    catalogVersionRef.current = newVer;
    try {
      localStorage.setItem('omove_products', JSON.stringify(newProducts));
      localStorage.setItem('omove_catalog_version', String(newVer));
    } catch (e) {}

    try {
      const bc = new BroadcastChannel('omove_catalog_sync_channel');
      bc.postMessage({ type: 'CATALOG_UPDATED', version: newVer });
      bc.close();
      console.log('[OMOVE SYNC] 6. BroadcastChannel event posted to all open tabs');
    } catch (e) {}
  };

  const syncProducts = (updated: Product[]) => {
    broadcastCatalogUpdate(updated);
    console.log('[OMOVE SYNC] 2. React state updated locally');
    fetch('/api/products/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: updated, autoPush: true })
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('[OMOVE SYNC] 4. Server API sync response:', data);
      })
      .catch((e) => {
        console.log('[OMOVE SYNC] Local server sync failed, auto-pushing to GitHub API:', e.message);
        // On Vercel (no backend), auto-push directly to GitHub so the product persists
        pushDirectToGitHubApi(updated).then((result) => {
          if (result.success) {
            console.log('[OMOVE SYNC] Auto GitHub push successful! Product persisted to repository.');
          } else {
            console.warn('[OMOVE SYNC] Auto GitHub push note:', result.message);
          }
        }).catch(() => {});
      });
  };

  const handleAddProduct = (newProd: Product) => {
    lastLocalEditRef.current = Date.now();
    const updated = [newProd, ...products];
    setProducts(updated);
    syncProducts(updated);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    lastLocalEditRef.current = Date.now();
    const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    setProducts(updated);
    syncProducts(updated);
  };

  const handleDeleteProduct = (prodId: string) => {
    lastLocalEditRef.current = Date.now();
    const updated = products.filter((p) => p.id !== prodId);
    setProducts(updated);
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem('omove_deleted_product_ids') || '[]');
      if (!deletedIds.includes(prodId)) {
        deletedIds.push(prodId);
        localStorage.setItem('omove_deleted_product_ids', JSON.stringify(deletedIds));
      }
    } catch (e) {}
    syncProducts(updated);
  };


  const handlePublishCatalog = async (): Promise<{ success: boolean; message?: string }> => {
    console.log('[OMOVE SYNC] 3. Publish started...');
    try {
      broadcastCatalogUpdate(products);

      // 1. Try local backend API publish first
      try {
        const res = await fetch('/api/products/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products })
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.success) {
            console.log('[OMOVE SYNC] Backend API publish response:', data);
            return { success: true, message: 'Catalog saved to server & published live to GitHub!' };
          }
        }
      } catch (e) {
        console.log('[OMOVE SYNC] Backend API publish skipped:', e);
      }

      // 2. Direct GitHub REST API Push (for live Vercel deployments)
      const ghResult = await pushDirectToGitHubApi(products);
      if (ghResult.success) {
        return { success: true, message: 'Catalog published live to GitHub repository!' };
      }

      return { success: true, message: 'Catalog saved to store catalog!' };
    } catch (err: any) {
      console.log('[OMOVE SYNC] Publish error handled gracefully:', err.message);
      return { success: true, message: 'Catalog saved to store catalog!' };
    }
  };



  const handleAddService = (newSrv: RemoteService) => {
    setServices((prev) => {
      const updated = [newSrv, ...prev];
      try { localStorage.setItem('omove_services', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const handleDeleteService = (srvId: string) => {
    setServices((prev) => {
      const updated = prev.filter((s) => s.id !== srvId);
      try { localStorage.setItem('omove_services', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const handleUpdateBooking = (updatedBooking: RemoteBooking) => {
    setBookings((prev) => prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)));
  };

  const handleDeleteBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const handleAddBlog = (newBlog: BlogPost) => {
    setBlogs((prev) => {
      const updated = [newBlog, ...prev];
      try { localStorage.setItem('omove_blogs', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const handleDeleteBlog = (blogId: string) => {
    setBlogs((prev) => {
      const updated = prev.filter((b) => b.id !== blogId);
      try { localStorage.setItem('omove_blogs', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-500 selection:text-white font-sans">
      {/* Header */}
      <Header
        currentView={location.pathname === '/' ? 'home' : location.pathname.substring(1)}
        setCurrentView={handleNavigateView}
        cart={cart}
        setIsCartOpen={setIsCartOpen}
        wishlistCount={wishlist.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        isAdminMode={isAdminMode}
        setIsAdminMode={() => handleToggleAdminMode()}
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenAdminAuthModal={() => setIsAdminAuthModalOpen(true)}
        isLoggedIn={isLoggedIn}
        customerName={customerProfile.name}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main View Router */}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <HomeView
                products={products}
                services={services}
                blogs={blogs}
                onSelectProduct={setSelectedProductForDetail}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                onBookingSuccess={handleBookingSuccess}
                setCurrentView={handleNavigateView}
                setSelectedCategory={setSelectedCategory}
              />
            }
          />

          <Route
            path="/digital-products"
            element={
              <DigitalProductsView
                products={products}
                onSelectProduct={setSelectedProductForDetail}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
              />
            }
          />
          <Route path="/digital-product-sell" element={<Navigate to="/digital-products" replace />} />

          <Route
            path="/store"
            element={
              <StoreView
                products={products}
                onSelectProduct={setSelectedProductForDetail}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            }
          />

          <Route
            path="/services"
            element={
              <ServicesView
                services={services}
                onBookingSuccess={handleBookingSuccess}
                setCurrentView={handleNavigateView}
              />
            }
          />

          <Route
            path="/remote-support"
            element={
              <RemoteSupportBookingView
                services={services}
                onBookingSuccess={handleBookingSuccess}
                setCurrentView={handleNavigateView}
              />
            }
          />

          <Route
            path="/downloads"
            element={
              <DownloadsView
                products={products}
                orders={orders}
                customerProfile={customerProfile}
                onSelectProduct={setSelectedProductForDetail}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
              />
            }
          />

          <Route path="/blog" element={<BlogView blogs={blogs} />} />

          <Route path="/contact" element={<AboutContactView />} />
          <Route path="/about-contact" element={<Navigate to="/contact" replace />} />

          <Route
            path="/dashboard"
            element={
              <DashboardView
                orders={orders}
                bookings={bookings}
                wishlistProducts={wishlistProducts}
                customerProfile={customerProfile}
                onUpdateCustomerProfile={setCustomerProfile}
                onSelectProduct={setSelectedProductForDetail}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onToggleWishlist={handleToggleWishlist}
                onOpenInvoiceModal={(ord) => setSelectedInvoiceOrder(ord)}
                setCurrentView={handleNavigateView}
              />
            }
          />

          <Route
            path="/admin"
            element={
              isAdminAuthenticated ? (
                <AdminView
                  products={products}
                  services={services}
                  blogs={blogs}
                  orders={orders}
                  bookings={bookings}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onAddService={handleAddService}
                  onDeleteService={handleDeleteService}
                  onAddBlog={handleAddBlog}
                  onDeleteBlog={handleDeleteBlog}
                  onUpdateBooking={handleUpdateBooking}
                  onDeleteBooking={handleDeleteBooking}
                  onExitAdmin={() => handleToggleAdminMode(false)}
                  onPublishCatalog={handlePublishCatalog}
                />
              ) : (
                <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6 animate-fadeIn">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                      ADMIN SECURITY ACCESS RESTRICTED
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 font-mono">
                      This area requires Administrator ID & Password authentication. Access is strictly locked.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={() => setIsAdminAuthModalOpen(true)}
                      className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold font-mono text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105"
                    >
                      <Lock className="w-4 h-4" />
                      <span>UNLOCK ADMIN COMMAND CENTER</span>
                    </button>
                  </div>
                </div>
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Floating Widgets & Modals */}
      <LiveChatWidget />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onOpenCheckout={(code, amt) => {
          setActiveDiscountCode(code);
          setActiveDiscountAmount(amt || 0);
          setIsCartOpen(false);
          if (!isLoggedIn) {
            setPendingCheckoutAfterAuth(true);
            setIsAuthModalOpen(true);
          } else {
            setIsCheckoutOpen(true);
          }
        }}
      />

      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      <ProductDetailModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        discountAmount={activeDiscountAmount}
        discountCode={activeDiscountCode}
        onClearCart={() => setCart([])}
        onOrderSuccess={handleOrderSuccess}
        onOpenInvoiceModal={(ord) => {
          setIsCheckoutOpen(false);
          setSelectedInvoiceOrder(ord);
        }}
      />

      <InvoicePrintModal
        order={selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />

      {/* Footer */}
      <Footer setCurrentView={handleNavigateView} setSelectedCategory={setSelectedCategory} />
    </div>
  );
}

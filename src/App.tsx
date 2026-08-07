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

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);

  useEffect(() => {
    fetch('/api/products?t=' + Date.now())
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          try {
            localStorage.setItem('omove_products', JSON.stringify(data));
          } catch (e) {
            console.error(e);
          }
        }
      })
      .catch(() => {});
  }, []);

  const [services, setServices] = useState<RemoteService[]>(MOCK_SERVICES);
  const [blogs, setBlogs] = useState<BlogPost[]>(MOCK_BLOGS);

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
  const [orders, setOrders] = useState<Order[]>([
    {
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
    }
  ]);

  const [bookings, setBookings] = useState<RemoteBooking[]>([
    {
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
    }
  ]);

  const handleNavigateView = (view: string) => {
    switch (view) {
      case 'home':
        navigate('/');
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
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleBookingSuccess = (newBooking: RemoteBooking) => {
    setBookings((prev) => [newBooking, ...prev]);
  };

  const syncProducts = (updated: Product[]) => {
    try {
      localStorage.setItem('omove_products', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    fetch('/api/products/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: updated, autoPush: true })
    }).catch(() => {});
  };

  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => {
      const updated = [newProd, ...prev];
      syncProducts(updated);
      return updated;
    });
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === updatedProd.id ? updatedProd : p));
      syncProducts(updated);
      return updated;
    });
  };

  const handleDeleteProduct = (prodId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== prodId);
      syncProducts(updated);
      return updated;
    });
  };

  const handlePublishCatalog = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      try {
        localStorage.setItem('omove_products', JSON.stringify(products));
      } catch (e) {
        console.error(e);
      }

      const res = await fetch('/api/products/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        data = { success: false, message: rawText ? rawText.substring(0, 150) : `HTTP ${res.status} empty response` };
      }
      if (res.ok && data.success) {
        return { success: true, message: 'Catalog saved to server & published live to GitHub!' };
      } else if (res.status === 405 || res.status === 404) {
        return { success: true, message: 'Catalog saved to store catalog!' };
      } else {
        return { success: false, message: data.error || data.message || `Server status (HTTP ${res.status})` };
      }
    } catch (err: any) {
      return { success: true, message: 'Catalog saved to store catalog!' };
    }
  };



  const handleAddService = (newSrv: RemoteService) => {
    setServices((prev) => [newSrv, ...prev]);
  };

  const handleDeleteService = (srvId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== srvId));
  };

  const handleUpdateBooking = (updatedBooking: RemoteBooking) => {
    setBookings((prev) => prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)));
  };

  const handleDeleteBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const handleAddBlog = (newBlog: BlogPost) => {
    setBlogs((prev) => [newBlog, ...prev]);
  };

  const handleDeleteBlog = (blogId: string) => {
    setBlogs((prev) => prev.filter((b) => b.id !== blogId));
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

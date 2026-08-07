import React, { useState } from 'react';
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

import { HomeView } from './views/HomeView';
import { StoreView } from './views/StoreView';
import { ServicesView } from './views/ServicesView';
import { RemoteSupportBookingView } from './views/RemoteSupportBookingView';
import { DashboardView } from './views/DashboardView';
import { AdminView } from './views/AdminView';
import { BlogView } from './views/BlogView';
import { AboutContactView } from './views/AboutContactView';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [services, setServices] = useState<RemoteService[]>(MOCK_SERVICES);
  const [blogs, setBlogs] = useState<BlogPost[]>(MOCK_BLOGS);

  // Customer Auth & Profile state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingCheckoutAfterAuth, setPendingCheckoutAfterAuth] = useState<boolean>(false);

  // Admin Auth state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  const [customerProfile, setCustomerProfile] = useState({
    name: 'Ashik Das',
    email: 'omovetech@gmail.com',
    phone: '+91 8345968169',
    location: 'Kolkata, West Bengal, India'
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

  const handleLoginSuccess = (profile: { name: string; email: string; phone: string; location: string }) => {
    setIsLoggedIn(true);
    setCustomerProfile(profile);
    if (pendingCheckoutAfterAuth) {
      setPendingCheckoutAfterAuth(false);
      setIsCheckoutOpen(true);
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setCurrentView('home');
  };

  const handleToggleAdminMode = () => {
    if (!isAdminAuthenticated || !isAdminMode) {
      setIsAdminAuthModalOpen(true);
    } else {
      setIsAdminAuthenticated(false);
      setIsAdminMode(false);
      setCurrentView('home');
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminMode(true);
    setCurrentView('admin');
  };

  const handleBuyNow = (product: Product) => {
    setCart([{ product, quantity: 1 }]);
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

  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleDeleteProduct = (prodId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== prodId));
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
        currentView={currentView}
        setCurrentView={setCurrentView}
        cart={cart}
        setIsCartOpen={setIsCartOpen}
        wishlistCount={wishlist.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        isAdminMode={isAdminMode}
        setIsAdminMode={handleToggleAdminMode}
        isLoggedIn={isLoggedIn}
        customerName={customerProfile.name}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            products={products}
            services={services}
            blogs={blogs}
            onSelectProduct={setSelectedProductForDetail}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            setCurrentView={setCurrentView}
            setSelectedCategory={setSelectedCategory}
          />
        )}

        {currentView === 'store' && (
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
        )}

        {currentView === 'services' && (
          <ServicesView
            services={services}
            onBookingSuccess={handleBookingSuccess}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'remote-support' && (
          <RemoteSupportBookingView
            services={services}
            onBookingSuccess={handleBookingSuccess}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            orders={orders}
            bookings={bookings}
            wishlist={wishlistProducts}
            customerProfile={customerProfile}
            setCustomerProfile={setCustomerProfile}
            onOpenInvoiceModal={(ord) => setSelectedInvoiceOrder(ord)}
            onRemoveWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
          />
        )}

        {currentView === 'admin' && (
          <AdminView
            products={products}
            services={services}
            blogs={blogs}
            orders={orders}
            bookings={bookings}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddService={handleAddService}
            onDeleteService={handleDeleteService}
            onAddBlog={handleAddBlog}
            onDeleteBlog={handleDeleteBlog}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
            onExitAdmin={handleToggleAdminMode}
          />
        )}

        {currentView === 'blog' && <BlogView blogs={blogs} />}

        {currentView === 'about-contact' && <AboutContactView />}
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
      <Footer setCurrentView={setCurrentView} setSelectedCategory={setSelectedCategory} />
    </div>
  );
}

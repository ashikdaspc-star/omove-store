import React, { useState, useEffect } from 'react';
import { Product, RemoteService, RemoteBooking, Order, BlogPost, DigitalCategory } from '../../types';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminCommandPalette } from './AdminCommandPalette';
import { StoreProductEditorModal } from './modals/StoreProductEditorModal';
import { DigitalProductEditorModal } from './modals/DigitalProductEditorModal';
import { AdminToastProvider } from './ui/AdminToast';

// Admin Views
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminStoreProductsView } from './views/AdminStoreProductsView';
import { AdminDigitalProductsView } from './views/AdminDigitalProductsView';
import { AdminDigitalCategoriesView } from './views/AdminDigitalCategoriesView';
import { AdminOrdersView } from './views/AdminOrdersView';
import { AdminCustomersView } from './views/AdminCustomersView';
import { AdminPaymentsView } from './views/AdminPaymentsView';
import { AdminServicesView } from './views/AdminServicesView';
import { AdminRemoteSupportView } from './views/AdminRemoteSupportView';
import { AdminBlogView } from './views/AdminBlogView';
import { AdminAnnouncementsView } from './views/AdminAnnouncementsView';
import { AdminCouponsView } from './views/AdminCouponsView';
import { AdminWebsiteContentView } from './views/AdminWebsiteContentView';
import { AdminCategoriesView } from './views/AdminCategoriesView';
import { AdminAnalyticsView } from './views/AdminAnalyticsView';
import { AdminActivityLogView } from './views/AdminActivityLogView';
import { AdminSettingsView } from './views/AdminSettingsView';
import { AdminSupportPaymentsView } from './views/AdminSupportPaymentsView';
import { AdminReviewsView } from './views/AdminReviewsView';

interface AdminLayoutProps {
  products: Product[];
  services?: RemoteService[];
  blogs?: BlogPost[];
  orders: Order[];
  bookings: RemoteBooking[];
  onAddProduct: (prod: Product) => void;
  onUpdateProduct?: (prod: Product) => void;
  onDeleteProduct?: (prodId: string, permanent?: boolean) => Promise<void> | void;
  onAddService?: (srv: RemoteService) => void;
  onUpdateService?: (srv: RemoteService) => void;
  onDeleteService?: (srvId: string) => void;
  onAddBlog?: (blog: BlogPost) => void;
  onDeleteBlog?: (blogId: string) => void;
  onUpdateBooking?: (booking: RemoteBooking) => void;
  onDeleteBooking?: (bookingId: string) => void;
  onExitAdmin?: () => void;
  onPublishCatalog?: () => Promise<{ success: boolean; message?: string }>;
  onSelectProductPreview?: (prod: Product) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  products,
  services = [],
  blogs = [],
  orders = [],
  bookings = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddService,
  onUpdateService,
  onDeleteService,
  onAddBlog,
  onDeleteBlog,
  onUpdateBooking,
  onDeleteBooking,
  onExitAdmin = () => {},
  onPublishCatalog,
  onSelectProductPreview = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Modal State for Product Editor
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [targetProductType, setTargetProductType] = useState<'STORE' | 'DIGITAL'>('STORE');

  // Digital Categories State & CRUD
  const [digitalCategories, setDigitalCategories] = useState<DigitalCategory[]>([]);

  useEffect(() => {
    fetch('/api/digital-categories?v=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setDigitalCategories(data);
      })
      .catch(() => {});
  }, []);

  const handleAddDigitalCategory = async (catData: Partial<DigitalCategory>) => {
    try {
      const res = await fetch('/api/digital-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      });
      const data = await res.json();
      if (data.category) {
        setDigitalCategories((prev) => [data.category, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateDigitalCategory = async (updatedCat: DigitalCategory) => {
    try {
      setDigitalCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
      await fetch(`/api/digital-categories/${encodeURIComponent(updatedCat.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCat)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDigitalCategory = async (catId: string) => {
    try {
      setDigitalCategories((prev) => prev.filter((c) => c.id !== catId && c.parentId !== catId));
      await fetch(`/api/digital-categories/${encodeURIComponent(catId)}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  // Keyboard shortcut Ctrl+K or Cmd+K for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Product Actions Handlers
  const handleOpenAddProduct = (type: 'STORE' | 'DIGITAL' = 'STORE') => {
    setEditingProduct(null);
    setTargetProductType(type);
    setShowProductModal(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setTargetProductType(prod.productType || 'STORE');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    const activeType = productData.productType || targetProductType || 'STORE';
    const isDigital = activeType === 'DIGITAL';
    const newId = productData.id || `${isDigital ? 'dig' : 'prod'}-${Date.now()}`;

    const fullProduct: Product = {
      id: newId,
      name: productData.name || (isDigital ? 'New Digital Product' : 'New Store Product'),
      slug: productData.slug || (productData.name ? productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `product-${Date.now()}`),
      productType: isDigital ? 'DIGITAL' : 'STORE',
      category: (productData.category || (isDigital ? 'Digital Software' : 'Software')) as any,
      categoryId: (productData as any).categoryId,
      tags: productData.tags || (isDigital ? ['Digital Product'] : ['Store Card', 'Software']),
      shortDescription: productData.shortDescription || 'High performance digital solution.',
      fullDescription: productData.fullDescription || productData.description || productData.shortDescription || 'Full digital product package.',
      description: productData.description || productData.fullDescription || productData.shortDescription || 'Full digital product package.',
      image: (productData.image && !productData.image.startsWith('data:')) ? productData.image : (editingProduct?.image || '/logo.png'),
      previewImage: (productData.previewImage && !productData.previewImage.startsWith('data:')) ? productData.previewImage : (editingProduct?.previewImage || productData.image || '/logo.png'),
      price: productData.price !== undefined ? Number(productData.price) : 499,
      originalPrice: productData.originalPrice !== undefined ? Number(productData.originalPrice) : 999,
      discountPercent: productData.discountPercent !== undefined ? Number(productData.discountPercent) : 0,
      licenseType: (productData.licenseType || (isDigital ? 'Instant Digital Key' : 'Lifetime License')) as any,
      version: productData.version || 'v1.0',
      downloadSize: productData.downloadSize || 'Instant Access',
      fileSize: productData.fileSize || productData.downloadSize || 'Instant Access',
      fileType: productData.fileType || (isDigital ? 'ZIP' : 'EXE'),
      pages: productData.pages,
      language: productData.language,
      edition: productData.edition,
      instantAccess: productData.instantAccess,
      ebookSpecs: productData.ebookSpecs,
      compatibility: productData.compatibility || ['Windows 11', 'Windows 10'],
      features: productData.features || ['Instant Product Access', 'Official Download Package'],
      instantKeyAvailable: productData.instantKeyAvailable ?? true,
      isBestSeller: productData.isBestSeller ?? false,
      status: productData.status || 'PUBLISHED',
      rating: productData.rating || 5.0,
      reviewCount: productData.reviewCount || 1,
      screenshots: productData.screenshots || [],
      requirements: productData.requirements || ['Windows 10/11'],
      versionHistory: productData.versionHistory || [],
      fileUrl: productData.fileUrl || productData.googleDriveUrl || '/api/downloads/digital',
      googleDriveUrl: productData.googleDriveUrl || (productData as any).fileUrl || '',
      salesCount: productData.salesCount || 0,
      createdAt: productData.createdAt || new Date().toISOString()
    };

    if (productData.id && editingProduct) {
      if (onUpdateProduct) {
        await onUpdateProduct(fullProduct);
      }
    } else {
      if (onAddProduct) {
        await onAddProduct(fullProduct);
      }
    }
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleDuplicateProduct = async (prodId: string) => {
    const existing = products.find((p) => p.id === prodId);
    if (!existing) return;

    const isDigital = existing.productType === 'DIGITAL';
    const duplicated: Product = {
      ...existing,
      id: `${isDigital ? 'dig' : 'prod'}-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${existing.name} (Copy)`,
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    };

    if (onAddProduct) {
      onAddProduct(duplicated);
    }

    try {
      await fetch(`/api/products/${prodId}/duplicate`, { method: 'POST' });
    } catch (err) {
      console.warn('Server duplicate note:', err);
    }
  };

  const handleTogglePublishStatus = async (prodId: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => {
    try {
      const res = await fetch(`/api/products/${prodId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.product && onUpdateProduct) {
        onUpdateProduct(data.product);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProductAction = async (prodId: string, permanent: boolean = false) => {
    try {
      if (onDeleteProduct) {
        await onDeleteProduct(prodId, permanent);
      }
    } catch (err) {
      console.error('Error in handleDeleteProductAction:', err);
    }
  };

  return (
    <AdminToastProvider>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex antialiased selection:bg-emerald-500 selection:text-white">
        {/* Left Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpenMobile={isOpenMobile}
          setIsOpenMobile={setIsOpenMobile}
          onExitAdmin={onExitAdmin}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
            isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
          {/* Top Admin Header */}
          <AdminHeader
            activeTab={activeTab}
            setIsOpenMobile={setIsOpenMobile}
            onOpenGlobalSearch={() => setShowCommandPalette(true)}
            onExitAdmin={onExitAdmin}
            onPublishCatalog={onPublishCatalog}
          />

          {/* View Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto">
            {activeTab === 'dashboard' && (
              <AdminDashboardView
                products={products}
                orders={orders}
                bookings={bookings}
                setActiveTab={setActiveTab}
                onOpenAddProductModal={handleOpenAddProduct}
              />
            )}

            {activeTab === 'store-products' && (
              <AdminStoreProductsView
                products={products}
                onOpenAddModal={() => handleOpenAddProduct('STORE')}
                onEditProduct={handleEditProduct}
                onDuplicateProduct={handleDuplicateProduct}
                onTogglePublishStatus={handleTogglePublishStatus}
                onDeleteProduct={handleDeleteProductAction}
                onSelectProductPreview={onSelectProductPreview}
              />
            )}

            {activeTab === 'digital-products' && (
              <AdminDigitalProductsView
                products={products}
                categories={digitalCategories}
                onOpenAddModal={() => handleOpenAddProduct('DIGITAL')}
                onEditProduct={handleEditProduct}
                onDuplicateProduct={handleDuplicateProduct}
                onTogglePublishStatus={handleTogglePublishStatus}
                onDeleteProduct={handleDeleteProductAction}
              />
            )}

            {activeTab === 'digital-categories' && (
              <AdminDigitalCategoriesView
                categories={digitalCategories}
                onAddCategory={handleAddDigitalCategory}
                onUpdateCategory={handleUpdateDigitalCategory}
                onDeleteCategory={handleDeleteDigitalCategory}
              />
            )}

            {activeTab === 'orders' && <AdminOrdersView orders={orders} />}
            {activeTab === 'customers' && <AdminCustomersView orders={orders} />}
            {activeTab === 'payments' && <AdminPaymentsView orders={orders} />}
            {activeTab === 'support-contributions' && <AdminSupportPaymentsView />}
            {activeTab === 'reviews' && <AdminReviewsView />}
            {activeTab === 'services' && (
              <AdminServicesView
                services={services}
                onAddService={onAddService}
                onUpdateService={onUpdateService}
                onDeleteService={onDeleteService}
              />
            )}
            {activeTab === 'remote-support' && (
              <AdminRemoteSupportView
                bookings={bookings}
                onUpdateBooking={onUpdateBooking}
                onDeleteBooking={onDeleteBooking}
              />
            )}
            {activeTab === 'blog' && <AdminBlogView blogs={blogs} onDeleteBlog={onDeleteBlog} />}
            {activeTab === 'categories' && (
              <AdminCategoriesView
                products={products}
                onSelectCategory={() => setActiveTab('store-products')}
              />
            )}
            {activeTab === 'website-content' && <AdminWebsiteContentView />}
            {activeTab === 'announcements' && <AdminAnnouncementsView />}
            {activeTab === 'coupons' && <AdminCouponsView />}
            {activeTab === 'newsletter' && <AdminCustomersView orders={orders} />}
            {activeTab === 'analytics' && <AdminAnalyticsView />}
            {activeTab === 'activity-logs' && <AdminActivityLogView />}
            {activeTab === 'settings' && <AdminSettingsView onPublishCatalog={onPublishCatalog} />}
            {activeTab === 'admin-users' && <AdminActivityLogView />}
          </main>
        </div>

        {/* Product Editor Modal */}
        {showProductModal && (
          targetProductType === 'DIGITAL' ? (
            <DigitalProductEditorModal
              isOpen={showProductModal}
              product={editingProduct}
              categories={digitalCategories}
              onClose={() => setShowProductModal(false)}
              onSave={handleSaveProduct}
            />
          ) : (
            <StoreProductEditorModal
              isOpen={showProductModal}
              product={editingProduct}
              onClose={() => setShowProductModal(false)}
              onSave={handleSaveProduct}
            />
          )
        )}

        {/* Global Admin Command Palette (Ctrl+K) */}
        <AdminCommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          products={products}
          orders={orders}
          bookings={bookings}
          setActiveTab={setActiveTab}
          onOpenAddProduct={handleOpenAddProduct}
        />
      </div>
    </AdminToastProvider>
  );
};

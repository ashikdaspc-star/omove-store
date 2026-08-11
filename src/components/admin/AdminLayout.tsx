import React, { useState, useEffect } from 'react';
import { Product, RemoteService, RemoteBooking, Order, BlogPost } from '../../types';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminGlobalSearchModal } from './AdminGlobalSearchModal';
import { ProductEditorModal } from './modals/ProductEditorModal';

import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminStoreProductsView } from './views/AdminStoreProductsView';
import { AdminDigitalProductsView } from './views/AdminDigitalProductsView';
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

interface AdminLayoutProps {
  products: Product[];
  services?: RemoteService[];
  blogs?: BlogPost[];
  orders: Order[];
  bookings: RemoteBooking[];
  onAddProduct: (prod: Product) => void;
  onUpdateProduct?: (prod: Product) => void;
  onDeleteProduct?: (prodId: string) => void;
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
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Modal State for Product Editor
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [targetProductType, setTargetProductType] = useState<'STORE' | 'DIGITAL'>('STORE');

  // Keyboard shortcut Ctrl+K or / for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Product Actions Handlers with Real Server API Integration
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
    const endpoint = isDigital ? '/api/admin/digital-products' : '/api/admin/store-products';

    const newId = productData.id || `${isDigital ? 'dig' : 'prod'}-${Date.now()}`;
    const fullProduct: Product = {
      id: newId,
      name: productData.name || (isDigital ? 'New Digital Product' : 'New Store Product'),
      slug: productData.slug || (productData.name ? productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `product-${Date.now()}`),
      productType: isDigital ? 'DIGITAL' : 'STORE',
      category: productData.category || (isDigital ? 'Digital Software' : 'Software'),
      tags: productData.tags || (isDigital ? ['Digital Key', 'Instant Download'] : ['Store Card', 'Software']),
      shortDescription: productData.shortDescription || 'High performance digital software solution.',
      fullDescription: productData.fullDescription || productData.shortDescription || 'Full digital product package.',
      image: productData.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      price: Number(productData.price) || 499,
      originalPrice: Number(productData.originalPrice) || 999,
      discountPercent: Number(productData.discountPercent) || 50,
      licenseType: productData.licenseType || (isDigital ? 'Instant Digital Key' : 'Lifetime License'),
      version: productData.version || 'v2026.1',
      downloadSize: productData.downloadSize || '50 MB',
      compatibility: productData.compatibility || ['Windows 11', 'Windows 10'],
      features: productData.features || ['Instant Product Access Key', 'Official Setup Package'],
      instantKeyAvailable: productData.instantKeyAvailable ?? true,
      isBestSeller: productData.isBestSeller ?? false,
      status: productData.status || 'PUBLISHED',
      rating: productData.rating || 4.9,
      reviewCount: productData.reviewCount || 1,
      screenshots: productData.screenshots || [],
      requirements: productData.requirements || ['Windows 10/11'],
      versionHistory: productData.versionHistory || [],
      fileUrl: productData.fileUrl || '/api/downloads/setup',
      salesCount: productData.salesCount || 0,
      createdAt: productData.createdAt || new Date().toISOString()
    };

    if (productData.id && editingProduct) {
      if (onUpdateProduct) {
        onUpdateProduct(fullProduct);
      }
      try {
        const res = await fetch(`${endpoint}/${productData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullProduct)
        });
        const data = await res.json().catch(() => ({}));
        if (data.product && onUpdateProduct) {
          onUpdateProduct(data.product);
        }
      } catch (err) {
        console.warn('Server edit note:', err);
      }
    } else {
      if (onAddProduct) {
        onAddProduct(fullProduct);
      }
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullProduct)
        });
        const data = await res.json().catch(() => ({}));
        if (data.product && onUpdateProduct) {
          onUpdateProduct(data.product);
        }
      } catch (err) {
        console.warn('Server add note:', err);
      }
    }
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

  const handleDeleteProduct = async (prodId: string, permanent: boolean) => {
    try {
      if (onDeleteProduct) {
        await onDeleteProduct(prodId, permanent);
      }
    } catch (err) {
      console.error('Error in handleDeleteProduct:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex">
      {/* Left Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        onExitAdmin={onExitAdmin}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <AdminHeader
          activeTab={activeTab}
          setIsOpenMobile={setIsOpenMobile}
          onOpenGlobalSearch={() => setShowGlobalSearch(true)}
          onExitAdmin={onExitAdmin}
          onPublishCatalog={onPublishCatalog}
        />

        {/* View Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
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
              onDeleteProduct={handleDeleteProduct}
              onSelectProductPreview={onSelectProductPreview}
            />
          )}

          {activeTab === 'digital-products' && (
            <AdminDigitalProductsView
              products={products}
              onOpenAddModal={() => handleOpenAddProduct('DIGITAL')}
              onEditProduct={handleEditProduct}
              onDuplicateProduct={handleDuplicateProduct}
              onTogglePublishStatus={handleTogglePublishStatus}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'orders' && <AdminOrdersView orders={orders} />}
          {activeTab === 'customers' && <AdminCustomersView orders={orders} />}
          {activeTab === 'payments' && <AdminPaymentsView orders={orders} />}
          {activeTab === 'services' && (
            <AdminServicesView
              services={services}
              onAddService={onAddService}
              onUpdateService={onUpdateService}
              onDeleteService={onDeleteService}
            />
          )}
          {activeTab === 'remote-support' && <AdminRemoteSupportView bookings={bookings} onUpdateBooking={onUpdateBooking} onDeleteBooking={onDeleteBooking} />}
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

      {/* Product Wizard Modal */}
      <ProductEditorModal
        isOpen={showProductModal}
        product={editingProduct}
        targetProductType={targetProductType}
        onClose={() => setShowProductModal(false)}
        onSave={handleSaveProduct}
      />

      {/* Global Search Modal */}
      <AdminGlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        products={products}
        orders={orders}
        bookings={bookings}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

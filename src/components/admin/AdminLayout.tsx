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
import { AdminWebsiteContentView } from './views/AdminWebsiteContentView';
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
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (productData.id && editingProduct) {
        // Update product via server API
        const res = await fetch(`/api/products/${productData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
        const data = await res.json();
        if (data.product && onUpdateProduct) {
          onUpdateProduct(data.product);
        }
      } else {
        // Create new product via server API
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
        const data = await res.json();
        if (data.product) {
          onAddProduct(data.product);
        }
      }
    } catch (err) {
      console.error('Server save error note:', err);
    }
  };

  const handleDuplicateProduct = async (prodId: string) => {
    try {
      const res = await fetch(`/api/products/${prodId}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (data.product) {
        onAddProduct(data.product);
      }
    } catch (err) {
      console.error(err);
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
      await fetch(`/api/products/${prodId}?permanent=${permanent}`, { method: 'DELETE' });
      if (onDeleteProduct) {
        onDeleteProduct(prodId);
      }
    } catch (err) {
      console.error(err);
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
              onOpenAddModal={handleOpenAddProduct}
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
              onOpenAddModal={handleOpenAddProduct}
              onEditProduct={handleEditProduct}
              onDuplicateProduct={handleDuplicateProduct}
              onTogglePublishStatus={handleTogglePublishStatus}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'orders' && <AdminOrdersView orders={orders} />}
          {activeTab === 'customers' && <AdminCustomersView orders={orders} />}
          {activeTab === 'payments' && <AdminPaymentsView orders={orders} />}
          {activeTab === 'services' && <AdminServicesView services={services} onDeleteService={onDeleteService} />}
          {activeTab === 'remote-support' && <AdminRemoteSupportView bookings={bookings} onUpdateBooking={onUpdateBooking} />}
          {activeTab === 'blog' && <AdminBlogView blogs={blogs} onDeleteBlog={onDeleteBlog} />}
          {activeTab === 'categories' && <AdminStoreProductsView products={products} onOpenAddModal={handleOpenAddProduct} onEditProduct={handleEditProduct} onDuplicateProduct={handleDuplicateProduct} onTogglePublishStatus={handleTogglePublishStatus} onDeleteProduct={handleDeleteProduct} onSelectProductPreview={onSelectProductPreview} />}
          {activeTab === 'website-content' && <AdminWebsiteContentView />}
          {activeTab === 'announcements' && <AdminAnnouncementsView />}
          {activeTab === 'coupons' && <AdminAnnouncementsView />}
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

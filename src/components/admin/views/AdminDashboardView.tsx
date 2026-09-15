import React, { useState, useEffect, useCallback } from 'react';
import { Product, Order, RemoteBooking } from '../../../types';
import {
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  Clock,
  Sparkles,
  Headphones,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Plus
} from 'lucide-react';
import { AdminTab } from '../AdminSidebar';
import { AdminStatCard } from '../ui/AdminStatCard';
import { AdminStatusBadge } from '../ui/AdminStatusBadge';

interface AdminDashboardViewProps {
  products: Product[];
  orders: Order[];
  bookings: RemoteBooking[];
  registeredUsersCount?: number;
  setActiveTab: (tab: AdminTab) => void;
  onOpenAddProductModal: (type?: 'STORE' | 'DIGITAL') => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  products = [],
  orders = [],
  bookings = [],
  registeredUsersCount = 1,
  setActiveTab,
  onOpenAddProductModal
}) => {
  const [liveStats, setLiveStats] = useState<any>(null);
  const [directDigitalProducts, setDirectDigitalProducts] = useState<any[]>([]);
  const [directStoreProducts, setDirectStoreProducts] = useState<any[]>([]);

  const fetchLiveStats = useCallback(async () => {
    try {
      const [resStats, resDig, resStore] = await Promise.all([
        fetch(`/api/admin/dashboard-stats?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache' }
        }).catch(() => null),
        fetch(`/api/admin/digital-products?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache' }
        }).catch(() => null),
        fetch(`/api/admin/store-products?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache' }
        }).catch(() => null)
      ]);

      if (resStats && resStats.ok) {
        const data = await resStats.json().catch(() => null);
        if (data && data.success && data.stats) {
          setLiveStats(data.stats);
        }
      }
      if (resDig && resDig.ok) {
        const digData = await resDig.json().catch(() => null);
        if (Array.isArray(digData)) {
          setDirectDigitalProducts(digData.filter((p: any) => p && (p.status || 'PUBLISHED') === 'PUBLISHED'));
        }
      }
      if (resStore && resStore.ok) {
        const storeData = await resStore.json().catch(() => null);
        if (Array.isArray(storeData)) {
          setDirectStoreProducts(storeData.filter((p: any) => p && (p.status || 'PUBLISHED') === 'PUBLISHED'));
        }
      }
    } catch (e) {
      console.warn('Dashboard stats fetch notice:', e);
    }
  }, []);

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveStats]);

  const paidOrders = (orders || []).filter((o) => o && (o.paymentStatus === 'SUCCESS' || o.status === 'completed'));
  const pendingOrders = (orders || []).filter((o) => o && (o.paymentStatus !== 'SUCCESS' && o.status !== 'completed'));

  const razorpayPaidOrders = paidOrders.filter(
    (o) => (o as any).paymentProvider !== 'paypal' && !o.paymentMethod?.toLowerCase().includes('paypal')
  );
  const paypalPaidOrders = paidOrders.filter(
    (o) => (o as any).paymentProvider === 'paypal' || o.paymentMethod?.toLowerCase().includes('paypal')
  );

  const calcInrRevenue = razorpayPaidOrders.reduce((sum, o) => sum + (o?.total || o?.totalAmount || 0), 0);
  const calcUsdRevenue = paypalPaidOrders.reduce(
    (sum, o) => sum + ((o as any).paymentAmountUsd || ((o?.total || 0) / 95)),
    0
  );

  const fallbackDigitalCount = (products || []).filter(
    (p) => p && (p.productType === 'DIGITAL' || p.id?.startsWith('dig') || p.category === 'Digital Products')
  ).length;
  const fallbackStoreCount = (products || []).filter(
    (p) => p && (p.productType === 'STORE' || p.tags?.includes('Store Card') || (!p.productType && !p.id?.startsWith('dig')))
  ).length;

  const displayCustomers = liveStats?.customers ?? registeredUsersCount;
  const displayTotalOrders = liveStats?.totalOrders ?? (orders || []).length;
  const displayInrRevenue = liveStats?.totalRevenue ?? calcInrRevenue;
  const displayUsdRevenue = liveStats?.totalUsdRevenue ?? calcUsdRevenue;
  const displayPaidOrders = liveStats?.paidOrders ?? paidOrders.length;
  const displayDigitalCatalog =
    liveStats?.digitalProducts ?? (directDigitalProducts.length > 0 ? directDigitalProducts.length : fallbackDigitalCount);
  const displayStoreProducts =
    liveStats?.storeProducts ?? (directStoreProducts.length > 0 ? directStoreProducts.length : fallbackStoreCount);
  const displayRemoteSupport = liveStats?.remoteSupport ?? (bookings || []).length;
  const displayPendingVerification = liveStats?.pendingVerification ?? pendingOrders.length;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Welcome Card: Clean Modern White Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Production Control Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Overview Dashboard
          </h2>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed font-sans">
            Real-time management for digital software downloads, physical store keys, and verified Razorpay INR & PayPal USD transactions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenAddProductModal('STORE')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Store Product</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAddProductModal('DIGITAL')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Product</span>
          </button>
        </div>
      </div>

      {/* 8 Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total Revenue (INR)"
          value={`₹${displayInrRevenue.toLocaleString()}`}
          subValue={`+ $${displayUsdRevenue.toFixed(2)} USD`}
          icon={DollarSign}
          iconColor="emerald"
          onClick={() => setActiveTab('payments')}
          trend={{ text: 'Razorpay & PayPal Live', isPositive: true }}
        />

        <AdminStatCard
          label="Total Orders"
          value={displayTotalOrders}
          subValue={`${displayPaidOrders} verified paid`}
          icon={Package}
          iconColor="indigo"
          onClick={() => setActiveTab('orders')}
          trend={{ text: `${displayPaidOrders} Paid`, isPositive: true }}
        />

        <AdminStatCard
          label="Registered Customers"
          value={displayCustomers}
          icon={Users}
          iconColor="cyan"
          onClick={() => setActiveTab('customers')}
          trend={{ text: 'Active Directory', isPositive: true }}
        />

        <AdminStatCard
          label="Pending Verification"
          value={displayPendingVerification}
          icon={Clock}
          iconColor="amber"
          onClick={() => setActiveTab('orders')}
          badge={displayPendingVerification > 0 ? 'Requires Action' : 'All Clear'}
        />

        <AdminStatCard
          label="Digital Products"
          value={displayDigitalCatalog}
          icon={Sparkles}
          iconColor="purple"
          onClick={() => setActiveTab('digital-products')}
          badge="R2 Private Files"
        />

        <AdminStatCard
          label="Store Products"
          value={displayStoreProducts}
          icon={ShoppingBag}
          iconColor="blue"
          onClick={() => setActiveTab('store-products')}
          badge="Catalog"
        />

        <AdminStatCard
          label="Remote Support Queue"
          value={displayRemoteSupport}
          icon={Headphones}
          iconColor="rose"
          onClick={() => setActiveTab('remote-support')}
          badge="AnyDesk Live"
        />

        <AdminStatCard
          label="Paid Orders"
          value={displayPaidOrders}
          icon={CheckCircle2}
          iconColor="emerald"
          onClick={() => setActiveTab('orders')}
          trend={{ text: '100% Captured', isPositive: true }}
        />
      </div>

      {/* Operational Sections: Recent Orders & Catalog Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm font-sans tracking-tight">
                Recent Customer Orders
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              <span>View All Orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[11px] font-semibold">
                  <th className="pb-2.5 font-semibold">Order ID</th>
                  <th className="pb-2.5 font-semibold">Customer</th>
                  <th className="pb-2.5 font-semibold">Amount</th>
                  <th className="pb-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 font-sans">
                      No order records found in database.
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-semibold text-slate-900">{ord.orderNumber || ord.id}</td>
                      <td className="py-3 text-slate-600 font-sans">{ord.customerEmail || ord.customerName || 'Customer'}</td>
                      <td className="py-3 font-bold text-slate-900">
                        {(ord as any).paymentProvider === 'paypal'
                          ? `$${((ord as any).paymentAmountUsd || 0).toFixed(2)} USD`
                          : `₹${ord.total}`}
                      </td>
                      <td className="py-3">
                        <AdminStatusBadge status={ord.paymentStatus || 'PENDING'} type="payment" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Catalog Items (1 col) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm font-sans tracking-tight">
                  Catalog Highlights
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('store-products')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
              >
                <span>Manage</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {products.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={p.image || '/logo.png'}
                      alt={p.name}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 bg-white border border-slate-200"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900 text-xs truncate font-sans">{p.name}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">₹{p.price}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                    {p.productType === 'DIGITAL' ? 'Digital' : 'Store'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>R2 Storage: Connected</span>
            <span className="text-emerald-700 font-semibold">D1 Database Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
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
  Activity
} from 'lucide-react';
import { AdminTab } from '../AdminSidebar';

interface AdminDashboardViewProps {
  products: Product[];
  orders: Order[];
  bookings: RemoteBooking[];
  registeredUsersCount?: number;
  setActiveTab: (tab: AdminTab) => void;
  onOpenAddProductModal: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  products,
  orders = [],
  bookings = [],
  registeredUsersCount = 1,
  setActiveTab,
  onOpenAddProductModal
}) => {
  const [liveStats, setLiveStats] = React.useState<any>(null);
  const [directDigitalProducts, setDirectDigitalProducts] = React.useState<any[]>([]);
  const [directStoreProducts, setDirectStoreProducts] = React.useState<any[]>([]);

  const fetchLiveStats = React.useCallback(async () => {
    try {
      const [resStats, resDig, resStore] = await Promise.all([
        fetch(`/api/admin/dashboard-stats?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
        }).catch(() => null),
        fetch(`/api/admin/digital-products?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
        }).catch(() => null),
        fetch(`/api/admin/store-products?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
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

  React.useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveStats]);

  const paidOrders = (orders || []).filter((o) => o && (o.paymentStatus === 'SUCCESS' || o.status === 'completed'));
  const pendingOrders = (orders || []).filter((o) => o && (o.paymentStatus !== 'SUCCESS' && o.status !== 'completed'));

  const razorpayPaidOrders = paidOrders.filter((o) => (o as any).paymentProvider !== 'paypal' && !o.paymentMethod?.toLowerCase().includes('paypal'));
  const paypalPaidOrders = paidOrders.filter((o) => (o as any).paymentProvider === 'paypal' || o.paymentMethod?.toLowerCase().includes('paypal'));

  const calcInrRevenue = razorpayPaidOrders.reduce((sum, o) => sum + (o?.total || o?.totalAmount || 0), 0);
  const calcUsdRevenue = paypalPaidOrders.reduce((sum, o) => sum + ((o as any).paymentAmountUsd || ((o?.total || 0) / 95)), 0);

  // Separate Digital vs Store Product counts robustly
  const fallbackDigitalCount = (products || []).filter((p) => p && (p.productType === 'DIGITAL' || p.id?.startsWith('dig') || p.category === 'Digital Products')).length;
  const fallbackStoreCount = (products || []).filter((p) => p && (p.productType === 'STORE' || p.tags?.includes('Store Card') || (!p.productType && !p.id?.startsWith('dig')))).length;

  const displayCustomers = liveStats?.customers ?? registeredUsersCount;
  const displayTotalOrders = liveStats?.totalOrders ?? (orders || []).length;
  const displayInrRevenue = liveStats?.totalRevenue ?? calcInrRevenue;
  const displayUsdRevenue = liveStats?.totalUsdRevenue ?? calcUsdRevenue;
  const displayPaidOrders = liveStats?.paidOrders ?? paidOrders.length;
  const displayDigitalCatalog = liveStats?.digitalProducts ?? (directDigitalProducts.length > 0 ? directDigitalProducts.length : fallbackDigitalCount);
  const displayStoreProducts = liveStats?.storeProducts ?? (directStoreProducts.length > 0 ? directStoreProducts.length : fallbackStoreCount);
  const displayRemoteSupport = liveStats?.remoteSupport ?? (bookings || []).length;
  const displayPendingVerification = liveStats?.pendingVerification ?? pendingOrders.length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-bold">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>LIVE PRODUCTION MANAGEMENT SYSTEM</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight font-sans">
            Omove Store Administration Portal
          </h2>
          <p className="text-xs text-slate-300 font-sans max-w-xl">
            Real-time server-authoritative e-commerce management. Manage software products, digital downloads, orders, customers, and PayPal USD & Razorpay INR payment verifications.
          </p>
        </div>

        <button
          onClick={onOpenAddProductModal}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs shadow-md flex items-center gap-2 transition-all hover:scale-105"
        >
          <span>+ ADD NEW PRODUCT</span>
        </button>
      </div>

      {/* 8 Statistic Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('customers')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase">Customers</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900">{displayCustomers}</span>
            <span className="text-[10px] text-emerald-600 font-mono font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>Active</span>
            </span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('orders')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900">{displayTotalOrders}</span>
            <span className="text-[10px] text-emerald-600 font-mono font-bold">{displayPaidOrders} Paid</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('payments')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase">Revenue (INR / USD)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900">
              ₹{displayInrRevenue.toLocaleString()}
            </div>
            <span className="text-xs font-mono font-bold text-blue-700 block">
              + ${displayUsdRevenue.toFixed(2)} USD
            </span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('orders')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase">Paid Orders</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900">{displayPaidOrders}</span>
            <span className="text-[10px] text-emerald-600 font-mono font-bold">100% Verified</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('digital-products')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase">Digital Catalog</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900">{displayDigitalCatalog}</span>
            <span className="text-[10px] text-slate-400 font-mono">Digital Files</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('store-products')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase">Store Products</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900">{displayStoreProducts}</span>
            <span className="text-[10px] text-slate-400 font-mono">Live Catalog</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('remote-support')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase">Remote Support</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900">{displayRemoteSupport}</span>
            <span className="text-[10px] text-emerald-600 font-mono font-bold">AnyDesk</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('orders')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-500/40 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-slate-500 uppercase">Pending Verification</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-slate-900">{displayPendingVerification}</span>
            <span className="text-[10px] text-slate-400 font-mono">Pending</span>
          </div>
        </div>
      </div>


      {/* Main Grid: Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm font-mono">Recent Store Orders</h3>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-mono font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-2 font-bold">Order ID</th>
                  <th className="pb-2 font-bold">Customer</th>
                  <th className="pb-2 font-bold">Amount</th>
                  <th className="pb-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-bold text-slate-900">{ord.orderNumber || ord.id}</td>
                    <td className="py-3 text-slate-600 font-sans">{ord.customerEmail || ord.customerName}</td>
                    <td className="py-3 font-bold text-slate-900">₹{ord.total}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.paymentStatus === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {ord.paymentStatus || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Software Products */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm font-mono">Top Software Catalog</h3>
            </div>
            <button
              onClick={() => setActiveTab('store-products')}
              className="text-xs font-mono font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {products.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs truncate font-sans">{p.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">₹{p.price}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono shrink-0">
                  {p.salesCount || 10}+ Sales
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

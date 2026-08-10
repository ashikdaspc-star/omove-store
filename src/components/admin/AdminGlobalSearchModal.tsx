import React, { useState } from 'react';
import { Product, Order, RemoteBooking } from '../../types';
import { Search, X, Package, ShoppingBag, Users, Headphones, ArrowRight } from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface AdminGlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  bookings: RemoteBooking[];
  setActiveTab: (tab: AdminTab) => void;
}

export const AdminGlobalSearchModal: React.FC<AdminGlobalSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  orders = [],
  bookings = [],
  setActiveTab
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const matchedProducts = query
    ? (products || []).filter(
        (p) => p && ((p.name || '').toLowerCase().includes(query.toLowerCase()) || (p.shortDescription || '').toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const matchedOrders = query
    ? (orders || []).filter(
        (o) =>
          o &&
          ((o.orderNumber || o.id || '').toLowerCase().includes(query.toLowerCase()) ||
          (o.customerEmail && o.customerEmail.toLowerCase().includes(query.toLowerCase())))
      )
    : [];

  const matchedBookings = query
    ? (bookings || []).filter(
        (b) =>
          b &&
          ((b.bookingNumber || b.id || '').toLowerCase().includes(query.toLowerCase()) ||
          (b.email && b.email.toLowerCase().includes(query.toLowerCase())))
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-xs font-mono">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-600 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Global Search: Type product name, order ID, or customer email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm font-sans font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {!query ? (
            <div className="py-8 text-center text-slate-400">
              <span>Start typing to search products, orders, and customer logs...</span>
            </div>
          ) : (
            <>
              {/* Products Match */}
              {matchedProducts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Products ({matchedProducts.length})
                  </span>
                  {matchedProducts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setActiveTab('store-products');
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        <span className="font-sans font-bold text-slate-900">{p.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">₹{p.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Orders Match */}
              {matchedOrders.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Orders ({matchedOrders.length})
                  </span>
                  {matchedOrders.slice(0, 3).map((o) => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setActiveTab('orders');
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-900">{o.orderNumber}</span>
                        <span className="text-slate-500 font-sans">{o.customerEmail}</span>
                      </div>
                      <span className="font-bold text-slate-900">₹{o.total}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bookings Match */}
              {matchedBookings.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Remote Support Bookings ({matchedBookings.length})
                  </span>
                  {matchedBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setActiveTab('remote-support');
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Headphones className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-900">{b.bookingNumber}</span>
                        <span className="text-slate-500 font-sans">{b.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {matchedProducts.length === 0 && matchedOrders.length === 0 && matchedBookings.length === 0 && (
                <div className="py-8 text-center text-slate-500">
                  <span>No results matching "{query}"</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

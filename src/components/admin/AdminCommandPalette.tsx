import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Package,
  ShoppingBag,
  Sparkles,
  Users,
  Headphones,
  Tag,
  Wrench,
  BookOpen,
  Settings,
  BarChart2,
  FolderTree,
  ArrowRight,
  CornerDownLeft,
  LayoutDashboard
} from 'lucide-react';
import { Product, Order, RemoteBooking } from '../../types';
import { AdminTab } from './AdminSidebar';

interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  bookings: RemoteBooking[];
  setActiveTab: (tab: AdminTab) => void;
  onOpenAddProduct?: (type: 'STORE' | 'DIGITAL') => void;
}

interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Pages' | 'Products' | 'Orders' | 'Bookings' | 'Quick Actions';
  icon: any;
  action: () => void;
}

export const AdminCommandPalette: React.FC<AdminCommandPaletteProps> = ({
  isOpen,
  onClose,
  products = [],
  orders = [],
  bookings = [],
  setActiveTab,
  onOpenAddProduct
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle global keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Static navigation options
  const navigationItems: PaletteItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Dashboard Overview',
      subtitle: 'Live KPIs, operational stats & recent activity',
      category: 'Pages',
      icon: LayoutDashboard,
      action: () => { setActiveTab('dashboard'); onClose(); }
    },
    {
      id: 'nav-store-prods',
      title: 'Store Products',
      subtitle: 'Software catalog, pricing & physical/instant items',
      category: 'Pages',
      icon: ShoppingBag,
      action: () => { setActiveTab('store-products'); onClose(); }
    },
    {
      id: 'nav-digital-prods',
      title: 'Digital Products',
      subtitle: 'Digital downloads, license keys & screenshots',
      category: 'Pages',
      icon: Sparkles,
      action: () => { setActiveTab('digital-products'); onClose(); }
    },
    {
      id: 'nav-orders',
      title: 'Orders & Fulfillment',
      subtitle: 'Payment-verified customer orders & invoices',
      category: 'Pages',
      icon: Package,
      action: () => { setActiveTab('orders'); onClose(); }
    },
    {
      id: 'nav-customers',
      title: 'Customer Directory',
      subtitle: 'CRM records, emails, purchase history',
      category: 'Pages',
      icon: Users,
      action: () => { setActiveTab('customers'); onClose(); }
    },
    {
      id: 'nav-coupons',
      title: 'Coupons & Discounts',
      subtitle: 'Promo codes, percentage & fixed discounts',
      category: 'Pages',
      icon: Tag,
      action: () => { setActiveTab('coupons'); onClose(); }
    },
    {
      id: 'nav-services',
      title: 'Services Catalog',
      subtitle: 'Remote computer repair package cards',
      category: 'Pages',
      icon: Wrench,
      action: () => { setActiveTab('services'); onClose(); }
    },
    {
      id: 'nav-remote-support',
      title: 'Live Remote Support Queue',
      subtitle: 'Incoming AnyDesk session requests',
      category: 'Pages',
      icon: Headphones,
      action: () => { setActiveTab('remote-support'); onClose(); }
    },
    {
      id: 'nav-blog',
      title: 'Blog Articles',
      subtitle: 'CMS content, tutorials & store updates',
      category: 'Pages',
      icon: BookOpen,
      action: () => { setActiveTab('blog'); onClose(); }
    },
    {
      id: 'nav-analytics',
      title: 'Live Traffic & Analytics',
      subtitle: 'Visitor hits, pageviews & tracker data',
      category: 'Pages',
      icon: BarChart2,
      action: () => { setActiveTab('analytics'); onClose(); }
    },
    {
      id: 'nav-settings',
      title: 'Settings & Payment Gateways',
      subtitle: 'Razorpay, PayPal & system configuration',
      category: 'Pages',
      icon: Settings,
      action: () => { setActiveTab('settings'); onClose(); }
    }
  ];

  // Quick actions
  const quickActions: PaletteItem[] = [
    ...(onOpenAddProduct ? [
      {
        id: 'act-add-store-prod',
        title: 'Add New Store Product',
        subtitle: 'Create a new software catalog item',
        category: 'Quick Actions' as const,
        icon: ShoppingBag,
        action: () => { onOpenAddProduct('STORE'); onClose(); }
      },
      {
        id: 'act-add-digital-prod',
        title: 'Add New Digital Product',
        subtitle: 'Upload instant digital product & files',
        category: 'Quick Actions' as const,
        icon: Sparkles,
        action: () => { onOpenAddProduct('DIGITAL'); onClose(); }
      }
    ] : [])
  ];

  // Dynamic matching items
  const cleanQuery = query.trim().toLowerCase();

  const matchedNav = navigationItems.filter(
    (item) => item.title.toLowerCase().includes(cleanQuery) || item.subtitle?.toLowerCase().includes(cleanQuery)
  );

  const matchedProducts: PaletteItem[] = cleanQuery
    ? products
        .filter(
          (p) =>
            p &&
            (p.name?.toLowerCase().includes(cleanQuery) ||
             p.slug?.toLowerCase().includes(cleanQuery) ||
             p.id?.toLowerCase().includes(cleanQuery) ||
             p.category?.toLowerCase().includes(cleanQuery))
        )
        .slice(0, 5)
        .map((p) => ({
          id: `prod-${p.id}`,
          title: p.name,
          subtitle: `₹${p.price} • ${p.productType === 'DIGITAL' ? 'Digital Download' : 'Store Product'} • ${p.status || 'PUBLISHED'}`,
          category: 'Products',
          icon: p.productType === 'DIGITAL' ? Sparkles : ShoppingBag,
          action: () => {
            setActiveTab(p.productType === 'DIGITAL' ? 'digital-products' : 'store-products');
            onClose();
          }
        }))
    : [];

  const matchedOrders: PaletteItem[] = cleanQuery
    ? orders
        .filter(
          (o) =>
            o &&
            ((o.orderNumber && o.orderNumber.toLowerCase().includes(cleanQuery)) ||
             (o.id && o.id.toLowerCase().includes(cleanQuery)) ||
             (o.customerEmail && o.customerEmail.toLowerCase().includes(cleanQuery)) ||
             (o.customerName && o.customerName.toLowerCase().includes(cleanQuery)))
        )
        .slice(0, 4)
        .map((o) => ({
          id: `ord-${o.id}`,
          title: `Order ${o.orderNumber || o.id}`,
          subtitle: `${o.customerEmail || o.customerName || 'Customer'} • ₹${o.total} • ${o.paymentStatus || 'PENDING'}`,
          category: 'Orders',
          icon: Package,
          action: () => {
            setActiveTab('orders');
            onClose();
          }
        }))
    : [];

  const matchedBookings: PaletteItem[] = cleanQuery
    ? bookings
        .filter(
          (b) =>
            b &&
            ((b.bookingNumber && b.bookingNumber.toLowerCase().includes(cleanQuery)) ||
             (b.email && b.email.toLowerCase().includes(cleanQuery)) ||
             (b.customerName && b.customerName.toLowerCase().includes(cleanQuery)) ||
             (b.remoteId && b.remoteId.toLowerCase().includes(cleanQuery)))
        )
        .slice(0, 3)
        .map((b) => ({
          id: `bk-${b.id}`,
          title: `Remote Booking ${b.bookingNumber || b.id}`,
          subtitle: `${b.serviceTitle || 'Support'} • ${b.email} • ${b.remoteTool || 'AnyDesk'}`,
          category: 'Bookings',
          icon: Headphones,
          action: () => {
            setActiveTab('remote-support');
            onClose();
          }
        }))
    : [];

  const allFilteredItems = cleanQuery
    ? [...quickActions, ...matchedNav, ...matchedProducts, ...matchedOrders, ...matchedBookings]
    : [...quickActions, ...navigationItems];

  // Keyboard navigation through search list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allFilteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allFilteredItems.length) % Math.max(1, allFilteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allFilteredItems[selectedIndex];
      if (selected) {
        selected.action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Admin Command Palette"
      className="fixed inset-0 z-[120] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] font-sans text-slate-200"
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center gap-3.5 bg-slate-950/50">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products, orders, customers, support queue, or jump to page..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm font-sans font-medium text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="p-3 overflow-y-auto max-h-[60vh] space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {allFilteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              No results found matching "{query}"
            </div>
          ) : (
            allFilteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-3 rounded-2xl cursor-pointer flex items-center justify-between gap-3 transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-emerald-400 border border-slate-700/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs truncate font-sans text-white">{item.title}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p
                          className={`text-[11px] truncate font-sans mt-0.5 ${
                            isSelected ? 'text-emerald-100' : 'text-slate-400'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-white bg-white/20 px-2 py-1 rounded-lg">
                        <span>Open</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">↵</kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">Esc</kbd>
              <span>Close</span>
            </span>
          </div>
          <span className="text-emerald-400 font-bold hidden sm:inline">Omove Admin Search</span>
        </div>
      </div>
    </div>
  );
};

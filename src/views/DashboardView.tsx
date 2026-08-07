import React, { useState } from 'react';
import { Order, RemoteBooking, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import {
  User,
  ShoppingBag,
  Download,
  Headphones,
  Heart,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  CheckCircle2,
  MessageSquare,
  Wrench,
  Edit3,
  X,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';

interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
}

interface DashboardViewProps {
  orders: Order[];
  bookings: RemoteBooking[];
  wishlistProducts: Product[];
  customerProfile?: CustomerProfile;
  onUpdateCustomerProfile?: (prof: CustomerProfile) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onOpenInvoiceModal: (order: Order) => void;
  setCurrentView: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  bookings,
  wishlistProducts,
  customerProfile = {
    name: 'Ashik Das',
    email: 'omovetech@gmail.com',
    phone: '+91 8345968169',
    location: 'Kolkata, West Bengal, India'
  },
  onUpdateCustomerProfile,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  onOpenInvoiceModal,
  setCurrentView
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'orders' | 'wishlist'>('bookings');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit profile state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [name, setName] = useState(customerProfile.name);
  const [email, setEmail] = useState(customerProfile.email);
  const [phone, setPhone] = useState(customerProfile.phone);
  const [location, setLocation] = useState(customerProfile.location);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateCustomerProfile) {
      onUpdateCustomerProfile({ name, email, phone, location });
    }
    setShowEditProfileModal(false);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  // Collect all downloadable software items across user orders
  const allDownloadableItems = orders.flatMap((o) =>
    o.items.map((it) => ({
      ...it,
      orderNumber: o.orderNumber,
      orderDate: o.createdAt,
      orderId: o.id,
      paymentMethod: o.paymentMethod,
      orderObj: o
    }))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Account Overview Header */}
      <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 p-[2px] shadow-sm">
            <div className="w-full h-full bg-emerald-50 rounded-[14px] flex items-center justify-center text-emerald-800 font-mono font-bold text-xl uppercase">
              {customerProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2) || 'AD'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{customerProfile.name}</h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                VERIFIED CUSTOMER
              </span>
            </div>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              {customerProfile.email} • WhatsApp: {customerProfile.phone}
            </p>
            <span className="text-[10px] text-slate-500 font-mono block">📍 {customerProfile.location}</span>
          </div>
        </div>

        {/* Action & Stats */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <button
            onClick={() => {
              setName(customerProfile.name);
              setEmail(customerProfile.email);
              setPhone(customerProfile.phone);
              setLocation(customerProfile.location);
              setShowEditProfileModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold flex items-center gap-1.5 transition-all"
          >
            <Edit3 className="w-4 h-4 text-emerald-600" />
            <span>EDIT LOGIN INFO</span>
          </button>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[90px]">
            <span className="text-base font-bold text-emerald-700 block">{bookings.length}</span>
            <span className="text-slate-500 text-[10px]">Repairs</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[90px]">
            <span className="text-base font-bold text-slate-900 block">{allDownloadableItems.length}</span>
            <span className="text-slate-500 text-[10px]">Keys</span>
          </div>
        </div>
      </div>

      {/* Simplified Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'bookings', label: '🛠️ Live Remote Support Tracking', icon: Headphones, count: bookings.length },
          { id: 'orders', label: '📦 Software Purchases & Keys', icon: ShoppingBag, count: orders.length },
          { id: 'wishlist', label: '❤️ Saved Wishlist', icon: Heart, count: wishlistProducts.length }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold font-mono whitespace-nowrap flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE REMOTE SUPPORT REPAIRS TRACKER */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-900 font-mono flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-600" />
                <span>Live Remote Computer Repair Status</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">Track your ₹39 AnyDesk repair session & connect with assigned expert</p>
            </div>
            <button
              onClick={() => {
                setCurrentView('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-sm"
            >
              + Book New Repair (₹39)
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <Headphones className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-900 text-base">No active remote repair sessions</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-mono">
                Book Remote PC Support for just ₹39 to get 1-on-1 technician assistance on WhatsApp.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((bk) => (
                <div key={bk.id} className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
                  {/* Booking Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                        BOOKING ID: {bk.bookingNumber}
                      </span>
                      <h4 className="font-bold text-slate-900 text-lg mt-1">{bk.serviceTitle}</h4>
                      <p className="text-xs text-slate-500 font-mono">Customer: {bk.customerName} • {bk.phone}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>PAYMENT VERIFIED (₹{bk.amount})</span>
                      </span>
                    </div>
                  </div>

                  {/* 4-Step Visual Live Repair Status Pipeline */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                      LIVE REPAIR PIPELINE STAGE
                    </span>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>1. Payment Verified</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">₹{bk.amount} Paid via Razorpay</span>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>2. Tech Assigned</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">{bk.technicianName || 'Certified Expert #1'}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-mono space-y-1 animate-pulse">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Clock className="w-4 h-4 text-emerald-700" />
                          <span>3. AnyDesk Ready</span>
                        </div>
                        <span className="text-[10px] text-slate-600 block">Tool: AnyDesk Remote</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-mono space-y-1 opacity-60">
                        <div className="flex items-center gap-1.5 font-bold">
                          <ShieldCheck className="w-4 h-4" />
                          <span>4. Repair Done</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">Diagnostic Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* Remote Access & Problem Summary */}
                  <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Remote Software Tool</span>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-900 font-bold">{bk.remoteTool || 'AnyDesk'}</span>
                        <a
                          href="https://anydesk.com/en/downloads"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold border border-emerald-200 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download AnyDesk</span>
                        </a>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Issue Category</span>
                      <span className="text-slate-900 font-bold block truncate">{bk.issueCategory || 'Windows Inspection'}</span>
                      <p className="text-[11px] text-slate-600 line-clamp-1">{bk.problemDescription}</p>
                    </div>
                  </div>

                  {/* Action WhatsApp Connect Button */}
                  <div className="pt-2">
                    <a
                      href={`https://wa.me/918345968169?text=${encodeURIComponent(
                        `Hello OMOVE Expert! I need remote support.\nBooking Ref: ${bk.bookingNumber}\nService: ${bk.serviceTitle}\nCustomer: ${bk.customerName}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm font-mono tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    >
                      <MessageSquare className="w-5 h-5 fill-white text-emerald-600" />
                      <span>CONNECT WITH TECHNICIAN ON WHATSAPP NOW</span>
                      <ExternalLink className="w-4 h-4 opacity-80" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SOFTWARE PURCHASES & LICENSE KEYS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900 font-mono">Software License Vault & Downloads ({allDownloadableItems.length})</h3>
            <button
              onClick={() => {
                setCurrentView('store');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono shadow-sm"
            >
              + Browse Software Catalog
            </button>
          </div>

          {allDownloadableItems.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-900 text-base">No software licenses purchased yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-mono">
                Explore our catalog for genuine Windows utilities and software keys with instant delivery.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {allDownloadableItems.map((item, idx) => (
                <div key={idx} className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ORDER #{item.orderNumber}
                      </span>
                      <button
                        onClick={() => onOpenInvoiceModal(item.orderObj)}
                        className="text-[10px] text-slate-500 hover:text-slate-900 font-mono flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print Invoice</span>
                      </button>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base">{item.productName}</h4>
                    <span className="text-xs font-mono text-emerald-700 font-bold block">Paid: ₹{item.price} ({item.paymentMethod})</span>
                  </div>

                  {/* License Key Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">License Key</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-extrabold text-sm text-slate-900 tracking-wider select-all truncate">
                        {item.licenseKey}
                      </span>
                      <button
                        onClick={() => handleCopyKey(item.licenseKey)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono flex items-center gap-1"
                      >
                        {copiedKey === item.licenseKey ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Download Action */}
                  <div>
                    <a
                      href={item.fileUrl}
                      download
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Software Installer</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED WISHLIST */}
      {activeTab === 'wishlist' && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-slate-900 font-mono">Saved Products Wishlist ({wishlistProducts.length})</h3>

          {wishlistProducts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <Heart className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-900 text-base">Your wishlist is empty</h4>
              <p className="text-xs text-slate-500 font-mono">Click the heart icon on any product in the store to save it here.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelect={onSelectProduct}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                  isWishlisted={true}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT CUSTOMER LOGIN INFO MODAL */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-slate-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 font-mono">Update Customer Login Info</h3>
              </div>
              <button onClick={() => setShowEditProfileModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs font-sans">
              <div>
                <label className="text-slate-700 font-semibold block mb-1 font-mono">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1 font-mono">WhatsApp Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1 font-mono">Support Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1 font-mono">City / Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold font-mono text-xs shadow-md shadow-emerald-600/20"
              >
                SAVE LOGIN DETAILS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

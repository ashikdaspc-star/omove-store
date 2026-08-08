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
  wishlistProducts?: Product[];
  customerProfile?: CustomerProfile;
  onUpdateCustomerProfile?: (prof: CustomerProfile) => void;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  onOpenInvoiceModal?: (order: Order) => void;
  setCurrentView?: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders = [],
  bookings = [],
  wishlistProducts = [],
  customerProfile = {
    name: 'Customer',
    email: '',
    phone: '',
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
  const [name, setName] = useState(customerProfile.name || 'Customer');
  const [email, setEmail] = useState(customerProfile.email || '');
  const [phone, setPhone] = useState(customerProfile.phone || '');
  const [location, setLocation] = useState(customerProfile.location || 'Kolkata, West Bengal, India');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { name, email, phone, location };
    if (onUpdateCustomerProfile) {
      onUpdateCustomerProfile(updated);
    }
    try {
      localStorage.setItem('omove_active_session', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setShowEditProfileModal(false);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  // Filter orders & bookings for current customer profile
  const userOrders = orders.filter((o) => {
    if (customerProfile && customerProfile.email) {
      return o.customerEmail && o.customerEmail.toLowerCase() === customerProfile.email.toLowerCase();
    }
    return true;
  });

  const userBookings = bookings.filter((b) => {
    if (customerProfile && customerProfile.email) {
      return b.email && b.email.toLowerCase() === customerProfile.email.toLowerCase();
    }
    return true;
  });

  // Flatten orders for license downloads vault
  const allDownloadableItems = userOrders.flatMap((ord) =>
    ord.items.map((it) => ({
      orderId: ord.id,
      orderNumber: ord.orderNumber,
      productName: it.productName,
      price: it.price,
      licenseKey: it.licenseKey,
      fileSize: it.fileSize,
      fileUrl: it.fileUrl,
      createdAt: ord.createdAt,
      paymentMethod: ord.paymentMethod,
      orderObj: ord
    }))
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Card - Highlighted Dark Slate Theme */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#04392b] to-slate-900 text-white shadow-xl border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-3xl shadow-lg shadow-emerald-500/20 font-mono">
            {customerProfile.name ? customerProfile.name.charAt(0).toUpperCase() : 'C'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{customerProfile.name || 'Customer'}</h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono">
                VERIFIED USER
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-100/80 font-mono">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>{customerProfile.email || 'customer@omove.tech'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{customerProfile.phone || '+91 8345968169'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{customerProfile.location || 'Kolkata, WB, India'}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setName(customerProfile.name || 'Customer');
            setEmail(customerProfile.email || '');
            setPhone(customerProfile.phone || '');
            setLocation(customerProfile.location || 'Kolkata, West Bengal, India');
            setShowEditProfileModal(true);
          }}
          className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold border border-white/20 flex items-center gap-2 transition-all"
        >
          <Edit3 className="w-4 h-4 text-emerald-400" />
          <span>EDIT LOGIN INFO</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold font-mono whitespace-nowrap flex items-center gap-2 transition-all ${
            activeTab === 'bookings'
              ? 'bg-emerald-600 text-white shadow-md font-extrabold'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Remote Repairs Log ({userBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold font-mono whitespace-nowrap flex items-center gap-2 transition-all ${
            activeTab === 'orders'
              ? 'bg-emerald-600 text-white shadow-md font-extrabold'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>License Keys & Downloads ({allDownloadableItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold font-mono whitespace-nowrap flex items-center gap-2 transition-all ${
            activeTab === 'wishlist'
              ? 'bg-emerald-600 text-white shadow-md font-extrabold'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved Wishlist ({wishlistProducts.length})</span>
        </button>
      </div>

      {/* TAB 1: REMOTE REPAIRS LOG */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-900 font-mono">Live AnyDesk Repair Sessions ({userBookings.length})</h3>
            {setCurrentView && (
              <button
                onClick={() => {
                  setCurrentView('remote-support');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono shadow-sm"
              >
                + Book Remote Repair (₹39)
              </button>
            )}
          </div>

          {userBookings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <Headphones className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-900 text-base">No remote repair sessions requested yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-mono">
                Book certified remote PC inspection (₹39) for instant AnyDesk connection & WhatsApp technician support.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userBookings.map((bk) => (
                <div key={bk.id} className="p-6 rounded-3xl bg-white border-2 border-emerald-500/30 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                          BOOKING ID: {bk.bookingNumber}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {bk.preferredDate || new Date().toISOString().split('T')[0]}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base mt-1">{bk.serviceTitle}</h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold border border-emerald-300">
                        {bk.status}
                      </span>
                      <span className="text-sm font-mono font-extrabold text-slate-900">₹{bk.amount} Paid</span>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Assigned Technician</span>
                      <span className="text-slate-900 font-bold">{bk.technicianName || 'David Chen (Cert #8821)'}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">AnyDesk Connection ID</span>
                      <span className="text-emerald-700 font-bold">{bk.remoteId || '982 110 449'}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Payment Status</span>
                      <span className="text-emerald-700 font-bold">₹{bk.amount} Verified</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={`https://wa.me/918345968169?text=${encodeURIComponent(
                        `Hello OMOVE Expert! I need remote support.\nBooking Ref: ${bk.bookingNumber}\nService: ${bk.serviceTitle}\nCustomer: ${bk.customerName}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm font-mono tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    >
                      <MessageSquare className="w-5 h-5" />
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
            {setCurrentView && (
              <button
                onClick={() => {
                  setCurrentView('store');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono shadow-sm"
              >
                + Browse Software Catalog
              </button>
            )}
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
                      {onOpenInvoiceModal && (
                        <button
                          onClick={() => onOpenInvoiceModal(item.orderObj)}
                          className="text-[10px] text-slate-500 hover:text-slate-900 font-mono flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print Invoice</span>
                        </button>
                      )}
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
                  onSelect={onSelectProduct || (() => {})}
                  onAddToCart={onAddToCart || (() => {})}
                  onBuyNow={onBuyNow || (() => {})}
                  isWishlisted={true}
                  onToggleWishlist={onToggleWishlist || (() => {})}
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
                <label className="text-slate-700 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">WhatsApp Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Location / Region</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-xs shadow-sm"
              >
                SAVE CUSTOMER PROFILE
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

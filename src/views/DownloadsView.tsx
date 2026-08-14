import React, { useState } from 'react';
import { Product, Order, UserProfile } from '../types';
import {
  Download,
  Search,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Zap,
  ExternalLink,
  HardDrive,
  Terminal,
  ShoppingBag,
  Clock,
  Sparkles,
  WifiOff
} from 'lucide-react';
import { useOnlineStatus } from '../components/OfflineBanner';

interface DownloadsViewProps {
  products: Product[];
  orders?: Order[];
  customerProfile?: { name: string; email: string; phone?: string; location?: string };
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  products,
  orders = [],
  customerProfile,
  onSelectProduct,
  onAddToCart,
  onBuyNow
}) => {
  const isOnline = useOnlineStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [serverOrders, setServerOrders] = useState<Order[]>([]);

  React.useEffect(() => {
    const token = localStorage.getItem('omove_session_token');
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/account/orders', {
      cache: 'no-store',
      headers
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setServerOrders(data);
      })
      .catch((err) => console.warn('Account orders fetch note:', err));
  }, []);

  const combinedOrders = serverOrders.length > 0 ? serverOrders : orders;

  const validOrders = combinedOrders.filter((o) => {
    const statusOk = o.paymentStatus === 'SUCCESS' || o.status === 'completed' || o.status === 'SUCCESS';
    if (!statusOk) return false;

    if (customerProfile) {
      const userEmail = (customerProfile.email || '').toLowerCase().trim();
      const userPhone = (customerProfile.phone || '').replace(/\D/g, '').slice(-10);

      const ordEmail = (o.customerEmail || '').toLowerCase().trim();
      const ordPhone = (o.customerPhone || '').replace(/\D/g, '').slice(-10);

      if (userEmail && ordEmail && ordEmail === userEmail) return true;
      if (userPhone && ordPhone && ordPhone === userPhone) return true;
      if (userPhone && ordEmail.includes(userPhone)) return true;
    }

    return true;
  });

  const purchasedItems = validOrders.flatMap((o) =>
    (o.items || []).map((item: any) => ({
      ...item,
      orderId: o.id,
      orderNumber: o.orderNumber || o.id,
      createdAt: o.createdAt,
      customerEmail: o.customerEmail,
      googleDriveUrl: item.googleDriveUrl || item.fileUrl || '',
      fileUrl: item.googleDriveUrl || item.fileUrl || ''
    }))
  );

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });



  const handleTriggerDownload = (productId: string, productName: string, fileUrl?: string, orderId?: string) => {
    const targetUrl = fileUrl;
    if (!targetUrl || targetUrl.trim() === '' || targetUrl === '#') {
      alert(`Google Drive download link for ${productName} is currently being prepared. Please check back under My Orders or contact support.`);
      return;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-8 space-y-10">
      {/* Header Banner */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 via-[#04392b] to-[#064E3B] text-white shadow-xl border border-emerald-500/30 relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-mono font-bold">
              <Download className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span>OFFICIAL DIGITAL DOWNLOAD CENTER</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
              Software & Utility Downloads
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-sans">
              Access your purchased digital files and downloads.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center font-mono space-y-1 w-full sm:w-auto">
              <span className="text-[10px] text-emerald-300 uppercase font-bold block">Purchased Downloads</span>
              <span className="text-base font-extrabold text-emerald-400 flex items-center justify-center gap-1 font-mono">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{purchasedItems.length} Purchased File(s)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Search & Category Bar */}
        <div className="pt-4 border-t border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search software downloads, utilities or tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 font-sans"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 font-mono text-xs">
            {['All', 'Windows Tools', 'Software'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: MY PURCHASED DOWNLOADS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 font-mono flex items-center gap-2">
                <span>My Purchased Downloads</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  {purchasedItems.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-mono">Software items you bought will show up here with instant digital downloads</p>
            </div>
          </div>
        </div>

        {purchasedItems.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-emerald-50/50 border-2 border-dashed border-emerald-200 space-y-3">
            <ShoppingBag className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base font-mono">No Purchased Digital Files Yet</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto font-sans">
              When you buy digital products from Omove Store, your purchased Google Drive file downloads will appear here automatically!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {purchasedItems.map((item, idx) => {
              const uniqueKeyId = `${item.orderId}-${item.productId}-${idx}`;
              const matchingProduct = products.find((p) => p.id === item.productId);

              return (
                <div
                  key={uniqueKeyId}
                  className="p-6 rounded-3xl bg-white border-2 border-emerald-500/40 shadow-md space-y-4 hover:border-emerald-500 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                          PURCHASED • {item.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-lg leading-snug">{item.productName}</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-emerald-400 font-mono shrink-0">
                      ₹{item.price} Paid
                    </span>
                  </div>

                  {/* File Access or WhatsApp Fulfillment Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans">
                    {item.googleDriveUrl || item.fileUrl ? (
                      <>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono font-extrabold text-emerald-800 uppercase block">DIGITAL FILE ACCESS</span>
                          <p className="text-xs text-slate-600 font-sans">Ready for direct Google Drive download</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTriggerDownload(item.productId, item.productName, item.googleDriveUrl || item.fileUrl, item.orderId)}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all shrink-0"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono font-extrabold text-emerald-800 uppercase block">STORE PRODUCT ORDER</span>
                          <p className="text-xs text-slate-600 font-sans">Connect on WhatsApp with your verified Order ID</p>
                        </div>

                        <a
                          href={`https://wa.me/918345968169?text=${encodeURIComponent(
                            `Hi, I have completed the payment for ${item.productName}. My Order ID is #${item.orderNumber || item.orderId}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all shrink-0"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Contact on WhatsApp</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trust Highlights */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Instant Download</h4>
            <p className="text-xs text-slate-500">Fast direct download links with no delay</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Verified SHA-256</h4>
            <p className="text-xs text-slate-500">Clean digital signatures & safe binaries</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Automated Setup</h4>
            <p className="text-xs text-slate-500">1-Click setup & Google Drive file integration</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: ALL PUBLIC SOFTWARE DOWNLOADS CATALOG */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-xl font-extrabold text-slate-900 font-mono flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-600" />
            <span>Browse All Available Downloads ({filteredProducts.length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Sorted by Popular Downloads</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <Download className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-900 text-lg">No downloads found matching "{searchQuery}"</h3>
            <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
              Try searching with another keyword or select "All" categories to view available digital installers.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/90 text-white backdrop-blur-md font-mono">
                      {prod.category}
                    </span>
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600 text-white font-mono shadow-sm">
                      {prod.price === 0 ? 'FREE DOWNLOAD' : `₹${prod.price}`}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
                      <span>Ver: {prod.version}</span>
                      <span>Size: {prod.downloadSize}</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-snug line-clamp-1">{prod.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-sans">{prod.shortDescription}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                      {prod.licenseType}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                      Windows 10 / 11 64-bit
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {prod.price > 0 && onBuyNow && (
                    <button
                      disabled={!isOnline}
                      onClick={() => {
                        if (!isOnline) {
                          alert("You’re offline. Please reconnect to the internet to purchase this product.");
                          return;
                        }
                        onBuyNow(prod);
                      }}
                      className={`w-full py-3 rounded-xl font-bold font-mono text-xs shadow-md flex items-center justify-center gap-2 transition-all ${
                        !isOnline
                          ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:scale-[1.01]'
                      }`}
                    >
                      {isOnline ? <ShoppingBag className="w-4 h-4" /> : <WifiOff className="w-4 h-4 text-rose-400" />}
                      <span>{isOnline ? `BUY NOW & GET DIGITAL DOWNLOAD (₹${prod.price})` : 'OFFLINE — BUY UNAVAILABLE'}</span>
                    </button>
                  )}

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1 pt-1">
                    {onSelectProduct && (
                      <button
                        onClick={() => onSelectProduct(prod)}
                        className="text-slate-600 hover:text-emerald-700 hover:underline font-bold flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

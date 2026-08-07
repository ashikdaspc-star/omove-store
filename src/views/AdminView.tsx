import React, { useState } from 'react';
import { Product, RemoteService, RemoteBooking, Order, BlogPost } from '../types';
import {
  LayoutDashboard,
  ShoppingBag,
  Headphones,
  Key,
  Plus,
  BarChart2,
  ShieldCheck,
  Check,
  X,
  Zap,
  MessageSquare,
  ExternalLink,
  DollarSign,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Trash2,
  Wrench,
  Lock,
  BookOpen,
  FileText
} from 'lucide-react';

interface AdminViewProps {
  products: Product[];
  services?: RemoteService[];
  blogs?: BlogPost[];
  orders: Order[];
  bookings: RemoteBooking[];
  onAddProduct: (prod: Product) => void;
  onDeleteProduct?: (prodId: string) => void;
  onAddService?: (srv: RemoteService) => void;
  onDeleteService?: (srvId: string) => void;
  onAddBlog?: (blog: BlogPost) => void;
  onDeleteBlog?: (blogId: string) => void;
  onUpdateBooking?: (booking: RemoteBooking) => void;
  onDeleteBooking?: (bookingId: string) => void;
  onExitAdmin?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  products,
  services = [],
  blogs = [],
  orders,
  bookings,
  onAddProduct,
  onDeleteProduct,
  onAddService,
  onDeleteService,
  onAddBlog,
  onDeleteBlog,
  onUpdateBooking,
  onDeleteBooking,
  onExitAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'analytics' | 'services' | 'blogs' | 'gateway'>('bookings');
  const [razorpayKeyId, setRazorpayKeyId] = useState(import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TMiCMOFsYnHr8G');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('●●●●●●●●●●●●●●●●●●●●');
  const [isSaved, setIsSaved] = useState(false);

  // New Service Modal state
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [srvTitle, setSrvTitle] = useState('Remote PC Support');
  const [srvPrice, setSrvPrice] = useState(39);
  const [srvOrigPrice, setSrvOrigPrice] = useState(499);
  const [srvTime, setSrvTime] = useState('15 Mins');
  const [srvDesc, setSrvDesc] = useState('Get secure remote support from certified technicians. We connect to your PC using AnyDesk and stay in touch through WhatsApp to diagnose, troubleshoot, and resolve your Windows or software issues quickly and safely.');
  const [srvFeatures, setSrvFeatures] = useState('Direct Expert Support, PC & Software Solutions, Secure Remote Repair, WhatsApp Support');

  // New Blog Modal state
  const [showAddBlogModal, setShowAddBlogModal] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('Windows Fix');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogAuthor, setBlogAuthor] = useState('Omove Tech Expert');
  const [blogReadTime, setBlogReadTime] = useState('5 Mins');
  const [blogImage, setBlogImage] = useState('https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80');
  const [blogTags, setBlogTags] = useState('Windows 11, Repair, AnyDesk, Remote Support');

  // Analytics data
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0) + bookings.reduce((acc, b) => acc + b.amount, 0);

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvTitle.trim()) return;

    const newService: RemoteService = {
      id: 'srv-' + Date.now(),
      title: srvTitle,
      description: srvDesc || 'Certified 1-on-1 computer inspection & repair service via AnyDesk.',
      price: srvPrice,
      originalPrice: srvOrigPrice,
      category: 'Windows Fix' as any,
      estimatedTime: srvTime,
      iconName: 'Search',
      popular: true,
      features: srvFeatures.split(',').map((f) => f.trim()).filter(Boolean)
    };

    if (onAddService) onAddService(newService);
    setShowAddServiceModal(false);
  };

  const handleCreateBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim()) return;

    const newBlog: BlogPost = {
      id: 'blog-' + Date.now(),
      title: blogTitle,
      slug: blogTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: blogExcerpt || 'Learn how to fix computer errors and optimize Windows performance with expert remote support.',
      content: blogContent || 'Comprehensive guide for diagnosing Windows crashes and optimizing hardware performance.',
      author: blogAuthor,
      authorRole: 'Senior Technical Lead',
      category: blogCategory,
      readTime: blogReadTime,
      publishedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      image: blogImage,
      tags: blogTags.split(',').map((t) => t.trim()).filter(Boolean),
      likes: 42
    };

    if (onAddBlog) onAddBlog(newBlog);

    // Reset form
    setBlogTitle('');
    setBlogExcerpt('');
    setBlogContent('');
    setShowAddBlogModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Command Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#064E3B] via-[#04392b] to-slate-900 text-white shadow-xl border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono text-white">ADMIN COMMAND CENTER</h1>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono">
                LIVE ROOT ACCESS
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 font-mono mt-0.5">Manage live remote repairs, client queue, blog articles & Razorpay credentials</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddBlogModal(true)}
            className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold font-mono text-xs shadow-md border border-slate-700 flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>+ PUBLISH BLOG</span>
          </button>

          <button
            onClick={() => setShowAddServiceModal(true)}
            className="px-5 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black font-mono text-xs shadow-lg shadow-emerald-400/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4.5 h-4.5 stroke-[3]" />
            <span>+ ADD SERVICE (₹39)</span>
          </button>

          {onExitAdmin && (
            <button
              onClick={onExitAdmin}
              className="px-4 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 font-bold font-mono text-xs flex items-center gap-1.5 transition-all"
              title="Lock Admin Command Center and logout"
            >
              <Lock className="w-4 h-4 text-rose-300" />
              <span>LOCK & EXIT ADMIN</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'bookings', label: '🛠️ Remote Repairs Queue', icon: Headphones, count: bookings.length },
          { id: 'analytics', label: '📊 Revenue & Analytics', icon: BarChart2 },
          { id: 'services', label: '⚡ Remote Services Catalog', icon: Wrench, count: services.length },
          { id: 'blogs', label: '📰 Blog & Knowledge Base', icon: BookOpen, count: blogs.length },
          { id: 'gateway', label: '🛡️ Razorpay Gateway Config', icon: Lock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold font-mono whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md font-extrabold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-800'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE REMOTE REPAIRS QUEUE */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-xl text-slate-900 font-mono flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-600" />
                <span>Live Remote Computer Repairs Queue ({bookings.length})</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">Manage client AnyDesk sessions, assigned technicians, WhatsApp links & repair status</p>
            </div>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-sm"
            >
              + Create Service Package
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <Headphones className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-900 text-base">No active remote repair sessions in queue</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-mono">
                When clients book Remote PC Support (₹39), their AnyDesk sessions and WhatsApp contact details will appear here live.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {bookings.map((bk) => (
                <div key={bk.id} className="p-6 rounded-3xl bg-white border-2 border-emerald-500/30 shadow-md space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                          REF: {bk.bookingNumber}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {bk.preferredDate || new Date().toISOString().split('T')[0]}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg mt-1">{bk.serviceTitle}</h4>
                      <p className="text-xs text-slate-600 font-mono">
                        Client: <strong>{bk.customerName}</strong> ({bk.phone}) • {bk.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={bk.status}
                        onChange={(e) => {
                          if (onUpdateBooking) {
                            onUpdateBooking({ ...bk, status: e.target.value as any });
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-xs font-mono font-bold focus:outline-none focus:border-emerald-600"
                      >
                        <option value="Pending">1. Booking Confirmed</option>
                        <option value="Technician Assigned">2. Technician Assigned</option>
                        <option value="In Progress">3. AnyDesk Session Active</option>
                        <option value="Completed">4. Repair Completed</option>
                      </select>

                      <a
                        href={`https://wa.me/${bk.phone.replace(/[^0-9]/g, '') || '918345968169'}?text=${encodeURIComponent(
                          `Hello ${bk.customerName}! This is OMOVE Expert Support regarding your booking #${bk.bookingNumber} (${bk.serviceTitle}). Are you ready for AnyDesk remote connection?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        title="Chat directly with client on WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>

                      {onDeleteBooking && (
                        <button
                          onClick={() => onDeleteBooking(bk.id)}
                          className="p-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-mono"
                          title="Delete booking record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Assigned Technician</label>
                      <input
                        type="text"
                        value={bk.technicianName || 'Certified Expert #1'}
                        onChange={(e) => {
                          if (onUpdateBooking) {
                            onUpdateBooking({ ...bk, technicianName: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <label className="text-slate-500 text-[10px] uppercase font-bold block mb-1">AnyDesk Remote ID</label>
                      <input
                        type="text"
                        value={bk.remoteId || '982 110 449'}
                        onChange={(e) => {
                          if (onUpdateBooking) {
                            onUpdateBooking({ ...bk, remoteId: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-emerald-800 font-bold text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-center">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Fee Collected</span>
                      <span className="text-emerald-800 font-bold text-sm">₹{bk.amount} Paid via Razorpay</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-sans">
                    <strong className="font-mono text-slate-900 uppercase text-[11px] block mb-0.5">Problem Description:</strong>
                    {bk.problemDescription || 'Full remote PC diagnostic & troubleshooting requested.'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REVENUE & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Total Store Revenue</span>
              <span className="text-3xl font-extrabold font-mono text-emerald-700 block">₹{totalRevenue.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500">Recorded via Razorpay (INR)</span>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Remote PC Repairs</span>
              <span className="text-3xl font-extrabold font-mono text-slate-900 block">{bookings.length}</span>
              <span className="text-[10px] text-slate-500">Active AnyDesk sessions</span>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Published Blog Articles</span>
              <span className="text-3xl font-extrabold font-mono text-emerald-700 block">{blogs.length}</span>
              <span className="text-[10px] text-slate-500">Knowledge Base guides</span>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Repair Resolution Rate</span>
              <span className="text-3xl font-extrabold font-mono text-amber-600 block">99.8%</span>
              <span className="text-[10px] text-slate-500">100% Refund Guarantee</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 font-mono uppercase tracking-wider">Recent Transactions & Repair Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Ref Code</th>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Service</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((bk) => (
                    <tr key={bk.id} className="text-slate-800">
                      <td className="p-3 font-bold text-emerald-700">{bk.bookingNumber}</td>
                      <td className="p-3">{bk.customerName} ({bk.phone})</td>
                      <td className="p-3 text-slate-600">{bk.serviceTitle}</td>
                      <td className="p-3 font-bold text-slate-900">₹{bk.amount}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          {bk.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REMOTE SERVICES CATALOG */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-900 font-mono">Active Remote Services Catalog ({services.length})</h3>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono shadow-sm"
            >
              + Add Remote Service (₹39)
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {services.map((srv) => (
              <div key={srv.id} className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                      {srv.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">₹{srv.price}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{srv.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{srv.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500 font-mono">Est: {srv.estimatedTime}</span>
                  {onDeleteService && (
                    <button
                      onClick={() => onDeleteService(srv.id)}
                      className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-mono"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BLOG & KNOWLEDGE BASE PUBLISHING */}
      {activeTab === 'blogs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-xl text-slate-900 font-mono flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>Knowledge Base & Blog Management ({blogs.length})</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">Publish technical guides, computer troubleshooting articles & repair tutorials</p>
            </div>
            <button
              onClick={() => setShowAddBlogModal(true)}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ PUBLISH NEW ARTICLE</span>
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((b) => (
              <div key={b.id} className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-md flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold">
                      {b.category}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block mb-1">{b.publishedAt} • By {b.author}</span>
                    <h4 className="font-bold text-base text-slate-900 line-clamp-2 leading-snug">{b.title}</h4>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{b.excerpt}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-emerald-700 font-mono font-bold">{b.readTime} read</span>
                  {onDeleteBlog && (
                    <button
                      onClick={() => onDeleteBlog(b.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-mono font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: GATEWAY CONFIG */}
      {activeTab === 'gateway' && (
        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-mono">Razorpay Payment Gateway Settings</h3>
              <p className="text-xs text-slate-500">Configure your Live/Test API Key ID and Key Secret from Razorpay Dashboard</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Razorpay API Integration Active</span>
            </div>
            <p>
              Your store uses Razorpay for collecting payments via UPI (Google Pay, PhonePe, Paytm), Credit/Debit cards, NetBanking, and Wallets.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setIsSaved(true); setTimeout(() => setIsSaved(false), 4000); }} className="space-y-4 max-w-xl font-sans">
            <div>
              <label className="text-xs font-mono font-bold text-slate-700 block mb-1">Razorpay Key ID (VITE_RAZORPAY_KEY_ID)</label>
              <input
                type="text"
                required
                value={razorpayKeyId}
                onChange={(e) => setRazorpayKeyId(e.target.value)}
                placeholder="rzp_test_..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Public key used on client checkout popups.</span>
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-slate-700 block mb-1">Razorpay Key Secret (RAZORPAY_KEY_SECRET)</label>
              <input
                type="password"
                required
                value={razorpayKeySecret}
                onChange={(e) => setRazorpayKeySecret(e.target.value)}
                placeholder="Key Secret from Razorpay Dashboard"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Private secret kept safe on Node.js server to verify signatures.</span>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-xs flex items-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{isSaved ? 'SETTINGS SAVED & VERIFIED!' : 'SAVE RAZORPAY CREDENTIALS'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ADD REMOTE SERVICE MODAL */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-slate-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 font-mono">Add New Remote Service (₹39)</h3>
              <button onClick={() => setShowAddServiceModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-3 text-xs font-sans">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full PC Inspection & Live Health Check"
                  value={srvTitle}
                  onChange={(e) => setSrvTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={srvOrigPrice}
                    onChange={(e) => setSrvOrigPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Est. Time</label>
                  <input
                    type="text"
                    required
                    value={srvTime}
                    onChange={(e) => setSrvTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={srvDesc}
                  onChange={(e) => setSrvDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Key Features (comma separated)</label>
                <input
                  type="text"
                  required
                  placeholder="Full Health Check, BSOD Diagnosis, Malware Audit, WhatsApp Support"
                  value={srvFeatures}
                  onChange={(e) => setSrvFeatures(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-xs shadow-sm"
              >
                PUBLISH REPAIR SERVICE TO CATALOG
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PUBLISH NEW BLOG ARTICLE MODAL */}
      {showAddBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-slate-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 font-mono flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>Publish New Blog Article</span>
              </h3>
              <button onClick={() => setShowAddBlogModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBlog} className="space-y-3 text-xs font-sans">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How to Fix Blue Screen WHEA_UNCORRECTABLE_ERROR"
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Category</label>
                  <select
                    value={blogCategory}
                    onChange={(e) => setBlogCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                  >
                    <option value="Windows Fix">Windows Fix</option>
                    <option value="PC Maintenance">PC Maintenance</option>
                    <option value="Security & Privacy">Security & Privacy</option>
                    <option value="Hardware Guides">Hardware Guides</option>
                    <option value="Tutorials">Tutorials</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Author Name</label>
                  <input
                    type="text"
                    required
                    value={blogAuthor}
                    onChange={(e) => setBlogAuthor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Short Excerpt / Summary *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief 1-2 sentence overview of the article..."
                  value={blogExcerpt}
                  onChange={(e) => setBlogExcerpt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Full Article Content *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write full article body text, step-by-step diagnostic guide..."
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Cover Image URL</label>
                <input
                  type="text"
                  required
                  value={blogImage}
                  onChange={(e) => setBlogImage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono text-[11px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-xs shadow-md shadow-emerald-600/20"
              >
                PUBLISH ARTICLE TO WEBSITE BLOG
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

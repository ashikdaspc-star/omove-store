import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
  Package,
  CreditCard,
  Users,
  Download,
  Wrench,
  Headphones,
  MessageSquare,
  BookOpen,
  FolderTree,
  Globe,
  Megaphone,
  Tag,
  Mail,
  BarChart2,
  Activity,
  Settings,
  ShieldCheck,
  LogOut,
  X
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'store-products'
  | 'digital-products'
  | 'digital-categories'
  | 'orders'
  | 'payments'
  | 'customers'
  | 'downloads'
  | 'services'
  | 'remote-support'
  | 'support-tickets'
  | 'blog'
  | 'categories'
  | 'website-content'
  | 'announcements'
  | 'coupons'
  | 'newsletter'
  | 'analytics'
  | 'activity-logs'
  | 'settings'
  | 'admin-users';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onExitAdmin: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  onExitAdmin
}) => {
  const sections = [
    {
      group: 'OVERVIEW',
      items: [{ id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard }]
    },
    {
      group: 'COMMERCE',
      items: [
        { id: 'store-products' as AdminTab, label: 'Store Products', icon: ShoppingBag },
        { id: 'digital-products' as AdminTab, label: 'Digital Products', icon: Sparkles },
        { id: 'digital-categories' as AdminTab, label: 'Digital Categories', icon: FolderTree },
        { id: 'orders' as AdminTab, label: 'Orders', icon: Package },
        { id: 'payments' as AdminTab, label: 'Payments', icon: CreditCard },
        { id: 'customers' as AdminTab, label: 'Customers', icon: Users },
        { id: 'downloads' as AdminTab, label: 'Downloads', icon: Download }
      ]
    },
    {
      group: 'SERVICES',
      items: [
        { id: 'services' as AdminTab, label: 'Services', icon: Wrench },
        { id: 'remote-support' as AdminTab, label: 'Remote Support', icon: Headphones, badge: 'Live' },
        { id: 'support-tickets' as AdminTab, label: 'Support Tickets', icon: MessageSquare }
      ]
    },
    {
      group: 'CONTENT',
      items: [
        { id: 'blog' as AdminTab, label: 'Blog Articles', icon: BookOpen },
        { id: 'categories' as AdminTab, label: 'Categories', icon: FolderTree },
        { id: 'website-content' as AdminTab, label: 'Website Content', icon: Globe }
      ]
    },
    {
      group: 'MARKETING',
      items: [
        { id: 'announcements' as AdminTab, label: 'Announcements', icon: Megaphone },
        { id: 'coupons' as AdminTab, label: 'Coupons / Discounts', icon: Tag },
        { id: 'newsletter' as AdminTab, label: 'Newsletter', icon: Mail }
      ]
    },
    {
      group: 'SYSTEM',
      items: [
        { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart2 },
        { id: 'activity-logs' as AdminTab, label: 'Activity Audit Log', icon: Activity },
        { id: 'settings' as AdminTab, label: 'Settings & Security', icon: Settings }
      ]
    },
    {
      group: 'ADMIN',
      items: [{ id: 'admin-users' as AdminTab, label: 'Admin Access', icon: ShieldCheck }]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-emerald-600/30">
                O
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-tight font-sans">Omove</span>
                <span className="text-emerald-400 font-bold text-xs uppercase ml-1 font-mono">ADMIN</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpenMobile(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links List */}
          <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin scrollbar-thumb-slate-800">
            {sections.map((sec) => (
              <div key={sec.group} className="space-y-1">
                <span className="px-3 text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">
                  {sec.group}
                </span>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpenMobile(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-between group ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-extrabold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Exit Action */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={onExitAdmin}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-300 font-mono text-xs font-bold border border-slate-700/60 flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>EXIT ADMIN PANEL</span>
          </button>
        </div>
      </aside>
    </>
  );
};

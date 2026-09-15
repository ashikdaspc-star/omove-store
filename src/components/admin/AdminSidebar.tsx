import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
  Package,
  CreditCard,
  Heart,
  Users,
  Download,
  Wrench,
  Headphones,
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
  Star,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'store-products'
  | 'digital-products'
  | 'digital-categories'
  | 'orders'
  | 'payments'
  | 'support-contributions'
  | 'customers'
  | 'downloads'
  | 'reviews'
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  onExitAdmin,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const navigationGroups = [
    {
      group: 'Overview',
      items: [
        { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: 'Commerce',
      items: [
        { id: 'store-products' as AdminTab, label: 'Store Products', icon: ShoppingBag },
        { id: 'digital-products' as AdminTab, label: 'Digital Products', icon: Sparkles },
        { id: 'digital-categories' as AdminTab, label: 'Digital Categories', icon: FolderTree },
        { id: 'orders' as AdminTab, label: 'Orders & Fulfillment', icon: Package },
        { id: 'payments' as AdminTab, label: 'Payments Log', icon: CreditCard },
        { id: 'customers' as AdminTab, label: 'Customers Directory', icon: Users },
        { id: 'coupons' as AdminTab, label: 'Coupons & Discounts', icon: Tag },
        { id: 'downloads' as AdminTab, label: 'Downloads Log', icon: Download },
        { id: 'reviews' as AdminTab, label: 'Customer Reviews', icon: Star, badge: 'D1' }
      ]
    },
    {
      group: 'Services',
      items: [
        { id: 'services' as AdminTab, label: 'Services Catalog', icon: Wrench },
        { id: 'remote-support' as AdminTab, label: 'Live Remote Support', icon: Headphones, badge: 'Live' },
        { id: 'support-contributions' as AdminTab, label: 'Support Contributions', icon: Heart }
      ]
    },
    {
      group: 'Content',
      items: [
        { id: 'blog' as AdminTab, label: 'Blog Articles', icon: BookOpen },
        { id: 'categories' as AdminTab, label: 'Product Categories', icon: FolderTree },
        { id: 'website-content' as AdminTab, label: 'Website Content', icon: Globe }
      ]
    },
    {
      group: 'Marketing',
      items: [
        { id: 'announcements' as AdminTab, label: 'Announcements', icon: Megaphone },
        { id: 'newsletter' as AdminTab, label: 'Newsletter', icon: Mail }
      ]
    },
    {
      group: 'System',
      items: [
        { id: 'analytics' as AdminTab, label: 'Traffic & Analytics', icon: BarChart2 },
        { id: 'activity-logs' as AdminTab, label: 'Activity Logs', icon: Activity },
        { id: 'settings' as AdminTab, label: 'Settings & Security', icon: Settings }
      ]
    },
    {
      group: 'Administration',
      items: [
        { id: 'admin-users' as AdminTab, label: 'Admin Access', icon: ShieldCheck }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container: Clean, Crisp, High-End SaaS */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200/90 text-slate-700 flex flex-col justify-between transition-all duration-200 shadow-xs ${
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        } w-64 ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Refined Brand Icon */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-sm shadow-emerald-600/20 shrink-0">
                O
              </div>

              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm tracking-tight font-sans">
                      Omove
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 leading-none">
                      Admin
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal block truncate mt-0.5 font-sans">
                    Control Center
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Desktop Collapse Toggle */}
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              )}

              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={() => setIsOpenMobile(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Links List */}
          <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-145px)] scrollbar-thin scrollbar-thumb-slate-200">
            {navigationGroups.map((sec) => (
              <div key={sec.group} className="space-y-1">
                {!isCollapsed ? (
                  <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-sans">
                    {sec.group}
                  </span>
                ) : (
                  <div className="h-1.5" />
                )}

                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <div key={item.id} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsOpenMobile(false);
                        }}
                        onMouseEnter={() => isCollapsed && setHoveredTooltip(item.id)}
                        onMouseLeave={() => setHoveredTooltip(null)}
                        className={`w-full rounded-xl text-[13px] font-medium font-sans transition-all flex items-center group relative ${
                          isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2 justify-between'
                        } ${
                          isActive
                            ? 'bg-emerald-50/90 text-emerald-900 font-semibold shadow-xs border border-emerald-200/60'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold font-sans ${
                              item.badge === 'Live'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>

                      {/* Tooltip on compact icon mode */}
                      {isCollapsed && hoveredTooltip === item.id && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-sans font-medium rounded-lg whitespace-nowrap shadow-xl z-[60] pointer-events-none animate-fadeIn">
                          {item.label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Profile & Exit */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between gap-2">
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                  A
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-900 block truncate font-sans">
                    Super Admin
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate font-sans">
                    admin@omove.in
                  </span>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={onExitAdmin}
              title="Exit to Storefront"
              className={`p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors ${
                isCollapsed ? 'mx-auto' : ''
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

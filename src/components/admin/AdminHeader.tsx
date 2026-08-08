import React, { useState } from 'react';
import { Menu, Search, Bell, ShieldCheck, LogOut, ChevronDown, CheckCircle2 } from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface AdminHeaderProps {
  activeTab: AdminTab;
  setIsOpenMobile: (open: boolean) => void;
  onOpenGlobalSearch: () => void;
  onExitAdmin: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  setIsOpenMobile,
  onOpenGlobalSearch,
  onExitAdmin
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getBreadcrumb = (tab: AdminTab) => {
    switch (tab) {
      case 'dashboard':
        return { group: 'Overview', title: 'Dashboard Overview' };
      case 'store-products':
        return { group: 'Commerce', title: 'Store Products Catalog' };
      case 'digital-products':
        return { group: 'Commerce', title: 'Digital Products Catalog' };
      case 'orders':
        return { group: 'Commerce', title: 'Orders & Fulfillment' };
      case 'payments':
        return { group: 'Commerce', title: 'Payments & Gateway Logs' };
      case 'customers':
        return { group: 'Commerce', title: 'Registered Customer Directory' };
      case 'downloads':
        return { group: 'Commerce', title: 'Digital Downloads Logs' };
      case 'services':
        return { group: 'Services', title: 'Services Catalog' };
      case 'remote-support':
        return { group: 'Services', title: 'Live Remote Support Queue' };
      case 'support-tickets':
        return { group: 'Services', title: 'Customer Support Tickets' };
      case 'blog':
        return { group: 'Content', title: 'Blog Articles Management' };
      case 'categories':
        return { group: 'Content', title: 'Product Categories' };
      case 'website-content':
        return { group: 'Content', title: 'Website Content & Hero Settings' };
      case 'announcements':
        return { group: 'Marketing', title: 'Announcement Banners' };
      case 'coupons':
        return { group: 'Marketing', title: 'Coupons & Discount Keys' };
      case 'newsletter':
        return { group: 'Marketing', title: 'Newsletter Subscribers' };
      case 'analytics':
        return { group: 'System', title: 'Live Traffic & Analytics' };
      case 'activity-logs':
        return { group: 'System', title: 'Admin Activity Audit Trail' };
      case 'settings':
        return { group: 'System', title: 'Settings & Razorpay Security' };
      case 'admin-users':
        return { group: 'Admin', title: 'Administrator Access' };
      default:
        return { group: 'Admin', title: 'Management Dashboard' };
    }
  };

  const breadcrumb = getBreadcrumb(activeTab);

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpenMobile(true)}
          className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400">
            <span>Admin</span>
            <span>/</span>
            <span>{breadcrumb.group}</span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight font-sans">
            {breadcrumb.title}
          </h1>
        </div>
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Button */}
        <button
          onClick={onOpenGlobalSearch}
          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/90 text-xs font-mono font-medium flex items-center gap-2 transition-all min-h-[40px]"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Search orders, products, customers...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded text-slate-500">
            Ctrl+K
          </kbd>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors relative min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl py-3 z-50 animate-fadeIn text-xs font-sans">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-900 font-mono">Notifications</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">System Active</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-bold text-[11px]">Server Verified Payment</strong>
                    <span className="text-[10px] text-slate-500 block font-mono">Razorpay HMAC signature verification active</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/90 text-xs font-mono font-bold text-slate-800 transition-all min-h-[40px]"
          >
            <div className="w-6 h-6 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center text-[10px] font-extrabold uppercase shrink-0">
              A
            </div>
            <span className="hidden sm:inline text-slate-900">Admin Portal</span>
            <span className="hidden md:inline px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              Super Admin
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-fadeIn text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">Super Admin Account</p>
                <p className="text-[10px] text-slate-500 font-mono">admin@omovestore.shop</p>
              </div>
              <button
                onClick={onExitAdmin}
                className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-rose-600 font-medium flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Admin</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

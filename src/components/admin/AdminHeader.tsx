import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  Bell,
  ShieldCheck,
  LogOut,
  ExternalLink,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Command
} from 'lucide-react';
import { AdminTab } from './AdminSidebar';

interface AdminHeaderProps {
  activeTab: AdminTab;
  setIsOpenMobile: (open: boolean) => void;
  onOpenGlobalSearch: () => void;
  onExitAdmin: () => void;
  onPublishCatalog?: () => Promise<{ success: boolean; message?: string }>;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  setIsOpenMobile,
  onOpenGlobalSearch,
  onExitAdmin,
  onPublishCatalog
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
  const [publishMessage, setPublishMessage] = useState<string>('');
  const [hasPendingDrafts, setHasPendingDrafts] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll draft status
  useEffect(() => {
    let isMounted = true;
    const checkDraftStatus = async () => {
      try {
        const res = await fetch('/api/admin/draft-status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setHasPendingDrafts(Boolean(data.hasPendingChanges));
            setPendingCount(data.pendingCount || (data.hasPendingChanges ? 1 : 0));
          }
        }
      } catch (e) {}
    };
    checkDraftStatus();
    const interval = setInterval(checkDraftStatus, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [publishStatus]);

  const handlePublish = async () => {
    if (!onPublishCatalog || publishStatus === 'publishing') return;
    setPublishStatus('publishing');
    setPublishMessage('Publishing changes live to production...');

    try {
      const res = await onPublishCatalog();
      if (res && res.success) {
        setPublishStatus('success');
        setPublishMessage(res.message || 'Published Live to Production!');
        setHasPendingDrafts(false);
        setPendingCount(0);
      } else {
        setPublishStatus('error');
        setPublishMessage(res?.message || 'Publish failed.');
      }
    } catch (err: any) {
      setPublishStatus('error');
      setPublishMessage(err.message || 'Publish failed.');
    } finally {
      setTimeout(() => {
        setPublishStatus('idle');
        setPublishMessage('');
      }, 5000);
    }
  };

  const getBreadcrumb = (tab: AdminTab) => {
    switch (tab) {
      case 'dashboard':
        return { group: 'Overview', title: 'Dashboard' };
      case 'store-products':
        return { group: 'Commerce', title: 'Store Products' };
      case 'digital-products':
        return { group: 'Commerce', title: 'Digital Products' };
      case 'digital-categories':
        return { group: 'Commerce', title: 'Digital Categories' };
      case 'orders':
        return { group: 'Commerce', title: 'Orders & Fulfillment' };
      case 'payments':
        return { group: 'Commerce', title: 'Payments Audit Log' };
      case 'support-contributions':
        return { group: 'Commerce', title: 'Support Contributions' };
      case 'customers':
        return { group: 'Commerce', title: 'Customer Directory' };
      case 'downloads':
        return { group: 'Commerce', title: 'Downloads Logs' };
      case 'reviews':
        return { group: 'Commerce', title: 'Customer Reviews' };
      case 'services':
        return { group: 'Services', title: 'Services Catalog' };
      case 'remote-support':
        return { group: 'Services', title: 'Live Remote Support' };
      case 'support-tickets':
        return { group: 'Services', title: 'Support Tickets' };
      case 'blog':
        return { group: 'Content', title: 'Blog Articles' };
      case 'categories':
        return { group: 'Content', title: 'Product Categories' };
      case 'website-content':
        return { group: 'Content', title: 'Website Content' };
      case 'announcements':
        return { group: 'Marketing', title: 'Announcements' };
      case 'coupons':
        return { group: 'Marketing', title: 'Coupons & Discounts' };
      case 'newsletter':
        return { group: 'Marketing', title: 'Newsletter Subscribers' };
      case 'analytics':
        return { group: 'System', title: 'Traffic & Analytics' };
      case 'activity-logs':
        return { group: 'System', title: 'Activity Logs' };
      case 'settings':
        return { group: 'System', title: 'Settings & Security' };
      case 'admin-users':
        return { group: 'Administration', title: 'Administrator Access' };
      default:
        return { group: 'Admin', title: 'Control Center' };
    }
  };

  const breadcrumb = getBreadcrumb(activeTab);

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 font-sans shadow-2xs">
      {/* Left: Mobile Menu & Clean Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsOpenMobile(true)}
          className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium font-sans">
            <span>Admin</span>
            <span>/</span>
            <span>{breadcrumb.group}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight font-sans">
            {breadcrumb.title}
          </h1>
        </div>
      </div>

      {/* Right: Admin Action Cluster */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Save & Publish Live Button (if changes pending) */}
        {onPublishCatalog && (
          <div className="relative">
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishStatus === 'publishing'}
              className={`px-3 py-1.5 rounded-xl font-sans text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                hasPendingDrafts
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 animate-pulse'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80'
              }`}
            >
              {publishStatus === 'publishing' ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="hidden md:inline font-sans">
                {publishStatus === 'publishing'
                  ? 'Publishing...'
                  : hasPendingDrafts
                  ? `Publish (${pendingCount})`
                  : 'Sync Production'}
              </span>
            </button>

            {publishMessage && (
              <div
                className={`absolute right-0 top-full mt-2 px-3 py-1.5 rounded-xl text-xs font-sans whitespace-nowrap shadow-xl z-50 animate-fadeIn ${
                  publishStatus === 'success'
                    ? 'bg-emerald-900 text-white border border-emerald-800'
                    : 'bg-rose-900 text-white border border-rose-800'
                }`}
              >
                {publishMessage}
              </div>
            )}
          </div>
        )}

        {/* Global Admin Search Trigger Button (Ctrl+K) */}
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/90 text-xs font-sans flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline font-sans text-xs text-slate-500">Search admin...</span>
          <span className="hidden sm:flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-2xs">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </span>
        </button>

        {/* Notification Center Popover */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/90 transition-colors relative"
            aria-label="Admin notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 text-xs font-sans animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <span className="font-semibold text-slate-900 font-sans uppercase text-[11px] tracking-wider">
                  System Notifications
                </span>
                <span className="text-[10px] text-emerald-600 font-sans font-semibold">
                  All Systems Operational
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-semibold font-sans">Cloudflare D1 & R2 Active</strong>
                    <p className="text-slate-500 text-[11px] font-sans">
                      Database and private R2 storage binding `env.FILES` connected.
                    </p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 font-semibold font-sans">Gateways Configured</strong>
                    <p className="text-slate-500 text-[11px] font-sans">
                      Razorpay INR & PayPal USD dual-currency checkouts live.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Pill & Menu */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              A
            </div>
            <div className="hidden md:block text-left">
              <span className="text-xs font-semibold text-slate-900 block leading-tight font-sans">
                Admin
              </span>
              <span className="text-[10px] text-emerald-700 font-medium font-sans block leading-none">
                Super Admin
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 text-xs font-sans animate-fadeIn">
              <div className="p-3 border-b border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-medium">Logged in as</span>
                <strong className="text-slate-900 block font-sans text-xs font-semibold mt-0.5">
                  Omove Administrator
                </strong>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Full Authorization
                </span>
              </div>

              <div className="p-1 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onExitAdmin();
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors font-medium"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>Visit Public Storefront</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onExitAdmin();
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Admin</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

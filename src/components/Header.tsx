import React, { useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Monitor,
  ShoppingBag,
  User,
  Search,
  Menu,
  X,
  Headphones,
  Zap,
  BookOpen,
  Info,
  LogIn,
  LogOut,
  ShieldCheck,
  MessageSquare,
  Download,
  Sparkles
} from 'lucide-react';
import { CartItem } from '../types';

interface HeaderProps {
  cart: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  wishlistCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;
  isAdminAuthenticated?: boolean;
  onOpenAdminAuthModal?: () => void;
  isLoggedIn?: boolean;
  customerName?: string;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cart,
  setIsCartOpen,
  wishlistCount,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  isAdminMode,
  setIsAdminMode,
  isAdminAuthenticated = false,
  onOpenAdminAuthModal,
  isLoggedIn = true,
  customerName = 'Ashik Das',
  onOpenAuthModal,
  onSignOut
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { path: '/', label: 'Home', icon: Monitor },
    { path: '/digital-products', label: 'Digital Product', icon: Sparkles },
    { path: '/store', label: 'Store', icon: ShoppingBag },
    { path: '/services', label: 'Services', icon: Zap },
    { path: '/remote-support', label: 'Remote Support', icon: Headphones, badge: 'Live' },
    { path: '/downloads', label: 'Downloads', icon: Download },
    { path: '/blog', label: 'Blog', icon: BookOpen },
    { path: '/contact', label: 'Contact', icon: Info }
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/store');
      setShowSearchModal(false);
    }
  };

  const handleAdminToggle = () => {
    setMobileMenuOpen(false);
    if (isAdminAuthenticated) {
      navigate('/admin');
    } else {
      if (onOpenAdminAuthModal) {
        onOpenAdminAuthModal();
      } else {
        navigate('/admin');
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Title */}
        <Link
          to="/"
          onClick={handleNavClick}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <img
            src="/logo.png"
            alt="Omove Store Logo"
            className="h-11 w-auto object-contain group-hover:scale-105 transition-transform"
          />
          <div className="hidden sm:block">
            <div className="flex items-center gap-1 leading-tight">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">Omove</span>
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600 font-sans">Store</span>
            </div>
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold font-mono">Digital • Software • PC Support</p>
          </div>
        </Link>

        {/* Center: Main Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `relative px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/80 shadow-xs'
                      : 'text-slate-700 hover:text-emerald-700 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right: Clean Unified Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Search Button */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-2.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-medium flex items-center gap-2 transition-all"
            title="Search software, drivers or services"
          >
            <Search className="w-4 h-4 text-slate-500" />
            <span className="hidden xl:inline text-slate-500">Search...</span>
          </button>

          {/* WhatsApp Support Button */}
          <a
            href="https://wa.me/918345968169"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 font-semibold text-xs transition-all shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp</span>
          </a>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-mono tracking-wide shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline font-sans">Cart</span>
            {cartCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-emerald-700 font-bold text-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account / Sign In Pill */}
          {isLoggedIn ? (
            <div className="flex items-center rounded-xl bg-slate-100 border border-slate-200/90 p-1">
              <Link
                to="/dashboard"
                onClick={handleNavClick}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  location.pathname === '/dashboard'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
                title="Account Dashboard"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">{customerName.split(' ')[0]}</span>
              </Link>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>SIGN IN</span>
            </button>
          )}

          {/* Admin Panel Access Button */}
          <button
            onClick={handleAdminToggle}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isAdminMode && location.pathname === '/admin'
                ? 'bg-amber-500 text-slate-950 font-black shadow-amber-500/20'
                : 'bg-[#064E3B] hover:bg-[#04392b] text-white border border-emerald-700'
            }`}
            title="Admin Command Center"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline font-mono">{isAdminMode ? 'ADMIN ACTIVE' : 'ADMIN PORTAL 🔐'}</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Global Quick Search Modal Popup */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-2xl text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 font-mono flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600" />
                <span>Search Omove Store</span>
              </h3>
              <button onClick={() => setShowSearchModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search software, remote repairs, drivers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans"
              />
            </form>

            <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-1">
              <span>Press enter to search</span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  navigate('/store');
                  setShowSearchModal(false);
                }}
                className="text-emerald-700 hover:underline font-bold"
              >
                Browse All Services →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 px-4 pt-4 pb-6 space-y-4 bg-white shadow-xl">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-600" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handleAdminToggle}
              className="text-xs font-mono font-bold text-white bg-[#064E3B] px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{isAdminMode ? 'Admin Active' : 'ADMIN PORTAL 🔐'}</span>
            </button>
            <span className="text-xs text-slate-500 font-mono">OMOVE TECH v2026</span>
          </div>
        </div>
      )}
    </header>
  );
};


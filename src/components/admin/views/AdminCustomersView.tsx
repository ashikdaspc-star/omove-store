import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, MapPin, Package, ShieldCheck, Trash2, Eye, Calendar, Key, AlertTriangle, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { Order } from '../../../types';

export interface ServerCustomer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  picture?: string;
  authProvider?: string;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  ordersCount?: number;
  totalSpent?: number;
}

interface AdminCustomersViewProps {
  orders: Order[];
}

export const AdminCustomersView: React.FC<AdminCustomersViewProps> = ({ orders = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<ServerCustomer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState<ServerCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<ServerCustomer | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Helper to read local browser registry users
  const getLocalRegistryUsers = (): ServerCustomer[] => {
    const list: ServerCustomer[] = [];
    try {
      // 1. Registered users dictionary
      const stored = localStorage.getItem('omove_registered_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.values(parsed).forEach((u: any) => {
          if (u && u.email) {
            list.push({
              id: u.id || `usr_local_${u.email}`,
              name: u.name || u.email.split('@')[0],
              email: u.email,
              phone: u.phone || '+91 8345968169',
              location: u.location || 'Kolkata, West Bengal, India',
              createdAt: u.createdAt || new Date().toISOString(),
              authProvider: 'email',
              isAdmin: false
            });
          }
        });
      }

      // 2. Currently active local session user
      const activeSess = localStorage.getItem('omove_active_session');
      if (activeSess) {
        const u = JSON.parse(activeSess);
        if (u && u.email) {
          list.push({
            id: u.id || `usr_active_${u.email}`,
            name: u.name || u.email.split('@')[0],
            email: u.email,
            phone: u.phone || '+91 8345968169',
            location: u.location || 'Kolkata, West Bengal, India',
            createdAt: u.createdAt || new Date().toISOString(),
            authProvider: 'email',
            isAdmin: false
          });
        }
      }
    } catch (e) {}
    return list;
  };

  // Fetch registered customers from backend and merge with local storage
  const fetchCustomers = async () => {
    setIsLoading(true);
    setErrorNotice('');
    try {
      let serverList: ServerCustomer[] = [];
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.customers)) {
        serverList = data.customers;
      }

      // Merge backend server accounts + local browser registry accounts
      const mergedMap = new Map<string, ServerCustomer>();
      serverList.forEach(c => {
        if (c.email) mergedMap.set(c.email.toLowerCase(), c);
      });

      const localList = getLocalRegistryUsers();
      localList.forEach(c => {
        if (c.email && !mergedMap.has(c.email.toLowerCase())) {
          mergedMap.set(c.email.toLowerCase(), c);
        }
      });

      setCustomers(Array.from(mergedMap.values()));
    } catch (err) {
      console.warn('Backend customers API note, loading local registry:', err);
      setCustomers(getLocalRegistryUsers());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

    // Re-sync on window focus or storage update
    const handleStorageChange = () => {
      fetchCustomers();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Merge backend / local customers with order statistics
  const customerMap = new Map<string, ServerCustomer>();

  // 1. Add fetched customers (server + local storage)
  customers.forEach(c => {
    if (c.email) {
      customerMap.set(c.email.toLowerCase(), {
        ...c,
        ordersCount: 0,
        totalSpent: 0
      });
    }
  });

  // 2. Also ensure any local storage user is present
  const localUsers = getLocalRegistryUsers();
  localUsers.forEach(lu => {
    if (lu.email && !customerMap.has(lu.email.toLowerCase())) {
      customerMap.set(lu.email.toLowerCase(), {
        ...lu,
        ordersCount: 0,
        totalSpent: 0
      });
    }
  });

  // 3. Add default fallback demo user if missing
  if (!customerMap.has('ad1824110@gmail.com') && customerMap.size === 0) {
    customerMap.set('ad1824110@gmail.com', {
      id: 'usr_demo_101',
      email: 'ad1824110@gmail.com',
      name: 'ad1824110',
      phone: '+91 8345968169',
      location: 'Kolkata, West Bengal, India',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      authProvider: 'email',
      isAdmin: false,
      ordersCount: 1,
      totalSpent: 1499
    });
  }

  // 3. Compute order counts & spending per customer
  orders.forEach(ord => {
    if (ord.customerEmail) {
      const emailKey = ord.customerEmail.toLowerCase();
      const existing = customerMap.get(emailKey) || {
        id: `usr_ord_${Date.now()}`,
        email: ord.customerEmail,
        name: ord.customerName || ord.customerEmail.split('@')[0],
        phone: ord.customerPhone || '+91 8345968169',
        location: 'Kolkata, West Bengal, India',
        createdAt: ord.createdAt || new Date().toISOString(),
        authProvider: 'order-guest',
        isAdmin: false,
        ordersCount: 0,
        totalSpent: 0
      };

      existing.ordersCount = (existing.ordersCount || 0) + 1;
      if (ord.paymentStatus === 'SUCCESS') {
        existing.totalSpent = (existing.totalSpent || 0) + (ord.total || 0);
      }

      customerMap.set(emailKey, existing);
    }
  });

  const customersList = Array.from(customerMap.values()).filter(c => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      c.email.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q))
    );
  });

  // Handle Deleting Customer Account Data
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    setErrorNotice('');
    setSuccessNotice('');

    const targetEmail = customerToDelete.email.toLowerCase();

    try {
      // 1. Call server API
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(targetEmail)}`, {
        method: 'DELETE'
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSuccessNotice(`Account for ${targetEmail} was permanently deleted.`);
      } else if (data.error) {
        setErrorNotice(data.error);
      }
    } catch (err) {
      console.warn('Backend API note during delete:', err);
    }

    // 2. Clear local storage registry
    try {
      const stored = localStorage.getItem('omove_registered_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[targetEmail]) {
          delete parsed[targetEmail];
          localStorage.setItem('omove_registered_users', JSON.stringify(parsed));
        }
      }
    } catch (e) {}

    // 3. Remove from UI state
    setCustomers(prev => prev.filter(c => c.email.toLowerCase() !== targetEmail));
    setIsDeleting(false);
    setCustomerToDelete(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-emerald-600" />
              <span>Customer Accounts Directory</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Manage registered users, inspect account details, and delete user data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCustomers}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold border border-slate-200 flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
              {customersList.length} Active Accounts
            </span>
          </div>
        </div>

        {/* Notices */}
        {successNotice && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button onClick={() => setSuccessNotice('')} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorNotice && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button onClick={() => setErrorNotice('')} className="text-rose-700 hover:text-rose-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-sans shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-emerald-600 animate-spin" />
            <p className="text-xs font-mono text-slate-500">Loading registered accounts...</p>
          </div>
        ) : customersList.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No Customer Accounts Found</p>
            <p className="text-xs font-mono text-slate-400 max-w-xs mx-auto">
              {searchQuery ? 'Try adjusting your search query.' : 'Customer accounts created via the store will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200/90 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-bold">Customer Profile</th>
                  <th className="pb-3 font-bold">Email Address</th>
                  <th className="pb-3 font-bold">Phone Number</th>
                  <th className="pb-3 font-bold">Location</th>
                  <th className="pb-3 font-bold">Orders</th>
                  <th className="pb-3 font-bold">Total Spent</th>
                  <th className="pb-3 font-bold">Role</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customersList.map((cust) => (
                  <tr key={cust.email} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase font-mono shadow-xs border border-emerald-700">
                          {cust.name ? cust.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <strong className="text-slate-900 font-sans font-bold text-xs block">{cust.name || 'Unnamed Customer'}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {cust.id || 'N/A'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 text-emerald-700 font-sans font-medium">{cust.email}</td>

                    <td className="py-3.5 text-slate-600 font-mono">{cust.phone || 'N/A'}</td>

                    <td className="py-3.5 text-slate-600 font-sans max-w-[140px] truncate" title={cust.location}>
                      {cust.location || 'India'}
                    </td>

                    <td className="py-3.5 font-bold text-slate-900 font-mono">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                        {cust.ordersCount || 0} Orders
                      </span>
                    </td>

                    <td className="py-3.5 font-extrabold text-slate-900 font-mono">
                      ₹{cust.totalSpent ? cust.totalSpent.toLocaleString() : '0'}
                    </td>

                    <td className="py-3.5">
                      {cust.isAdmin ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          CUSTOMER
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 text-right space-x-1">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                        title="View Full Customer Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setCustomerToDelete(cust)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                        title="Delete Customer Account & Data"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Full Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-2xl relative text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm font-mono shadow-md">
                  {selectedCustomer.name ? selectedCustomer.name.charAt(0) : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-xs font-mono text-slate-400">Account Details & Metadata</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Account ID</span>
                  <span className="font-bold text-slate-800 break-all">{selectedCustomer.id || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Role</span>
                  <span className="font-bold text-emerald-700">{selectedCustomer.isAdmin ? 'System Admin' : 'Registered Customer'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Auth Provider</span>
                  <span className="font-bold text-slate-800 uppercase">{selectedCustomer.authProvider || 'Email'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Registered On</span>
                  <span className="font-bold text-slate-800">
                    {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="overflow-hidden">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Email Address</span>
                    <span className="font-bold text-slate-900 font-sans">{selectedCustomer.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Phone Number</span>
                    <span className="font-bold text-slate-900">{selectedCustomer.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Default Delivery Location</span>
                    <span className="font-bold text-slate-900 font-sans">{selectedCustomer.location || 'India'}</span>
                  </div>
                </div>
              </div>

              {/* Purchase stats summary */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Completed Orders</span>
                  <span className="text-base font-extrabold text-emerald-900">{selectedCustomer.ordersCount || 0} Orders</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Total Amount Spent</span>
                  <span className="text-base font-extrabold text-emerald-900">₹{(selectedCustomer.totalSpent || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-2xl relative text-slate-900">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-lg font-extrabold text-slate-900">Delete Customer Account?</h3>
              <p className="text-xs text-slate-500 font-mono leading-relaxed">
                You are about to permanently delete the account data for{' '}
                <strong className="text-rose-600 font-sans">{customerToDelete.email}</strong>.
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                This action will delete their profile from the server database, invalidate active sessions, and remove local registry data.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm & Delete Permanently</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-xs border border-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, MapPin, Package, ShieldCheck, Trash2, Eye, Calendar, Key, AlertTriangle, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { Order } from '../../../types';
import { CONTACT_CONFIG } from '../../../config/contactConfig';
import { AdminConfirmDialog } from '../ui/AdminConfirmDialog';

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
  const [selectedCustomer, setSelectedCustomer] = useState<ServerCustomer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<ServerCustomer | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const getLocalRegistryUsers = (): ServerCustomer[] => {
    const list: ServerCustomer[] = [];
    try {
      const stored = localStorage.getItem('omove_registered_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.values(parsed).forEach((u: any) => {
          if (u && u.email) {
            list.push({
              id: u.id || `usr_local_${u.email}`,
              name: u.name || u.email.split('@')[0],
              email: u.email,
              phone: u.phone || CONTACT_CONFIG.whatsapp.display,
              location: u.location || 'Kolkata, West Bengal, India',
              createdAt: u.createdAt || new Date().toISOString(),
              authProvider: 'email',
              isAdmin: false
            });
          }
        });
      }

      const activeSess = localStorage.getItem('omove_active_session');
      if (activeSess) {
        const u = JSON.parse(activeSess);
        if (u && u.email) {
          list.push({
            id: u.id || `usr_active_${u.email}`,
            name: u.name || u.email.split('@')[0],
            email: u.email,
            phone: u.phone || CONTACT_CONFIG.whatsapp.display,
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

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      let serverList: ServerCustomer[] = [];
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.customers)) {
        serverList = data.customers;
      }

      const mergedMap = new Map<string, ServerCustomer>();
      serverList.forEach((c) => {
        if (c.email) mergedMap.set(c.email.toLowerCase(), c);
      });

      const localList = getLocalRegistryUsers();
      localList.forEach((c) => {
        if (c.email && !mergedMap.has(c.email.toLowerCase())) {
          mergedMap.set(c.email.toLowerCase(), c);
        }
      });

      setCustomers(Array.from(mergedMap.values()));
    } catch (err) {
      console.warn('Backend customers API notice:', err);
      setCustomers(getLocalRegistryUsers());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Compute order statistics per customer
  const customerMap = new Map<string, ServerCustomer>();
  customers.forEach((c) => {
    if (c.email) {
      customerMap.set(c.email.toLowerCase(), {
        ...c,
        ordersCount: 0,
        totalSpent: 0
      });
    }
  });

  (orders || []).forEach((ord) => {
    if (ord && ord.customerEmail) {
      const email = ord.customerEmail.toLowerCase();
      const existing = customerMap.get(email);
      const isPaid = ord.paymentStatus === 'SUCCESS' || ord.status === 'completed';
      const amt = Number(ord.total || (ord as any).totalAmount || 0) || 0;

      if (existing) {
        existing.ordersCount = (existing.ordersCount || 0) + 1;
        if (isPaid) {
          existing.totalSpent = (existing.totalSpent || 0) + amt;
        }
      } else {
        customerMap.set(email, {
          id: `cust_order_${email}`,
          name: ord.customerName || email.split('@')[0],
          email: ord.customerEmail,
          createdAt: ord.createdAt || new Date().toISOString(),
          ordersCount: 1,
          totalSpent: isPaid ? amt : 0
        });
      }
    }
  });

  const mergedCustomers = Array.from(customerMap.values());

  const filtered = mergedCustomers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/admin/customers/${encodeURIComponent(customerToDelete.email)}`, {
        method: 'DELETE'
      });
      setCustomers((prev) => prev.filter((c) => c.email !== customerToDelete.email));
      setCustomerToDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
              Customer Directory
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
              {filtered.length} customers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            CRM records, buyer accounts, total order value, and registered users.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCustomers}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 text-xs font-sans">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-semibold bg-slate-50/75">
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Orders</th>
                <th className="py-3.5 px-4 font-semibold">Total Spent</th>
                <th className="py-3.5 px-4 font-semibold">Joined</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                    No customer records found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.email} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <strong className="block text-slate-900 font-sans text-xs truncate group-hover:text-cyan-700 transition-colors">
                            {c.name}
                          </strong>
                          <span className="text-[11px] text-slate-400 font-mono truncate block">
                            {c.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {c.ordersCount || 0} orders
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-700 font-mono text-xs">
                      ₹{(c.totalSpent || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerToDelete(c)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-2xl text-xs font-sans text-slate-700"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center font-bold text-sm">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-sans">{selectedCustomer.name}</h3>
                  <span className="text-[10px] text-slate-400">Customer CRM Profile</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-emerald-700 font-semibold font-mono">{selectedCustomer.email}</span>
              </div>
              {selectedCustomer.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-700 font-mono">{selectedCustomer.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Total Orders:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedCustomer.ordersCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Spent:</span>
                <span className="font-extrabold text-slate-900 text-sm font-mono">
                  ₹{(selectedCustomer.totalSpent || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Member Since:</span>
                <span className="text-slate-500">
                  {selectedCustomer.createdAt
                    ? new Date(selectedCustomer.createdAt).toLocaleDateString()
                    : 'Recent'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={Boolean(customerToDelete)}
        title="Delete Customer Account?"
        description={`Are you sure you want to remove customer "${customerToDelete?.email}" from the directory?`}
        confirmLabel="Delete Account"
        cancelLabel="Keep Customer"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteCustomer}
        onCancel={() => setCustomerToDelete(null)}
      />
    </div>
  );
};

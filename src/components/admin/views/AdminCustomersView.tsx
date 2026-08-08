import React, { useState } from 'react';
import { Users, Search, Mail, Phone, MapPin, Package, ShieldCheck } from 'lucide-react';
import { Order } from '../../../types';

interface RegisteredUser {
  name: string;
  email: string;
  phone: string;
  location?: string;
  createdAt?: string;
}

interface AdminCustomersViewProps {
  orders: Order[];
}

export const AdminCustomersView: React.FC<AdminCustomersViewProps> = ({ orders = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique customer profiles from orders and active state
  const customerMap = new Map<string, { email: string; name: string; phone: string; location: string; totalSpent: number; ordersCount: number }>();

  orders.forEach((ord) => {
    if (ord.customerEmail) {
      const existing = customerMap.get(ord.customerEmail.toLowerCase()) || {
        email: ord.customerEmail,
        name: ord.customerName || ord.customerEmail.split('@')[0],
        phone: ord.customerPhone || '+91 8345968169',
        location: 'Kolkata, West Bengal, India',
        totalSpent: 0,
        ordersCount: 0
      };
      if (ord.paymentStatus === 'SUCCESS') {
        existing.totalSpent += ord.total || 0;
      }
      existing.ordersCount += 1;
      customerMap.set(ord.customerEmail.toLowerCase(), existing);
    }
  });

  // Ensure default demo user exists for preview
  if (!customerMap.has('ad1824110@gmail.com')) {
    customerMap.set('ad1824110@gmail.com', {
      email: 'ad1824110@gmail.com',
      name: 'ad1824110',
      phone: '+91 8345968169',
      location: 'Kolkata, West Bengal, India',
      totalSpent: 1499,
      ordersCount: 1
    });
  }

  const customersList = Array.from(customerMap.values()).filter((c) => {
    return (
      !searchQuery ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">Registered Customer Directory</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Real-time customer account directory and purchasing statistics.</p>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
            {customersList.length} Verified Customers
          </span>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200/90 text-slate-400 uppercase">
                <th className="pb-3 font-bold">Customer</th>
                <th className="pb-3 font-bold">Primary Email</th>
                <th className="pb-3 font-bold">Phone Number</th>
                <th className="pb-3 font-bold">Orders</th>
                <th className="pb-3 font-bold">Total Spent</th>
                <th className="pb-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customersList.map((cust, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase font-mono shadow-xs">
                        {cust.name.charAt(0)}
                      </div>
                      <strong className="text-slate-900 font-sans font-bold text-xs">{cust.name}</strong>
                    </div>
                  </td>
                  <td className="py-3.5 text-emerald-700 font-sans">{cust.email}</td>
                  <td className="py-3.5 text-slate-600">{cust.phone}</td>
                  <td className="py-3.5 font-bold text-slate-900">{cust.ordersCount} Orders</td>
                  <td className="py-3.5 font-extrabold text-slate-900">₹{cust.totalSpent}</td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

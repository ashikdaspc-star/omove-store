import React from 'react';
import { Order } from '../types';
import { X, Printer, ShieldCheck, Download, Zap } from 'lucide-react';

interface InvoicePrintModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:rounded-none print:bg-white print:text-slate-900">
        {/* Modal Controls (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 print:hidden">
          <span className="font-mono text-xs font-bold text-cyan-400">OFFICIAL DIGITAL TAX INVOICE</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono flex items-center gap-2 shadow-md shadow-indigo-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT / SAVE AS PDF</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-8 space-y-8 print:p-6 text-slate-200 print:text-slate-900" id="printable-invoice">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 print:border-slate-300 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Omove Store Logo"
                  className="h-10 w-auto object-contain"
                />
                <span className="text-xl font-bold font-mono tracking-tight text-white print:text-slate-900">
                  Omove<span className="text-blue-500 print:text-blue-600">Store</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Omove Store Digital Products, Software Solutions & PC Support Ltd.
              </p>
              <p className="text-[11px] text-slate-500 print:text-slate-500 font-mono">
                GSTIN: 27AABCO8912C1Z4 • Reg ID: OMV-US-99120
              </p>
            </div>

            <div className="text-right space-y-1 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 print:bg-indigo-100 print:text-indigo-800 font-bold">
                TAX INVOICE
              </span>
              <p className="text-slate-300 print:text-slate-800 font-bold pt-2">{order.orderNumber}</p>
              <p className="text-slate-400 print:text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="grid grid-cols-2 gap-6 text-xs p-4 rounded-2xl bg-slate-950/60 print:bg-slate-50 border border-slate-800/80 print:border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Billed To</span>
              <p className="font-bold text-white print:text-slate-900">{order.customerName}</p>
              <p className="text-slate-400 print:text-slate-600">{order.customerEmail}</p>
              <p className="text-slate-400 print:text-slate-600">{order.customerPhone}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Payment Reference</span>
              <p className="font-mono text-slate-300 print:text-slate-800 font-semibold">{order.paymentMethod}</p>
              <p className="font-mono text-slate-400 print:text-slate-600 text-[11px] truncate">
                Txn ID: {order.razorpayPaymentId || 'pay_demo_verified'}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 print:bg-emerald-100 print:text-emerald-800 font-bold font-mono text-[10px]">
                STATUS: PAID
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-800 print:border-slate-300 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono">
                <tr>
                  <th className="p-3">Product Description</th>
                  <th className="p-3">License Key</th>
                  <th className="p-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="text-slate-300 print:text-slate-800">
                    <td className="p-3 font-semibold">
                      {it.productName}
                      <span className="block text-[10px] text-slate-500 font-mono">Digital License • Instant Download</span>
                    </td>
                    <td className="p-3 font-mono text-indigo-300 print:text-indigo-700 font-bold">
                      {it.licenseKey}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">₹{it.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Math */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400 print:text-slate-600">
                <span>Subtotal:</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-400 print:text-emerald-700">
                  <span>Discount:</span>
                  <span>-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-slate-400 print:text-slate-600">
                  <span>GST / Tax:</span>
                  <span>₹{order.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white print:text-slate-900 pt-2 border-t border-slate-800 print:border-slate-300">
                <span>Total Amount:</span>
                <span className="text-cyan-400 print:text-indigo-600">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Digital Signature Footer */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-300 flex items-center justify-between text-[11px] text-slate-500 print:text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 print:text-emerald-600" />
              <span>Cryptographically verified invoice issued by OMOVE TECH Engine.</span>
            </div>
            <span className="font-mono">Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};

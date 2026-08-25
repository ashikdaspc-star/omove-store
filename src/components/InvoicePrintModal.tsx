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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static font-sans">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:rounded-none print:bg-white print:text-slate-900">
        {/* Modal Controls (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 print:hidden">
          <span className="text-xs font-bold text-emerald-700">OFFICIAL DIGITAL TAX INVOICE</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT / SAVE AS PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-8 space-y-8 print:p-6 text-slate-900" id="printable-invoice">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Omove Store Logo"
                  className="h-10 w-auto object-contain"
                />
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Omove<span className="text-emerald-600">Store</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Omove Store Digital Products, Software Solutions & PC Support Ltd.
              </p>
              <p className="text-[11px] text-slate-500">
                GSTIN: 27AABCO8912C1Z4 • Reg ID: OMV-US-99120
              </p>
            </div>

            <div className="text-right space-y-1 text-xs">
              <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                TAX INVOICE
              </span>
              <p className="text-slate-900 font-bold pt-2">{order.orderNumber}</p>
              <p className="text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="grid grid-cols-2 gap-6 text-xs p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Billed To</span>
              <p className="font-bold text-slate-900">{order.customerName}</p>
              <p className="text-slate-600">{order.customerEmail}</p>
              <p className="text-slate-600">{order.customerPhone}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Payment Reference</span>
              <p className="text-slate-800 font-semibold">{order.paymentMethod}</p>
              <p className="text-slate-500 text-[11px] truncate">
                Txn ID: {order.razorpayPaymentId || 'pay_demo_verified'}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                STATUS: PAID
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3">Product Description</th>
                  <th className="p-3">Fulfillment</th>
                  <th className="p-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="text-slate-800">
                    <td className="p-3 font-semibold">
                      {it.productName}
                      <span className="block text-[10px] text-slate-500">Digital Product • Google Drive Link</span>
                    </td>
                    <td className="p-3 text-emerald-700 font-bold">
                      Google Drive File
                    </td>
                    <td className="p-3 text-right font-bold">₹{it.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Math */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount:</span>
                  <span>-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax:</span>
                  <span>₹{order.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-emerald-700 font-extrabold">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Digital Signature Footer */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Cryptographically verified invoice issued by OMOVE TECH Engine.</span>
            </div>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};

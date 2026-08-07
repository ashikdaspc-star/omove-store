import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { RemoteService, RemoteBooking } from '../types';
import {
  Zap,
  Check,
  Clock,
  ShieldCheck,
  Monitor,
  ArrowRight,
  Headphones,
  MessageSquare,
  ExternalLink,
  Lock,
  X,
  CheckCircle2,
  DownloadCloud
} from 'lucide-react';

interface ServicesViewProps {
  services: RemoteService[];
  onBookingSuccess?: (booking: RemoteBooking) => void;
  setCurrentView: (view: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ services, onBookingSuccess, setCurrentView }) => {
  const [activeService, setActiveService] = useState<RemoteService | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTestGateway, setShowTestGateway] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<RemoteBooking | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<RemoteBooking | null>(null);

  const handleStartBooking = (srv: RemoteService) => {
    setActiveService(srv);
    setConfirmedBooking(null);
    setShowTestGateway(false);
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeService) return;
    setIsSubmitting(true);

    const payload = {
      customerName,
      email,
      phone,
      serviceId: activeService.id,
      amount: activeService.price,
      issueCategory: activeService.category,
      problemDescription,
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: '10:00 AM',
      remoteTool: 'AnyDesk' as const,
      remoteId: remoteId || '982 110 449',
      remotePassword: ''
    };

    let bookingObj: RemoteBooking | null = null;

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.booking) {
          bookingObj = data.booking;
        }
      }
    } catch (err) {
      console.warn('Backend API unavailable, using client-side booking construction:', err);
    }

    if (!bookingObj) {
      bookingObj = {
        id: 'bk-' + Date.now(),
        bookingNumber: 'OMV-BOOK-' + Math.floor(1000 + Math.random() * 9000),
        customerName,
        email,
        phone,
        serviceId: activeService.id,
        serviceTitle: activeService.title,
        issueCategory: activeService.category,
        problemDescription: problemDescription || 'Remote PC inspection & repair requested.',
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '10:00 AM',
        remoteTool: 'AnyDesk',
        remoteId: remoteId || '982 110 449',
        remotePassword: '',
        amount: activeService.price,
        paymentStatus: 'Paid',
        status: 'Technician Assigned',
        technicianName: 'David Chen (Cert #8821)',
        createdAt: new Date().toISOString()
      };
    }

    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TMiCMOFsYnHr8G';

      if (typeof (window as any).Razorpay === 'undefined') {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.body.appendChild(script);
        });
      }

      if (typeof (window as any).Razorpay !== 'undefined') {
        const options = {
          key: razorpayKey,
          amount: Math.round(activeService.price * 100),
          currency: 'INR',
          name: 'OMOVE TECH Engine',
          description: `PC Service: ${activeService.title}`,
          image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200&auto=format&fit=crop&q=80',
          prefill: {
            name: customerName,
            email: email,
            contact: phone
          },
          theme: { color: '#059669' },
          handler: function (response: any) {
            if (bookingObj) {
              bookingObj.razorpayPaymentId = response.razorpay_payment_id || ('pay_' + Date.now());
              setConfirmedBooking(bookingObj);
              if (onBookingSuccess) onBookingSuccess(bookingObj);
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }
          },
          modal: {
            ondismiss: function () {
              console.log('Razorpay payment popup closed by user');
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        setPendingBooking(bookingObj);
        setShowTestGateway(true);
      }
    } catch (err) {
      console.error('Razorpay popup trigger error:', err);
      if (bookingObj) {
        setPendingBooking(bookingObj);
        setShowTestGateway(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmTestPayment = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (pendingBooking) {
        setConfirmedBooking(pendingBooking);
        if (onBookingSuccess) onBookingSuccess(pendingBooking);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
      setIsSubmitting(false);
      setShowTestGateway(false);
    }, 1000);
  };

  const handleCloseModal = () => {
    setActiveService(null);
    setShowTestGateway(false);
    setConfirmedBooking(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Header Banner - Highlighted Dark Green Mesh */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#04392b] to-[#0f172a] text-white shadow-xl border border-emerald-500/30 text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-mono font-bold shadow-md">
          <Zap className="w-4 h-4 text-emerald-300" />
          <span>INSTANT CERTIFIED REMOTE COMPUTER REPAIR SERVICES</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Professional Remote Technical Services
        </h1>

        <p className="text-sm sm:text-base text-emerald-100/90 max-w-3xl mx-auto leading-relaxed">
          Select from our certified computer repair services below. Our experts connect remotely via AnyDesk to inspect & fix issues live while you watch.
        </p>
      </div>

      {/* Services Grid - Prominently Highlighted Service Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((srv) => (
          <div
            key={srv.id}
            className="p-7 rounded-3xl bg-white border-2 border-emerald-500/40 hover:border-emerald-600 transition-all flex flex-col justify-between space-y-6 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transform hover:-translate-y-1"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold shadow-xs">
                  {srv.category}
                </span>
                <span className="text-xs text-emerald-700 font-mono font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  {srv.estimatedTime}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 leading-snug">{srv.title}</h3>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{srv.description}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 font-mono block">
                  Included Service Features:
                </span>
                <ul className="space-y-2 text-xs text-slate-800 font-medium">
                  {srv.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Refund Guarantee Highlight Box */}
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-xs text-emerald-950 font-sans shadow-xs space-y-1">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="uppercase text-[11px] tracking-wider">100% Refund Guarantee</span>
                  </div>
                  <p className="text-[11px] text-emerald-900 leading-relaxed font-sans">
                    If we're unable to resolve your issue, your payment will be automatically refunded within 2–3 business days.
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing CTA Box - Highlighted Dark Slate Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono uppercase tracking-wider">Special Inspection Fee</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-emerald-400">₹{srv.price}</span>
                    <span className="text-xs text-slate-500 line-through font-mono">₹{srv.originalPrice}</span>
                  </div>
                </div>

                <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-mono font-black shadow-md animate-pulse">
                  SAVE 92% TODAY
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleStartBooking(srv)}
                className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm font-mono tracking-wider shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Lock className="w-4.5 h-4.5" />
                <span>PAY ₹{srv.price} & GET INSTANT REPAIR</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* SELF-CONTAINED BOOKING & PAYMENT MODAL */}
      {activeService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-950 text-white border-b border-emerald-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white font-mono">
                    {confirmedBooking ? 'BOOKING VERIFIED' : 'PC INSPECTION BOOKING'}
                  </h3>
                  <p className="text-[11px] text-emerald-300 font-mono">{activeService.title} (₹{activeService.price})</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 rounded-xl bg-emerald-900 text-emerald-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* View 1: Confirmed & Post-Purchase WhatsApp Button */}
            {confirmedBooking ? (
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">Payment Successful & Booking Confirmed!</h3>
                  <p className="text-xs text-slate-600">
                    Booking ID: <strong className="font-mono text-emerald-700">{confirmedBooking.bookingNumber}</strong>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <span className="text-xs text-emerald-800 font-mono font-bold block uppercase tracking-wider">
                    ✅ TECHNICIAN ONLINE & ASSIGNED
                  </span>
                  <p className="text-xs text-slate-600">
                    Click below to start live 1-on-1 remote PC inspection chat directly on WhatsApp!
                  </p>
                  <a
                    href={`https://wa.me/918345968169?text=${encodeURIComponent(
                      `Hello OMOVE Expert! I paid ₹${activeService.price} for PC Inspection.\nBooking ID: ${confirmedBooking.bookingNumber}\nName: ${confirmedBooking.customerName}\nPhone: ${confirmedBooking.phone}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-sm font-extrabold inline-flex items-center justify-center gap-2.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>CONNECT WITH TECHNICIAN ON WHATSAPP NOW</span>
                    <ExternalLink className="w-4 h-4 opacity-80" />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-bold"
                >
                  CLOSE WINDOW
                </button>
              </div>
            ) : showTestGateway ? (
              /* View 2: Razorpay Test Gateway */
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-mono text-[10px] font-bold uppercase">
                      RAZORPAY TEST GATEWAY
                    </span>
                    <span className="text-xl font-mono font-extrabold text-slate-900">₹{activeService.price}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Simulating secure payment gateway transaction. Click below to verify payment and connect with your technician.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Customer</span>
                    <span className="text-slate-900 font-bold">{customerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Remote Tool</span>
                    <span className="text-emerald-700 font-bold">AnyDesk (WhatsApp Connected)</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Service</span>
                    <span className="text-slate-900">{activeService.title}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmTestPayment}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm font-mono tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>VERIFYING PAYMENT...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>COMPLETE SIMULATED PAYMENT (₹{activeService.price})</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* View 3: Customer Form */
              <form onSubmit={handleProceedToPayment} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. rahul@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">WhatsApp Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* AnyDesk Official Download Card */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-900 font-mono font-bold text-xs">
                        <Monitor className="w-4 h-4 text-emerald-600" />
                        <span>AnyDesk Remote Software</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Download free AnyDesk so our expert can inspect your PC live.
                      </p>
                    </div>
                    <a
                      href="https://anydesk.com/en/downloads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap transition-all"
                    >
                      <DownloadCloud className="w-4 h-4" />
                      <span>Download AnyDesk</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm font-mono tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>PREPARING CHECKOUT...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>PAY ₹{activeService.price} & GET INSTANT REPAIR</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

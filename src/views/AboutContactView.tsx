import React, { useState } from 'react';
import { ShieldCheck, Mail, MessageSquare, MapPin, Send, CheckCircle2, Lock, Zap } from 'lucide-react';
import { sendContactInquiryEmail } from '../utils/emailNotifier';

export const AboutContactView: React.FC = () => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactName && contactEmail && contactMsg) {
      sendContactInquiryEmail({
        customerName: contactName,
        email: contactEmail,
        message: contactMsg
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      setContactName('');
      setContactEmail('');
      setContactMsg('');
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center space-y-4">
        <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-700">
          About OMOVE TECH Inc.
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Enterprise Digital Marketplace & Remote Technical Support
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Founded in 2026, Omove Store empowers individuals, IT admins, and remote workers with genuine software, instant driver packages, and 24/7 live computer repair expertise.
        </p>
      </div>

      {/* Grid: Credentials & Contact Form */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Info Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-slate-900 font-mono">Our Trust Commitments</h3>
            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 font-sans">Genuine Software Guarantees</h4>
                  <p className="text-slate-500 mt-0.5">All digital files are verified with instant Google Drive fulfillment.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Encrypted AnyDesk Sessions</h4>
                  <p className="text-slate-500 mt-0.5">Remote repairs utilize TLS 1.3 encryption. You retain complete screen control.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">30-Day Money Back Guarantee</h4>
                  <p className="text-slate-500 mt-0.5">If software or remote support fails to fix your issue, receive a 100% full refund.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 text-xs text-slate-700 font-mono">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>omovetech@gmail.com</span>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Only: +91 8345968169</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Kolkata, West Bengal, India</span>
            </div>
          </div>
        </div>

        {/* Right Contact Form */}
        <div className="lg:col-span-7 p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-xl text-slate-900 font-mono">Send Us a Direct Message</h3>
            <p className="text-xs text-slate-500 mt-1">Fill out your inquiry details and our technical support team will contact you within 15 minutes.</p>
          </div>

          {submitted ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-xs font-mono">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <strong>Message Sent!</strong> Our technical support team will respond within 15 minutes.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Your Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Message / Inquiry Details *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us how we can help..."
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
              >
                <Send className="w-4 h-4" />
                <span>SEND DIRECT MESSAGE</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

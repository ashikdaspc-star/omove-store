import React, { useState } from 'react';
import { ShieldCheck, Mail, MessageSquare, MapPin, Send, CheckCircle2, Lock } from 'lucide-react';
import { sendContactInquiryEmail } from '../utils/emailNotifier';
import { CONTACT_CONFIG } from '../config/contactConfig';

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
    <div className="min-h-screen bg-[#FAFAF8] text-slate-900 font-sans py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* ========================================================================= */}
        {/* HERO / PAGE INTRO */}
        {/* ========================================================================= */}
        <div className="scroll-reveal max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <span>CONTACT OMOVE STORE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Let's Talk. We're Here to Help.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            Have a question about a digital product, an order, or remote technical support? Send us a message and our team will get back to you.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* TWO-COLUMN CONTACT & FORM SECTION */}
        {/* ========================================================================= */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Contact Information & Trust Commitments */}
          <div className="scroll-reveal lg:col-span-5 space-y-8">
            
            {/* Get in Touch Section */}
            <div className="bg-white border border-[#E6E8E5] rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Get in Touch
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Reach out directly via email, WhatsApp, or visit our office.
                </p>
              </div>

              <div className="space-y-4 text-sm">
                {/* Email */}
                <a
                  href="mailto:omovetech@gmail.com"
                  className="group flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Email
                    </span>
                    <span className="text-slate-900 font-semibold group-hover:text-emerald-700 transition-colors">
                      omovetech@gmail.com
                    </span>
                  </div>
                </a>

                {/* WhatsApp */}
                <a
                  href={CONTACT_CONFIG.whatsapp.getLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      WhatsApp
                    </span>
                    <span className="text-slate-900 font-semibold group-hover:text-emerald-700 transition-colors">
                      {CONTACT_CONFIG.whatsapp.display}
                    </span>
                  </div>
                </a>

                {/* Location */}
                <div className="flex items-start gap-3.5 p-3 rounded-xl">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Location
                    </span>
                    <span className="text-slate-900 font-semibold">
                      Kolkata, West Bengal, India
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Trust Commitments */}
            <div className="bg-white border border-[#E6E8E5] rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Our Trust Commitments
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Genuine Software</span>
                    <span className="text-slate-500 leading-relaxed">Verified digital files and secure delivery.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Secure Remote Sessions</span>
                    <span className="text-slate-500 leading-relaxed">Encrypted remote support sessions.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">30-Day Money Back</span>
                    <span className="text-slate-500 leading-relaxed">Clear refund policy for eligible services.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Contact Form */}
          <div className="scroll-reveal lg:col-span-7 bg-white border border-[#E6E8E5] rounded-2xl p-6 sm:p-8 md:p-10 shadow-xs space-y-6" style={{ '--reveal-delay': '140ms' } as React.CSSProperties}>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Send Us a Message
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Tell us what you need help with and our team will get back to you.
              </p>
            </div>

            {submitted ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3.5 text-xs animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block text-sm font-bold text-emerald-900">Message Sent Successfully!</strong>
                  <p className="text-emerald-700 leading-relaxed">
                    Thank you for reaching out. Our support team will review your inquiry and get back to you shortly.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Name Field */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block text-xs">
                      Your Name <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-colors text-xs"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-slate-700 font-bold block text-xs">
                      Your Email Address <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-colors text-xs"
                    />
                  </div>
                </div>

                {/* Message Field */}
                <div className="space-y-1.5">
                  <label className="text-slate-700 font-bold block text-xs">
                    Message / Inquiry Details <span className="text-emerald-600">*</span>
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Describe your inquiry, order details, or support request..."
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-colors text-xs leading-relaxed"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wide shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <span>SEND MESSAGE</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};


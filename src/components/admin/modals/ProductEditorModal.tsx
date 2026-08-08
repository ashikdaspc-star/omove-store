import React, { useState } from 'react';
import { Product } from '../../../types';
import { CATEGORIES } from '../../../data/mockData';
import { X, Check, ArrowRight, ArrowLeft, Sparkles, Image, Tag, DollarSign, ShieldCheck, Globe, Lock } from 'lucide-react';

interface ProductEditorModalProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
}

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave
}) => {
  const isEdit = Boolean(product && product.id);

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || 'Software');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || '');
  const [fullDescription, setFullDescription] = useState(product?.fullDescription || '');
  const [tagsInput, setTagsInput] = useState((product?.tags || ['Software', 'Digital Key']).join(', '));

  const [image, setImage] = useState(
    product?.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'
  );

  const [price, setPrice] = useState<number>(product?.price || 499);
  const [originalPrice, setOriginalPrice] = useState<number>(product?.originalPrice || 999);
  const [discountPercent, setDiscountPercent] = useState<number>(product?.discountPercent || 50);

  const [licenseType, setLicenseType] = useState(product?.licenseType || 'Lifetime License');
  const [version, setVersion] = useState(product?.version || 'v2026.1');
  const [downloadSize, setDownloadSize] = useState(product?.downloadSize || '50 MB');
  const [compatibilityInput, setCompatibilityInput] = useState(
    (product?.compatibility || ['Windows 11', 'Windows 10']).join(', ')
  );
  const [featuresInput, setFeaturesInput] = useState(
    (product?.features || ['Instant Product Access Key', 'Official Setup Package']).join('\n')
  );
  const [instantKeyAvailable, setInstantKeyAvailable] = useState<boolean>(product?.instantKeyAvailable ?? true);
  const [isBestSeller, setIsBestSeller] = useState<boolean>(product?.isBestSeller ?? false);

  const [slug, setSlug] = useState(product?.slug || '');
  const [seoTitle, setSeoTitle] = useState(product?.name ? `${product.name} - Omove Store` : '');
  const [seoDescription, setSeoDescription] = useState(product?.shortDescription || '');

  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>(product?.status || 'PUBLISHED');

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const compatibility = compatibilityInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const features = featuresInput
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const finalProductData: Partial<Product> = {
      id: product?.id,
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category,
      tags,
      shortDescription,
      fullDescription: fullDescription || shortDescription,
      image,
      price: Number(price),
      originalPrice: Number(originalPrice),
      discountPercent: Number(discountPercent),
      licenseType,
      version,
      downloadSize,
      compatibility,
      features,
      instantKeyAvailable,
      isBestSeller,
      status
    };

    try {
      await onSave(finalProductData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-400">
              {isEdit ? 'EDIT PRODUCT RECORD' : 'NEW PRODUCT WIZARD'}
            </span>
            <h2 className="text-lg font-extrabold text-white">{isEdit ? `Edit ${product?.name}` : 'Add New Product'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Indicator */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs font-mono font-bold overflow-x-auto">
          {[
            { num: 1, label: '1. Basic Info' },
            { num: 2, label: '2. Media' },
            { num: 3, label: '3. Pricing' },
            { num: 4, label: '4. Details' },
            { num: 5, label: '5. SEO' },
            { num: 6, label: '6. Publish' }
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                step === s.num
                  ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                  : step > s.num
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'text-slate-500 hover:bg-slate-200/60'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. OMOVE WinMaster Pro 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="Software">Software</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Software, Windows, Key"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Short Description *</label>
                <textarea
                  rows={2}
                  required
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief summary of what this product includes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Full Description</label>
                <textarea
                  rows={4}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Detailed breakdown of features, setup requirements, and license details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Media */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Main Product Image URL *</label>
                <input
                  type="text"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <span className="text-slate-500 font-mono text-[11px] block">Image Preview</span>
                <img
                  src={image}
                  alt="Preview"
                  className="h-40 mx-auto rounded-xl object-cover border border-slate-200"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Pricing */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Sale Price (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setPrice(p);
                      if (originalPrice > p) {
                        setDiscountPercent(Math.round(((originalPrice - p) / originalPrice) * 100));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Compare Price (₹ INR)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => {
                      const op = Number(e.target.value);
                      setOriginalPrice(op);
                      if (op > price) {
                        setDiscountPercent(Math.round(((op - price) / op) * 100));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Discount %</label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs">
                <span>Calculated Offer: </span>
                <strong className="text-emerald-950">₹{price}</strong>
                {originalPrice > price && <span className="line-through text-slate-400 ml-2">₹{originalPrice}</span>}
                <span className="ml-2 font-bold bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px]">
                  -{discountPercent}% OFF
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: Details */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 font-mono">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">License Type</label>
                  <input
                    type="text"
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    placeholder="Lifetime License"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="v2026.1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Download Size</label>
                  <input
                    type="text"
                    value={downloadSize}
                    onChange={(e) => setDownloadSize(e.target.value)}
                    placeholder="50 MB"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Key Features Bullets (1 per line)</label>
                <textarea
                  rows={3}
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  placeholder="Instant Access Key&#10;Official Setup Installer Package"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>

              <div className="flex items-center gap-6 pt-2 font-mono">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={instantKeyAvailable}
                    onChange={(e) => setInstantKeyAvailable(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span>Instant Access Key Enabled</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>Highlight as BESTSELLER</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: SEO */}
          {step === 5 && (
            <div className="space-y-4 font-mono">
              <div>
                <label className="font-bold text-slate-900 block mb-1">SEO URL Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="omove-winmaster-pro-2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">SEO Title Tag</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">SEO Meta Description</label>
                <textarea
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 6: Publishing */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-900 block mb-2 font-mono">Publishing Status *</label>
                <div className="grid grid-cols-3 gap-3 font-mono">
                  {(['PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setStatus(st)}
                      className={`p-4 rounded-2xl border text-center font-bold transition-all ${
                        status === st
                          ? st === 'PUBLISHED'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : st === 'DRAFT'
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                            : 'bg-slate-800 text-white border-slate-800 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block text-xs uppercase">{st}</span>
                      <span className="text-[10px] font-normal opacity-80 block mt-1">
                        {st === 'PUBLISHED'
                          ? 'Visible on store website'
                          : st === 'DRAFT'
                          ? 'Saved draft, hidden from catalog'
                          : 'Archived record'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-mono text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {step < 6 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(6, s + 1))}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-extrabold shadow-md flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>SAVING RECORD...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>SAVE & PUBLISH PRODUCT</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

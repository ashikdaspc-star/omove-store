import React, { useState, useEffect } from 'react';
import { Product } from '../../../types';
import { CATEGORIES } from '../../../data/mockData';
import { X, Check, ArrowRight, ArrowLeft, Sparkles, Image, Tag, DollarSign, ShieldCheck, Globe, Lock } from 'lucide-react';

interface ProductEditorModalProps {
  product?: Product | null;
  targetProductType?: 'STORE' | 'DIGITAL';
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
}

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
  product,
  targetProductType = 'STORE',
  isOpen,
  onClose,
  onSave
}) => {
  const isEdit = Boolean(product && product.id);

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || (targetProductType === 'DIGITAL' ? 'Digital Software' : 'Software'));
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || '');
  const [fullDescription, setFullDescription] = useState(product?.fullDescription || '');
  const [tagsInput, setTagsInput] = useState(
    (product?.tags || (targetProductType === 'DIGITAL' ? ['Digital Key', 'Instant Download'] : ['Software', 'Store Card'])).join(', ')
  );

  const [image, setImage] = useState(
    product?.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'
  );

  const [price, setPrice] = useState<number>(product?.price || 499);
  const [originalPrice, setOriginalPrice] = useState<number>(product?.originalPrice || 999);
  const [discountPercent, setDiscountPercent] = useState<number>(product?.discountPercent || 50);

  const [licenseType, setLicenseType] = useState(
    product?.licenseType || (targetProductType === 'DIGITAL' ? 'Instant Digital Key' : 'Lifetime License')
  );
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
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>(product?.status || 'PUBLISHED');

  // Sync state whenever modal is opened or product changes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setName(product?.name || '');
      setCategory(
        product?.category || (targetProductType === 'DIGITAL' ? 'Digital Software' : 'Software')
      );
      setShortDescription(product?.shortDescription || '');
      setFullDescription(product?.fullDescription || '');
      setTagsInput(
        (product?.tags || (targetProductType === 'DIGITAL' ? ['Digital Key', 'Instant Download'] : ['Software', 'Store Card'])).join(', ')
      );
      setImage(
        product?.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'
      );
      setPrice(product?.price || 499);
      setOriginalPrice(product?.originalPrice || 999);
      setDiscountPercent(product?.discountPercent || 50);
      setLicenseType(
        product?.licenseType || (targetProductType === 'DIGITAL' ? 'Instant Digital Key' : 'Lifetime License')
      );
      setVersion(product?.version || 'v2026.1');
      setDownloadSize(product?.downloadSize || '50 MB');
      setCompatibilityInput(
        (product?.compatibility || ['Windows 11', 'Windows 10']).join(', ')
      );
      setFeaturesInput(
        (product?.features || ['Instant Product Access Key', 'Official Setup Package']).join('\n')
      );
      setInstantKeyAvailable(product?.instantKeyAvailable ?? true);
      setIsBestSeller(product?.isBestSeller ?? false);
      setSlug(product?.slug || '');
      setStatus(product?.status || 'PUBLISHED');
      setIsSubmitting(false);
    }
  }, [isOpen, product, targetProductType]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
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

    const activeType = product?.productType || targetProductType || 'STORE';

    const finalProductData: Partial<Product> = {
      id: product?.id,
      name: name || (activeType === 'DIGITAL' ? 'New Digital Product' : 'New Store Product'),
      slug: slug || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `product-${Date.now()}`),
      productType: activeType,
      category,
      tags: tags.length > 0 ? tags : (activeType === 'DIGITAL' ? ['Digital Key'] : ['Store Card']),
      shortDescription: shortDescription || 'High performance software solution.',
      fullDescription: fullDescription || shortDescription || 'Full digital product package.',
      image,
      price: Number(price) || 499,
      originalPrice: Number(originalPrice) || 999,
      discountPercent: Number(discountPercent) || 50,
      licenseType: licenseType || (activeType === 'DIGITAL' ? 'Instant Digital Key' : 'Lifetime License'),
      version: version || 'v2026.1',
      downloadSize: downloadSize || '50 MB',
      compatibility: compatibility.length > 0 ? compatibility : ['Windows 11', 'Windows 10'],
      features: features.length > 0 ? features : ['Instant Product Access Key', 'Official Setup Package'],
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

  const activeType = product?.productType || targetProductType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-400">
              {isEdit ? `EDIT ${activeType} PRODUCT` : `NEW ${activeType} PRODUCT WIZARD`}
            </span>
            <h2 className="text-lg font-extrabold text-white">
              {isEdit ? `Edit ${product?.name}` : `Add New ${activeType === 'DIGITAL' ? 'Digital Product' : 'Store Product'}`}
            </h2>
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
                  placeholder={activeType === 'DIGITAL' ? 'e.g. AutoCAD 2026 Instant Key' : 'e.g. OMOVE WinMaster Pro 2026'}
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
                    <option value="Digital Software">Digital Software</option>
                    <option value="Software">Software</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Catalog Section *</label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 font-mono text-emerald-800 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{activeType === 'DIGITAL' ? 'DIGITAL CATALOG (INSTANT KEY)' : 'STORE CATALOG (PHYSICAL/SETUP)'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Short Description *</label>
                <textarea
                  rows={2}
                  required
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Summary of product features and capabilities..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Software, Digital Key, CAD, Windows 11"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Media */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Product Image URL *</label>
                <input
                  type="url"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs">Image Preview</span>
                <div className="aspect-video w-full max-w-sm rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Pricing */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Sale Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 font-mono text-xs text-emerald-900 flex items-center justify-between">
                <span>Final Checkout Price:</span>
                <strong className="text-base font-extrabold text-emerald-800">₹{price}</strong>
              </div>
            </div>
          )}

          {/* STEP 4: Technical Details */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">License Type</label>
                  <input
                    type="text"
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    placeholder="Instant Digital Key"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Download Size</label>
                  <input
                    type="text"
                    value={downloadSize}
                    onChange={(e) => setDownloadSize(e.target.value)}
                    placeholder="50 MB"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Compatibility (Comma Separated)</label>
                <input
                  type="text"
                  value={compatibilityInput}
                  onChange={(e) => setCompatibilityInput(e.target.value)}
                  placeholder="Windows 11, Windows 10, macOS"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Features (One Per Line)</label>
                <textarea
                  rows={3}
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  placeholder="Instant Access Key&#10;Official Setup Installer&#10;Verified Support"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 5: SEO */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-900 block mb-1">URL Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Full Description</label>
                <textarea
                  rows={4}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Detailed product information for detail page..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 6: Publish Settings */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-900 block mb-2">Publishing Status *</label>
                <div className="grid grid-cols-3 gap-3 font-mono">
                  {(['PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`p-3 rounded-2xl border text-center font-bold transition-all ${
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
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-extrabold shadow-md flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEdit ? 'SAVE CHANGES' : 'SAVE & CREATE PRODUCT'}</span>
                </>
              )}
            </button>

            {step < 6 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(6, s + 1))}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-mono text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

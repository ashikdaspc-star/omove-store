import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../../types';
import { CATEGORIES } from '../../../data/mockData';
import {
  X, Check, ArrowRight, ArrowLeft, Sparkles, Image as ImageIcon, Tag, DollarSign,
  ShieldCheck, Globe, Lock, UploadCloud, Link as LinkIcon, Trash2, Copy, RefreshCw, FileImage
} from 'lucide-react';

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
  const [subCategory, setSubCategory] = useState(product?.subCategory || '');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || '');
  const [fullDescription, setFullDescription] = useState(product?.fullDescription || '');
  const [tagsInput, setTagsInput] = useState(
    (product?.tags || (targetProductType === 'DIGITAL' ? ['Digital Key', 'Instant Download'] : ['Software', 'Store Card'])).join(', ')
  );

  const [image, setImage] = useState(
    product?.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'
  );

  // Media Upload States
  const [mediaMode, setMediaMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string>('');
  const [copiedNotice, setCopiedNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const STOCK_IMAGE_PRESETS = [
    { label: 'AutoCAD / CAD', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80' },
    { label: 'Windows / OS', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80' },
    { label: 'Security Suite', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80' },
    { label: 'Developer Code', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' },
    { label: 'PC Hardware', url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80' }
  ];

  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setUploadNotice('File size is larger than 12MB limit. Please choose a smaller image.');
      return;
    }

    setIsUploadingMedia(true);
    setUploadNotice('Reading & uploading media file...');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch('/api/admin/upload-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileData: base64Data })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.url) {
            setImage(data.url);
            setUploadNotice('Media uploaded successfully!');
            setIsUploadingMedia(false);
            setTimeout(() => setUploadNotice(''), 3000);
            return;
          }
        }
      } catch (err) {
        console.warn('Server upload notice, fallback to data URI:', err);
      }

      // Fallback to Data URI directly
      setImage(base64Data);
      setUploadNotice('Image attached successfully!');
      setIsUploadingMedia(false);
      setTimeout(() => setUploadNotice(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  const [price, setPrice] = useState<number>(product?.price || 499);
  const [originalPrice, setOriginalPrice] = useState<number>(product?.originalPrice || 999);
  const [discountPercent, setDiscountPercent] = useState<number>(product?.discountPercent || 50);

  const [licenseType, setLicenseType] = useState(
    product?.licenseType || (targetProductType === 'DIGITAL' ? 'Instant Digital Key' : 'Lifetime License')
  );
  const [version, setVersion] = useState(product?.version || 'v2026.1');
  const [downloadSize, setDownloadSize] = useState(product?.downloadSize || '50 MB');
  const [fileUrl, setFileUrl] = useState(product?.fileUrl || '/api/downloads/setup');
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
      setSubCategory(product?.subCategory || '');
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
      setFileUrl(product?.fileUrl || '/api/downloads/setup');
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
      subCategory: subCategory.trim() || undefined,
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
      fileUrl: fileUrl.trim() || '/api/downloads/setup',
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
                    onChange={(e) => setCategory(e.target.value as any)}
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
                <label className="font-bold text-slate-900 block mb-1">
                  Sub-Category (Add custom or choose preset)
                </label>
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="e.g. Software Keys, CAD Software, Antivirus, Operating Systems..."
                  list="sub-category-presets"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono font-semibold"
                />
                <datalist id="sub-category-presets">
                  <option value="Software Keys" />
                  <option value="Operating Systems" />
                  <option value="CAD & Design Tools" />
                  <option value="Antivirus & Security" />
                  <option value="Office & Productivity" />
                  <option value="Utilities & Optimization" />
                  <option value="Developer Tools" />
                  <option value="Lifetime Licenses" />
                </datalist>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Sub-categories are automatically displayed as filter tabs on the Digital Products page.
                </p>
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
              {/* Media Input Mode Toggle */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMediaMode('upload')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    mediaMode === 'upload'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Image File
                </button>
                <button
                  type="button"
                  onClick={() => setMediaMode('url')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    mediaMode === 'url'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  Paste Image URL
                </button>
              </div>

              {/* Upload File Mode */}
              {mediaMode === 'upload' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
                    onChange={handleMediaFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      {isUploadingMedia ? (
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      ) : (
                        <UploadCloud className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        {isUploadingMedia ? 'Uploading media file...' : 'Click to Upload Image from PC'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Supports PNG, JPG, WEBP, GIF, SVG (Max 12MB)
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      Choose Image File
                    </button>
                  </div>
                </div>
              )}

              {/* Enter URL Mode */}
              {mediaMode === 'url' && (
                <div>
                  <label className="font-bold text-slate-900 block mb-1 text-xs">Product Image Web URL *</label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 text-xs font-mono"
                    />
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              )}

              {uploadNotice && (
                <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  uploadNotice.includes('successfully') || uploadNotice.includes('attached')
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{uploadNotice}</span>
                </div>
              )}

              {/* Quick Image Presets */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block text-[11px]">Stock Image Quick Presets</span>
                <div className="flex flex-wrap gap-1.5">
                  {STOCK_IMAGE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImage(preset.url)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Image Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 block text-xs">Live Image Preview</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(image);
                        setCopiedNotice(true);
                        setTimeout(() => setCopiedNotice(false), 2000);
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedNotice ? 'Copied!' : 'Copy URL'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="px-2 py-1 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                </div>

                <div className="aspect-video w-full max-w-md rounded-xl overflow-hidden bg-slate-200 border border-slate-300 relative group">
                  {image ? (
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                      <span className="text-xs font-semibold">No Image Selected</span>
                    </div>
                  )}
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

              {activeType === 'DIGITAL' && (
                <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200 space-y-1.5">
                  <label className="font-bold text-cyan-900 block text-xs flex items-center gap-1.5">
                    <LinkIcon className="w-4 h-4 text-cyan-700" />
                    <span>Digital Product Download URL *</span>
                  </label>
                  <input
                    type="text"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or https://domain.com/setup.zip"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cyan-300 text-slate-900 focus:outline-none focus:border-cyan-600 text-xs font-mono"
                  />
                  <p className="text-[10px] text-cyan-700 font-mono">
                    This saved download URL will be used for the Download button on payment success and customer portal.
                  </p>
                </div>
              )}
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

import React, { useState, useEffect, useRef } from 'react';
import { Product, ProductCategory } from '../../../types';
import { CATEGORIES } from '../../../data/mockData';
import {
  X,
  Check,
  Sparkles,
  Image as ImageIcon,
  Tag,
  DollarSign,
  UploadCloud,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Bold,
  Italic,
  List as ListIcon,
  ListOrdered,
  ExternalLink,
  MessageSquare,
  ShoppingBag,
  Zap
} from 'lucide-react';

interface StoreProductEditorModalProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => Promise<void>;
}

export const StoreProductEditorModal: React.FC<StoreProductEditorModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave
}) => {
  const isEdit = Boolean(product && product.id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Software');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [descriptionMode, setDescriptionMode] = useState<'write' | 'preview'>('write');

  // Single Image State
  const [image, setImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadNotice, setUploadNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pricing State
  const [originalPrice, setOriginalPrice] = useState<number>(5000);
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [isFree, setIsFree] = useState<boolean>(false);

  // Optional Product / License Note (e.g. 1 Year Warranty, Lifetime Support)
  const [productNote, setProductNote] = useState('');

  // Sync state when modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      setValidationErrors({});
      if (product) {
        setName(product.name || '');
        setSlug(product.slug || '');
        setCategory(product.category || 'Software');
        setShortDescription(product.shortDescription || '');
        setDescription(product.fullDescription || product.description || '');
        setTags(Array.isArray(product.tags) ? product.tags : ['Software', 'Store Card']);
        setImage(product.image || '');

        const origPrice = Number(product.originalPrice ?? product.price ?? 5000);
        const finalP = Number(product.price ?? 5000);
        setOriginalPrice(origPrice);
        setIsFree(finalP === 0 && origPrice === 0);

        if (origPrice > 0 && finalP >= 0) {
          const discount = Math.round(((origPrice - finalP) / origPrice) * 100);
          setDiscountPercent(Math.max(0, discount));
        } else {
          setDiscountPercent(Number(product.discountPercent) || 0);
        }

        setProductNote(product.licenseType || '');
      } else {
        // Defaults for new store product
        setName('');
        setSlug('');
        setCategory('Software');
        setShortDescription('');
        setDescription('');
        setTags(['Software', 'Store Card']);
        setImage('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80');
        setOriginalPrice(5000);
        setDiscountPercent(20);
        setIsFree(false);
        setProductNote('Lifetime Support');
      }
      setIsSubmitting(false);
    }
  }, [isOpen, product]);

  // Derived calculated final price
  const calculatedFinalPrice = isFree
    ? 0
    : Math.max(0, Math.round(originalPrice * (1 - (discountPercent || 0) / 100)));

  // Auto slug handler
  const handleNameChange = (val: string) => {
    setName(val);
    if (!product || !product.id) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  };

  // Tags management
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Rich Text Editor formatting helper
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('store-description-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end) || 'text';
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newDescription = description.substring(0, start) + replacement + description.substring(end);
    setDescription(newDescription);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  // Single Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setUploadNotice('File size exceeds 12MB limit.');
      return;
    }

    setIsUploadingImage(true);
    setUploadNotice('Uploading image...');

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
            setUploadNotice('Image updated successfully!');
            setIsUploadingImage(false);
            setTimeout(() => setUploadNotice(''), 2500);
            return;
          }
        }
      } catch (err) {
        console.warn('Server media upload fallback:', err);
      }

      setImage(base64Data);
      setUploadNotice('Image attached!');
      setIsUploadingImage(false);
      setTimeout(() => setUploadNotice(''), 2500);
    };
    reader.readAsDataURL(file);
  };

  // Readiness Checklist checks
  const isProductInfoValid = Boolean(name.trim() && shortDescription.trim());
  const isImageValid = Boolean(image.trim());
  const isPricingValid = isFree || (originalPrice >= 0 && calculatedFinalPrice >= 0);
  const isReadyToPublish = isProductInfoValid && isImageValid && isPricingValid;

  // Validation
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) errors.name = 'Product name is required.';
    if (!shortDescription.trim()) errors.shortDescription = 'Short description is required.';
    if (!image.trim()) errors.image = 'Product image is required.';
    if (!isFree && (originalPrice === undefined || originalPrice < 0)) {
      errors.price = 'Please enter a valid price.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSave = async (publishStatus: 'PUBLISHED' | 'DRAFT') => {
    if (publishStatus === 'PUBLISHED') {
      const isValid = validateForm();
      if (!isValid) return;
    } else {
      if (!name.trim()) {
        setValidationErrors({ name: 'Enter a product name to save as draft.' });
        return;
      }
    }

    setIsSubmitting(true);

    const generatedSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `prod-${Date.now()}`;

    const payload: Partial<Product> = {
      id: product?.id,
      name: name.trim(),
      slug: generatedSlug,
      productType: 'STORE',
      category: category || 'Software',
      shortDescription: shortDescription.trim(),
      fullDescription: description.trim() || shortDescription.trim(),
      description: description.trim() || shortDescription.trim(),
      tags: tags.length > 0 ? tags : ['Software', 'Store Card'],
      image: image.trim() || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      screenshots: [image.trim()],
      originalPrice: isFree ? 0 : Number(originalPrice || 0),
      price: isFree ? 0 : Number(calculatedFinalPrice || 0),
      discountPercent: isFree ? 0 : Number(discountPercent || 0),
      licenseType: (productNote.trim() || 'Lifetime Support') as any,
      status: publishStatus,
      instantKeyAvailable: false,
      rating: product?.rating || 4.9,
      reviewCount: product?.reviewCount || 1,
      salesCount: product?.salesCount || 0,
      features: product?.features || ['Direct WhatsApp Assistance', 'Official Store Verification'],
      createdAt: product?.createdAt || new Date().toISOString()
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Failed to save store product:', err);
      setValidationErrors({ general: err.message || 'Failed to save product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm font-sans overflow-y-auto animate-fade-in">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  {isEdit ? 'EDIT STORE PRODUCT' : 'ADD STORE PRODUCT'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
                  WhatsApp Inquiries
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                {isEdit ? name || 'Edit Product' : 'Create Store Product'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body (2 Columns on Desktop) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 grid lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: PRODUCT FORM (~65% on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* General Error Alert */}
            {validationErrors.general && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationErrors.general}</span>
              </div>
            )}

            {/* 1. PRODUCT INFORMATION */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">
                  1. Product Information
                </h3>
                <p className="text-xs text-slate-500">
                  Define the name, category, and descriptive details of your product.
                </p>
              </div>

              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter product name (e.g. AutoCAD 2026)"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border ${
                    validationErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'
                  } text-slate-900 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors`}
                />
                {validationErrors.name && (
                  <p className="text-[11px] text-rose-600 font-mono">{validationErrors.name}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 transition-colors font-sans"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                    Short Description <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {shortDescription.length} chars
                  </span>
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="Write a short description..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border ${
                    validationErrors.shortDescription ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500'
                  } text-slate-900 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors leading-relaxed`}
                />
                {validationErrors.shortDescription && (
                  <p className="text-[11px] text-rose-600 font-mono">{validationErrors.shortDescription}</p>
                )}
              </div>

              {/* Product Description (Rich Text Editor) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                    Product Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-mono font-bold">
                    <button
                      type="button"
                      onClick={() => setDescriptionMode('write')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        descriptionMode === 'write' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescriptionMode('preview')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        descriptionMode === 'preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {descriptionMode === 'write' ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                    <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center gap-1 text-slate-600 text-xs">
                      <button
                        type="button"
                        onClick={() => insertFormatting('**', '**')}
                        title="Bold"
                        className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg transition-colors"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('*', '*')}
                        title="Italic"
                        className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg transition-colors"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-[1px] h-4 bg-slate-300 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertFormatting('## ')}
                        title="Heading 2"
                        className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg transition-colors font-bold font-mono text-[11px]"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('### ')}
                        title="Heading 3"
                        className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg transition-colors font-bold font-mono text-[11px]"
                      >
                        H3
                      </button>
                      <div className="w-[1px] h-4 bg-slate-300 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertFormatting('- ')}
                        title="Bullet List"
                        className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg transition-colors"
                      >
                        <ListIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('1. ')}
                        title="Numbered List"
                        className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg transition-colors"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('[', '](https://)')}
                        title="Link"
                        className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      id="store-description-textarea"
                      rows={4}
                      placeholder="Detailed features, specifications, or what's included..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-transparent text-slate-900 text-sm font-sans focus:outline-none resize-y leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 min-h-[120px] text-xs text-slate-700 font-sans prose prose-sm max-w-none">
                    {description ? (
                      <div className="whitespace-pre-wrap leading-relaxed">{description}</div>
                    ) : (
                      <span className="text-slate-400 italic font-mono">No description written yet.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                  Tags <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-1.5 min-h-[48px] focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono text-xs font-bold shadow-2xs"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-rose-500 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={tags.length === 0 ? 'Type tag & press Enter...' : 'Add tag...'}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={handleAddTag}
                    className="flex-1 min-w-[130px] bg-transparent text-xs font-sans text-slate-900 focus:outline-none px-2 py-1"
                  />
                </div>
              </div>
            </div>

            {/* 2. PRODUCT IMAGE (Single Image Only) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">
                  2. Product Image
                </h3>
                <p className="text-xs text-slate-500">
                  Upload a single primary image for the product.
                </p>
              </div>

              {image ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group aspect-video max-h-[240px]">
                  <img src={image} alt="Product preview" className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-2xs">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-white text-slate-950 font-mono text-xs font-bold shadow-lg hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Replace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="px-4 py-2 rounded-xl bg-rose-500 text-white font-mono text-xs font-bold shadow-lg hover:bg-rose-600 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 bg-slate-950/80 text-white px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold backdrop-blur-md">
                    Main Image
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-7 text-center cursor-pointer bg-slate-50/60 hover:bg-emerald-50/20 transition-all space-y-2.5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                    {isUploadingImage ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">Upload Product Image</strong>
                    <span className="text-[11px] text-slate-500">PNG, JPG, WebP up to 12MB</span>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Select Image</span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {uploadNotice && (
                <p className="text-xs text-emerald-600 font-mono">{uploadNotice}</p>
              )}
              {validationErrors.image && (
                <p className="text-xs text-rose-600 font-mono">{validationErrors.image}</p>
              )}
            </div>

            {/* 3. PRICING & OPTIONAL NOTE */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">
                  3. Pricing & Product Note
                </h3>
                <p className="text-xs text-slate-500">
                  Set original price, optional discount, or mark product as free.
                </p>
              </div>

              {/* Free Product Toggle */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <strong className="text-sm font-bold text-emerald-950">Free Product</strong>
                  <p className="text-xs text-emerald-800">
                    Offer this product at ₹0.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => {
                      setIsFree(e.target.checked);
                      if (e.target.checked) {
                        setOriginalPrice(0);
                        setDiscountPercent(0);
                      } else {
                        setOriginalPrice(5000);
                        setDiscountPercent(20);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {!isFree ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Original Price */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                        Original Price <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          placeholder="5000"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Discount % */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                        Discount %
                      </label>
                      <div className="relative">
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                          %
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="20"
                          value={discountPercent}
                          onChange={(e) =>
                            setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                          }
                          className="w-full pl-4 pr-9 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Price Display Card */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Final Price
                      </span>
                      <div className="flex items-baseline gap-2.5 mt-0.5">
                        <span className="text-2xl font-black font-mono text-emerald-400">
                          ₹{calculatedFinalPrice}
                        </span>
                        {discountPercent > 0 && originalPrice > calculatedFinalPrice && (
                          <span className="text-xs font-mono text-slate-400 line-through">
                            ₹{originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {discountPercent > 0 && (
                      <div className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-black">
                        {discountPercent}% OFF
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 text-center">
                  <span className="text-2xl font-black font-mono text-emerald-400">FREE</span>
                </div>
              )}

              {/* Optional License / Product Note */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                  License / Product Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1 Year Warranty or Lifetime Support"
                  value={productNote}
                  onChange={(e) => setProductNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-sans focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* ACTION BUTTONS & CHECKLIST */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave('DRAFT')}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs border border-slate-700 transition-colors"
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={isSubmitting || !isReadyToPublish}
                onClick={() => handleSave('PUBLISHED')}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-extrabold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Publish Product</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: STICKY LIVE PREVIEW (~35% on desktop) */}
          <div className="lg:col-span-5 sticky top-0 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Preview</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                Storefront Simulation
              </span>
            </div>

            {/* Preview Card */}
            <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden font-sans space-y-4 p-4">
              {/* Image Preview */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-100 group">
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4">
                    <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                    <span className="text-[11px] font-mono">No image uploaded</span>
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-950/85 text-emerald-400 font-mono font-bold text-[10px] uppercase border border-emerald-500/30 backdrop-blur-xs">
                    {category || 'Store Product'}
                  </span>
                </div>

                {discountPercent > 0 && !isFree && (
                  <div className="absolute top-2.5 right-2.5 bg-rose-600 text-white font-mono font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md">
                    {discountPercent}% OFF
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-2">
                <h4 className="text-base font-extrabold text-slate-900 tracking-tight line-clamp-1">
                  {name || 'Untitled Store Product'}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {shortDescription || 'Short description will appear here for customers.'}
                </p>

                {productNote && (
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                    ✓ {productNote}
                  </span>
                )}
              </div>

              {/* Pricing Display */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">Price</span>
                  {isFree ? (
                    <span className="text-lg font-black font-mono text-emerald-600">FREE</span>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black font-mono text-slate-900">
                        ₹{calculatedFinalPrice}
                      </span>
                      {discountPercent > 0 && (
                        <span className="text-xs font-mono text-slate-400 line-through">
                          ₹{originalPrice}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase CTA Simulation Button */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <div className="py-2.5 rounded-xl bg-slate-800 text-white font-mono font-bold text-[11px] flex items-center justify-center gap-1.5 border border-slate-700">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </div>
                <div className="py-2.5 rounded-xl bg-emerald-600 text-white font-mono font-bold text-[11px] shadow-sm flex items-center justify-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Buy Now</span>
                </div>
              </div>
            </div>

            {/* Post-Payment Flow Callout */}
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 font-mono text-[11px] space-y-1.5 border border-slate-800">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Post-Payment WhatsApp Fulfillment</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Customer purchases through existing checkout → upon successful payment, they get the <strong>Contact on WhatsApp</strong> action with their verified <strong>Order ID</strong>.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

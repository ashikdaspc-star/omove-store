import React, { useState, useEffect, useRef } from 'react';
import { Product, DigitalCategory } from '../../../types';
import {
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  Tag,
  DollarSign,
  UploadCloud,
  Link as LinkIcon,
  Trash2,
  Copy,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  FileText,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List as ListIcon,
  ListOrdered,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';

interface DigitalProductEditorModalProps {
  product?: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => Promise<void>;
  categories?: DigitalCategory[];
}

export const DigitalProductEditorModal: React.FC<DigitalProductEditorModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
  categories = []
}) => {
  const isEdit = Boolean(product && product.id);

  // Active step: 1 = Product, 2 = Media, 3 = Pricing, 4 = Download & Publish
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // STEP 1: Product Information
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [descriptionMode, setDescriptionMode] = useState<'write' | 'preview'>('write');

  // STEP 2: Media
  const [image, setImage] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [uploadNotice, setUploadNotice] = useState('');
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // STEP 3: Pricing
  const [originalPrice, setOriginalPrice] = useState<number>(499);
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [isFree, setIsFree] = useState<boolean>(false);

  // STEP 4: Download & Publish
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveInputVal, setDriveInputVal] = useState('');

  // Sync state when modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setValidationErrors({});
      if (product) {
        setName(product.name || '');
        setSlug(product.slug || '');
        setShortDescription(product.shortDescription || '');
        setDescription(product.fullDescription || product.description || '');
        setCategoryId(product.categoryId || product.category || '');
        setTags(Array.isArray(product.tags) ? product.tags : ['Digital Product']);
        setImage(product.image || '');
        setScreenshots(Array.isArray(product.screenshots) ? product.screenshots : []);
        
        const origPrice = Number(product.originalPrice ?? product.price ?? 499);
        const finalP = Number(product.price ?? 499);
        setOriginalPrice(origPrice);
        setIsFree(finalP === 0 && origPrice === 0);
        
        if (origPrice > 0 && finalP >= 0) {
          const discount = Math.round(((origPrice - finalP) / origPrice) * 100);
          setDiscountPercent(Math.max(0, discount));
        } else {
          setDiscountPercent(Number(product.discountPercent) || 0);
        }

        setGoogleDriveUrl(product.googleDriveUrl || product.fileUrl || '');
      } else {
        // Defaults for new product
        setName('');
        setSlug('');
        setShortDescription('');
        setDescription('');
        setCategoryId(categories.length > 0 ? categories[0].id : '');
        setTags(['Digital Product']);
        setImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80');
        setScreenshots([]);
        setOriginalPrice(499);
        setDiscountPercent(20);
        setIsFree(false);
        setGoogleDriveUrl('');
      }
      setIsSubmitting(false);
    }
  }, [isOpen, product, categories]);

  // Derived final price
  const calculatedFinalPrice = isFree
    ? 0
    : Math.max(0, Math.round(originalPrice * (1 - (discountPercent || 0) / 100)));

  // Auto-slug generator
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

  // Rich Text helper for product description
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('digital-description-textarea') as HTMLTextAreaElement;
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

  // Cover image upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setUploadNotice('File size is larger than 12MB limit.');
      return;
    }

    setIsUploadingCover(true);
    setUploadNotice('Uploading cover image...');

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
            setUploadNotice('Cover image updated successfully!');
            setIsUploadingCover(false);
            setTimeout(() => setUploadNotice(''), 2500);
            return;
          }
        }
      } catch (err) {
        console.warn('Server upload fallback to data URI:', err);
      }
      setImage(base64Data);
      setUploadNotice('Cover image attached!');
      setIsUploadingCover(false);
      setTimeout(() => setUploadNotice(''), 2500);
    };
    reader.readAsDataURL(file);
  };

  // Gallery preview upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 12 * 1024 * 1024) continue;

      const base64 = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(file);
      });

      try {
        const res = await fetch('/api/admin/upload-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileData: base64 })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.url) {
            newImages.push(data.url);
            continue;
          }
        }
      } catch (err) {}
      newImages.push(base64);
    }

    setScreenshots((prev) => [...prev, ...newImages]);
    setIsUploadingGallery(false);
  };

  // Gallery reorder & remove
  const handleMoveGallery = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= screenshots.length) return;
    const updated = [...screenshots];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setScreenshots(updated);
  };

  const handleRemoveGalleryItem = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  // Readiness Checklist
  const isProductInfoValid = Boolean(name.trim() && shortDescription.trim());
  const isCoverImageValid = Boolean(image.trim());
  const isPricingValid = isFree || (originalPrice >= 0 && calculatedFinalPrice >= 0);
  const isDownloadLinkValid = Boolean(googleDriveUrl.trim());
  const isReadyToPublish = isProductInfoValid && isCoverImageValid && isPricingValid && isDownloadLinkValid;

  // Validation before submit
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) errors.name = 'Product name is required.';
    if (!shortDescription.trim()) errors.shortDescription = 'Short description is required.';
    if (!image.trim()) errors.image = 'Cover image is required.';
    if (!isFree && (originalPrice === undefined || originalPrice < 0)) {
      errors.price = 'Please enter a valid price.';
    }
    if (!googleDriveUrl.trim()) {
      errors.googleDriveUrl = 'Google Drive download link is required.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Final Submit Handler
  const handleSave = async (publishStatus: 'PUBLISHED' | 'DRAFT') => {
    if (publishStatus === 'PUBLISHED') {
      const isValid = validateForm();
      if (!isValid) return;
    } else {
      // Draft allows saving if at least name is entered
      if (!name.trim()) {
        setValidationErrors({ name: 'Enter at least a product name to save as draft.' });
        return;
      }
    }

    setIsSubmitting(true);

    const generatedSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `digital-${Date.now()}`;
    const matchedCategory = categories.find((c) => c.id === categoryId || c.slug === categoryId);

    const payload: Partial<Product> = {
      id: product?.id,
      name: name.trim(),
      slug: generatedSlug,
      productType: 'DIGITAL',
      category: (matchedCategory ? matchedCategory.name : 'Digital Products') as any,
      categoryId: categoryId || undefined,
      shortDescription: shortDescription.trim(),
      fullDescription: description.trim() || shortDescription.trim(),
      description: description.trim() || shortDescription.trim(),
      tags: tags.length > 0 ? tags : ['Digital Product'],
      image: image.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      screenshots: screenshots,
      originalPrice: isFree ? 0 : Number(originalPrice || 0),
      price: isFree ? 0 : Number(calculatedFinalPrice || 0),
      discountPercent: isFree ? 0 : Number(discountPercent || 0),
      googleDriveUrl: googleDriveUrl.trim(),
      fileUrl: googleDriveUrl.trim() || '/api/downloads/digital',
      licenseType: 'Instant Digital Download' as any,
      version: product?.version || 'v1.0',
      downloadSize: product?.downloadSize || 'Instant Access',
      status: publishStatus,
      instantKeyAvailable: true,
      rating: product?.rating || 5.0,
      reviewCount: product?.reviewCount || 1,
      salesCount: product?.salesCount || 0,
      createdAt: product?.createdAt || new Date().toISOString()
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Failed to save digital product:', err);
      setValidationErrors({ general: err.message || 'Failed to save product on server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm font-sans overflow-y-auto animate-fade-in">
      <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  {isEdit ? 'EDIT DIGITAL PRODUCT' : 'ADD DIGITAL PRODUCT'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
                  Commerce
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                {isEdit ? name || 'Edit Product' : 'Create Digital Product'}
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

        {/* 4-Step Navigation Tabs */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs font-mono shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-4 min-w-max">
            {[
              { num: 1, label: '1. Product', complete: isProductInfoValid },
              { num: 2, label: '2. Media', complete: isCoverImageValid },
              { num: 3, label: '3. Pricing', complete: isPricingValid },
              { num: 4, label: '4. Download & Publish', complete: isDownloadLinkValid }
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                  step === s.num
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : s.complete
                    ? 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800'
                    : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{s.label}</span>
                {s.complete && step !== s.num && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span>Step {step} of 4</span>
          </div>
        </div>

        {/* Modal Main Body (2 Columns on Desktop) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 grid lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: FORM CONTENT (65-70% on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* General Validation Error Alert */}
            {validationErrors.general && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationErrors.general}</span>
              </div>
            )}

            {/* ================= STEP 1: PRODUCT ================= */}
            {step === 1 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Product Information</h3>
                  <p className="text-xs text-slate-500">
                    Define the core identity, title, short summary, and tags for your digital product.
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
                    placeholder="Enter product name (e.g. Cinematic SFX Pack)"
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

                {/* Category Selection */}
                {categories.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 transition-colors font-sans"
                    >
                      <option value="">Select Category (Optional)</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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
                    rows={3}
                    required
                    placeholder="Write a short description of your product... (e.g. A collection of cinematic sound effects for video editing.)"
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

                {/* Full Description (Rich Text Editor) */}
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
                      {/* Rich Text Toolbar */}
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
                        id="digital-description-textarea"
                        rows={5}
                        placeholder="Detailed overview, features, what is included in the download..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-transparent text-slate-900 text-sm font-sans focus:outline-none resize-y leading-relaxed"
                      />
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 min-h-[140px] text-xs text-slate-700 font-sans prose prose-sm max-w-none">
                      {description ? (
                        <div className="whitespace-pre-wrap leading-relaxed">{description}</div>
                      ) : (
                        <span className="text-slate-400 italic font-mono">No description written yet.</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Tags Chip Input */}
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
                      placeholder={tags.length === 0 ? 'Type tag & press Enter (e.g. SFX, Cinematic)...' : 'Add tag...'}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={handleAddTag}
                      className="flex-1 min-w-[140px] bg-transparent text-xs font-sans text-slate-900 focus:outline-none px-2 py-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 2: MEDIA ================= */}
            {step === 2 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Product Media</h3>
                  <p className="text-xs text-slate-500">
                    Upload an attractive cover image for your product and optional preview screenshots.
                  </p>
                </div>

                {/* Cover Image (Required) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                      Cover Image <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">16:9 Recommended</span>
                  </div>

                  {image ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group aspect-video max-h-[260px]">
                      <img src={image} alt="Cover preview" className="w-full h-full object-cover" />
                      
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-2xs">
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
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
                        Main Cover Image
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => coverInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-8 text-center cursor-pointer bg-slate-50/60 hover:bg-emerald-50/20 transition-all space-y-3"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                        {isUploadingCover ? (
                          <RefreshCw className="w-7 h-7 animate-spin" />
                        ) : (
                          <UploadCloud className="w-7 h-7" />
                        )}
                      </div>
                      <div>
                        <strong className="text-sm font-bold text-slate-900 block">Add Cover Image</strong>
                        <span className="text-xs text-slate-500">Upload the main image for your product. (PNG, JPG, WebP up to 12MB)</span>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Select File</span>
                      </button>
                    </div>
                  )}

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />

                  {uploadNotice && (
                    <p className="text-xs text-emerald-600 font-mono">{uploadNotice}</p>
                  )}
                  {validationErrors.image && (
                    <p className="text-xs text-rose-600 font-mono">{validationErrors.image}</p>
                  )}
                </div>

                {/* Preview Images (Optional) */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                        Preview Images
                      </label>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono font-bold border border-slate-200">
                        Optional
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isUploadingGallery}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isUploadingGallery ? 'Uploading...' : 'Add Images'}</span>
                    </button>
                  </div>

                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />

                  {screenshots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {screenshots.map((src, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group aspect-video"
                        >
                          <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveGallery(idx, 'left')}
                                className="p-1 rounded-md bg-white text-slate-900 hover:bg-slate-100"
                                title="Move Left"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryItem(idx)}
                              className="p-1 rounded-md bg-rose-500 text-white hover:bg-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {idx < screenshots.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveGallery(idx, 'right')}
                                className="p-1 rounded-md bg-white text-slate-900 hover:bg-slate-100"
                                title="Move Right"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      onClick={() => galleryInputRef.current?.click()}
                      className="border border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/40 hover:bg-slate-100/50 transition-colors"
                    >
                      <ImageIcon className="w-6 h-6 mx-auto text-slate-400 mb-1.5" />
                      <p className="text-xs text-slate-500 font-sans">
                        No additional preview images added. Click to upload screenshot samples.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= STEP 3: PRICING ================= */}
            {step === 3 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Pricing & Discounts</h3>
                  <p className="text-xs text-slate-500">
                    Set standard pricing, discount percentages, or provide this digital product for free.
                  </p>
                </div>

                {/* Free Product Toggle */}
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <strong className="text-sm font-bold text-emerald-950">Free Digital Product</strong>
                    <p className="text-xs text-emerald-800">
                      Offer this digital product at no charge (₹0).
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
                          setOriginalPrice(499);
                          setDiscountPercent(20);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {!isFree ? (
                  <div className="space-y-5">
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
                            placeholder="499"
                            value={originalPrice}
                            onChange={(e) => setOriginalPrice(Math.max(0, Number(e.target.value) || 0))}
                            className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Discount % */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                          Discount Percentage
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

                    {/* Calculated Price Summary Card */}
                    <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                          Final Customer Price
                        </span>
                        <div className="flex items-baseline gap-3 mt-1">
                          <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                            ₹{calculatedFinalPrice}
                          </span>
                          {discountPercent > 0 && originalPrice > calculatedFinalPrice && (
                            <span className="text-sm font-mono text-slate-400 line-through">
                              ₹{originalPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      {discountPercent > 0 && (
                        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-black tracking-wide">
                          {discountPercent}% OFF
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 text-center space-y-2">
                    <span className="text-3xl font-black font-mono text-emerald-400">FREE</span>
                    <p className="text-xs text-slate-400 font-mono">
                      Customers will be able to download this file instantly at ₹0.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 4: DOWNLOAD & PUBLISH ================= */}
            {step === 4 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Download Link & Delivery</h3>
                  <p className="text-xs text-slate-500">
                    Connect your secure Google Drive link. The link is kept discreet and never exposed as raw text on the storefront.
                  </p>
                </div>

                {/* Discreet Google Drive Manager */}
                <div className="space-y-3">
                  <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                    Product Download <span className="text-rose-500">*</span>
                  </label>

                  {googleDriveUrl.trim() ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-5 h-5" />
                        </div>
                        <div>
                          <strong className="text-xs font-bold text-emerald-950 block">✓ Download Link Added</strong>
                          <span className="text-[11px] font-mono text-emerald-700">Google Drive Cloud Link</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setDriveInputVal(googleDriveUrl);
                            setIsDriveModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-mono text-xs font-bold transition-colors"
                        >
                          Change Link
                        </button>
                        <button
                          type="button"
                          onClick={() => setGoogleDriveUrl('')}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-mono text-xs font-bold transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDriveInputVal('');
                        setIsDriveModalOpen(true);
                      }}
                      className="w-full py-6 rounded-3xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20 text-slate-800 font-mono font-bold text-sm flex flex-col items-center justify-center gap-2 transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span>+ Add Download Link</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Configure Google Drive shareable link for instant customer delivery
                      </span>
                    </button>
                  )}

                  {validationErrors.googleDriveUrl && (
                    <p className="text-xs text-rose-600 font-mono">{validationErrors.googleDriveUrl}</p>
                  )}
                </div>

                {/* Readiness Checklist */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Product Ready</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isReadyToPublish ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isReadyToPublish ? 'All Requirements Met' : 'Information Missing'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {isProductInfoValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className={isProductInfoValid ? 'text-slate-800' : 'text-slate-400'}>
                        Product information
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCoverImageValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className={isCoverImageValid ? 'text-slate-800' : 'text-slate-400'}>
                        Cover image
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPricingValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className={isPricingValid ? 'text-slate-800' : 'text-slate-400'}>
                        Pricing
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDownloadLinkValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className={isDownloadLinkValid ? 'text-slate-800' : 'text-slate-400'}>
                        Download link
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step Navigation Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as any)}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-mono font-bold text-xs border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep((step + 1) as any)}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-3">
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
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: STICKY LIVE PRODUCT PREVIEW (30-35% on desktop) */}
          <div className="lg:col-span-5 sticky top-0 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Product Preview</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                Real-time
              </span>
            </div>

            {/* Preview Card */}
            <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden font-sans space-y-4 p-4">
              {/* Cover Image Preview */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-100 group">
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4">
                    <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                    <span className="text-[11px] font-mono">No cover image uploaded</span>
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-950/85 text-emerald-400 font-mono font-bold text-[10px] uppercase border border-emerald-500/30 backdrop-blur-xs">
                    Digital Product
                  </span>
                </div>

                {discountPercent > 0 && !isFree && (
                  <div className="absolute top-2.5 right-2.5 bg-rose-600 text-white font-mono font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md">
                    {discountPercent}% OFF
                  </div>
                )}
              </div>

              {/* Product Info Preview */}
              <div className="space-y-2">
                <h4 className="text-base font-extrabold text-slate-900 tracking-tight line-clamp-1">
                  {name || 'Untitled Digital Product'}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {shortDescription || 'Your short product description will appear right here for customers.'}
                </p>

                {/* Tags preview */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tags.slice(0, 3).map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px]">
                        #{t}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span className="text-[10px] font-mono text-slate-400 self-center">
                        +{tags.length - 3} more
                      </span>
                    )}
                  </div>
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

                <div className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-mono font-extrabold text-xs shadow-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Instant Access</span>
                </div>
              </div>
            </div>

            {/* Helper Tips Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 font-mono text-[11px] space-y-1.5 border border-slate-800">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Fast Creator Workflow</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Add product details, images, price, and your Google Drive link to publish immediately.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL: Google Drive Link Ingestion Popover */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in font-sans">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Google Drive Download Link
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDriveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                Google Drive URL
              </label>
              <input
                type="url"
                autoFocus
                placeholder="Paste your Google Drive link here..."
                value={driveInputVal}
                onChange={(e) => setDriveInputVal(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500 font-sans">
                Make sure the link sharing setting in Google Drive is set to <strong>"Anyone with the link can view/download"</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDriveModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (driveInputVal.trim()) {
                    setGoogleDriveUrl(driveInputVal.trim());
                    if (validationErrors.googleDriveUrl) {
                      setValidationErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.googleDriveUrl;
                        return copy;
                      });
                    }
                  }
                  setIsDriveModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all"
              >
                Save Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Centralized Product Architecture & Classification Utility
 * Ensures 100% strict separation between Digital Products and Store Catalogs.
 */

export const DIGITAL_CATEGORIES = [
  'ebooks',
  'digital products',
  'templates',
  'graphics',
  'graphic bundles',
  'design resources',
  'ai resources',
  'ai prompts',
  'guides',
  'audio resources',
  'sfx',
  'digital downloads'
];

export const STORE_CATEGORIES = [
  'software',
  'windows tools',
  'digital software',
  'operating systems',
  'utilities',
  'driver packages',
  'os licenses',
  'office suites',
  'pc utilities',
  'software licenses'
];

/**
 * Returns true if a product is strictly a DIGITAL DOWNLOAD product.
 * (Ebooks, Graphic Bundles, AI Prompts, SFX Packs, Templates, Design Resources, Guides, etc.)
 */
export function isDigitalProduct(p: any): boolean {
  if (!p) return false;
  if (p.productType === 'DIGITAL') return true;
  if (p.productType === 'STORE') return false;

  const cat = (p.category || '').toLowerCase();
  if (DIGITAL_CATEGORIES.some((dc) => cat.includes(dc) || dc.includes(cat))) return true;
  if (p.ebookSpecs || p.pages || (p.googleDriveUrl && !p.licenseType?.includes('License'))) return true;

  return false;
}

/**
 * Returns true if a product is strictly a STORE / SOFTWARE product.
 * (Software, Windows Tools, Software licenses, PC utilities, Driver packages, etc.)
 */
export function isStoreProduct(p: any): boolean {
  if (!p) return false;
  if (p.productType === 'STORE') return true;
  if (p.productType === 'DIGITAL') return false;

  const cat = (p.category || '').toLowerCase();
  if (STORE_CATEGORIES.some((sc) => cat.includes(sc) || sc.includes(cat))) return true;
  if (p.tags && p.tags.includes('Store Card')) return true;

  // Fallback: If not digital, classify as store
  return !isDigitalProduct(p);
}

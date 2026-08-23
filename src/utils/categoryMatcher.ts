import { DigitalCategory } from '../types';

/**
 * Checks if a given category ID, slug, or name corresponds strictly to the eBook category.
 */
export const isEbookCategory = (
  categoryIdOrSlug?: string,
  categoryName?: string,
  categories?: DigitalCategory[]
): boolean => {
  const targetSlug = (categoryIdOrSlug || '').toLowerCase().trim();
  const targetName = (categoryName || '').toLowerCase().trim();

  // Direct keyword matching on slug or name
  if (
    targetSlug === 'ebooks' ||
    targetSlug === 'ebook' ||
    targetName === 'ebooks' ||
    targetName === 'ebook' ||
    targetName === 'e-books' ||
    targetName === 'e-book'
  ) {
    return true;
  }

  // Lookup in categories array if available
  if (categories && Array.isArray(categories) && categories.length > 0) {
    const matched = categories.find(
      (c) =>
        c.id === categoryIdOrSlug ||
        c.slug.toLowerCase() === targetSlug ||
        c.name.toLowerCase() === targetName
    );

    if (matched) {
      const mSlug = (matched.slug || '').toLowerCase().trim();
      const mName = (matched.name || '').toLowerCase().trim();
      if (
        mSlug === 'ebooks' ||
        mSlug === 'ebook' ||
        mName === 'ebooks' ||
        mName === 'ebook' ||
        mName === 'e-books' ||
        mName === 'e-book'
      ) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Checks if a given product belongs strictly to the eBook category.
 */
export const isEbookProduct = (product?: any, categories?: DigitalCategory[]): boolean => {
  if (!product) return false;

  // 1. Check categoryId against eBook category
  if (isEbookCategory(product.categoryId, product.category, categories)) {
    return true;
  }

  // 2. Check subcategoryId against eBook category
  if (product.subcategoryId && isEbookCategory(product.subcategoryId, undefined, categories)) {
    return true;
  }

  return false;
};

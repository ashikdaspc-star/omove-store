import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DigitalProduct, DigitalCategory } from '../types';
import { DigitalProductsView } from './DigitalProductsView';
import { DigitalProductDetailView } from './DigitalProductDetailView';
import { matchProductBySlugOrId } from '../utils/productMatcher';

interface DigitalProductsRouteHandlerProps {
  products: any[];
  categories: DigitalCategory[];
  onSelectProduct: (product: any) => void;
  onAddToCart: (product: any) => void;
  onBuyNow: (product: any) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
}

export const DigitalProductsRouteHandler: React.FC<DigitalProductsRouteHandlerProps> = ({
  products = [],
  categories = [],
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  wishlist,
  onToggleWishlist
}) => {
  const params = useParams<{ categorySlug?: string; subcategorySlug?: string }>();
  const routeSlug = params.subcategorySlug || params.categorySlug;

  const [fetchedDigitalProds, setFetchedDigitalProds] = useState<DigitalProduct[]>([]);
  const [digitalCats, setDigitalCats] = useState<DigitalCategory[]>(categories);

  useEffect(() => {
    // 1. Fetch categories
    fetch('/api/digital-categories?v=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setDigitalCats(data);
      })
      .catch(() => {});

    // 2. Fetch authoritative digital products to ensure instant hydration on direct URL / hard refresh
    fetch('/api/digital-products?v=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setFetchedDigitalProds(data);
      })
      .catch(() => {});
  }, []);

  // Merge products from props and fetched digital products
  const productMap = new Map<string, any>();
  if (Array.isArray(fetchedDigitalProds)) {
    fetchedDigitalProds.forEach((p) => { if (p && p.id) productMap.set(p.id, p); });
  }
  if (Array.isArray(products)) {
    products.forEach((p) => { if (p && p.id) productMap.set(p.id, p); });
  }

  const combinedProds = Array.from(productMap.values()).filter(
    (p) => (p.status || 'PUBLISHED') === 'PUBLISHED'
  );
  const activeCats = digitalCats.length > 0 ? digitalCats : categories;

  // Check if routeSlug matches a product rather than a category
  const matchingProduct = routeSlug ? matchProductBySlugOrId(combinedProds, routeSlug) : null;
  const isCategoryMatch = routeSlug
    ? activeCats.some((c) => c.slug.toLowerCase() === routeSlug.toLowerCase() || c.id === routeSlug)
    : false;

  // If URL slug matches a product and NOT a category, render DigitalProductDetailView!
  if (matchingProduct && !isCategoryMatch) {
    return (
      <DigitalProductDetailView
        product={matchingProduct}
        products={combinedProds}
        categories={activeCats}
        onAddToCart={onAddToCart}
        onBuyNow={onBuyNow}
      />
    );
  }

  // Otherwise render DigitalProductsView for Catalog / Category / Subcategory
  return (
    <DigitalProductsView
      products={combinedProds}
      categories={activeCats}
      onSelectProduct={onSelectProduct}
      onAddToCart={onAddToCart}
      onBuyNow={onBuyNow}
      wishlist={wishlist}
      onToggleWishlist={onToggleWishlist}
    />
  );
};


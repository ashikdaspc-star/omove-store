import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DigitalProduct, DigitalCategory } from '../types';
import { DigitalProductsView } from './DigitalProductsView';
import { DigitalProductDetailView } from './DigitalProductDetailView';

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
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [digitalProds, setDigitalProds] = useState<DigitalProduct[]>([]);
  const [digitalCats, setDigitalCats] = useState<DigitalCategory[]>(categories);

  useEffect(() => {
    fetch('/api/digital-categories?v=' + Date.now(), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setDigitalCats(data);
      })
      .catch(() => {});
  }, []);

  // Use authoritative products passed down from App state, filtering for active published items
  const activeProds = (products as any[]).filter(
    (p) => (p.status || 'PUBLISHED') === 'PUBLISHED'
  );
  const activeCats = digitalCats.length > 0 ? digitalCats : categories;

  // Check if categorySlug matches a product slug rather than a category slug
  const matchingProduct = categorySlug
    ? activeProds.find(
        (p) => p.slug === categorySlug || p.id === categorySlug || (p.name && p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === categorySlug)
      )
    : null;

  const isCategoryMatch = categorySlug
    ? activeCats.some((c) => c.slug.toLowerCase() === categorySlug.toLowerCase() || c.id === categorySlug)
    : false;

  // If URL slug matches a product and NOT a category, render DigitalProductDetailView!
  if (matchingProduct && !isCategoryMatch) {
    return (
      <DigitalProductDetailView
        products={activeProds}
        categories={activeCats}
        onAddToCart={onAddToCart}
        onBuyNow={onBuyNow}
      />
    );
  }

  // Otherwise render DigitalProductsView for Catalog / Category / Subcategory
  return (
    <DigitalProductsView
      products={activeProds}
      categories={activeCats}
      onSelectProduct={onSelectProduct}
      onAddToCart={onAddToCart}
      onBuyNow={onBuyNow}
      wishlist={wishlist}
      onToggleWishlist={onToggleWishlist}
    />
  );
};

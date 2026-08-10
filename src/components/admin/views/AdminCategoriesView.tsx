import React, { useState } from 'react';
import { Product } from '../../../types';
import { CATEGORIES } from '../../../data/mockData';
import { FolderTree, ShoppingBag, Sparkles, Tag, ArrowRight } from 'lucide-react';

interface AdminCategoriesViewProps {
  products: Product[];
  onSelectCategory?: (categoryName: string) => void;
}

export const AdminCategoriesView: React.FC<AdminCategoriesViewProps> = ({
  products = [],
  onSelectCategory
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const categoryStats = CATEGORIES.map((cat) => {
    const matchingProducts = (products || []).filter(
      (p) => p && (p.category || '').toLowerCase() === cat.name.toLowerCase()
    );
    const storeCount = matchingProducts.filter((p) => p.productType === 'STORE').length;
    const digitalCount = matchingProducts.filter((p) => p.productType === 'DIGITAL').length;

    return {
      ...cat,
      totalCount: matchingProducts.length,
      storeCount,
      digitalCount
    };
  });

  const filteredCategories = categoryStats.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Single Clean Main Container */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-emerald-600" />
              <span>Product Categories Management</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Browse product count breakdowns across store catalog and digital products.
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Filter categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-sans"
            />
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => (
            <div
              key={cat.name}
              className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-500/40 hover:bg-white transition-all space-y-4 group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {cat.totalCount} Products
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">{cat.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{cat.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3 text-slate-600">
                  <span className="flex items-center gap-1 text-[11px]">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>{cat.storeCount}</strong> Store
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <strong>{cat.digitalCount}</strong> Digital
                  </span>
                </div>

                {onSelectCategory && (
                  <button
                    onClick={() => onSelectCategory(cat.name)}
                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

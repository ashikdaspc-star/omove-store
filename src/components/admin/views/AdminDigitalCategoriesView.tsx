import React, { useState } from 'react';
import { DigitalCategory } from '../../../types';
import { FolderTree, Plus, Edit2, Trash2, CheckCircle2, XCircle, ArrowUp, ArrowDown, Image as ImageIcon, ChevronRight, CornerDownRight } from 'lucide-react';

interface AdminDigitalCategoriesViewProps {
  categories: DigitalCategory[];
  onAddCategory: (cat: Partial<DigitalCategory>) => void;
  onUpdateCategory: (cat: DigitalCategory) => void;
  onDeleteCategory: (catId: string) => void;
}

export const AdminDigitalCategoriesView: React.FC<AdminDigitalCategoriesViewProps> = ({
  categories = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DigitalCategory | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [active, setActive] = useState(true);

  const topLevelCategories = categories.filter((c) => !c.parentId);

  const handleOpenAddModal = (parent?: DigitalCategory) => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setParentId(parent ? parent.id : null);
    setDescription('');
    setImage('');
    setSortOrder(categories.length + 1);
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: DigitalCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setParentId(cat.parentId || null);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setSortOrder(cat.sortOrder || 1);
    setActive(cat.active !== false);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    if (editingCategory) {
      onUpdateCategory({
        ...editingCategory,
        name,
        slug: finalSlug,
        parentId: parentId || null,
        description,
        image,
        sortOrder: Number(sortOrder),
        active,
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddCategory({
        name,
        slug: finalSlug,
        parentId: parentId || null,
        description,
        image,
        sortOrder: Number(sortOrder),
        active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">Digital Category Manager</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Manage dynamic multi-level categories & subcategories for Digital Products.</p>
          </div>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>ADD TOP CATEGORY</span>
        </button>
      </div>

      {/* Category Tree View */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        {topLevelCategories.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <FolderTree className="w-10 h-10 mx-auto text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700 font-mono">No Digital Categories Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Create your first top-level digital product category to begin organizing your marketplace.</p>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>CREATE CATEGORY</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {topLevelCategories.map((topCat) => {
              const subCats = categories.filter((c) => c.parentId === topCat.id);

              return (
                <div key={topCat.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                  {/* Top Level Category Header */}
                  <div className="p-4 bg-white flex items-center justify-between gap-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      {topCat.image ? (
                        <img src={topCat.image} alt={topCat.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center font-bold">
                          {topCat.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm font-sans">{topCat.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                            /{topCat.slug}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${topCat.active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                            {topCat.active !== false ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </div>
                        {topCat.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{topCat.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAddModal(topCat)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-mono font-bold inline-flex items-center gap-1 border border-emerald-200"
                        title="Add Subcategory under this parent"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Subcategory</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(topCat)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete category "${topCat.name}" and all its subcategories?`)) {
                            onDeleteCategory(topCat.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories List */}
                  {subCats.length > 0 && (
                    <div className="p-3 space-y-2 bg-slate-50/80">
                      {subCats.map((subCat) => (
                        <div key={subCat.id} className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-4 ml-6 relative">
                          <div className="flex items-center gap-2.5">
                            <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" />
                            {subCat.image && (
                              <img src={subCat.image} alt={subCat.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-xs font-sans">{subCat.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">/digital-products/{topCat.slug}/{subCat.slug}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${subCat.active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                                  {subCat.active !== false ? 'Active' : 'Disabled'}
                                </span>
                              </div>
                              {subCat.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-1">{subCat.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(subCat)}
                              className="p-1 text-slate-500 hover:bg-slate-100 rounded-md"
                              title="Edit Subcategory"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete subcategory "${subCat.name}"?`)) {
                                  onDeleteCategory(subCat.id);
                                }
                              }}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded-md"
                              title="Delete Subcategory"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-lg font-mono">
                {editingCategory ? 'Edit Category' : parentId ? 'Add Subcategory' : 'Add Top Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs font-sans">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graphics, Fonts, LUTs"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">SEO URL Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. graphics, fonts, luts"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Parent Category</label>
                <select
                  value={parentId || ''}
                  onChange={(e) => setParentId(e.target.value || null)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                >
                  <option value="">None (Top-Level Category)</option>
                  {topLevelCategories.map((c) => (
                    <option key={c.id} value={c.id} disabled={editingCategory?.id === c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description of products in this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Image / Banner URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="catActive"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <label htmlFor="catActive" className="text-slate-800 font-bold cursor-pointer">
                      Active / Enabled
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold shadow-sm"
                >
                  SAVE CATEGORY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

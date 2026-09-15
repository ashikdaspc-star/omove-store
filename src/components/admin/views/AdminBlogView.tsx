import React, { useState } from 'react';
import { BlogPost } from '../../../types';
import { BookOpen, Plus, Trash2, Calendar, Tag } from 'lucide-react';
import { AdminConfirmDialog } from '../ui/AdminConfirmDialog';

interface AdminBlogViewProps {
  blogs: BlogPost[];
  onAddBlog?: (blog: BlogPost) => void;
  onDeleteBlog?: (blogId: string) => void;
}

export const AdminBlogView: React.FC<AdminBlogViewProps> = ({ blogs = [], onDeleteBlog }) => {
  const [blogToDelete, setBlogToDelete] = useState<BlogPost | null>(null);

  const handleConfirmDelete = () => {
    if (!blogToDelete || !onDeleteBlog) return;
    onDeleteBlog(blogToDelete.id);
    setBlogToDelete(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
              Blog Articles Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              {blogs.length} articles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Manage published tutorials, technical writeups, and knowledge base articles.
          </p>
        </div>
      </div>

      {/* Blog Cards Grid */}
      {blogs.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-slate-200 space-y-3 shadow-xs">
          <BookOpen className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">No Blog Articles Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans">
            Published articles will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {blogs.map((b) => (
            <div
              key={b.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all space-y-4 flex flex-col justify-between group font-sans"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                    {b.category || 'Article'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {b.publishDate || b.date}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base font-sans group-hover:text-emerald-700 transition-colors">
                  {b.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-sans">
                  {b.excerpt}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">ID: {b.id}</span>
                {onDeleteBlog && (
                  <button
                    type="button"
                    onClick={() => setBlogToDelete(b)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                    title="Delete Article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={Boolean(blogToDelete)}
        title="Delete Blog Article?"
        description={`Are you sure you want to delete "${blogToDelete?.title}"?`}
        confirmLabel="Delete Article"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBlogToDelete(null)}
      />
    </div>
  );
};

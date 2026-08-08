import React from 'react';
import { BlogPost } from '../../../types';
import { BookOpen, Plus, Trash2 } from 'lucide-react';

interface AdminBlogViewProps {
  blogs: BlogPost[];
  onAddBlog?: (blog: BlogPost) => void;
  onDeleteBlog?: (blogId: string) => void;
}

export const AdminBlogView: React.FC<AdminBlogViewProps> = ({ blogs = [], onDeleteBlog }) => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">Blog Articles Management</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Manage published guides, news, and technical tutorials.</p>
        </div>
        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
          {blogs.length} Articles Published
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((b) => (
          <div key={b.id} className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                {b.category}
              </span>
              <h3 className="font-bold text-slate-900 text-base">{b.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{b.excerpt}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">{b.publishDate || b.date}</span>
              {onDeleteBlog && (
                <button
                  onClick={() => onDeleteBlog(b.id)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

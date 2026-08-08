import React, { useState } from 'react';
import { BlogPost } from '../types';
import { Search, ArrowRight, X } from 'lucide-react';

interface BlogViewProps {
  blogs: BlogPost[];
}

export const BlogView: React.FC<BlogViewProps> = ({ blogs }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBlogs = blogs.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-8 space-y-8">
      {/* Blog Header */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center space-y-4">
        <span className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-700">
          PC Expert & Repair Insights
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          OMOVE TECH Knowledge Base
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto">
          Deep-dive technical guides on fixing Windows BSOD minidumps, telemetry removal scripts, driver management, and local offline AI setups.
        </p>

        {/* Search */}
        <div className="max-w-md mx-auto pt-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search guides, PowerShell snippets or BSOD codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Blog Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {filteredBlogs.map((post) => (
          <div
            key={post.id}
            onClick={() => setSelectedPost(post)}
            className="p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-emerald-500/40 cursor-pointer transition-all space-y-4 hover:shadow-md"
          >
            <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {post.category}
              </span>
              <span>{post.readTime}</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 hover:text-emerald-700 transition-colors">
              {post.title}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">{post.excerpt}</p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span>By {post.author}</span>
              <span className="text-emerald-700 font-bold font-mono flex items-center gap-1">
                Read Guide <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full Article Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-8 space-y-6 my-8 overflow-y-auto max-h-[85vh] text-slate-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-mono text-xs font-bold border border-emerald-200">
                {selectedPost.category}
              </span>
              <button onClick={() => setSelectedPost(null)} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{selectedPost.title}</h2>

            <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
              <span>Author: {selectedPost.author} ({selectedPost.authorRole})</span>
              <span>Date: {selectedPost.publishedAt}</span>
            </div>

            <div className="prose max-w-none text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans">
              {selectedPost.content}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold hover:bg-emerald-700"
              >
                CLOSE ARTICLE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

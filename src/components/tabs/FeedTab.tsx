import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeedPost, User } from '../../types';
import {
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Plus,
  X,
  Award,
  Filter,
  Camera,
  Maximize2,
  User as UserIcon,
  ChevronRight,
  Shield,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { MemberProfileModal } from '../modals/MemberProfileModal';

export const FeedTab: React.FC = () => {
  const {
    feedPosts,
    applaudPost,
    currentUser,
    createFeedPost,
    allUsers,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inspectingMember, setInspectingMember] = useState<User | null>(null);

  // Filter posts
  const filteredPosts = feedPosts.filter((post) => {
    if (activeCategory === 'all') return true;
    return post.category === activeCategory;
  });

  // New post form state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<FeedPost['category']>('announcement');
  const [postImage, setPostImage] = useState('');
  const [postTags, setPostTags] = useState('Spotlight, Photography');

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !postTitle.trim() || !postContent.trim()) return;

    createFeedPost({
      title: postTitle.trim(),
      content: postContent.trim(),
      category: postCategory,
      authorName: currentUser.fullName,
      authorRole: currentUser.role,
      authorAvatar: currentUser.avatarUrl,
      imageUrl: postImage.trim() || undefined,
      tags: postTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setPostTitle('');
    setPostContent('');
    setPostImage('');
    setShowCreateModal(false);
  };

  // Helper to open profile when clicking on author or mentioned member
  const handleOpenAuthorProfile = (authorName: string) => {
    const matched = allUsers.find(
      (u) =>
        u.fullName.toLowerCase() === authorName.toLowerCase() ||
        u.nickname.toLowerCase() === authorName.toLowerCase()
    );
    if (matched) {
      setInspectingMember(matched);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4 pb-20 md:pb-8 animate-in fade-in duration-200">
      {/* Feed Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {[
            { id: 'all', label: 'All Posts' },
            { id: 'promotion', label: '🎉 Promotions' },
            { id: 'announcement', label: 'Announcements' },
            { id: 'contest_winner', label: 'Contest Winners' },
            { id: 'showcase', label: 'Creative Showcase' },
            { id: 'behind_the_scenes', label: 'Behind the Scenes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer border ${
                activeCategory === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Officer Publish Post Action */}
        {currentUser?.isOfficer && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0 self-start sm:self-auto"
            title="Publish a new dispatch to the FPC Creative Feed"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Post</span>
          </button>
        )}
      </div>

      {/* Posts Feed List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-10 px-4 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No official dispatches published yet.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 transition-colors p-4 sm:p-5 space-y-3"
            >
              {/* Post Author Bar & Category */}
              <div className="flex items-center justify-between gap-2">
                <div
                  onClick={() => handleOpenAuthorProfile(post.authorName)}
                  className="flex items-center gap-2.5 cursor-pointer group min-w-0"
                  title="Click to view member profile"
                >
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-slate-200 group-hover:opacity-90 transition-opacity shrink-0 shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-none flex items-center gap-1.5 truncate">
                      <span className="truncate">{post.authorName}</span>
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
                      <span className="text-indigo-600 font-semibold truncate">{post.authorRole}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="shrink-0">{post.publishedAt}</span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 shrink-0">
                  {post.category === 'promotion' ? 'Rank Promotion' : post.category.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Post Headline & Prose */}
              <div className="space-y-1.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  {post.title}
                </h2>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
              </div>

              {/* Compact Media Attachment (Only if post has an image) */}
              {post.imageUrl && (
                <div
                  className="mt-2.5 relative max-h-52 sm:max-h-60 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 cursor-pointer group"
                  onClick={() => setLightboxImage(post.imageUrl || null)}
                >
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-44 sm:h-52 object-cover group-hover:scale-101 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity shadow-xs">
                    <Maximize2 className="w-3 h-3" />
                    <span>View photo</span>
                  </div>
                </div>
              )}

              {/* Rank Promotion Elevation Showcase */}
              {post.featuredPromotion && (
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[9px] uppercase font-bold text-indigo-700 tracking-wider">
                        Merit Elevation
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {post.featuredPromotion.memberName} advanced to {post.featuredPromotion.newRank}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Ledger Milestone: {post.featuredPromotion.totalPks} PKS
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAuthorProfile(post.featuredPromotion?.memberName || '')}
                    className="w-full sm:w-auto text-center px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 font-semibold text-[11px] sm:text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                  >
                    View Member Profile
                  </button>
                </div>
              )}

              {/* Unboxed Tags & Action Bar */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                {/* Quiet Unboxed Tags with subtle dots */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
                  {post.tags.map((tag, idx) => (
                    <span key={tag} className="flex items-center gap-1.5">
                      {idx > 0 && <span aria-hidden="true" className="text-slate-300">·</span>}
                      <span className="font-medium text-slate-500">#{tag}</span>
                    </span>
                  ))}
                </div>

                {/* Applaud Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => applaudPost(post.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer group active:scale-95"
                  >
                    <Heart className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 group-hover:fill-rose-500 transition-colors" />
                    <span className="font-semibold text-xs">{post.applauseCount}</span>
                    <span className="text-[10px] text-slate-500 hidden sm:inline">Applaud</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Inspect Member Profile Modal */}
      {inspectingMember && (
        <MemberProfileModal
          member={inspectingMember}
          onClose={() => setInspectingMember(null)}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Enlarged view"
              className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Create Post Modal for Officers */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create Official Feed Post</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value as FeedPost['category'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="announcement">Announcement</option>
                  <option value="promotion">Rank Promotion</option>
                  <option value="contest_winner">Contest Winner</option>
                  <option value="showcase">Showcase</option>
                  <option value="behind_the_scenes">Behind the Scenes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Post Title
                </label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Coverage Wrap: Division Press Conference"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Content / Article Body
                </label>
                <textarea
                  rows={4}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Write the announcement or event recap..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Photo Attachment <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  {postImage.trim() && (
                    <button
                      type="button"
                      onClick={() => setPostImage('')}
                      className="text-[11px] text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={postImage}
                  onChange={(e) => setPostImage(e.target.value)}
                  placeholder="https://... (or leave blank for a clean text-only post)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Leave blank for a clean, minimal text-only dispatch or announcement.
                </p>
                {postImage.trim() && (
                  <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100 flex items-center justify-center">
                    <img
                      src={postImage}
                      alt="Attachment preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  placeholder="e.g. Intramurals, Photography, San Jose NHS"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs cursor-pointer"
                >
                  Publish to Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

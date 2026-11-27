import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EventAssignment } from '../../types';
import { X, Link2, ExternalLink, AlertCircle, Check } from 'lucide-react';
import { getLinkDomainLabel, normalizeSafeHttpUrl } from '../../utils/urlUtils';

interface SubmitContestModalProps {
  event: EventAssignment;
  onClose: () => void;
}

export const SubmitContestModal: React.FC<SubmitContestModalProps> = ({ event, onClose }) => {
  const { submitToContest } = useApp();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [entryUrl, setEntryUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const normalizedUrl = normalizeSafeHttpUrl(entryUrl);
  const detectedDomain = normalizedUrl ? getLinkDomainLabel(normalizedUrl) : null;

  const handleUrlChange = (value: string) => {
    setEntryUrl(value);
    if (!value.trim()) {
      setUrlError(null);
    } else if (!normalizeSafeHttpUrl(value)) {
      setUrlError('Enter a valid http:// or https:// link (e.g. Google Drive, Canva, YouTube, or portfolio URL).');
    } else {
      setUrlError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeUrl = normalizeSafeHttpUrl(entryUrl);
    if (!safeUrl) {
      setUrlError('Please enter a valid http:// or https:// link to your contest entry.');
      return;
    }
    if (!title.trim()) return;

    submitToContest({
      eventId: event.id,
      eventTitle: event.title,
      title: title.trim(),
      caption: caption.trim(),
      imageUrl: safeUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <span className="text-[11px] font-semibold text-purple-700 tracking-wider uppercase">
              Contest Submission
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">{event.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 bg-white">
          {/* Link-Only Entry Input */}
          <div className="space-y-2">
            <label htmlFor="contest-entry-link" className="block text-xs font-semibold text-slate-700">
              Entry Link (URL) *
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="contest-entry-link"
                type="url"
                required
                value={entryUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://drive.google.com/..., Canva, YouTube, or portfolio link"
                className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 shadow-xs ${
                  urlError
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-purple-500 focus:ring-purple-100'
                }`}
              />
            </div>

            {urlError ? (
              <div className="flex items-start gap-1.5 text-[11px] text-rose-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{urlError}</span>
              </div>
            ) : normalizedUrl ? (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Verified Link Preview
                  </div>
                  <div className="text-xs font-mono font-semibold text-slate-700 truncate">
                    {detectedDomain}
                  </div>
                </div>
                <a
                  href={normalizedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-indigo-600 whitespace-nowrap shrink-0"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Paste a shareable link to your photo, film, or design (Google Drive, Canva, YouTube, Adobe Express, Behance, etc.). Make sure viewing access is enabled.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contest-entry-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Artwork / Entry Title *
            </label>
            <input
              id="contest-entry-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Shadows on the Arcade Path"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 shadow-xs"
            />
          </div>

          <div>
            <label htmlFor="contest-entry-caption" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Artist Statement / Technical Specs
            </label>
            <textarea
              id="contest-entry-caption"
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe composition, camera settings (focal length, ISO, shutter), or creative concept..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 shadow-xs"
            />
          </div>

          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-[11px] text-purple-950 flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Automated PKS Reward:</strong> Submitting verified original work grants <span className="text-purple-700 font-semibold font-mono">+15 PKS (P5)</span> participation and showcases your entry link on your profile.
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !normalizedUrl}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              Submit Entry Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

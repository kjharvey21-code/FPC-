import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { EventAssignment } from '../../types';
import { X, Upload, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { compressImageFile } from '../../utils/imageUtils';

interface SubmitContestModalProps {
  event: EventAssignment;
  onClose: () => void;
}

export const SubmitContestModal: React.FC<SubmitContestModalProps> = ({ event, onClose }) => {
  const { submitToContest } = useApp();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('/src/assets/images/fpc_contest_streetphoto_1792558823968.jpg');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const samplePresets = [
    { label: 'Campus Shadows', url: '/src/assets/images/fpc_contest_streetphoto_1792558823968.jpg' },
    { label: 'Courtside Action', url: '/src/assets/images/fpc_event_intramurals_1792558823605.jpg' },
    { label: 'Creative Studio', url: '/src/assets/images/fpc_workshop_cover_1792558823447.jpg' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 1200, 1200, 0.75);
      setImagePreview(compressedDataUrl);
    } catch (err) {
      console.warn('Image compression fallback:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imagePreview) return;

    submitToContest({
      eventId: event.id,
      eventTitle: event.title,
      title: title.trim(),
      caption: caption.trim(),
      imageUrl: imagePreview,
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
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 bg-white">
          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Photograph / Creative Artwork File
            </label>
            <div className="relative group rounded-2xl border-2 border-dashed border-slate-200 hover:border-purple-400 transition-colors overflow-hidden bg-slate-50 p-3 flex flex-col items-center justify-center min-h-[180px]">
              {imagePreview ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={imagePreview}
                    alt="Upload Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Change File</span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center text-center cursor-pointer p-6"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-2 border border-purple-200">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-slate-800">
                    Click to browse or drop high-res image
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP up to 20MB</span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Quick Sample Presets */}
            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-500">
              <span className="shrink-0 flex items-center gap-1 text-[10px] text-slate-400">
                <Sparkles className="w-3 h-3 text-purple-600" /> Quick samples:
              </span>
              {samplePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setImagePreview(preset.url)}
                  className={`px-2 py-0.5 rounded-lg border text-[10px] transition-colors whitespace-nowrap cursor-pointer ${
                    imagePreview === preset.url
                      ? 'bg-purple-50 text-purple-800 border-purple-300 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Artwork / Photo Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Shadows on the Arcade Path"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Artist Statement / Technical Specs
            </label>
            <textarea
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
              <strong className="text-slate-900">Automated PKS Reward:</strong> Submitting verified original work grants <span className="text-purple-700 font-semibold font-mono">+15 PKS (P5)</span> participation instantly upon verification.
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !imagePreview || isUploading}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              Submit Official Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

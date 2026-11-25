import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PILLAR_CODES, validatePksSelection, calculatePksFromCodes } from '../../data/pksFramework';
import { X, Upload, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { compressImageFile } from '../../utils/imageUtils';

interface RequestMLogModalProps {
  onClose: () => void;
}

export const RequestMLogModal: React.FC<RequestMLogModalProps> = ({ onClose }) => {
  const { submitMemberMLogRequest, events } = useApp();
  const [eventTitle, setEventTitle] = useState('');
  const [customEventTitle, setCustomEventTitle] = useState('');
  const [roleOrAward, setRoleOrAward] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>(['C2', 'P3']);
  const [remarks, setRemarks] = useState('');
  const [proofUrl, setProofUrl] = useState<string>('/src/assets/images/fpc_event_intramurals_1792558823605.jpg');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validation = validatePksSelection(selectedCodes);
  const score = calculatePksFromCodes(selectedCodes);

  const finalEventTitle = eventTitle === 'custom' ? customEventTitle : eventTitle || events[0]?.title || '';

  const toggleCode = (code: string) => {
    setSelectedCodes((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file, 1000, 1000, 0.72);
      setProofUrl(compressedDataUrl);
    } catch (err) {
      console.warn('Fallback proof read:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalEventTitle.trim() || !roleOrAward.trim() || selectedCodes.length === 0) return;
    if (!validation.isValid) return;

    submitMemberMLogRequest({
      eventTitle: finalEventTitle.trim(),
      roleOrAward: roleOrAward.trim(),
      codes: selectedCodes,
      remarks: remarks.trim(),
      proofUrl,
    });
    onClose();
  };

  const samplePresets = [
    { label: 'Intramurals Coverage', url: '/src/assets/images/fpc_event_intramurals_1792558823605.jpg' },
    { label: 'Photo Contest', url: '/src/assets/images/fpc_contest_streetphoto_1792558823968.jpg' },
    { label: 'Media Workshop', url: '/src/assets/images/fpc_workshop_cover_1792558823447.jpg' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Fixed Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-indigo-600 tracking-wider uppercase">
              M.Log Workflow
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Log Activity / Request Verification</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="mlog-request-form" onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {/* Event Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Event or Project Title <span className="text-rose-500">*</span>
            </label>
            <select
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
            >
              <option value="">Select official event...</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.title}>
                  {ev.title} ({ev.date})
                </option>
              ))}
              <option value="custom">+ Other / External Competition / Milestone...</option>
            </select>

            {eventTitle === 'custom' && (
              <input
                type="text"
                required
                value={customEventTitle}
                onChange={(e) => setCustomEventTitle(e.target.value)}
                placeholder="Enter custom event or project name..."
                className="mt-2 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            )}
          </div>

          {/* Role or Award */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Role Performed / Distinction Won <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={roleOrAward}
              onChange={(e) => setRoleOrAward(e.target.value)}
              placeholder="e.g. Lead Courtside Photographer, Video Editor, or 1st Place Poster"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Pillar Codes Selector with Real-time Rules Enforcement */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                PKS Pillar Codes ({selectedCodes.length} selected)
              </label>
              <div className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                Total: +{score.total} PKS
              </div>
            </div>

            {/* Validation Errors Notice */}
            {!validation.isValid && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                {validation.errors.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Code Pills Categorized */}
            <div className="space-y-2.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-200 max-h-56 overflow-y-auto">
              {(['C', 'P', 'B', 'R', 'S'] as const).map((cat) => {
                const catCodes = PILLAR_CODES.filter((c) => c.category === cat);
                const catTitles = {
                  C: 'C-Codes (Creative Output)',
                  P: 'P-Codes (Participation)',
                  B: 'B-Codes (Leadership & Responsibility)',
                  R: 'R-Codes (Recognition & Awards)',
                  S: 'S-Codes (Special Distinction)',
                };

                return (
                  <div key={cat} className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {catTitles[cat]}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {catCodes.map((c) => {
                        const isSelected = selectedCodes.includes(c.code);
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => toggleCode(c.code)}
                            title={`${c.title} (+${c.points} PKS): ${c.description}`}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <span>{c.code}</span>
                            <span className={`text-[10px] font-sans font-normal ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                              +{c.points}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              FPC Rule: One code per pillar per entry. No double counting (Leadership B-code replaces Participation P-code).
            </p>
          </div>

          {/* Proof Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Proof File / Output Screenshot / Certificate
            </label>
            <div className="flex items-center gap-3">
              {proofUrl && (
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 shadow-2xs">
                  <img src={proofUrl} alt="Proof" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Choose file from device</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Quick Sample Presets */}
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 flex-wrap">
              <span className="font-semibold text-slate-400">Presets:</span>
              {samplePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setProofUrl(preset.url)}
                  className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Production Remarks / Deliverables Link
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Uploaded 20 RAW+JPEG selects to Google Drive. Edited highlight reel."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            />
          </div>
        </form>

        {/* Pinned Sticky Footer Actions (Natural Thumb Zone) */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Credit: <span className="font-mono font-bold text-indigo-600">+{score.total} PKS</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="mlog-request-form"
              disabled={!validation.isValid || selectedCodes.length === 0}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Submit for Verification</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


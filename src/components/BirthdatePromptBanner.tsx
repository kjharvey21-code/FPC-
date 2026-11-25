import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Check, X } from 'lucide-react';
import { getTodayIsoDate, isValidBirthdate } from '../utils/dateUtils';

interface BirthdatePromptBannerProps {
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const BirthdatePromptBanner: React.FC<BirthdatePromptBannerProps> = ({
  dismissible = true,
  onDismiss,
}) => {
  const { currentUser, updateMemberProfile, showToast } = useApp();
  const [birthdateInput, setBirthdateInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!currentUser || currentUser.birthdate) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidBirthdate(birthdateInput)) {
      showToast('Please enter a valid birthdate (cannot be in the future).', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateMemberProfile(currentUser.id, { birthdate: birthdateInput });
      setBirthdateInput('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-3 sm:mb-4 bg-white border border-amber-300/90 rounded-2xl p-3.5 sm:p-4 shadow-xs animate-in fade-in duration-200">
      <form
        onSubmit={handleSave}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Complete your member profile: Add your birthdate
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
              Your account is missing a date of birth. Type or select your birthdate to update your FPC member record.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <input
            type="date"
            min="1950-01-01"
            max={getTodayIsoDate()}
            value={birthdateInput}
            onChange={(e) => setBirthdateInput(e.target.value)}
            aria-label="Your birthdate"
            required
            className="flex-1 sm:w-40 min-h-[40px] px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
          />
          <button
            type="submit"
            disabled={isSaving || !birthdateInput}
            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          {dismissible && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Remind me later"
              title="Remind me later"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

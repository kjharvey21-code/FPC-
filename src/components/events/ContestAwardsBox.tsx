import React, { useState } from 'react';
import { ContestAward } from '../../types';
import { Award, Plus, Trash2 } from 'lucide-react';

interface ContestAwardsBoxProps {
  awards: ContestAward[];
  onChange: (awards: ContestAward[]) => void;
  draftAward?: string;
  draftPks?: string;
  onDraftChange?: (award: string, pks: string) => void;
}

export const ContestAwardsBox: React.FC<ContestAwardsBoxProps> = ({
  awards,
  onChange,
  draftAward: controlledDraftAward,
  draftPks: controlledDraftPks,
  onDraftChange,
}) => {
  const [internalDraftAward, setInternalDraftAward] = useState('');
  const [internalDraftPks, setInternalDraftPks] = useState('15');

  const draftAward = controlledDraftAward !== undefined ? controlledDraftAward : internalDraftAward;
  const draftPks = controlledDraftPks !== undefined ? controlledDraftPks : internalDraftPks;

  const setDraft = (nextAward: string, nextPks: string) => {
    if (onDraftChange) {
      onDraftChange(nextAward, nextPks);
    } else {
      setInternalDraftAward(nextAward);
      setInternalDraftPks(nextPks);
    }
  };

  const handleAddAward = () => {
    const cleanName = draftAward.trim();
    if (!cleanName) return;
    const parsedPks = Math.max(0, parseInt(draftPks, 10) || 0);

    onChange([
      ...awards,
      {
        id: `award_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        award: cleanName,
        pks: parsedPks,
      },
    ]);
    setDraft('', '15');
  };

  const handleUpdateAward = (id: string, field: 'award' | 'pks', value: string) => {
    onChange(
      awards.map((item) => {
        if (item.id !== id) return item;
        if (field === 'pks') {
          const numeric = Math.max(0, parseInt(value, 10) || 0);
          return { ...item, pks: numeric };
        }
        return { ...item, award: value };
      })
    );
  };

  const handleRemoveAward = (id: string) => {
    onChange(awards.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-indigo-600" />
          <span>Prize &amp; Recognition Details</span>
        </label>
        <span className="text-[11px] font-mono tabular-nums text-slate-500">
          {awards.length} {awards.length === 1 ? 'award' : 'awards'}
        </span>
      </div>

      <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2.5">
        {/* Existing / Added Awards */}
        {awards.length > 0 ? (
          <div className="space-y-2">
            {awards.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.award}
                  onChange={(e) => handleUpdateAward(item.id, 'award', e.target.value)}
                  placeholder="Award name (e.g. 1st Place)"
                  aria-label="Award name"
                  className="flex-1 min-w-0 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                />

                <div className="relative flex items-center shrink-0">
                  <span className="absolute left-2.5 text-[11px] font-mono text-slate-400 pointer-events-none">
                    +
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={item.pks}
                    onChange={(e) => handleUpdateAward(item.id, 'pks', e.target.value)}
                    aria-label="PKS points for award"
                    className="w-24 pl-5 pr-9 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums font-bold text-indigo-700 text-right focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-2.5 text-[10px] font-mono font-semibold text-slate-500 pointer-events-none">
                    PKS
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAward(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                  title="Remove award"
                  aria-label={`Remove ${item.award || 'award'}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 py-1">
            No awards added yet. Enter an award name and PKS value below.
          </p>
        )}

        {/* Add New Award Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={draftAward}
            onChange={(e) => setDraft(e.target.value, draftPks)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddAward();
              }
            }}
            placeholder="Add award (e.g. 3rd Place, Best Portrait)"
            aria-label="New award title"
            className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex items-center flex-1 sm:flex-initial">
              <span className="absolute left-2.5 text-[11px] font-mono text-slate-400 pointer-events-none">
                +
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={draftPks}
                onChange={(e) => setDraft(draftAward, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAward();
                  }
                }}
                aria-label="New award PKS points"
                className="w-full sm:w-24 pl-5 pr-9 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono tabular-nums font-bold text-slate-900 text-right focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute right-2.5 text-[10px] font-mono font-semibold text-slate-500 pointer-events-none">
                PKS
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddAward}
              disabled={!draftAward.trim()}
              className="min-h-[34px] px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ContestSubmission } from '../../types';
import { Award, Calendar, ExternalLink, Link2 } from 'lucide-react';
import {
  getLinkDomainLabel,
  isDisplayableImageUrl,
  normalizeSafeHttpUrl,
} from '../../utils/urlUtils';

interface ContestEntryCardProps {
  submission: ContestSubmission;
}

export const ContestEntryCard: React.FC<ContestEntryCardProps> = ({ submission }) => {
  const [imageFailed, setImageFailed] = useState(false);

  const safeExternalUrl = normalizeSafeHttpUrl(submission.imageUrl);
  const canRenderImage = isDisplayableImageUrl(submission.imageUrl) && !imageFailed;
  const domainLabel = getLinkDomainLabel(submission.imageUrl);

  const statusLabel =
    submission.status === 'featured'
      ? 'Featured'
      : submission.status === 'approved'
      ? 'Approved'
      : submission.status === 'rejected'
      ? 'Not Selected'
      : 'Pending Review';

  const statusClass =
    submission.status === 'featured'
      ? 'bg-purple-50 text-purple-700 border-purple-200'
      : submission.status === 'approved'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : submission.status === 'rejected'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between">
      <div>
        {canRenderImage ? (
          <div className="h-36 w-full bg-slate-100 overflow-hidden relative">
            <img
              src={submission.imageUrl}
              alt={submission.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <div className="px-3.5 py-3 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/40 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                <Link2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Entry Link
                </div>
                <div className="text-xs font-mono font-semibold text-slate-700 truncate">
                  {domainLabel}
                </div>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>
        )}

        <div className="p-3.5 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
              {submission.title}
            </h4>
            {canRenderImage && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${statusClass}`}
              >
                {statusLabel}
              </span>
            )}
          </div>

          <div className="text-[11px] font-medium text-indigo-700 truncate">
            {submission.eventTitle}
          </div>

          {submission.awardWon && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
              <Award className="w-3 h-3 shrink-0" />
              <span className="truncate">{submission.awardWon}</span>
            </div>
          )}

          {submission.caption && (
            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
              {submission.caption}
            </p>
          )}
        </div>
      </div>

      <div className="px-3.5 py-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400 font-mono tabular-nums flex items-center gap-1 truncate">
          <Calendar className="w-3 h-3 shrink-0" />
          <span>{submission.submittedAt}</span>
        </span>

        {safeExternalUrl ? (
          <a
            href={safeExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <span>Open Entry</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-[10px] text-slate-400 font-mono truncate">
            Link unavailable
          </span>
        )}
      </div>
    </div>
  );
};

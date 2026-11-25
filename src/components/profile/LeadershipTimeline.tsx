import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, LeadershipTimelineItem } from '../../types';
import { getMemberLeadershipHistory } from '../../utils/leadershipSync';
import {
  Shield,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronDown,
  FileText,
  Briefcase,
  Layers,
} from 'lucide-react';

interface LeadershipTimelineProps {
  member: User;
  onOpenMLogTab?: () => void;
  className?: string;
  defaultExpanded?: boolean;
}

export const LeadershipTimeline: React.FC<LeadershipTimelineProps> = ({
  member,
  onOpenMLogTab,
  className = '',
  defaultExpanded = false,
}) => {
  const { mLogEntries, systemSettings, currentUser } = useApp();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const currentAcademicYear = systemSettings.academicYear || '2025–2026';

  const isViewerAdmin = currentUser?.isOfficer || currentUser?.role === 'SuperAdmin';
  const isOwnProfile = currentUser?.id === member.id;
  const canViewLedger = isViewerAdmin || isOwnProfile;

  const historyItems = getMemberLeadershipHistory(member, mLogEntries, currentAcademicYear);
  const activeTerm = historyItems.find((item) => item.isCurrent);
  const pastTerms = historyItems.filter((item) => !item.isCurrent);

  return (
    <div className={`bg-white border border-slate-200 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-xs ${className}`}>
      {/* Section Header / Dropdown Button Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 cursor-pointer select-none transition-colors rounded-xl sm:rounded-2xl ${
          isExpanded ? 'border-b border-slate-100 bg-slate-50/50' : 'hover:bg-slate-50/70'
        }`}
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">Leadership Track Record</h2>
              {historyItems.length > 0 ? (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  {historyItems.length} {historyItems.length === 1 ? 'Term' : 'Terms'}
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium">
                  No Posts
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
              Verified officer service, executive stewardship, and committee leadership.
            </p>
          </div>
        </div>

        {/* Right side: Dropdown toggle button & quick view in M.Log */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          {canViewLedger && onOpenMLogTab && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMLogTab();
              }}
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[10px] sm:text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View in M.Log</span>
              <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
            </button>
          )}

          {/* Dropdown Toggle Button */}
          <div
            className={`px-2 py-1 rounded-md border text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 transition-all ${
              isExpanded
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <span>{isExpanded ? 'Hide' : 'Details'}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Collapsible Dropdown Content Body */}
      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">

      {historyItems.length === 0 ? (
        /* Empty state for members without recorded officer terms */
        <div className="p-5 rounded-lg bg-slate-50/70 border border-dashed border-slate-200 text-center space-y-1.5">
          <Briefcase className="w-5 h-5 text-slate-300 mx-auto" />
          <div className="text-xs font-semibold text-slate-700">No Official Leadership Posts Recorded Yet</div>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            Members earn official leadership credits through Shoot Direction (B2 · +30 PKS), Committee Chairs (B3 · +50 PKS), or Executive Posts (B4 · +80 PKS).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active Incumbent Highlight Card */}
          {activeTerm && (
            <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50/70 border border-slate-200 space-y-2 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700">
                    Current Active Post
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-500">
                    {activeTerm.academicYear}
                  </span>
                </div>

                {activeTerm.isMLogSynced ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] sm:text-[11px] font-semibold shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Aligned (+{activeTerm.pksPoints} PKS · {activeTerm.pksCode})</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-semibold">
                    Pending M.Log Sync
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{activeTerm.roleTitle}</span>
                </h3>
                {activeTerm.remarks && (
                  <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                    {activeTerm.remarks}
                  </p>
                )}
              </div>

              {/* Projects Led Tags */}
              {activeTerm.projectsLed && activeTerm.projectsLed.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Key Campaigns:
                  </span>
                  {activeTerm.projectsLed.map((proj) => (
                    <span
                      key={proj}
                      className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs"
                    >
                      {proj}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Historical Terms Timeline */}
          {pastTerms.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Previous Terms ({pastTerms.length})</span>
              </div>

              <div className="relative pl-4 sm:pl-5 ml-1.5 sm:ml-2 border-l-2 border-slate-200 space-y-2 pt-0.5">
                {pastTerms.map((term) => (
                  <div key={term.id} className="relative group">
                    {/* Timeline Node Bullet */}
                    <div className="absolute -left-[23px] sm:-left-[27px] top-2 w-3 h-3 rounded-full bg-white border-2 border-indigo-600 shadow-2xs group-hover:scale-110 group-hover:bg-indigo-600 transition-all" />

                    <div className="bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 transition-colors space-y-1 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {term.roleTitle}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 font-semibold">
                            {term.academicYear}
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 w-fit">
                          <CheckCircle2 className="w-2.5 h-2.5 text-indigo-600" />
                          <span>+{term.pksPoints} ({term.pksCode})</span>
                        </span>
                      </div>

                      {term.remarks && (
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {term.remarks}
                        </p>
                      )}

                      {/* Projects Led */}
                      {term.projectsLed && term.projectsLed.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          {term.projectsLed.map((p) => (
                            <span
                              key={p}
                              className="text-[9px] sm:text-[10px] font-medium px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
};

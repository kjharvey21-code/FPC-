import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ContestSubmission, EventAssignment } from '../../types';
import { hasAdminAccess } from '../../utils/permissions';
import { ContestEntryCard } from '../profile/ContestEntryCard';
import {
  X,
  Eye,
  Lock,
  Search,
  CheckCircle2,
  Star,
  XCircle,
  Award,
  Shield,
  Users,
} from 'lucide-react';

interface ContestEntriesModalProps {
  event: EventAssignment;
  onClose: () => void;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'featured' | 'rejected';

export const ContestEntriesModal: React.FC<ContestEntriesModalProps> = ({ event, onClose }) => {
  const {
    currentUser,
    events,
    allUsers,
    contestSubmissions,
    toggleContestPublicEntriesView,
    reviewSubmission,
  } = useApp();

  const liveEvent = events.find((e) => e.id === event.id) || event;
  const isAdmin = hasAdminAccess(currentUser);
  const isPublicAllowed = Boolean(liveEvent.allowPublicEntriesView);
  const canViewEntries = isAdmin || isPublicAllowed;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [awardSelectionBySub, setAwardSelectionBySub] = useState<Record<string, string>>({});

  const eventSubmissions = useMemo(() => {
    return contestSubmissions.filter((sub) => sub.eventId === liveEvent.id);
  }, [contestSubmissions, liveEvent.id]);

  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return eventSubmissions.filter((sub) => {
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
      if (!q) return true;
      return (
        sub.title.toLowerCase().includes(q) ||
        sub.memberName.toLowerCase().includes(q) ||
        (sub.caption || '').toLowerCase().includes(q) ||
        (sub.awardWon || '').toLowerCase().includes(q)
      );
    });
  }, [eventSubmissions, searchQuery, statusFilter]);

  const handleTogglePublicView = async () => {
    if (!isAdmin || isUpdatingVisibility) return;
    setIsUpdatingVisibility(true);
    try {
      await toggleContestPublicEntriesView(liveEvent.id, !isPublicAllowed);
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleAdminModerate = async (
    sub: ContestSubmission,
    nextStatus: 'approved' | 'featured' | 'rejected'
  ) => {
    if (!isAdmin) return;
    const chosenAward = awardSelectionBySub[sub.id]?.trim();
    await reviewSubmission(sub.id, nextStatus, chosenAward || sub.awardWon);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-purple-700 uppercase tracking-wider text-[11px]">
                Contest Entries
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {eventSubmissions.length} submitted
              </span>
              <span aria-hidden="true">·</span>
              <span className={isPublicAllowed ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                {isPublicAllowed ? 'Visible to Members' : 'Admins Only'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate mt-0.5">
              {liveEvent.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {isAdmin && (
              <button
                type="button"
                onClick={handleTogglePublicView}
                disabled={isUpdatingVisibility}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                  isPublicAllowed
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-xs'
                }`}
                title={
                  isPublicAllowed
                    ? 'Click to restrict entry viewing back to admins only'
                    : 'Allow non-admin members to open and view all submitted entries'
                }
              >
                {isPublicAllowed ? (
                  <>
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Restrict to Admins</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span>Allow Others to View</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Access Guard for non-admins when public viewing is disabled */}
        {!canViewEntries ? (
          <div className="p-8 sm:p-10 text-center space-y-3 bg-slate-50 flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Entries Are Restricted to Administrators
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Submitted entries for this contest are currently private for judging. Once an administrator enables public viewing, all members will be able to browse them here.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Search & Status Filters */}
            <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, member name, or award..."
                  className="w-full h-9 pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto scrollbar-none shrink-0">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'approved', label: 'Approved' },
                    { id: 'featured', label: 'Featured' },
                    { id: 'rejected', label: 'Rejected' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Permissions Notice Banner */}
            {isAdmin && (
              <div className="px-4 sm:px-5 py-2.5 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between gap-2 text-xs text-indigo-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>
                    {isPublicAllowed
                      ? 'Public gallery is enabled — all club members can currently open and view these entries.'
                      : 'Private judging mode — only administrators can view these entries until you allow others.'}
                  </span>
                </span>
              </div>
            )}

            {/* Entries List */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-white">
              {filteredSubmissions.length === 0 ? (
                <div className="py-10 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1.5">
                  <Users className="w-6 h-6 text-slate-400 mx-auto" />
                  <div className="text-xs sm:text-sm font-semibold text-slate-700">
                    {eventSubmissions.length === 0
                      ? 'No contest entries submitted yet'
                      : 'No entries match your search or status filter'}
                  </div>
                  <p className="text-xs text-slate-500">
                    {eventSubmissions.length === 0
                      ? 'Submitted entry links from members will appear here automatically.'
                      : 'Try clearing the search box or switching status filters.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredSubmissions.map((sub) => {
                    const submitter = allUsers.find((u) => u.id === sub.memberId);
                    return (
                      <div key={sub.id} className="flex flex-col gap-2">
                        {/* Submitter Header Strip */}
                        <div className="flex items-center justify-between gap-2 px-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={submitter?.avatarUrl || sub.memberAvatar}
                              alt={sub.memberName}
                              className="w-6 h-6 rounded-lg object-cover border border-slate-200 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex items-center gap-1.5 text-xs">
                              <span className="font-semibold text-slate-900 truncate">
                                {submitter?.fullName || sub.memberName}
                              </span>
                              {submitter?.username && (
                                <span className="text-[11px] font-mono text-slate-400 truncate">
                                  @{submitter.username}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Entry Card */}
                        <ContestEntryCard submission={sub} />

                        {/* Admin Moderation & Award Controls */}
                        {isAdmin && (
                          <div className="px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                            {liveEvent.contestAwards && liveEvent.contestAwards.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                <select
                                  value={awardSelectionBySub[sub.id] ?? sub.awardWon ?? ''}
                                  onChange={(e) =>
                                    setAwardSelectionBySub((prev) => ({
                                      ...prev,
                                      [sub.id]: e.target.value,
                                    }))
                                  }
                                  className="flex-1 h-7 px-2 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800 focus:outline-none focus:border-indigo-500"
                                  aria-label={`Select award for ${sub.title}`}
                                >
                                  <option value="">No specific award</option>
                                  {liveEvent.contestAwards.map((aw) => (
                                    <option key={aw.id} value={aw.award}>
                                      {aw.award} (+{aw.pks} PKS)
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAdminModerate(sub, 'approved')}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-emerald-700 text-[11px] font-semibold transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdminModerate(sub, 'featured')}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-purple-700 text-[11px] font-semibold transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <Star className="w-3 h-3" />
                                <span>Feature</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdminModerate(sub, 'rejected')}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-rose-700 text-[11px] font-semibold transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500">
            {isPublicAllowed
              ? 'Public entry gallery is enabled for all FPC Hub members.'
              : 'Private to admins until public viewing is enabled.'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

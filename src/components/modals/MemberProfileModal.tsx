import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, MLogEntry } from '../../types';
import {
  X,
  Shield,
  Award,
  Sparkles,
  Camera,
  CheckCircle2,
  Lock,
  FileText,
  Calendar,
  Layers,
  ExternalLink,
  Briefcase,
  UserCheck,
  Tag,
  Palette,
  Video,
} from 'lucide-react';
import { LeadershipTimeline } from '../profile/LeadershipTimeline';
import { ContestEntryCard } from '../profile/ContestEntryCard';
import { formatBirthdateDisplay } from '../../utils/dateUtils';

interface MemberProfileModalProps {
  member: User;
  onClose: () => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  onClose,
}) => {
  const {
    currentUser,
    mLogEntries,
    feedPosts,
    contestSubmissions,
    getMemberPks,
    getMemberRank,
    getMemberPillarBreakdown,
  } = useApp();

  // Strict privacy rule: M.Log is ONLY viewable by Admins and SuperAdmins
  const isViewerAdmin = currentUser?.isOfficer || currentUser?.role === 'SuperAdmin';
  const isOwnProfile = currentUser?.id === member.id;
  const canViewMLog = isViewerAdmin || isOwnProfile;

  const [activeTab, setActiveTab] = useState<'overview' | 'showcase' | 'mlog'>('overview');

  const memberPks = getMemberPks(member.id);
  const memberRank = getMemberRank(member.id);
  const pillarBreakdown = getMemberPillarBreakdown(member.id);

  // Member's published posts / features on the feed
  const memberPosts = feedPosts.filter(
    (p) =>
      p.authorName.toLowerCase() === member.fullName.toLowerCase() ||
      p.authorName.toLowerCase() === member.nickname.toLowerCase() ||
      p.title.toLowerCase().includes(member.fullName.toLowerCase()) ||
      p.title.toLowerCase().includes(member.nickname.toLowerCase())
  );

  // Member's contest submissions
  const memberContestEntries = contestSubmissions.filter((s) => s.memberId === member.id);

  // Member's verified M.Log records (strictly for authorized viewers)
  const memberMLog = mLogEntries.filter(
    (entry) => entry.memberId === member.id && entry.status === 'verified'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Hero Banner */}
        <div className="relative bg-gradient-to-r from-slate-100 via-indigo-50/50 to-slate-100 p-4 sm:p-5 border-b border-slate-200">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 border border-slate-200 shadow-xs transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
            <div className="relative shrink-0">
              <img
                src={member.avatarUrl}
                alt={member.fullName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl object-cover border-2 border-white shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1.5 -right-1 px-1.5 py-0.2 rounded bg-indigo-600 text-[9px] font-bold text-white shadow-xs">
                {memberRank.name}
              </div>
            </div>

            <div className="text-center sm:text-left min-w-0 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                  {member.fullName}
                </h2>
                <span className="text-xs text-slate-500 font-medium">({member.nickname})</span>
                {member.isOfficer && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] sm:text-[11px] font-semibold">
                    <Shield className="w-3 h-3 text-indigo-600" />
                    <span>{member.officerRole || member.role}</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 mt-1">
                <span className="font-mono text-slate-600">@{member.username}</span>
                <span aria-hidden="true">·</span>
                <span>{member.gradeSection || 'First Peek Creative'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-indigo-600 font-mono">
                  {memberPks} PKS
                </span>
              </div>

              {/* Bio */}
              {member.bio && (
                <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-xl line-clamp-2">
                  {member.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 border-b border-slate-200 bg-slate-50/80 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap min-h-[38px] active:scale-98 ${
              activeTab === 'overview'
                ? 'bg-white text-indigo-700 border-slate-200 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="sm:hidden">Profile</span>
            <span className="hidden sm:inline">Creative Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('showcase')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap min-h-[38px] active:scale-98 ${
              activeTab === 'showcase'
                ? 'bg-white text-indigo-700 border-slate-200 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border-transparent'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="sm:hidden">Showcase</span>
            <span className="hidden sm:inline">Showcase & Work</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200/90 text-slate-700 text-[10px] font-mono font-bold leading-none">
              {memberPosts.length + memberContestEntries.length}
            </span>
          </button>

          {/* M.Log Tab is STRICTLY only visible to Admins/SuperAdmins or the owner themselves */}
          {canViewMLog && (
            <button
              type="button"
              onClick={() => setActiveTab('mlog')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap min-h-[38px] active:scale-98 ${
                activeTab === 'mlog'
                  ? 'bg-white text-indigo-700 border-slate-200 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="sm:hidden">Ledger</span>
              <span className="hidden sm:inline">Official M.Log Ledger</span>
              {isViewerAdmin && !isOwnProfile && (
                <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold">
                  <span className="sm:hidden">Admin</span>
                  <span className="hidden sm:inline">Admin View</span>
                </span>
              )}
            </button>
          )}
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* TAB 1: OVERVIEW & CREATIVE PROFILE */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Rank & Standing Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        Creative Rank Standing
                      </div>
                      <div className="text-base font-bold text-slate-900">
                        {memberRank.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Verified PKS
                    </div>
                    <div className="text-xl font-black font-mono text-indigo-600">
                      {memberPks} pts
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-indigo-100">
                  {memberRank.description}
                </p>

                {memberRank.perks && memberRank.perks.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Tier Privileges & Responsibilities:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {memberRank.perks.map((perk, i) => (
                        <div key={i} className="text-xs text-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Leadership History & Stewardship Timeline (M.Log Aligned) */}
              <LeadershipTimeline
                member={member}
                onOpenMLogTab={canViewMLog ? () => setActiveTab('mlog') : undefined}
              />

              {/* Creative Tags & Discipline */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Creative Focus & Core Skills</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(member.creativeTags || []).length > 0 ? (
                    member.creativeTags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No specific tags added yet.</span>
                  )}
                </div>

                {member.creativeGroup && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-medium text-slate-500">Creative Group:</span>
                    <span className="capitalize font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {member.creativeGroup}
                    </span>
                  </div>
                )}
              </div>

              {/* Organizational Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Batch
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    {member.batch || 'Batch 2026'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Birthdate
                  </div>
                  <div
                    className={`text-xs font-bold font-mono tabular-nums mt-0.5 ${
                      member.birthdate ? 'text-slate-900' : 'text-slate-400 font-sans italic font-normal'
                    }`}
                  >
                    {member.birthdate ? formatBirthdateDisplay(member.birthdate) : 'Not set'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Date of Registration
                  </div>
                  <div className="text-xs font-bold text-indigo-700 font-mono tabular-nums mt-0.5">
                    {member.registrationDate || member.joinedDate || 'Aug 2025'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Joined Guild
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">
                    {member.joinedDate || 'August 2025'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Leadership Post
                  </div>
                  <div className="text-xs font-bold text-indigo-700 mt-0.5 truncate">
                    {member.officerRole || member.role || 'Member'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHOWCASE & WORK */}
          {activeTab === 'showcase' && (
            <div className="space-y-4">
              {/* Feed Showcase Posts */}
              <div>
                <div className="text-xs font-bold text-slate-900 mb-2">
                  Featured Community Posts & Dispatches ({memberPosts.length})
                </div>

                {memberPosts.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    No community feed posts attributed to this member yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {memberPosts.map((post) => (
                      <div
                        key={post.id}
                        className="rounded-2xl border border-slate-200 overflow-hidden bg-white hover:border-slate-300 transition-colors shadow-xs"
                      >
                        {post.imageUrl && (
                          <div className="h-32 w-full bg-slate-100 overflow-hidden">
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        <div className="p-3 space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {post.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="text-[10px] text-slate-400 font-mono pt-1">
                            {post.publishedAt}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contest Submissions */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-900 mb-2">
                  Contest Submissions ({memberContestEntries.length})
                </div>
                {memberContestEntries.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    No contest entry links submitted by this member yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {memberContestEntries.map((sub) => (
                      <ContestEntryCard key={sub.id} submission={sub} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: OFFICIAL M.LOG LEDGER (STRICT ADMIN / OWNER ONLY) */}
          {activeTab === 'mlog' && canViewMLog && (
            <div className="space-y-4">
              {/* Admin Audit Notice Banner */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Confidential M.Log records visible only to administrators & account owners.
                  </span>
                </div>
                <span className="font-mono font-bold text-[11px] text-amber-800">
                  {memberMLog.length} Verified Entries
                </span>
              </div>

              {/* Pillar Points Breakdown Table */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  4-PILLAR SCORE BREAKDOWN
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="py-2.5 px-1 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-between min-h-[86px] shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="text-xs font-bold text-slate-700">C</div>
                    <div className="text-[10px] text-slate-600 font-medium leading-tight truncate w-full">
                      (Creative)
                    </div>
                    <div className="text-sm sm:text-base font-bold font-mono text-indigo-600 mt-1">
                      {pillarBreakdown.C}
                    </div>
                  </div>

                  <div className="py-2.5 px-1 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-between min-h-[86px] shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="text-xs font-bold text-slate-700">P</div>
                    <div className="text-[10px] text-slate-600 font-medium leading-tight truncate w-full">
                      (Particip.)
                    </div>
                    <div className="text-sm sm:text-base font-bold font-mono text-emerald-600 mt-1">
                      {pillarBreakdown.P}
                    </div>
                  </div>

                  <div className="py-2.5 px-1 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-between min-h-[86px] shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="text-xs font-bold text-slate-700">B</div>
                    <div className="text-[10px] text-slate-600 font-medium leading-tight truncate w-full">
                      (Build/Tech)
                    </div>
                    <div className="text-sm sm:text-base font-bold font-mono text-sky-600 mt-1">
                      {pillarBreakdown.B}
                    </div>
                  </div>

                  <div className="py-2.5 px-1 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-between min-h-[86px] shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="text-xs font-bold text-slate-700">R</div>
                    <div className="text-[10px] text-slate-600 font-medium leading-tight truncate w-full">
                      (Respons.)
                    </div>
                    <div className="text-sm sm:text-base font-bold font-mono text-purple-600 mt-1">
                      {pillarBreakdown.R}
                    </div>
                  </div>

                  <div className="py-2.5 px-1 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-between min-h-[86px] shadow-2xs hover:border-slate-300 transition-colors">
                    <div className="text-xs font-bold text-slate-700">S</div>
                    <div className="text-[10px] text-slate-600 font-medium leading-tight truncate w-full">
                      (Special)
                    </div>
                    <div className="text-sm sm:text-base font-bold font-mono text-rose-600 mt-1">
                      {pillarBreakdown.S}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Verified Entries List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  Verified Production & Activity Ledger
                </div>

                {memberMLog.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                    No verified M.Log records on file for this member.
                  </div>
                ) : (
                  memberMLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {entry.eventTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{entry.date}</span>
                          <span aria-hidden="true">·</span>
                          <span>{entry.roleOrAward}</span>
                        </div>
                        {entry.remarks && (
                          <p className="text-[11px] text-slate-600 mt-1 italic">
                            &ldquo;{entry.remarks}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-indigo-600">
                          +{entry.totalPoints} PKS
                        </div>
                        <div className="flex gap-1 justify-end mt-1">
                          {entry.codes.map((c) => (
                            <span
                              key={c}
                              className="px-1 py-0.2 rounded bg-slate-100 text-[10px] font-mono text-slate-600 border border-slate-200"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

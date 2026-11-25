import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getRankTierForPks,
  getNextRankProgress,
  RANK_TIERS,
  PILLAR_CODES,
} from '../../data/pksFramework';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  FileCheck,
  AlertCircle,
  Plus,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag,
  Shield,
  Layers,
  X,
  Camera,
  Edit3,
  Check,
} from 'lucide-react';
import { RequestMLogModal } from '../modals/RequestMLogModal';
import { ProfilePhotoModal } from '../modals/ProfilePhotoModal';
import { LeadershipTimeline } from '../profile/LeadershipTimeline';
import { BirthdatePromptBanner } from '../BirthdatePromptBanner';
import { formatBirthdateDisplay, getTodayIsoDate, isValidBirthdate } from '../../utils/dateUtils';

export const ProfileTab: React.FC = () => {
  const {
    currentUser,
    getMemberPks,
    getMemberRank,
    getMemberProgress,
    getMemberPillarBreakdown,
    mLogEntries,
    updateMemberProfile,
    showToast,
  } = useApp();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [activeLedgerFilter, setActiveLedgerFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [showRankDetails, setShowRankDetails] = useState(false);
  const [showPillarDetails, setShowPillarDetails] = useState(false);

  // Member bionote editing
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(currentUser?.bio || '');
  const [isSavingBio, setIsSavingBio] = useState(false);

  // Member birthdate editing
  const [isEditingBirthdate, setIsEditingBirthdate] = useState(false);
  const [birthdateDraft, setBirthdateDraft] = useState(currentUser?.birthdate || '');
  const [isSavingBirthdate, setIsSavingBirthdate] = useState(false);

  const handleSaveBio = async () => {
    if (!currentUser) return;
    setIsSavingBio(true);
    try {
      await updateMemberProfile(currentUser.id, { bio: bioText.trim() });
      setIsEditingBio(false);
    } catch (e) {
      console.error('Failed to update bio:', e);
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleSaveBirthdate = async () => {
    if (!currentUser) return;
    if (!isValidBirthdate(birthdateDraft)) {
      showToast('Please enter a valid birthdate (cannot be in the future).', 'error');
      return;
    }
    setIsSavingBirthdate(true);
    try {
      await updateMemberProfile(currentUser.id, { birthdate: birthdateDraft });
      setIsEditingBirthdate(false);
    } catch (e) {
      console.error('Failed to update birthdate:', e);
    } finally {
      setIsSavingBirthdate(false);
    }
  };

  if (!currentUser) return null;

  const totalPks = getMemberPks(currentUser.id);
  const currentTier = getMemberRank(currentUser.id);
  const progress = getMemberProgress(currentUser.id);
  const pillarBreakdown = getMemberPillarBreakdown(currentUser.id);

  // User's personal ledger entries
  const userEntries = mLogEntries.filter((entry) => entry.memberId === currentUser.id);
  const filteredEntries = userEntries.filter((entry) => {
    if (activeLedgerFilter === 'all') return true;
    return entry.status === activeLedgerFilter;
  });

  const pillarCards = [
    {
      code: 'C',
      label: '(Creative)',
      fullName: 'Creative Outputs',
      points: pillarBreakdown.C,
      scoreColor: 'text-indigo-600',
      desc: 'Assets, Posters, Reels & Masterpieces (C1-C4)',
    },
    {
      code: 'P',
      label: '(Particip.)',
      fullName: 'Participation',
      points: pillarBreakdown.P,
      scoreColor: 'text-emerald-600',
      desc: 'Meetings, Workshops, Shoot Crew & Contests (P1-P9)',
    },
    {
      code: 'B',
      label: '(Build/Tech)',
      fullName: 'Build & Tech / Lead',
      points: pillarBreakdown.B,
      scoreColor: 'text-sky-600',
      desc: 'Mentorship, Shoot Direction & Executive (B1-B4)',
    },
    {
      code: 'R',
      label: '(Respons.)',
      fullName: 'Responsibility & Awards',
      points: pillarBreakdown.R,
      scoreColor: 'text-purple-600',
      desc: 'School, City, Regional & National Honors (R1-R5)',
    },
    {
      code: 'S',
      label: '(Special)',
      fullName: 'Special Distinction',
      points: pillarBreakdown.S,
      scoreColor: 'text-rose-600',
      desc: 'Skill Milestones, Streaks & Trust Roles (S1-S6)',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto w-full space-y-3 sm:space-y-4 pb-20 md:pb-8 animate-in fade-in duration-200">
      {/* Birthdate Completion Prompt (Persistent in Profile until completed) */}
      {!currentUser.birthdate && <BirthdatePromptBanner dismissible={false} />}

      {/* Member Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-2 sm:space-y-2.5">
        {/* Row 1: Identity & PKS Counter */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Avatar + Primary Details */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar with Camera button */}
            <div className="relative group shrink-0">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl object-cover border-2 border-slate-200 shadow-2xs group-hover:opacity-90 transition-opacity"
                referrerPolicy="no-referrer"
              />
              {/* Desktop hover camera button */}
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer backdrop-blur-xs"
                title="Change Profile Photo"
              >
                <Camera className="w-3 h-3 text-indigo-300" />
                <span className="text-[7px] font-bold mt-0.5">Change</span>
              </button>

              {/* Mobile quick camera badge button */}
              <button
                type="button"
                onClick={() => setShowPhotoModal(true)}
                className="sm:hidden absolute -top-1 -right-1 p-0.5 rounded-full bg-white border border-slate-200 text-indigo-600 shadow-2xs cursor-pointer"
                aria-label="Change photo"
              >
                <Camera className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Name, Username, and Horizontal Peak Creative + Roles */}
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-baseline gap-1.5 truncate">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                  {currentUser.fullName}
                </h1>
                <span className="text-[11px] text-slate-400 font-mono truncate">
                  @{currentUser.username || currentUser.nickname}
                </span>
              </div>

              {/* Peak Creative & Roles in Horizontal Line */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border whitespace-nowrap shrink-0 ${currentTier.badgeColor} ${currentTier.borderColor}`}>
                  {currentTier.name}
                </span>

                {currentUser.officerRole && currentUser.officerRole !== 'None' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 whitespace-nowrap shrink-0">
                    {currentUser.officerRole}
                  </span>
                )}

                {currentUser.projectHeadRoles && currentUser.projectHeadRoles.length > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-purple-50 border border-purple-200 text-purple-700 whitespace-nowrap shrink-0">
                    Head: {currentUser.projectHeadRoles.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick PKS Total Badge */}
          <div className="flex flex-col items-end justify-center px-2 py-1 sm:px-2.5 sm:py-1.5 bg-slate-50 border border-slate-200/90 rounded-lg shrink-0">
            <span className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
              Total PKS
            </span>
            <span className="text-base sm:text-xl font-black font-mono text-indigo-600 tabular-nums leading-none mt-0.5">
              {totalPks}
            </span>
          </div>
        </div>

        {/* Row 2: Academic & Affiliation Metadata Bar */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-600 bg-slate-50/70 px-2.5 py-1 rounded-md sm:rounded-lg border border-slate-100">
          <span className="font-semibold text-slate-700">{currentUser.gradeSection}</span>
          {currentUser.batch && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-indigo-600 font-medium">{currentUser.batch}</span>
            </>
          )}
          {currentUser.creativeGroup && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="capitalize text-purple-700 font-medium">{currentUser.creativeGroup} Division</span>
            </>
          )}
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="text-slate-400">Joined {currentUser.joinedDate}</span>
          {currentUser.registrationDate && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-500 font-mono text-[9px] sm:text-[10px]">Date of Registration: <strong className="text-indigo-600">{currentUser.registrationDate}</strong></span>
            </>
          )}
          {currentUser.birthdate && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              {isEditingBirthdate ? (
                <span className="inline-flex items-center gap-1.5 flex-wrap">
                  <input
                    type="date"
                    min="1950-01-01"
                    max={getTodayIsoDate()}
                    value={birthdateDraft}
                    onChange={(e) => setBirthdateDraft(e.target.value)}
                    className="px-2 py-0.5 bg-white border border-indigo-300 rounded text-[10px] font-mono tabular-nums text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={handleSaveBirthdate}
                    disabled={isSavingBirthdate}
                    className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isSavingBirthdate ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingBirthdate(false);
                      setBirthdateDraft(currentUser.birthdate || '');
                    }}
                    disabled={isSavingBirthdate}
                    className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-600 font-mono text-[9px] sm:text-[10px] tabular-nums">
                  <span>Birthdate: <strong className="text-slate-800">{formatBirthdateDisplay(currentUser.birthdate)}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setBirthdateDraft(currentUser.birthdate || '');
                      setIsEditingBirthdate(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 underline cursor-pointer ml-0.5 font-sans font-semibold"
                    title="Update birthdate"
                  >
                    Edit
                  </button>
                </span>
              )}
            </>
          )}
        </div>

        {/* Row 3: Bionote Section */}
        {isEditingBio ? (
          <div className="space-y-1 bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-indigo-200 shadow-2xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Edit3 className="w-2.5 h-2.5 text-indigo-600" />
                <span>Edit Bionote</span>
              </label>
              <span className="text-[8px] text-slate-400 font-mono">
                {bioText.length}/280
              </span>
            </div>
            <textarea
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              maxLength={280}
              rows={2}
              placeholder="Write a brief bionote..."
              className="w-full px-2 py-1 text-xs bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed shadow-inner"
              autoFocus
            />
            <div className="flex items-center justify-end gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsEditingBio(false);
                  setBioText(currentUser.bio || '');
                }}
                disabled={isSavingBio}
                className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:text-slate-800 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBio}
                disabled={isSavingBio}
                className="px-2.5 py-0.5 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-2xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isSavingBio ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2 pt-0.5 group/bio">
            <p className="text-xs text-slate-600 leading-relaxed flex-1">
              {currentUser.bio ? (
                <span>&ldquo;{currentUser.bio}&rdquo;</span>
              ) : (
                <span className="italic text-slate-400">
                  No bionote added yet. Click edit to introduce yourself.
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                setBioText(currentUser.bio || '');
                setIsEditingBio(true);
              }}
              className="shrink-0 px-1.5 py-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all flex items-center gap-0.5 text-[10px] font-semibold cursor-pointer"
              title="Edit your bionote"
            >
              <Edit3 className="w-2.5 h-2.5 text-indigo-500" />
              <span>Edit</span>
            </button>
          </div>
        )}

        {/* Row 4: Creative Tags */}
        {currentUser.creativeTags && currentUser.creativeTags.length > 0 && (
          <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1 flex-wrap">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-0.5 mr-0.5">
              <Tag className="w-2.5 h-2.5 text-slate-400" />
              <span>Tags:</span>
            </span>
            {currentUser.creativeTags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 font-medium transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Personal M.Log Ledger */}
      <section className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs space-y-2.5 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>M.log Ledger</span>
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500">
              Verified record of your completed shoots, creative outputs, and awards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] sm:text-[11px]">
              <button
                type="button"
                onClick={() => setActiveLedgerFilter('all')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  activeLedgerFilter === 'all'
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({userEntries.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveLedgerFilter('verified')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  activeLedgerFilter === 'verified'
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Verified
              </button>
              <button
                type="button"
                onClick={() => setActiveLedgerFilter('pending')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  activeLedgerFilter === 'pending'
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending
              </button>
            </div>

            {/* Request M.Log button with touch-friendly tap target */}
            <button
              type="button"
              onClick={() => setShowRequestModal(true)}
              title="Request Verification"
              aria-label="Request Verification"
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log M.Log</span>
            </button>
          </div>
        </div>

        {/* Ledger Entries Tiles Grid */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
            No ledger entries found for this filter. Click &ldquo;+&rdquo; to submit your latest creative activity.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-indigo-200 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 transition-all shadow-xs flex flex-col justify-between gap-2 group"
              >
                {/* Top Row: Date, Status Badge, Points */}
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 text-slate-400" />
                      {entry.date}
                    </span>

                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                          entry.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : entry.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {entry.status}
                      </span>
                      <span className="font-mono font-bold text-[10px] sm:text-xs px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 tabular-nums">
                        +{entry.totalPoints} PKS
                      </span>
                    </div>
                  </div>

                  {/* Title & Role */}
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-1 sm:line-clamp-2">
                    {entry.eventTitle}
                  </h3>

                  <div className="text-[11px] sm:text-xs text-indigo-700 font-semibold mt-0.5 flex items-center gap-1">
                    <Award className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{entry.roleOrAward}</span>
                  </div>

                  {/* PKS Codes Pills */}
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    {entry.codes.map((code) => (
                      <span
                        key={code}
                        className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Remarks, Proof, Verification */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  {entry.remarks && (
                    <p className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 leading-relaxed line-clamp-2">
                      &ldquo;{entry.remarks}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] pt-0.5">
                    {entry.verifiedBy ? (
                      <span className="text-emerald-700 font-mono flex items-center gap-1 truncate max-w-[170px]">
                        <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-emerald-600" />
                        <span className="truncate">Verified by {entry.verifiedBy}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span>Awaiting review</span>
                      </span>
                    )}

                    {entry.proofUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedProofUrl(entry.proofUrl || null)}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5 cursor-pointer hover:underline ml-auto"
                      >
                        <span>Proof</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Integrated Rank Progression & Pillar Points Distribution Section */}
      <section className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs space-y-2.5 sm:space-y-3">
        {/* Top: Rank Progression */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          {/* Left: Current Rank & Status */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] sm:text-xs font-bold text-slate-700">Rank:</span>
                <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.2 rounded ${currentTier.badgeColor} border ${currentTier.borderColor}`}>
                  {currentTier.name}
                </span>
                <span className="text-[11px] sm:text-xs font-mono text-slate-500 font-medium">({totalPks} PKS)</span>
              </div>
              {progress.nextTier ? (
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                  <span>Next: <strong className="text-slate-800">{progress.nextTier.name}</strong></span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-indigo-600 font-mono font-semibold">{progress.pointsRemaining} pts to unlock</span>
                </div>
              ) : (
                <div className="text-[10px] sm:text-[11px] text-indigo-700 mt-0.5 font-medium">
                  Highest Tier Achieved (Hall of Fame)
                </div>
              )}
            </div>
          </div>

          {/* Right: Progress bar & Rank Roadmap Details Toggle */}
          <div className="flex items-center gap-2 sm:justify-end flex-1 max-w-md">
            {progress.nextTier && (
              <div className="flex-1 space-y-0.5">
                <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-500 font-mono">
                  <span>Progress to Next Tier</span>
                  <span className="text-indigo-600 font-bold">{progress.progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress.progressPercent}%` }}
                  />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowRankDetails(!showRankDetails)}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[10px] sm:text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>{showRankDetails ? 'Hide Tiers' : 'Tiers Roadmap'}</span>
              <ChevronRight
                className={`w-3 h-3 transition-transform duration-200 ${
                  showRankDetails ? 'rotate-90' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Expandable Rank Tiers Checklist (Shown only when requested) */}
        {showRankDetails && (
          <div className="pt-2.5 border-t border-slate-100 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <span>All 7 Rank Tiers & Perks</span>
              <span className="text-indigo-600 font-mono text-[10px]">Tier Roadmap</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-1.5">
              {RANK_TIERS.map((tier, idx) => {
                const isAchieved = totalPks >= tier.minPks;
                const isCurrent = currentTier.id === tier.id;

                return (
                  <div
                    key={tier.id}
                    className={`p-2 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'bg-indigo-50 border-indigo-300 shadow-2xs'
                        : isAchieved
                        ? 'bg-white border-slate-200 text-slate-700'
                        : 'bg-slate-50 border-slate-200/60 text-slate-400 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-mono text-[9px] text-slate-400">Tier {idx + 1}</span>
                        {isAchieved && (
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-[10px] sm:text-[11px]">{tier.name}</div>
                      <div className="text-[9px] font-mono text-indigo-600 font-semibold">
                        {tier.minPks}+ PKS
                      </div>
                    </div>

                    <div className="mt-1.5 pt-1 border-t border-slate-100 text-[8px] sm:text-[9px] text-slate-500 line-clamp-2">
                      {tier.perks[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PKS 5-Pillar Score Breakdown */}
        <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              PKS 5-PILLAR SCORE BREAKDOWN
            </h3>
            <button
              type="button"
              onClick={() => setShowPillarDetails(!showPillarDetails)}
              className="text-[10px] sm:text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-0.5 cursor-pointer px-1.5 py-0.5 rounded hover:bg-white"
            >
              <span>{showPillarDetails ? 'Hide details' : 'More details'}</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${showPillarDetails ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {/* 5 Vertical Pillar Cards */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center">
            {pillarCards.map((p) => (
              <div
                key={p.code}
                className="py-1.5 sm:py-2 px-1 bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center gap-0.5 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="text-[10px] sm:text-xs font-bold text-slate-700">
                  {p.code}
                </div>
                <div className={`text-xs sm:text-sm font-bold font-mono tracking-tight ${p.scoreColor}`}>
                  {p.points}
                </div>
              </div>
            ))}
          </div>

          {/* Expandable Pillar Details */}
          {showPillarDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5 pt-1.5 border-t border-slate-200/70 animate-in fade-in duration-200">
              {pillarCards.map((p) => (
                <div
                  key={p.code}
                  className="p-2 rounded-lg bg-white border border-slate-200 space-y-0.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      Pillar {p.code}
                    </span>
                    <span className={`text-[11px] font-bold font-mono ${p.scoreColor}`}>
                      {p.points} pts
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-slate-800">
                    {p.fullName}
                  </div>
                  <p className="text-[9px] text-slate-500 leading-snug">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Leadership History & Stewardship Timeline (M.Log Aligned) */}
      <LeadershipTimeline member={currentUser} />

      {/* Proof Lightbox Modal */}
      {selectedProofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setSelectedProofUrl(null)}
        >
          <div className="relative max-w-3xl w-full flex flex-col items-center">
            <button
              onClick={() => setSelectedProofUrl(null)}
              className="absolute -top-12 right-0 p-2 text-slate-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedProofUrl}
              alt="M.Log Proof"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Request M.Log Modal */}
      {showRequestModal && (
        <RequestMLogModal onClose={() => setShowRequestModal(false)} />
      )}

      {/* Profile Photo Upload & Camera Modal */}
      {showPhotoModal && (
        <ProfilePhotoModal onClose={() => setShowPhotoModal(false)} />
      )}
    </div>
  );
};

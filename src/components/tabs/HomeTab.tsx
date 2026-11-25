import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EventAssignment, EventType } from '../../types';
import { getRankTierForPks, getNextRankProgress } from '../../data/pksFramework';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Camera,
  Users,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Edit3,
  Shield,
  Star,
  UserPlus,
  Check,
} from 'lucide-react';
import { EventDetailsModal } from '../modals/EventDetailsModal';
import { SubmitContestModal } from '../modals/SubmitContestModal';
import { EditEventModal } from '../modals/EditEventModal';
import { ParticipantCreditsModal } from '../modals/ParticipantCreditsModal';
import { canManageEvent, isEventProjectHead, getEventManagementBadge } from '../../utils/permissions';

export const HomeTab: React.FC = () => {
  const {
    currentUser,
    events,
    getMemberPks,
    getMemberRank,
    getMemberProgress,
    toggleVolunteer,
    systemSettings,
    setActiveTab,
  } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<'all' | EventType>('all');
  const [selectedStatusView, setSelectedStatusView] = useState<'active' | 'completed'>('active');
  const [activeEventModal, setActiveEventModal] = useState<EventAssignment | null>(null);
  const [contestSubmitEvent, setContestSubmitEvent] = useState<EventAssignment | null>(null);
  const [editingEventModal, setEditingEventModal] = useState<EventAssignment | null>(null);
  const [creditingEventModal, setCreditingEventModal] = useState<EventAssignment | null>(null);

  if (!currentUser) return null;

  const totalPks = getMemberPks(currentUser.id);
  const rank = getMemberRank(currentUser.id);
  const progress = getMemberProgress(currentUser.id);

  const filteredEvents = events.filter((ev) => {
    if (selectedFilter === 'all') return true;
    return ev.type === selectedFilter;
  });

  // Segregate into "Today / In-Progress", "Upcoming", and "Completed"
  const todayEvents = filteredEvents.filter((ev) => ev.status === 'ongoing');
  const upcomingEvents = filteredEvents.filter((ev) => ev.status === 'upcoming');
  const completedEvents = filteredEvents.filter((ev) => ev.status === 'completed');
  const activeCount = todayEvents.length + upcomingEvents.length;

  const renderEventCard = (ev: EventAssignment) => {
    const isAssigned = ev.assignedCrewIds.includes(currentUser.id);
    const isAssignedInSlot = ev.crewSlots?.some((s) => s.assignedMemberIds.includes(currentUser.id)) || false;
    const isUserAssigned = isAssigned || isAssignedInSlot;

    const isVolunteered = ev.volunteerCrewIds.includes(currentUser.id);
    const isVolunteeredInSlot = ev.crewSlots?.some((s) => s.volunteerMemberIds.includes(currentUser.id)) || false;
    const isUserVolunteered = isVolunteered || isVolunteeredInSlot;

    const hasManagementAccess = canManageEvent(currentUser, ev);
    const isHead = isEventProjectHead(currentUser, ev);
    const hasCrewSlots = Boolean(ev.crewSlots && ev.crewSlots.length > 0);

    return (
      <div
        key={ev.id}
        className="group relative bg-white border border-slate-200 hover:border-slate-300 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col sm:flex-row"
      >
        {/* Thumbnail media */}
        <div className="relative w-full sm:w-40 md:w-48 h-24 sm:h-auto shrink-0 bg-slate-100 overflow-hidden">
          <img
            src={ev.bannerUrl}
            alt={ev.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-slate-900/30 via-transparent to-transparent" />

          {/* Type tag */}
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex items-center gap-1 flex-wrap">
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded bg-white/95 text-indigo-700 border border-slate-200 shadow-xs">
              {ev.type === 'shoot' ? 'project' : ev.type}
            </span>
            {ev.status === 'completed' && (
              <span className="text-[9px] sm:text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                Done
              </span>
            )}
          </div>

          {/* Project Head or Admin badge */}
          {hasManagementAccess && (
            <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5">
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1 ${
                  isHead
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-900 text-white font-bold'
                }`}
              >
                {isHead && <Star className="w-2.5 h-2.5 fill-white" />}
                <span>{isHead ? 'Head' : 'Admin'}</span>
              </span>
            </div>
          )}

          {/* Quick status badge if user is involved */}
          {(isUserAssigned || isUserVolunteered) && (
            <div className="absolute bottom-1.5 left-2 sm:hidden">
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                  isUserAssigned
                    ? 'bg-indigo-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {isUserAssigned ? 'Assigned' : 'Volunteered'}
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-3 sm:p-3.5 md:p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Unboxed metadata row with typographic separators */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium mb-1">
              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                <Calendar className="w-3 h-3 text-indigo-600" />
                {ev.date}
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {ev.time}
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center gap-1 truncate max-w-[130px] sm:max-w-[160px]">
                <MapPin className="w-3 h-3 text-slate-400" />
                {ev.location}
              </span>
            </div>

            <h3
              onClick={() => setActiveEventModal(ev)}
              className="text-xs sm:text-sm md:text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer leading-snug line-clamp-1 sm:line-clamp-2"
            >
              {ev.title}
            </h3>

            {/* Project Head attribution if assigned */}
            {ev.projectHeadName && (
              <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                <span className="text-slate-400 font-normal">Project Head:</span>
                <span className="font-semibold text-slate-800">{ev.projectHeadName}</span>
              </div>
            )}

            <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 line-clamp-1 leading-relaxed">
              {ev.description}
            </p>
          </div>

          {/* Bottom Card Controls & Status Badges */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 sm:gap-2">
            {/* Left status markers */}
            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] min-w-0">
              {(() => {
                const userSlot = ev.crewSlots?.find(
                  (s) => s.assignedMemberIds.includes(currentUser.id) || s.volunteerMemberIds.includes(currentUser.id)
                );
                const isUserAssigned = userSlot?.assignedMemberIds.includes(currentUser.id) || isAssigned;
                const isUserVolunteered = userSlot?.volunteerMemberIds.includes(currentUser.id) || isVolunteered;

                if (isUserAssigned) {
                  return (
                    <span className="font-semibold text-indigo-700 flex items-center gap-1 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate max-w-[130px] sm:max-w-[160px]">{userSlot ? userSlot.role : 'Assigned Crew'}</span>
                    </span>
                  );
                }
                if (isUserVolunteered) {
                  return (
                    <span className="font-semibold text-emerald-700 flex items-center gap-1 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[130px] sm:max-w-[160px]">{userSlot ? `Volunteered: ${userSlot.role}` : 'Volunteered'}</span>
                    </span>
                  );
                }
                if (ev.crewSlots && ev.crewSlots.length > 0) {
                  const totalSpots = ev.crewSlots.reduce((a, s) => a + s.spotsNeeded, 0);
                  const filledSpots = ev.crewSlots.reduce((a, s) => a + s.assignedMemberIds.length, 0);
                  return (
                    <span className="text-slate-700 font-medium flex items-center gap-1 font-mono text-[10px] sm:text-[11px] truncate">
                      <Users className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span className="truncate">{ev.crewSlots.length} roles ({filledSpots}/{totalSpots})</span>
                    </span>
                  );
                }
                if (ev.isContest) {
                  return (
                    <span className="text-rose-600 font-medium flex items-center gap-1 truncate">
                      <Sparkles className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>{ev.submittedEntriesCount || 0} entries</span>
                    </span>
                  );
                }
                return (
                  <span className="text-slate-500 flex items-center gap-1 truncate">
                    <Users className="w-3 h-3 shrink-0" />
                    <span>{ev.assignedCrewIds.length} assigned</span>
                  </span>
                );
              })()}
            </div>

            {/* Right Action buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end pt-1 sm:pt-0">
              {/* Project Head / Admin quick update & credit buttons */}
              {hasManagementAccess && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditingEventModal(ev)}
                    className="min-h-[36px] sm:min-h-[32px] px-2.5 py-1.5 sm:px-3 sm:py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer active:scale-95"
                    title="Update Event or Contest"
                  >
                    <Edit3 className="w-3 h-3 text-slate-500" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreditingEventModal(ev)}
                    className={`min-h-[36px] sm:min-h-[32px] px-2.5 py-1.5 sm:px-3 sm:py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border active:scale-95 ${
                      ev.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:text-indigo-600'
                    }`}
                    title="Approve participant credit"
                  >
                    <Award className="w-3 h-3 text-indigo-600" />
                    <span>Credits</span>
                  </button>
                </>
              )}

              {/* Volunteer action button for all open events & projects */}
              {!isHead && ev.status !== 'completed' && (
                isUserAssigned ? (
                  <span className="min-h-[36px] sm:min-h-[32px] px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Assigned</span>
                  </span>
                ) : isUserVolunteered ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (hasCrewSlots) {
                        setActiveEventModal(ev);
                      } else {
                        toggleVolunteer(ev.id);
                      }
                    }}
                    className="min-h-[36px] sm:min-h-[32px] px-3 py-1.5 sm:py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 flex items-center gap-1 active:scale-95"
                    title={hasCrewSlots ? "You've volunteered for a crew role. Click to view or adjust." : "Click to withdraw volunteer status"}
                  >
                    <span>Applied · Withdraw</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (hasCrewSlots) {
                        setActiveEventModal(ev);
                      } else {
                        toggleVolunteer(ev.id);
                      }
                    }}
                    className="min-h-[36px] sm:min-h-[32px] px-3.5 py-1.5 sm:py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    title={hasCrewSlots ? "Browse open roles and volunteer" : "Volunteer for this event"}
                  >
                    <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Volunteer</span>
                  </button>
                )
              )}

              {/* Contest entry submission */}
              {ev.isContest && (
                <button
                  type="button"
                  onClick={() => setContestSubmitEvent(ev)}
                  className="min-h-[36px] sm:min-h-[32px] px-3 py-1.5 sm:py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                  title="Submit your creative entry"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Submit</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveEventModal(ev)}
                className="min-h-[36px] sm:min-h-[32px] px-3 py-1.5 sm:py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

    );
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4 sm:space-y-5 pb-20 md:pb-8 animate-in fade-in duration-200">
      {/* Reclub-Inspired Minimalist Header */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          {/* Left Greeting & Nickname */}
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
            <div className="relative shrink-0">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white flex items-center justify-center border border-indigo-200 text-indigo-600 text-[9px] sm:text-[10px] font-bold shadow-xs">
                ✓
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-500 font-medium">Welcome back,</div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Hi, {currentUser.nickname}!
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-medium mt-1">
                <span className="font-semibold text-indigo-600">{rank.name}</span>
                {currentUser.officerRole && currentUser.officerRole !== 'None' && (
                  <>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-700">{currentUser.officerRole}</span>
                  </>
                )}
                {currentUser.projectHeadRoles && currentUser.projectHeadRoles.length > 0 && (
                  <>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-indigo-600">Head: {currentUser.projectHeadRoles.join(', ')}</span>
                  </>
                )}
                {currentUser.gradeSection && currentUser.gradeSection !== '-' && (
                  <>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-500">{currentUser.gradeSection}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Quick Status & Numbers (Total PKS) */}
          <div className="shrink-0 flex items-center bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl">
            <div className="text-right sm:text-left">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Total PKS
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-indigo-600 tabular-nums">
                {totalPks}
              </div>
            </div>
          </div>
        </div>

        {/* Next Tier Micro Progress Bar */}
        {progress.nextTier && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
              <span>Promotion Review: {rank.name}</span>
              <span className="font-mono text-indigo-600 font-semibold">{progress.progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Global Announcement Banner (if active) */}
      {systemSettings.bannerActive && systemSettings.announcementBanner && (
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-indigo-950 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
          <Megaphone className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-indigo-900">Official Announcement: </span>
            <span className="text-indigo-800">{systemSettings.announcementBanner}</span>
          </div>
        </div>
      )}

      {/* Interactive Filter Controls */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-xs overflow-x-auto max-w-full">
            {(
              [
                { id: 'all', label: `All (${events.length})`, mobileLabel: `All (${events.length})` },
                { id: 'shoot', label: 'Projects', mobileLabel: 'Projects' },
                { id: 'contest', label: 'Contests', mobileLabel: 'Contests' },
                { id: 'workshop', label: 'Workshops', mobileLabel: 'Workshops' },
                { id: 'meeting', label: 'Meetings', mobileLabel: 'Meetings' },
                { id: 'coverage', label: 'Coverage', mobileLabel: 'Coverage' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="sm:hidden">{tab.mobileLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap hidden sm:flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Open Personal M.Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active vs Completed Status Toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 border border-slate-200 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedStatusView('active')}
              className={`px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedStatusView === 'active'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusView('completed')}
              className={`px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedStatusView === 'completed'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed ({completedEvents.length})</span>
            </button>
          </div>
        </div>
      </div>

      {selectedStatusView === 'active' ? (
        <>
          {/* Section 1: In-Progress / Today */}
          {todayEvents.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Today & In-Progress</span>
                </h2>
                <span className="text-xs text-slate-500 font-mono">Live Call Sheet</span>
              </div>

              <div className="space-y-2.5 sm:space-y-3">{todayEvents.map(renderEventCard)}</div>
            </section>
          )}

          {/* Section 2: Upcoming Assignments & Contests */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Upcoming Production & Events</h2>
              <span className="text-xs text-slate-500 font-mono">
                {upcomingEvents.length} scheduled
              </span>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 px-4 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                No scheduled events or production call sheets match this filter.
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">{upcomingEvents.map(renderEventCard)}</div>
            )}
          </section>
        </>
      ) : (
        /* Completed Events View */
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Completed Events & Archives</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {completedEvents.length} completed
            </span>
          </div>

          {completedEvents.length === 0 ? (
            <div className="text-center py-8 px-4 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No completed events match this filter yet.
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">{completedEvents.map(renderEventCard)}</div>
          )}
        </section>
      )}

      {/* Modals */}
      {activeEventModal && (
        <EventDetailsModal
          event={activeEventModal}
          onClose={() => setActiveEventModal(null)}
          onOpenSubmitEntry={() => setContestSubmitEvent(activeEventModal)}
        />
      )}

      {contestSubmitEvent && (
        <SubmitContestModal
          event={contestSubmitEvent}
          onClose={() => setContestSubmitEvent(null)}
        />
      )}

      {editingEventModal && (
        <EditEventModal
          event={editingEventModal}
          onClose={() => setEditingEventModal(null)}
          onOpenCredits={() => {
            const ev = editingEventModal;
            setEditingEventModal(null);
            setCreditingEventModal(ev);
          }}
        />
      )}

      {creditingEventModal && (
        <ParticipantCreditsModal
          event={creditingEventModal}
          onClose={() => setCreditingEventModal(null)}
          onOpenEditEvent={() => {
            const ev = creditingEventModal;
            setCreditingEventModal(null);
            setEditingEventModal(ev);
          }}
        />
      )}
    </div>
  );
};

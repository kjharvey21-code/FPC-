import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EventAssignment } from '../../types';
import { canManageEvent, isEventProjectHead, getEventManagementBadge, hasAdminAccess } from '../../utils/permissions';
import { calculatePksFromCodes } from '../../data/pksFramework';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  Camera,
  CheckCircle2,
  Edit3,
  Shield,
  Sparkles,
  UserCheck,
  Check,
  Sliders,
  ChevronRight,
  Plus,
  UserPlus,
  Eye,
  Lock,
} from 'lucide-react';
import { EditEventModal } from './EditEventModal';
import { ParticipantCreditsModal } from './ParticipantCreditsModal';
import { ContestEntriesModal } from './ContestEntriesModal';

interface EventDetailsModalProps {
  event: EventAssignment;
  onClose: () => void;
  onOpenSubmitEntry?: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
  onOpenSubmitEntry,
}) => {
  const {
    currentUser,
    events,
    allUsers,
    contestSubmissions,
    toggleVolunteer,
    toggleContestPublicEntriesView,
    volunteerForCrewRole,
    withdrawVolunteerCrewRole,
    assignMemberToCrewSlot,
    removeMemberFromCrewSlot,
    mLogEntries,
  } = useApp();

  const liveEvent = events.find((e) => e.id === event.id) || event;
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showEntriesModal, setShowEntriesModal] = useState(false);

  const isAdmin = hasAdminAccess(currentUser);
  const isContestEvent = Boolean(liveEvent.isContest || liveEvent.type === 'contest');
  const isPublicEntriesAllowed = Boolean(liveEvent.allowPublicEntriesView);
  const canClickViewEntries = isAdmin || isPublicEntriesAllowed;
  const contestEntriesCount = isContestEvent
    ? contestSubmissions.filter((s) => s.eventId === liveEvent.id).length ||
      liveEvent.submittedEntriesCount ||
      0
    : 0;

  const isHead = isEventProjectHead(currentUser, liveEvent);
  const crewSlots = liveEvent.crewSlots || [];
  const hasCrewSlots = crewSlots.length > 0;

  const isAssigned = currentUser ? liveEvent.assignedCrewIds.includes(currentUser.id) : false;
  const isAssignedInSlot = currentUser ? crewSlots.some((s) => s.assignedMemberIds.includes(currentUser.id)) : false;
  const isUserAssigned = isAssigned || isAssignedInSlot;

  const isVolunteered = currentUser ? liveEvent.volunteerCrewIds.includes(currentUser.id) : false;
  const isVolunteeredInSlot = currentUser ? crewSlots.some((s) => s.volunteerMemberIds.includes(currentUser.id)) : false;
  const isUserVolunteered = isVolunteered || isVolunteeredInSlot;

  const assignedUsers = allUsers.filter((u) => liveEvent.assignedCrewIds.includes(u.id));
  const volunteerUsers = allUsers.filter((u) => liveEvent.volunteerCrewIds.includes(u.id));

  const hasManagementAccess = canManageEvent(currentUser, liveEvent);
  const authBadge = getEventManagementBadge(currentUser, liveEvent);

  // Check if member received verified credit for this event
  const isMemberCredited = (memberId: string) => {
    if (event.creditedMemberIds && event.creditedMemberIds.includes(memberId)) return true;
    return mLogEntries.some(
      (m) =>
        m.memberId === memberId &&
        (m.eventId === event.id || m.eventTitle.toLowerCase().includes(event.title.toLowerCase())) &&
        m.status === 'verified'
    );
  };

  const projectHeadUser = event.projectHeadId
    ? allUsers.find((u) => u.id === event.projectHeadId)
    : event.projectHeadName
    ? allUsers.find(
        (u) =>
          u.fullName.toLowerCase() === event.projectHeadName?.toLowerCase() ||
          u.nickname.toLowerCase() === event.projectHeadName?.toLowerCase()
      )
    : null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
          {/* Banner with measured scrim */}
          <div className="relative h-44 sm:h-52 w-full bg-slate-100">
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200/60 backdrop-blur-md transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Event Management Badge if user has management access */}
            {authBadge && (
              <div className="absolute top-4 left-4">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1.5 shadow-md ${
                    authBadge.roleType === 'project_head'
                      ? 'bg-amber-500 text-slate-950 font-black border border-amber-300'
                      : 'bg-indigo-600 text-white font-bold border border-indigo-400/50'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>{authBadge.label}</span>
                </span>
              </div>
            )}

            {/* Event Status Badges */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
              <span
                className={`font-semibold uppercase tracking-wider text-[11px] px-2.5 py-1 rounded-lg border shadow-xs backdrop-blur-sm ${
                  event.status === 'completed'
                    ? 'bg-emerald-50/90 text-emerald-800 border-emerald-300'
                    : event.status === 'ongoing'
                    ? 'bg-amber-50/90 text-amber-800 border-amber-300'
                    : 'bg-white/90 text-slate-700 border-slate-200'
                }`}
              >
                {(event.type === 'shoot' ? 'PROJECT' : event.type.toUpperCase())} · {event.status.toUpperCase()}
              </span>
              {event.isContest && (
                <span className="text-[11px] font-semibold text-purple-800 bg-purple-50/90 px-2.5 py-1 rounded-lg border border-purple-200 shadow-xs backdrop-blur-sm">
                  Contest Active
                </span>
              )}
            </div>
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-white">
            {/* Title & Metadata */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {event.title}
                </h2>

                {hasManagementAccess && (
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                    title="Edit event details, crew requirements, and role PKS codes"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Edit Call Sheet</span>
                  </button>
                )}
              </div>

              {/* Project Head & Leadership Display */}
              <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Designated Project Head
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                      <span>{event.projectHeadName || 'FPC Board of Officers'}</span>
                      {projectHeadUser && (
                        <span className="text-[10px] text-amber-700 font-semibold">
                          ({projectHeadUser.officerRole || projectHeadUser.role})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {projectHeadUser && (
                  <img
                    src={projectHeadUser.avatarUrl}
                    alt={projectHeadUser.fullName}
                    className="w-8 h-8 rounded-xl object-cover border border-amber-300 shrink-0"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>
            </div>

            {/* Prominent Action Bar for Done Events: Credit Participants */}
            {hasManagementAccess && (
              <div
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  event.status === 'completed'
                    ? 'bg-gradient-to-r from-emerald-50 to-indigo-50/50 border-emerald-200 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>
                      {event.status === 'completed'
                        ? 'Event is Done · Participant Credits Ready'
                        : 'Participant Credits Approval'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {event.status === 'completed'
                      ? 'Admins & Project Head can review and approve PKS ledger points.'
                      : 'When finished, approve PKS points for assigned crew & contestants.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreditsModal(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 cursor-pointer transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Approve Credits</span>
                </button>
              </div>
            )}

            {/* Description */}
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              {event.description}
            </div>

            {/* Contest info & Entry Gallery Controls */}
            {isContestEvent && (
              <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs space-y-3">
                {(liveEvent.contestPrize || (liveEvent.contestAwards && liveEvent.contestAwards.length > 0)) && (
                  <div>
                    <div className="text-purple-900 font-semibold mb-1.5 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span>Contest Honor &amp; Prize:</span>
                    </div>
                    {liveEvent.contestAwards && liveEvent.contestAwards.length > 0 ? (
                      <div className="space-y-1.5">
                        {liveEvent.contestAwards.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 py-1 border-b border-purple-200/60 last:border-b-0"
                          >
                            <span className="text-slate-800 font-medium">{item.award}</span>
                            <span className="font-mono tabular-nums font-bold text-purple-800 shrink-0">
                              +{item.pks} PKS
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-800 font-medium">{liveEvent.contestPrize}</div>
                    )}
                    {liveEvent.contestDeadline && (
                      <div className="text-[11px] text-slate-500 mt-1.5">
                        Deadline: {liveEvent.contestDeadline}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-purple-200/70 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-purple-900 font-medium">
                    {isPublicEntriesAllowed
                      ? `All ${contestEntriesCount} submitted entries are open for members to view.`
                      : `Submitted entries (${contestEntriesCount}) are restricted to administrators.`}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={!canClickViewEntries}
                      onClick={() => {
                        if (!canClickViewEntries) return;
                        setShowEntriesModal(true);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        canClickViewEntries
                          ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 cursor-pointer shadow-xs'
                          : 'bg-white/80 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                      }`}
                      title={
                        canClickViewEntries
                          ? 'View all submitted contest entries'
                          : 'Only administrators can view entries until shared'
                      }
                    >
                      {canClickViewEntries ? (
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="tabular-nums">View All Entries ({contestEntriesCount})</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() =>
                          toggleContestPublicEntriesView(liveEvent.id, !isPublicEntriesAllowed)
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                          isPublicEntriesAllowed
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-xs'
                        }`}
                      >
                        {isPublicEntriesAllowed ? (
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
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STRUCTURED CREW REQUIREMENTS & ROLE CALL SHEET (KEY USER FEATURE) */}
            {/* ========================================================================= */}
            {crewSlots.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <span className="uppercase tracking-wider">
                      Crew Requirements & Open Roles ({crewSlots.length})
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Total Quota: {crewSlots.reduce((a, s) => a + s.spotsNeeded, 0)} spots
                  </span>
                </div>

                <div className="space-y-2.5">
                  {crewSlots.map((slot) => {
                    const { total: slotTotal } = calculatePksFromCodes(slot.pksCodes || []);
                    const isUserAssignedToSlot = currentUser ? slot.assignedMemberIds.includes(currentUser.id) : false;
                    const isUserVolunteeredForSlot = currentUser ? slot.volunteerMemberIds.includes(currentUser.id) : false;
                    const spotsRemaining = Math.max(0, slot.spotsNeeded - slot.assignedMemberIds.length);
                    const isFull = spotsRemaining === 0;

                    const assignedSlotUsers = allUsers.filter((u) => slot.assignedMemberIds.includes(u.id));
                    const volunteerSlotUsers = allUsers.filter((u) => slot.volunteerMemberIds.includes(u.id));

                    return (
                      <div
                        key={slot.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isUserAssignedToSlot
                            ? 'bg-indigo-50/70 border-indigo-200 shadow-xs'
                            : isUserVolunteeredForSlot
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                {slot.role}
                              </h4>
                              {slot.category && (
                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                                  {slot.category}
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded font-mono ${
                                  isFull
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}
                              >
                                {slot.assignedMemberIds.length}/{slot.spotsNeeded} Spots Filled
                              </span>
                            </div>

                            {slot.notes && (
                              <p className="text-[11px] text-slate-600 leading-snug">
                                {slot.notes}
                              </p>
                            )}

                            {/* Role PKS Award Badge */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-[10px] font-bold text-indigo-700 font-mono bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                                +{slotTotal} PKS Award
                              </span>
                              <div className="flex items-center gap-1">
                                {(slot.pksCodes || []).map((c) => (
                                  <span
                                    key={c}
                                    className="text-[9px] font-mono px-1 py-0.2 rounded bg-white border border-slate-200 text-slate-700"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons for this role */}
                          <div className="shrink-0 self-start sm:self-auto flex items-center gap-2">
                            {isUserAssignedToSlot ? (
                              <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs">
                                <Check className="w-3.5 h-3.5" />
                                <span>You are Assigned</span>
                              </span>
                            ) : isUserVolunteeredForSlot ? (
                              <button
                                type="button"
                                onClick={() => withdrawVolunteerCrewRole(event.id, slot.id)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                              >
                                Applied · Withdraw
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => volunteerForCrewRole(event.id, slot.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-1"
                              >
                                <span>Volunteer for Role</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Confirmed Members & Volunteers in this role slot */}
                        {(assignedSlotUsers.length > 0 || volunteerSlotUsers.length > 0) && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2 flex-wrap text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-slate-500 font-medium">Crew:</span>
                              {assignedSlotUsers.map((u) => {
                                const credited = isMemberCredited(u.id);
                                return (
                                  <div
                                    key={u.id}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-800 shadow-xs"
                                  >
                                    <img
                                      src={u.avatarUrl}
                                      alt={u.nickname}
                                      className="w-3.5 h-3.5 rounded-full object-cover"
                                    />
                                    <span className="font-medium">{u.nickname}</span>
                                    {credited && (
                                      <span className="text-[9px] text-emerald-600 font-bold">✓</span>
                                    )}
                                    {hasManagementAccess && (
                                      <button
                                        type="button"
                                        onClick={() => removeMemberFromCrewSlot(event.id, slot.id, u.id)}
                                        className="text-slate-400 hover:text-rose-600 ml-0.5"
                                        title="Remove from slot"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {volunteerSlotUsers.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-slate-500 font-medium">Volunteers:</span>
                                {volunteerSlotUsers.map((u) => (
                                  <div
                                    key={u.id}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-medium"
                                  >
                                    <span>{u.nickname}</span>
                                    {hasManagementAccess && (
                                      <button
                                        type="button"
                                        onClick={() => assignMemberToCrewSlot(event.id, slot.id, u.id)}
                                        className="text-emerald-700 hover:text-emerald-900 font-bold ml-0.5 cursor-pointer"
                                        title="Confirm volunteer into slot"
                                      >
                                        +Confirm
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Fallback General Crew Roster */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Assigned Media Crew ({assignedUsers.length})</span>
                  {event.maxCrew && <span className="font-mono">Max: {event.maxCrew}</span>}
                </div>

                {assignedUsers.length === 0 ? (
                  <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                    No primary crew assigned yet. Officers are finalizing call sheet slots.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {assignedUsers.map((user) => {
                      const credited = isMemberCredited(user.id);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={user.avatarUrl}
                              alt={user.nickname}
                              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 truncate">
                                {user.fullName}
                              </div>
                              <div className="text-[10px] text-indigo-600 truncate font-medium">
                                {user.role}
                              </div>
                            </div>
                          </div>

                          {credited && (
                            <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              <span>Credited</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              {isUserAssigned && (
                <span className="text-indigo-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" /> You are on the assigned crew
                </span>
              )}
              {!isUserAssigned && isUserVolunteered && (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> You are volunteered
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {!isContestEvent && !hasCrewSlots && !isHead && liveEvent.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => toggleVolunteer(liveEvent.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    isUserVolunteered
                      ? 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isUserVolunteered ? 'Withdraw Volunteer' : 'Volunteer for Event'}</span>
                </button>
              )}

              {hasManagementAccess && (
                <button
                  type="button"
                  onClick={() => setShowCreditsModal(true)}
                  className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Approve Credits</span>
                </button>
              )}

              {isContestEvent && onOpenSubmitEntry && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSubmitEntry();
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Submit Entry</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nested Modals */}
      {showEditModal && (
        <EditEventModal
          event={liveEvent}
          onClose={() => setShowEditModal(false)}
          onOpenCredits={() => setShowCreditsModal(true)}
        />
      )}

      {showCreditsModal && (
        <ParticipantCreditsModal
          event={liveEvent}
          onClose={() => setShowCreditsModal(false)}
          onOpenEditEvent={() => setShowEditModal(true)}
        />
      )}

      {showEntriesModal && (
        <ContestEntriesModal
          event={liveEvent}
          onClose={() => setShowEntriesModal(false)}
        />
      )}
    </>
  );
};

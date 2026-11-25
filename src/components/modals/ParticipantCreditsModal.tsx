import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EventAssignment, User } from '../../types';
import { PILLAR_CODES, calculatePksFromCodes } from '../../data/pksFramework';
import { getEventManagementBadge } from '../../utils/permissions';
import {
  X,
  Award,
  CheckCircle2,
  Users,
  Shield,
  Sparkles,
  Camera,
  Plus,
  Check,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface ParticipantCreditsModalProps {
  event: EventAssignment;
  onClose: () => void;
  onOpenEditEvent?: () => void;
}

export const ParticipantCreditsModal: React.FC<ParticipantCreditsModalProps> = ({
  event,
  onClose,
  onOpenEditEvent,
}) => {
  const {
    currentUser,
    allUsers,
    mLogEntries,
    contestSubmissions,
    approveParticipantCredit,
    batchApproveParticipantCredits,
    updateEventStatus,
    getMemberPks,
    getMemberRank,
  } = useApp();

  const authBadge = getEventManagementBadge(currentUser, event);

  // Default codes for crediting (fallback to C2+P3, or P5 for contest, or event eligible codes)
  const defaultCodes =
    event.eligibleCodes && event.eligibleCodes.length > 0
      ? event.eligibleCodes.slice(0, 3)
      : event.isContest
      ? ['P5', 'C1']
      : ['P3', 'C2'];

  const [batchCodes, setBatchCodes] = useState<string[]>(defaultCodes);
  const [batchRole, setBatchRole] = useState(
    event.isContest ? 'Contest Participant Credit' : 'Production Crew Credit'
  );
  const [selectedExtraMemberId, setSelectedExtraMemberId] = useState('');
  const [customParticipantCodes, setCustomParticipantCodes] = useState<Record<string, string[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Collect all unique participant member IDs:
  // 1. Assigned crew
  // 2. Volunteers
  // 3. Contest entrants (submissions for this event)
  const eventSubmissions = contestSubmissions.filter((sub) => sub.eventId === event.id);
  const contestMemberIds = eventSubmissions.map((s) => s.memberId);

  const participantIds = Array.from(
    new Set([
      ...(event.assignedCrewIds || []),
      ...(event.volunteerCrewIds || []),
      ...contestMemberIds,
    ])
  );

  // Participants already credited:
  // Check both event.creditedMemberIds and mLogEntries with matching eventId or eventTitle
  const isCredited = (memberId: string) => {
    if (event.creditedMemberIds && event.creditedMemberIds.includes(memberId)) return true;
    return mLogEntries.some(
      (m) =>
        m.memberId === memberId &&
        (m.eventId === event.id || m.eventTitle.toLowerCase().includes(event.title.toLowerCase())) &&
        m.status === 'verified'
    );
  };

  const getCreditedEntry = (memberId: string) => {
    return mLogEntries.find(
      (m) =>
        m.memberId === memberId &&
        (m.eventId === event.id || m.eventTitle.toLowerCase().includes(event.title.toLowerCase())) &&
        m.status === 'verified'
    );
  };

  const creditedCount = participantIds.filter(isCredited).length;
  const uncreditedIds = participantIds.filter((id) => !isCredited(id));

  // Crew slot mapping for accurate role-based PKS credit
  const getParticipantCrewSlot = (memberId: string) => {
    if (!event.crewSlots) return null;
    return (
      event.crewSlots.find((s) => s.assignedMemberIds.includes(memberId)) ||
      event.crewSlots.find((s) => s.volunteerMemberIds.includes(memberId)) ||
      null
    );
  };

  const getParticipantDefaultCodes = (memberId: string): string[] => {
    const slot = getParticipantCrewSlot(memberId);
    if (slot && slot.pksCodes && slot.pksCodes.length > 0) {
      return slot.pksCodes;
    }
    return defaultCodes;
  };

  const getParticipantRoleTitle = (memberId: string): string => {
    const slot = getParticipantCrewSlot(memberId);
    if (slot) {
      const isAssigned = slot.assignedMemberIds.includes(memberId);
      return `${slot.role} ${isAssigned ? '(Assigned Crew)' : '(Volunteer Crew)'}`;
    }
    if (event.assignedCrewIds.includes(memberId)) return 'Assigned Media Crew';
    if (event.volunteerCrewIds.includes(memberId)) return 'Volunteer Production Crew';
    if (contestMemberIds.includes(memberId)) return 'Contest Participant';
    return 'Event Production Participant';
  };

  const toggleBatchCode = (code: string) => {
    setBatchCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleMemberCustomCode = (memberId: string, code: string) => {
    const current = customParticipantCodes[memberId] || getParticipantDefaultCodes(memberId);
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    setCustomParticipantCodes((prev) => ({ ...prev, [memberId]: next }));
  };

  const handleApproveSingle = async (member: User) => {
    setIsProcessing(true);
    const codes = customParticipantCodes[member.id] || getParticipantDefaultCodes(member.id);
    const roleTitle = getParticipantRoleTitle(member.id);

    await approveParticipantCredit({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      memberId: member.id,
      memberName: member.fullName,
      memberAvatar: member.avatarUrl,
      codes: codes.length > 0 ? codes : ['P3'],
      roleOrAward: roleTitle,
      remarks: `Official credit approved for "${event.title}" as ${roleTitle}. Verified by ${currentUser?.fullName} (${authBadge?.label || 'Project Head'}).`,
    });
    setIsProcessing(false);
  };

  const handleBatchApprove = async () => {
    if (uncreditedIds.length === 0) return;
    setIsProcessing(true);

    // Each member receives credit tailored to their specific crew role
    for (const memberId of uncreditedIds) {
      const member = allUsers.find((u) => u.id === memberId);
      if (!member) continue;
      const codes = customParticipantCodes[member.id] || getParticipantDefaultCodes(member.id);
      const roleTitle = getParticipantRoleTitle(member.id);

      await approveParticipantCredit({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        memberId: member.id,
        memberName: member.fullName,
        memberAvatar: member.avatarUrl,
        codes: codes.length > 0 ? codes : ['P3'],
        roleOrAward: roleTitle,
        remarks: `Official credit approved for "${event.title}" as ${roleTitle}. Verified by ${currentUser?.fullName} (${authBadge?.label || 'Project Head'}).`,
      });
    }

    setIsProcessing(false);
  };

  const handleAddExtraMember = async () => {
    if (!selectedExtraMemberId) return;
    const member = allUsers.find((u) => u.id === selectedExtraMemberId);
    if (!member) return;

    await handleApproveSingle(member);
    setSelectedExtraMemberId('');
  };

  const handleMarkAsCompleted = async () => {
    await updateEventStatus(event.id, 'completed');
  };

  const batchCalc = calculatePksFromCodes(batchCodes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  Approve Participant Credits
                </h2>
                {authBadge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                      authBadge.roleType === 'project_head'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    <Shield className="w-2.5 h-2.5" />
                    <span>{authBadge.label}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate max-w-md">{event.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1 bg-white">
          {/* Status notice */}
          {event.status !== 'completed' ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <div className="font-bold text-slate-900">Event is Currently Marked: {event.status.toUpperCase()}</div>
                  <div className="text-slate-600 mt-0.5">
                    Credits are normally approved once the event or contest is done. You can mark it completed now!
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleMarkAsCompleted}
                className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-xs"
              >
                ✓ Mark Event Done Now
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Event Completed: Authorized to approve member M.Log credits</span>
              </div>
              {event.completedAt && (
                <span className="text-[11px] text-slate-500 font-mono">
                  {event.completedAt}
                </span>
              )}
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Total Roster
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 mt-0.5">
                {participantIds.length}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                Credited
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-700 mt-0.5">
                {creditedCount}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-700">
                Awaiting Credit
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-indigo-700 mt-0.5">
                {uncreditedIds.length}
              </div>
            </div>
          </div>

          {/* Batch 1-Click Crediting Configuration */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Standard Credit Preset for Participants</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select PKS codes applied when crediting crew and participants:
                </p>
              </div>

              <div className="flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
                <span>Total:</span>
                <span>+{batchCalc.total} PKS</span>
              </div>
            </div>

            {/* Code Pills */}
            <div className="flex flex-wrap gap-1.5">
              {(event.eligibleCodes || ['C2', 'P3', 'P4', 'P5', 'B2', 'S2']).map((code) => {
                const isSelected = batchCodes.includes(code);
                const item = PILLAR_CODES.find((c) => c.code === code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleBatchCode(code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{code}</span>
                    <span className="text-[10px] opacity-75">+{item?.points || 0}</span>
                  </button>
                );
              })}
            </div>

            {/* Batch Approve Action Button */}
            {uncreditedIds.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {uncreditedIds.length} participant(s) ready for approval
                </span>
                <button
                  type="button"
                  onClick={handleBatchApprove}
                  disabled={isProcessing || batchCodes.length === 0}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {isProcessing
                      ? 'Approving...'
                      : `Batch Credit All (${uncreditedIds.length}) Participants (+${batchCalc.total} PKS)`}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Participant Roster Table / List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Event Participants ({participantIds.length})
              </h3>
            </div>

            {participantIds.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                No participants or assigned crew found for this event yet. Add members below.
              </div>
            ) : (
              <div className="space-y-2">
                {participantIds.map((memberId) => {
                  const member = allUsers.find((u) => u.id === memberId);
                  if (!member) return null;

                  const memberPoints = getMemberPks(member.id);
                  const memberRank = getMemberRank(member.id);
                  const alreadyDone = isCredited(member.id);
                  const verifiedEntry = getCreditedEntry(member.id);

                  const isAssigned = event.assignedCrewIds?.includes(member.id);
                  const isVolunteered = event.volunteerCrewIds?.includes(member.id);
                  const isContestant = contestMemberIds.includes(member.id);

                  const activeCodes = customParticipantCodes[member.id] || getParticipantDefaultCodes(member.id);
                  const memberCalc = calculatePksFromCodes(activeCodes);
                  const participantSlot = getParticipantCrewSlot(member.id);

                  return (
                    <div
                      key={member.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        alreadyDone
                          ? 'bg-emerald-50/40 border-emerald-200/70'
                          : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Member Identity & Involvement */}
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={member.avatarUrl}
                            alt={member.nickname}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {member.fullName}
                              </span>
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${memberRank.badgeColor}20`,
                                  color: memberRank.textColor,
                                  border: `1px solid ${memberRank.borderColor}50`,
                                }}
                              >
                                {memberRank.name} ({memberPoints} PKS)
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                              <span>@{member.username}</span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={`font-semibold ${
                                  participantSlot
                                    ? 'text-indigo-700 font-bold'
                                    : isAssigned
                                    ? 'text-indigo-700'
                                    : isVolunteered
                                    ? 'text-emerald-700'
                                    : 'text-purple-700'
                                }`}
                              >
                                {participantSlot
                                  ? `${participantSlot.role} (${participantSlot.assignedMemberIds.includes(member.id) ? 'Assigned' : 'Volunteer'})`
                                  : isAssigned
                                  ? 'Assigned Crew'
                                  : isVolunteered
                                  ? 'Volunteered'
                                  : isContestant
                                  ? 'Contest Entrant'
                                  : 'Participant'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Credit Status & Action */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {alreadyDone ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1.5 shadow-xs">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Credited (+{verifiedEntry?.totalPoints || batchCalc.total} PKS)</span>
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Quick codes indicator */}
                              <div className="hidden md:flex items-center gap-1">
                                {activeCodes.map((c) => (
                                  <span
                                    key={c}
                                    className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-mono"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleApproveSingle(member)}
                                disabled={isProcessing}
                                className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve (+{memberCalc.total} PKS)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Additional Participant Section */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Credit Additional Unlisted Member</span>
            </label>
            <p className="text-[11px] text-slate-500">
              Did another student creative step in to assist with this production? Add and credit them directly:
            </p>

            <div className="flex gap-2">
              <select
                value={selectedExtraMemberId}
                onChange={(e) => setSelectedExtraMemberId(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
              >
                <option value="">-- Choose Member from Roster --</option>
                {allUsers
                  .filter((u) => !participantIds.includes(u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (@{u.username}) — {u.role}
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={handleAddExtraMember}
                disabled={!selectedExtraMemberId || isProcessing}
                className="py-2 px-4 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer disabled:opacity-40 shadow-xs"
              >
                Credit Member
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div>
            {onOpenEditEvent && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditEvent();
                }}
                className="text-xs text-slate-500 hover:text-indigo-600 underline cursor-pointer"
              >
                ← Back to Edit Event
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ContestAward, EventAssignment, EventType, EventCrewSlot } from '../../types';
import { PILLAR_CODES, calculatePksFromCodes } from '../../data/pksFramework';
import { getEventManagementBadge } from '../../utils/permissions';
import {
  STANDARD_CREW_ROLES,
  CREW_PRESET_PACKAGES,
  generateCrewSlot,
} from '../../data/crewTemplates';
import {
  formatContestPrizeSummary,
  parseLegacyContestPrize,
} from '../../utils/contestAwards';
import { ContestAwardsBox } from '../events/ContestAwardsBox';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  Sparkles,
  Shield,
  Trash2,
  CheckCircle2,
  Check,
  UserCheck,
  Plus,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  Sliders,
} from 'lucide-react';

interface EditEventModalProps {
  event: EventAssignment;
  onClose: () => void;
  onOpenCredits?: () => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  event,
  onClose,
  onOpenCredits,
}) => {
  const { currentUser, allUsers, updateEvent, deleteEvent } = useApp();

  const [title, setTitle] = useState(event.title);
  const [type, setType] = useState<EventType>(event.type);
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'completed'>(event.status);
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [location, setLocation] = useState(event.location);
  const [description, setDescription] = useState(event.description);
  const [bannerUrl, setBannerUrl] = useState(event.bannerUrl);
  const [projectHeadId, setProjectHeadId] = useState(event.projectHeadId || '');
  const [isContest, setIsContest] = useState(!!event.isContest);
  const [contestAwards, setContestAwards] = useState<ContestAward[]>(() =>
    event.contestAwards && event.contestAwards.length > 0
      ? event.contestAwards
      : parseLegacyContestPrize(event.contestPrize)
  );
  const [draftAward, setDraftAward] = useState('');
  const [draftPks, setDraftPks] = useState('15');
  const [contestDeadline, setContestDeadline] = useState(event.contestDeadline || '');
  const [eligibleCodes, setEligibleCodes] = useState<string[]>(event.eligibleCodes || []);
  const [maxCrew, setMaxCrew] = useState<number>(event.maxCrew || 10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Structured Crew Roles & Quotas
  const [crewSlots, setCrewSlots] = useState<EventCrewSlot[]>(event.crewSlots || []);
  const [expandedPksSlotId, setExpandedPksSlotId] = useState<string | null>(null);

  const authBadge = getEventManagementBadge(currentUser, event);

  // Overall eligible codes toggle
  const toggleEligibleCode = (code: string) => {
    setEligibleCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Crew slot actions
  const handleAddSlot = (roleTitle: string = 'Courtside Action Camera') => {
    const newSlot = generateCrewSlot(roleTitle, 1);
    setCrewSlots((prev) => [...prev, newSlot]);
    setExpandedPksSlotId(newSlot.id);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = CREW_PRESET_PACKAGES.find((p) => p.id === presetId);
    if (!preset) return;
    const newSlots: EventCrewSlot[] = preset.roles.map((r) =>
      generateCrewSlot(r.role, r.spots, r.pksCodes, r.notes)
    );
    setCrewSlots(newSlots);
  };

  const handleRemoveSlot = (slotId: string) => {
    setCrewSlots((prev) => prev.filter((s) => s.id !== slotId));
    if (expandedPksSlotId === slotId) setExpandedPksSlotId(null);
  };

  const handleUpdateSpots = (slotId: string, delta: number) => {
    setCrewSlots((prev) =>
      prev.map((s) =>
        s.id === slotId ? { ...s, spotsNeeded: Math.max(1, s.spotsNeeded + delta) } : s
      )
    );
  };

  const handleUpdateRoleTitle = (slotId: string, role: string) => {
    setCrewSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, role } : s))
    );
  };

  const handleUpdateNotes = (slotId: string, notes: string) => {
    setCrewSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, notes } : s))
    );
  };

  // Toggle PKS Code for a specific crew role
  const handleToggleSlotCode = (slotId: string, code: string) => {
    setCrewSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slotId) return s;
        const currentCodes = s.pksCodes || [];
        const nextCodes = currentCodes.includes(code)
          ? currentCodes.filter((c) => c !== code)
          : [...currentCodes, code];
        return { ...s, pksCodes: nextCodes };
      })
    );
  };

  // Assign or unassign a member to a specific crew slot
  const handleToggleMemberInSlot = (slotId: string, memberId: string) => {
    setCrewSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slotId) return s;
        const exists = s.assignedMemberIds.includes(memberId);
        const nextAssigned = exists
          ? s.assignedMemberIds.filter((id) => id !== memberId)
          : [...s.assignedMemberIds, memberId];
        return {
          ...s,
          assignedMemberIds: nextAssigned,
          volunteerMemberIds: s.volunteerMemberIds.filter((id) => id !== memberId),
        };
      })
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const selectedHead = allUsers.find((u) => u.id === projectHeadId);

    // Collect all assigned members across all slots
    const allAssignedFromSlots = Array.from(
      new Set(crewSlots.flatMap((s) => s.assignedMemberIds))
    );

    // Collect all PKS codes across all slots to merge with eligibleCodes
    const allSlotCodes = Array.from(
      new Set([...eligibleCodes, ...crewSlots.flatMap((s) => s.pksCodes)])
    );

    const finalAwards: ContestAward[] = [
      ...contestAwards.filter((a) => a.award.trim().length > 0),
      ...(draftAward.trim()
        ? [
            {
              id: `award_${Date.now()}_draft`,
              award: draftAward.trim(),
              pks: Math.max(0, parseInt(draftPks, 10) || 0),
            },
          ]
        : []),
    ];

    try {
      await updateEvent(event.id, {
        title: title.trim(),
        type,
        status,
        date,
        time,
        location: location.trim(),
        description: description.trim(),
        bannerUrl: bannerUrl.trim(),
        projectHeadId: projectHeadId || '',
        projectHeadName: selectedHead ? selectedHead.fullName : '',
        isContest,
        contestAwards: isContest ? finalAwards : [],
        contestPrize: isContest ? formatContestPrizeSummary(finalAwards) : '',
        contestDeadline: isContest ? contestDeadline : '',
        eligibleCodes: allSlotCodes,
        crewSlots,
        assignedCrewIds: allAssignedFromSlots.length > 0 ? allAssignedFromSlots : event.assignedCrewIds,
        maxCrew,
      });
      onClose();
    } catch {
      // Error toast and logging already handled by updateEvent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteEvent(event.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  Update Event & Crew Call Sheet
                </h2>
                {authBadge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      authBadge.roleType === 'project_head'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    <span>{authBadge.label}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">
                Configure crew requirements, quotas, and role-specific PKS codes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-white">
          {/* Status Controls */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Event Production Status</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {status === 'completed' ? '✓ Ready for participant credit' : 'Active event'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('upcoming')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  status === 'upcoming'
                    ? 'bg-sky-50 border-sky-300 text-sky-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setStatus('ongoing')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  status === 'ongoing'
                    ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Ongoing / Today
              </button>
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  status === 'completed'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Done / Completed</span>
              </button>
            </div>

            {status === 'completed' && onOpenCredits && (
              <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-medium text-[11px]">
                  Event marked as Done. Ready to credit participants?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCredits();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs cursor-pointer transition-colors"
                >
                  Approve Credits Now →
                </button>
              </div>
            )}
          </div>

          {/* Event Title & Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event / Contest Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Science Fair Video Reel & Photo Coverage"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Classification
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-xs transition-all cursor-pointer"
              >
                <option value="shoot">Project & Media Coverage</option>
                <option value="contest">Photo / Design Contest</option>
                <option value="workshop">Multimedia Workshop</option>
                <option value="meeting">General Assembly</option>
                <option value="coverage">Major Institutional Coverage</option>
              </select>
            </div>
          </div>

          {/* Project Head Assignment */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Designated Project Head</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Authorized to manage call sheets and approve credits
              </span>
            </div>

            <select
              value={projectHeadId}
              onChange={(e) => setProjectHeadId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-xs transition-all cursor-pointer"
            >
              <option value="">-- No Specific Project Head (Admins Only) --</option>
              {allUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.officerRole || user.role}) — @{user.username}
                </option>
              ))}
            </select>
          </div>

          {/* Date, Time, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-600" />
                  <span>Date</span>
                </span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  <span>Call Time</span>
                </span>
              </label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="8:00 AM – 3:00 PM"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-600" />
                  <span>Location</span>
                </span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="SJNHS Gymnasium"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>
          </div>

          {/* Call Sheet & Briefing */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Production Briefing & Guidelines
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details on camera gear, coverage guidelines, shot list, and timeline..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-xs leading-relaxed"
            />
          </div>

          {/* ========================================================================= */}
          {/* CREW REQUIREMENTS & ROLE-SPECIFIC PKS CODES (KEY USER FEATURE) */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Crew Requirements & Role PKS Quotas
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-200">
                    {crewSlots.length} Roles Defined
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Specify what crew roles you need and how many spots. Admins & Creators can edit the exact PKS codes each role receives.
                </p>
              </div>

              {/* Quick Template Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Presets:
                </span>
                {CREW_PRESET_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleApplyPreset(pkg.id)}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-indigo-600 text-[10px] font-semibold transition-colors cursor-pointer shadow-xs"
                    title={pkg.description}
                  >
                    + {pkg.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Crew Slots List */}
            {crewSlots.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-white text-center space-y-2">
                <p className="text-xs text-slate-500">
                  No specialized crew positions configured yet. Click below or load a preset above.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddSlot('Lead Photographer / Chief Photojournalist')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    + Add Lead Photo Slot
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSlot('Action & Courtside Camera Operator')}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs cursor-pointer shadow-xs"
                  >
                    + Add Action Cam Slot
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {crewSlots.map((slot, index) => {
                  const { total: slotTotal } = calculatePksFromCodes(slot.pksCodes || []);
                  const isExpandedPks = expandedPksSlotId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-3 transition-all hover:border-slate-300 shadow-xs"
                    >
                      {/* Slot Header: Role Name, Spots, Points Badge & Delete */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono flex items-center justify-center shrink-0 font-bold">
                            {index + 1}
                          </span>

                          <input
                            type="text"
                            value={slot.role}
                            onChange={(e) => handleUpdateRoleTitle(slot.id, e.target.value)}
                            placeholder="Crew Role Title (e.g. Lead Photographer)"
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 flex-1 min-w-[160px] focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {/* Spots Needed Stepper */}
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                            <span className="text-[10px] text-slate-500 font-semibold mr-1">
                              Spots:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateSpots(slot.id, -1)}
                              className="w-5 h-5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer shadow-xs"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-mono font-bold text-slate-900 text-xs">
                              {slot.spotsNeeded}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateSpots(slot.id, 1)}
                              className="w-5 h-5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer shadow-xs"
                            >
                              +
                            </button>
                          </div>

                          {/* PKS Points Pill */}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPksSlotId(isExpandedPks ? null : slot.id)
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                              isExpandedPks
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                            }`}
                            title="Click to edit or adjust PKS codes for this role"
                          >
                            <span>+{slotTotal} PKS</span>
                            {isExpandedPks ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Remove Slot */}
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(slot.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove this crew position"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Brief Role Notes / Instructions */}
                      <div>
                        <input
                          type="text"
                          value={slot.notes || ''}
                          onChange={(e) => handleUpdateNotes(slot.id, e.target.value)}
                          placeholder="Brief role expectations, required lenses, or gear notes..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white"
                        />
                      </div>

                      {/* Selected Codes Summary Preview */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                            Awarded Codes:
                          </span>
                          {(slot.pksCodes || []).map((code) => (
                            <span
                              key={code}
                              className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[10px] font-semibold"
                            >
                              {code}
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPksSlotId(isExpandedPks ? null : slot.id)
                          }
                          className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          {isExpandedPks ? 'Collapse Codes' : 'Edit PKS Codes →'}
                        </button>
                      </div>

                      {/* EXPANDABLE ADMIN & CREATOR PKS CODE EDITOR FOR THIS CREW ROLE */}
                      {isExpandedPks && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-indigo-200 space-y-2 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                              <Tag className="w-3 h-3 text-indigo-600" />
                              <span>Edit PKS Codes for "{slot.role}"</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Total: <strong className="text-indigo-700">+{slotTotal} PKS</strong>
                            </span>
                          </div>

                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {(['C', 'P', 'B', 'R', 'S'] as const).map((cat) => (
                              <div key={cat} className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-bold text-slate-400 w-4">
                                  {cat}:
                                </span>
                                {PILLAR_CODES.filter((c) => c.category === cat).map((c) => {
                                  const isSelected = (slot.pksCodes || []).includes(c.code);
                                  return (
                                    <button
                                      key={c.code}
                                      type="button"
                                      onClick={() => handleToggleSlotCode(slot.id, c.code)}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer border flex items-center gap-0.5 ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                      }`}
                                    >
                                      <span>{c.code}</span>
                                      <span className="text-[8px] opacity-75">+{c.points}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Direct Member Slot Assignment */}
                      <div className="pt-1.5 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                            Confirmed Roster for this Role ({slot.assignedMemberIds.length}/{slot.spotsNeeded})
                          </span>
                          {slot.volunteerMemberIds && slot.volunteerMemberIds.length > 0 && (
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              {slot.volunteerMemberIds.length} volunteer(s) waiting
                            </span>
                          )}
                        </div>

                        {/* Member assignment chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {slot.assignedMemberIds.map((memberId) => {
                            const member = allUsers.find((u) => u.id === memberId);
                            if (!member) return null;
                            return (
                              <span
                                key={memberId}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs"
                              >
                                <img
                                  src={member.avatarUrl}
                                  alt={member.nickname}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className="font-medium text-[11px]">{member.nickname}</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleMemberInSlot(slot.id, memberId)}
                                  className="text-indigo-500 hover:text-rose-600 text-xs ml-0.5 cursor-pointer"
                                  title="Unassign member"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}

                          {/* Quick assign member dropdown */}
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleToggleMemberInSlot(slot.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-700 cursor-pointer shadow-xs focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">+ Assign Member...</option>
                            {allUsers
                              .filter((u) => !slot.assignedMemberIds.includes(u.id))
                              .map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.fullName} ({u.officerRole || u.role})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Custom Crew Role Button */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => handleAddSlot('Action & Courtside Camera Operator')}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Add Position</span>
              </button>

              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddSlot(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer shadow-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="">+ Add from Standard Roles Catalog...</option>
                {STANDARD_CREW_ROLES.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.role} ({r.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contest Settings (if enabled) */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isContest}
                onChange={(e) => setIsContest(e.target.checked)}
                className="w-4 h-4 accent-purple-600 rounded"
              />
              <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Mark as Active Photo / Design Competition</span>
              </span>
            </label>

            {isContest && (
              <div className="space-y-3 pt-2">
                <ContestAwardsBox
                  awards={contestAwards}
                  onChange={setContestAwards}
                  draftAward={draftAward}
                  draftPks={draftPks}
                  onDraftChange={(nextAward, nextPks) => {
                    setDraftAward(nextAward);
                    setDraftPks(nextPks);
                  }}
                />
                <div>
                  <label className="block text-xs font-semibold text-purple-900 mb-1">
                    Submission Deadline
                  </label>
                  <input
                    type="text"
                    value={contestDeadline}
                    onChange={(e) => setContestDeadline(e.target.value)}
                    placeholder="October 25, 2026 11:59 PM"
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 shadow-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Banner URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Banner Image URL
            </label>
            <input
              type="text"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono shadow-xs"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 rounded-xl text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmDelete ? 'Confirm Permanent Delete?' : 'Delete Event'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium cursor-pointer shadow-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save & Publish Call Sheet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ContestAward, EventCrewSlot, EventType } from '../../types';
import { PILLAR_CODES, calculatePksFromCodes } from '../../data/pksFramework';
import {
  STANDARD_CREW_ROLES,
  CREW_PRESET_PACKAGES,
  generateCrewSlot,
} from '../../data/crewTemplates';
import {
  createDefaultContestAwards,
  formatContestPrizeSummary,
} from '../../utils/contestAwards';
import { ContestAwardsBox } from '../events/ContestAwardsBox';
import {
  X,
  CalendarPlus,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Sliders,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  Sparkles,
} from 'lucide-react';

interface PublishEventModalProps {
  onClose: () => void;
}

const BANNER_PRESETS = [
  {
    label: 'Workshop & Production',
    url: '/src/assets/images/fpc_workshop_cover_1792558823447.jpg',
  },
  {
    label: 'Sports & Intramurals',
    url: '/src/assets/images/fpc_event_intramurals_1792558823605.jpg',
  },
  {
    label: 'Street & Contest',
    url: '/src/assets/images/fpc_contest_streetphoto_1792558823968.jpg',
  },
];

export const PublishEventModal: React.FC<PublishEventModalProps> = ({ onClose }) => {
  const { allUsers, createEvent } = useApp();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('shoot');
  const [status, setStatus] = useState<'upcoming' | 'ongoing'>('upcoming');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('8:00 AM – 3:00 PM');
  const [location, setLocation] = useState('SJNHS Audio-Visual Center');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState(BANNER_PRESETS[0].url);
  const [projectHeadId, setProjectHeadId] = useState('');
  const [isContest, setIsContest] = useState(false);
  const [contestAwards, setContestAwards] = useState<ContestAward[]>(() =>
    createDefaultContestAwards()
  );
  const [draftAward, setDraftAward] = useState('');
  const [draftPks, setDraftPks] = useState('15');
  const [contestDeadline, setContestDeadline] = useState('');
  const [eligibleCodes] = useState<string[]>(['C2', 'P4', 'B2', 'S2']);
  const [crewSlots, setCrewSlots] = useState<EventCrewSlot[]>(() => [
    generateCrewSlot('Lead Photographer / Chief Photojournalist', 1, ['C3', 'P4', 'B2'], 'Leads shot plan, hero portraits, curated RAW selects'),
    generateCrewSlot('Action & Courtside Camera Operator', 2, ['C2', 'P4', 'B1'], 'High-speed action, celebration candids, telephoto bursts'),
    generateCrewSlot('Live Social Media Poster & Graphic Runner', 1, ['C2', 'B2', 'P2'], 'Rapid Lightroom edits and live story updates'),
  ]);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSlot = (roleTitle: string = 'Action & Courtside Camera Operator') => {
    const newSlot = generateCrewSlot(roleTitle, 1);
    setCrewSlots((prev) => [...prev, newSlot]);
    setExpandedSlotId(newSlot.id);
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = CREW_PRESET_PACKAGES.find((p) => p.id === presetId);
    if (!preset) return;
    setCrewSlots(
      preset.roles.map((r) => generateCrewSlot(r.role, r.spots, r.pksCodes, r.notes))
    );
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const selectedHead = allUsers.find((u) => u.id === projectHeadId);
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
      await createEvent({
        title: title.trim(),
        type,
        date,
        time: time.trim(),
        location: location.trim(),
        description: description.trim(),
        bannerUrl: bannerUrl.trim() || BANNER_PRESETS[0].url,
        status,
        projectHeadId: projectHeadId || undefined,
        projectHeadName: selectedHead ? selectedHead.fullName : undefined,
        isContest,
        contestAwards: isContest ? finalAwards : undefined,
        contestPrize: isContest ? formatContestPrizeSummary(finalAwards) : undefined,
        contestDeadline: isContest ? (contestDeadline.trim() || date) : undefined,
        eligibleCodes: allSlotCodes,
        crewSlots,
      });
      onClose();
    } catch {
      // Error toast and logging already handled by createEvent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                Publish Event to FPC Hub
              </h2>
              <p className="text-xs text-slate-500 truncate">
                Create a live production call sheet and notify all club members immediately.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-white">
          {/* Title & Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Event Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Science Fair Video Reel & Photo Coverage"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Classification
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const nextType = e.target.value as EventType;
                  setType(nextType);
                  if (nextType === 'contest') setIsContest(true);
                }}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
              >
                <option value="shoot">Shoot & Media Coverage</option>
                <option value="contest">Photo / Design Contest</option>
                <option value="workshop">Multimedia Workshop</option>
                <option value="meeting">General Assembly</option>
                <option value="coverage">Major Institutional Coverage</option>
              </select>
            </div>
          </div>

          {/* Status & Project Head */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Launch Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('upcoming')}
                  className={`min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    status === 'upcoming'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('ongoing')}
                  className={`min-h-[38px] px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    status === 'ongoing'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Ongoing / Today
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Designate Project Head</span>
              </label>
              <select
                value={projectHeadId}
                onChange={(e) => setProjectHeadId(e.target.value)}
                className="w-full min-h-[38px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">-- Admins Only (No Specific Head) --</option>
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.officerRole || user.role}) — @{user.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Call Time, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-600" />
                <span>Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-600" />
                <span>Call Time</span>
              </label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="8:00 AM – 3:00 PM"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-600" />
                <span>Location</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="SJNHS Gymnasium"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Briefing */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Call Sheet & Production Briefing
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details on camera rigs needed, shot list, coverage guidelines, and schedule..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 leading-relaxed"
            />
          </div>

          {/* Contest Option */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isContest}
                onChange={(e) => setIsContest(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mark as Active Photo / Design Competition</span>
              </span>
            </label>

            {isContest && (
              <div className="space-y-3 pt-1">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Submission Deadline
                  </label>
                  <input
                    type="text"
                    value={contestDeadline}
                    onChange={(e) => setContestDeadline(e.target.value)}
                    placeholder={date}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Crew Requirements & Role PKS Quotas */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Crew Requirements & Role PKS Quotas
                  </h3>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500">
                    · {crewSlots.length} roles
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Configure open crew roles and PKS point allocations for volunteers.
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {CREW_PRESET_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleApplyPreset(pkg.id)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    title={pkg.description}
                  >
                    + {pkg.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {crewSlots.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center bg-white space-y-2">
                <p className="text-xs text-slate-500">
                  No specialized crew positions added yet.
                </p>
                <button
                  type="button"
                  onClick={() => handleAddSlot('Lead Photographer / Chief Photojournalist')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer"
                >
                  + Add Lead Photographer Position
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {crewSlots.map((slot, index) => {
                  const { total: slotTotal } = calculatePksFromCodes(slot.pksCodes || []);
                  const isExpanded = expandedSlotId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[11px] font-mono tabular-nums text-slate-400 font-semibold w-5 text-center shrink-0">
                            {index + 1}.
                          </span>
                          <input
                            type="text"
                            value={slot.role}
                            onChange={(e) =>
                              setCrewSlots((prev) =>
                                prev.map((s) => (s.id === slot.id ? { ...s, role: e.target.value } : s))
                              )
                            }
                            placeholder="Crew Role Title"
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900 flex-1 min-w-[140px] focus:outline-none focus:bg-white focus:border-indigo-500"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                            <span className="text-[10px] text-slate-500 font-semibold mr-1">
                              Spots:
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setCrewSlots((prev) =>
                                  prev.map((s) =>
                                    s.id === slot.id
                                      ? { ...s, spotsNeeded: Math.max(1, s.spotsNeeded - 1) }
                                      : s
                                  )
                                )
                              }
                              className="w-5 h-5 rounded bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer border border-slate-200"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-mono tabular-nums font-bold text-slate-900 text-xs">
                              {slot.spotsNeeded}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setCrewSlots((prev) =>
                                  prev.map((s) =>
                                    s.id === slot.id
                                      ? { ...s, spotsNeeded: s.spotsNeeded + 1 }
                                      : s
                                  )
                                )
                              }
                              className="w-5 h-5 rounded bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center cursor-pointer border border-slate-200"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedSlotId(isExpanded ? null : slot.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums font-bold flex items-center gap-1 transition-colors cursor-pointer border whitespace-nowrap ${
                              isExpanded
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                            }`}
                          >
                            <span>+{slotTotal} PKS</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setCrewSlots((prev) => prev.filter((s) => s.id !== slot.id))
                            }
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove position"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={slot.notes || ''}
                        onChange={(e) =>
                          setCrewSlots((prev) =>
                            prev.map((s) => (s.id === slot.id ? { ...s, notes: e.target.value } : s))
                          )
                        }
                        placeholder="Brief role instructions or gear notes..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                      />

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                        <div className="text-slate-500 font-mono text-[10px]">
                          Codes: {(slot.pksCodes || []).join(', ') || 'None'}
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedSlotId(isExpanded ? null : slot.id)}
                          className="text-[11px] text-indigo-600 hover:underline cursor-pointer font-medium"
                        >
                          {isExpanded ? 'Collapse Codes' : 'Edit Role PKS Codes'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <Tag className="w-3 h-3 text-indigo-600" />
                              <span>Toggle PKS Codes</span>
                            </span>
                            <span className="font-mono tabular-nums text-indigo-700 font-bold">
                              +{slotTotal} PKS
                            </span>
                          </div>
                          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                            {(['C', 'P', 'B', 'R', 'S'] as const).map((cat) => (
                              <div key={cat} className="flex items-center gap-1 flex-wrap">
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
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                      }`}
                                    >
                                      {c.code} +{c.points}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => handleAddSlot('Action & Courtside Camera Operator')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Add Crew Position</span>
              </button>

              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddSlot(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer"
              >
                <option value="">+ Standard Roles Catalog...</option>
                {STANDARD_CREW_ROLES.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.role} ({r.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cover Banner */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Event Cover Banner
            </label>
            <div className="flex flex-wrap gap-2">
              {BANNER_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => setBannerUrl(preset.url)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    bannerUrl === preset.url
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="/src/assets/images/fpc_workshop_cover_1792558823447.jpg"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[40px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

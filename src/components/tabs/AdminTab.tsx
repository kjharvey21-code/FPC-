import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PILLAR_CODES,
  validatePksSelection,
  calculatePksFromCodes,
  isElevatedRole,
  getRankTierForPks,
} from '../../data/pksFramework';
import { UserRole, OfficerRole, EventType, MLogEntry, User, PendingRegistration } from '../../types';
import { compressImageFile } from '../../utils/imageUtils';
import {
  getLinkDomainLabel,
  isDisplayableImageUrl,
  normalizeSafeHttpUrl,
} from '../../utils/urlUtils';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  CalendarPlus,
  Users,
  Settings,
  AlertCircle,
  Upload,
  Plus,
  ExternalLink,
  Sparkles,
  Award,
  Layers,
  Search,
  Edit3,
  Trash2,
  Tag,
  Briefcase,
  UserCheck,
  ChevronRight,
  X,
  Zap,
  Camera,
  Palette,
  Video,
  LayoutGrid,
  List,
  Star,
  Check,
  Sliders,
  ChevronDown,
  ChevronUp,
  Link2,
  Copy,
  Clock,
  Share2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { CreateMemberModal } from '../modals/CreateMemberModal';
import { EditMemberModal } from '../modals/EditMemberModal';
import { EditEventModal } from '../modals/EditEventModal';
import { ParticipantCreditsModal } from '../modals/ParticipantCreditsModal';
import { ApproveMemberModal } from '../modals/ApproveMemberModal';
import { EventAssignment, EventCrewSlot, ContestAward } from '../../types';
import { canManageEvent, isEventProjectHead, getEventManagementBadge } from '../../utils/permissions';
import {
  STANDARD_CREW_ROLES,
  CREW_PRESET_PACKAGES,
  generateCrewSlot,
} from '../../data/crewTemplates';
import { isOfficerRoleSyncedWithMLog, getLeadershipPksCodeForRole } from '../../utils/leadershipSync';
import { formatBirthdateDisplay } from '../../utils/dateUtils';
import {
  createDefaultContestAwards,
  formatContestPrizeSummary,
} from '../../utils/contestAwards';
import { ContestAwardsBox } from '../events/ContestAwardsBox';

export const AdminTab: React.FC = () => {
  const {
    currentUser,
    allUsers,
    mLogEntries,
    verifyMLogEntry,
    updateMLogEntry,
    deleteMLogEntry,
    addManualMLogEntry,
    events,
    createEvent,
    updateEvent,
    updateEventStatus,
    deleteEvent,
    approveParticipantCredit,
    batchApproveParticipantCredits,
    addMember,
    updateMemberDualRoles,
    systemSettings,
    updateSystemSettings,
    getMemberPks,
    getMemberRank,
    syncOfficerLeadershipMLog,
    pendingRegistrations,
    toggleInviteRegistration,
    regenerateInviteCode,
  } = useApp();

  const [adminSection, setAdminSection] = useState<
    'queue' | 'manual_mlog' | 'ledger_audit' | 'create_event' | 'members' | 'superadmin'
  >('queue');

  // Pending M.Log entries
  const pendingEntries = mLogEntries.filter((e) => e.status === 'pending');

  // Member Registration Invites & Approvals
  const [selectedPendingReg, setSelectedPendingReg] = useState<PendingRegistration | null>(null);
  const [memberTabSubSection, setMemberTabSubSection] = useState<'active' | 'pending'>('active');
  const [copiedInvite, setCopiedInvite] = useState(false);

  const pendingRegList = pendingRegistrations.filter((r) => r.status === 'pending');

  // Manual M.Log Tool state
  const [selectedMemberId, setSelectedMemberId] = useState(allUsers[0]?.id || '');
  const [manualEventTitle, setManualEventTitle] = useState('');
  const [manualRole, setManualRole] = useState('Courtside Coverage Crew');
  const [manualCodes, setManualCodes] = useState<string[]>(['C2', 'B2']);
  const [manualRemarks, setManualRemarks] = useState('Official coverage assignment completed.');

  // Direct Starting / Baseline PKS mode
  const [manualMode, setManualMode] = useState<'baseline' | 'codes'>('baseline');
  const [directPksAmount, setDirectPksAmount] = useState<number>(50);
  const [directReasonTitle, setDirectReasonTitle] = useState<string>('Academic Year Initial Starting PKS');
  const [directRoleTitle, setDirectRoleTitle] = useState<string>('Member Baseline Credit');

  // Member Directory Direct Credit Modal
  const [creditingMember, setCreditingMember] = useState<User | null>(null);
  const [modalCreditAmount, setModalCreditAmount] = useState<number>(50);
  const [modalCreditReason, setModalCreditReason] = useState<string>('Academic Year Initial Starting PKS');
  const [modalCreditRole, setModalCreditRole] = useState<string>('Starting Member Credit');
  const [modalCreditNotes, setModalCreditNotes] = useState<string>('Initial onboarding starting PKS baseline credited.');

  // Create Event state
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('shoot');
  const [eventDate, setEventDate] = useState('2026-10-30');
  const [eventTime, setEventTime] = useState('8:00 AM – 3:00 PM');
  const [eventLocation, setEventLocation] = useState('SJNHS Audio-Visual Center');
  const [eventDescription, setEventDescription] = useState('');
  const [eventBanner, setEventBanner] = useState('/src/assets/images/fpc_workshop_cover_1792558823447.jpg');
  const [isContest, setIsContest] = useState(false);
  const [contestAwards, setContestAwards] = useState<ContestAward[]>(() =>
    createDefaultContestAwards()
  );
  const [draftContestAward, setDraftContestAward] = useState('');
  const [draftContestPks, setDraftContestPks] = useState('15');
  const [eligibleCodes, setEligibleCodes] = useState<string[]>(['C2', 'P4', 'B2', 'S2']);
  const [eventProjectHeadId, setEventProjectHeadId] = useState<string>('');
  const [eventSubView, setEventSubView] = useState<'roster' | 'create'>('roster');
  const [eventStatusFilter, setEventStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [editingEventAdmin, setEditingEventAdmin] = useState<EventAssignment | null>(null);
  const [creditingEventAdmin, setCreditingEventAdmin] = useState<EventAssignment | null>(null);

  // Structured Crew Requirements for New Events
  const [eventCrewSlots, setEventCrewSlots] = useState<EventCrewSlot[]>(() => [
    generateCrewSlot('Lead Photographer / Chief Photojournalist', 1, ['C3', 'P4', 'B2'], 'Leads shot plan, hero portraits, curated RAW selects'),
    generateCrewSlot('Action & Courtside Camera Operator', 2, ['C2', 'P4', 'B1'], 'High-speed action, celebration candids, telephoto bursts'),
    generateCrewSlot('Live Social Media Poster & Graphic Runner', 1, ['C2', 'B2', 'P2'], 'Rapid Lightroom edits and live story updates'),
  ]);
  const [expandedPublishSlotId, setExpandedPublishSlotId] = useState<string | null>(null);

  const toggleEligibleCode = (code: string) => {
    setEligibleCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handlePublishAddSlot = (roleTitle: string = 'Courtside Action Camera') => {
    const slot = generateCrewSlot(roleTitle, 1);
    setEventCrewSlots((prev) => [...prev, slot]);
    setExpandedPublishSlotId(slot.id);
  };

  const handlePublishApplyPreset = (presetId: string) => {
    const preset = CREW_PRESET_PACKAGES.find((p) => p.id === presetId);
    if (!preset) return;
    const newSlots: EventCrewSlot[] = preset.roles.map((r) =>
      generateCrewSlot(r.role, r.spots, r.pksCodes, r.notes)
    );
    setEventCrewSlots(newSlots);
  };

  const handlePublishToggleSlotCode = (slotId: string, code: string) => {
    setEventCrewSlots((prev) =>
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

  // Separate Create Member Modal state & Member filters
  const [isCreateMemberModalOpen, setIsCreateMemberModalOpen] = useState(false);
  const [memberGroupFilter, setMemberGroupFilter] = useState<'all' | 'photography' | 'design' | 'videography'>('all');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'officers' | 'members' | 'project_heads'>('all');
  const [memberBatchFilter, setMemberBatchFilter] = useState<string>('all');
  const [memberMissingBirthdateOnly, setMemberMissingBirthdateOnly] = useState<boolean>(false);

  // SuperAdmin Settings state
  const [appNameInput, setAppNameInput] = useState(systemSettings.appName);
  const [schoolNameInput, setSchoolNameInput] = useState(systemSettings.schoolName);
  const [taglineInput, setTaglineInput] = useState(systemSettings.orgTagline);
  const [logoInput, setLogoInput] = useState(systemSettings.logoUrl);
  const [academicYearInput, setAcademicYearInput] = useState(systemSettings.academicYear);
  const [bannerInput, setBannerInput] = useState(systemSettings.announcementBanner);
  const [bannerActiveInput, setBannerActiveInput] = useState(systemSettings.bannerActive);

  // Member search & edit modal
  const [memberSearch, setMemberSearch] = useState('');
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [memberViewMode, setMemberViewMode] = useState<'blocks' | 'table'>('blocks');

  // Ledger Audit state
  const [auditFilterMember, setAuditFilterMember] = useState<string>('all');
  const [auditFilterStatus, setAuditFilterStatus] = useState<string>('all');
  const [editingEntry, setEditingEntry] = useState<MLogEntry | null>(null);
  const [editEntryCodes, setEditEntryCodes] = useState<string[]>([]);
  const [editEntryRemarks, setEditEntryRemarks] = useState('');
  const [editEntryEventTitle, setEditEntryEventTitle] = useState('');
  const [editEntryStatus, setEditEntryStatus] = useState<'verified' | 'pending' | 'rejected'>('verified');

  // Proof inspection modal
  const [inspectProofUrl, setInspectProofUrl] = useState<string | null>(null);

  // File upload ref for SuperAdmin logo
  const logoFileRef = useRef<HTMLInputElement>(null);

  if (!currentUser?.isOfficer) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl shadow-xs">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Restricted Officer Zone</h2>
        <p className="text-xs text-slate-500 mt-1">
          This hub is restricted to elevated accounts (President, VP, Unit Heads, SuperAdmin).
        </p>
      </div>
    );
  }

  // Manual M.Log calculation & validation
  const manualValidation = validatePksSelection(manualCodes);
  const manualScore = calculatePksFromCodes(manualCodes);

  const toggleManualCode = (code: string) => {
    setManualCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const handleManualMLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = allUsers.find((u) => u.id === selectedMemberId);
    if (!targetMember || !manualEventTitle.trim() || manualCodes.length === 0) return;
    if (!manualValidation.isValid) return;

    addManualMLogEntry({
      memberId: targetMember.id,
      memberName: targetMember.fullName,
      memberAvatar: targetMember.avatarUrl,
      eventTitle: manualEventTitle.trim(),
      date: new Date().toISOString().split('T')[0],
      roleOrAward: manualRole.trim(),
      codes: manualCodes,
      pillarPoints: manualScore.breakdown,
      totalPoints: manualScore.total,
      remarks: manualRemarks.trim(),
      status: 'verified',
      verifiedBy: `${currentUser.fullName} (${currentUser.officerRole || currentUser.role})`,
      verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });

    setManualEventTitle('');
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const selectedHead = allUsers.find((u) => u.id === eventProjectHeadId);
    const allSlotCodes = Array.from(
      new Set([...eligibleCodes, ...eventCrewSlots.flatMap((s) => s.pksCodes)])
    );

    const finalAwards: ContestAward[] = [
      ...contestAwards.filter((a) => a.award.trim().length > 0),
      ...(draftContestAward.trim()
        ? [
            {
              id: `award_${Date.now()}_draft`,
              award: draftContestAward.trim(),
              pks: Math.max(0, parseInt(draftContestPks, 10) || 0),
            },
          ]
        : []),
    ];

    try {
      await createEvent({
        title: eventTitle.trim(),
        type: eventType,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        description: eventDescription,
        bannerUrl: eventBanner,
        status: 'upcoming',
        projectHeadId: eventProjectHeadId || undefined,
        projectHeadName: selectedHead ? selectedHead.fullName : undefined,
        isContest,
        contestAwards: isContest ? finalAwards : undefined,
        contestPrize: isContest ? formatContestPrizeSummary(finalAwards) : undefined,
        contestDeadline: isContest ? eventDate : undefined,
        eligibleCodes: allSlotCodes,
        crewSlots: eventCrewSlots,
      });

      setEventTitle('');
      setEventDescription('');
      setEventProjectHeadId('');
      setContestAwards(createDefaultContestAwards());
      setDraftContestAward('');
      setDraftContestPks('15');
      setEventSubView('roster');
    } catch {
      // Error toast and logging already handled by createEvent
    }
  };



  const handleSaveSuperAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings({
      appName: appNameInput,
      schoolName: schoolNameInput,
      orgTagline: taglineInput,
      logoUrl: logoInput,
      academicYear: academicYearInput,
      announcementBanner: bannerInput,
      bannerActive: bannerActiveInput,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file, 400, 400, 0.8);
      setLogoInput(compressedDataUrl);
    } catch (err) {
      console.warn('Fallback logo upload:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoInput(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  // Open Edit MLog Entry
  const openEditEntryModal = (entry: MLogEntry) => {
    setEditingEntry(entry);
    setEditEntryCodes(entry.codes);
    setEditEntryRemarks(entry.remarks);
    setEditEntryEventTitle(entry.eventTitle);
    setEditEntryStatus(entry.status);
  };

  const handleSaveEditEntry = () => {
    if (!editingEntry) return;
    const calc = calculatePksFromCodes(editEntryCodes);
    updateMLogEntry(editingEntry.id, {
      codes: editEntryCodes,
      pillarPoints: calc.breakdown,
      totalPoints: calc.total,
      remarks: editEntryRemarks,
      eventTitle: editEntryEventTitle,
      status: editEntryStatus,
    });
    setEditingEntry(null);
  };

  const toggleEditEntryCode = (code: string) => {
    setEditEntryCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const officerRolesList: OfficerRole[] = [
    'None',
    'President',
    'VPIA',
    'VPCA',
    'Secretary',
    'Treasurer',
    'Logistics Head',
    'Logistics Officer',
    'PEBU Head',
    'Creative Head (Photography)',
    'Creative Head (Videography)',
    'Creative Head (Design)',
    'Project Head',
    'SuperAdmin',
  ];

  // Target member calculation for manual M.Log tool
  const currentTargetMember = allUsers.find((u) => u.id === selectedMemberId);
  const currentTargetPoints = currentTargetMember ? getMemberPks(currentTargetMember.id) : 0;
  const currentTargetRank = currentTargetMember ? getMemberRank(currentTargetMember.id) : null;
  const projectedTargetPoints = currentTargetPoints + (manualValidation.isValid ? manualScore.total : 0);
  const projectedTargetRank = getRankTierForPks(projectedTargetPoints);

  // Filtered M.Log for Ledger Audit
  const auditEntries = mLogEntries.filter((entry) => {
    if (auditFilterMember !== 'all' && entry.memberId !== auditFilterMember) return false;
    if (auditFilterStatus !== 'all' && entry.status !== auditFilterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-200">
      {/* Admin Hub Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                Restricted Access
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-semibold">
                {currentUser.officerRole || currentUser.role}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                Dual Status: {getMemberRank(currentUser.id).name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <span>FPC Hub Management Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Verify M.Log ledger requests, manage dual roles, publish production shoots, and audit automated PKS rank progressions.
            </p>
          </div>
        </div>

        {/* Sub-Navigation Buttons (Mobile-friendly horizontal scrollbar) */}
        <div className="flex items-center gap-2 overflow-x-auto mt-5 pt-4 pb-1.5 scrollbar-none border-t border-slate-100">
          <button
            type="button"
            onClick={() => setAdminSection('queue')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border shrink-0 active:scale-95 ${
              adminSection === 'queue'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Verify</span>
            {pendingEntries.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  adminSection === 'queue'
                    ? 'bg-white text-indigo-700'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {pendingEntries.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAdminSection('manual_mlog')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border shrink-0 active:scale-95 ${
              adminSection === 'manual_mlog'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add M.Log</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminSection('ledger_audit')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border shrink-0 active:scale-95 ${
              adminSection === 'ledger_audit'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PKS Audit</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminSection('create_event')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border shrink-0 active:scale-95 ${
              adminSection === 'create_event'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Events</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminSection('members')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border shrink-0 active:scale-95 ${
              adminSection === 'members'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members</span>
            {pendingRegList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-black shadow-xs animate-pulse">
                {pendingRegList.length}
              </span>
            )}
          </button>

          {/* SuperAdmin Panel Tab */}
          {currentUser.role === 'SuperAdmin' && (
            <button
              type="button"
              onClick={() => setAdminSection('superadmin')}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border shrink-0 active:scale-95 ${
                adminSection === 'superadmin'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>SuperAdmin Panel</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: Verification Queue */}
      {adminSection === 'queue' && (
        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Officer Verification Queue</span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold">
                  {pendingEntries.length} Pending
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Approving entries dynamically credits PKS points to the member&rsquo;s ledger and immediately triggers rank badge promotions.
              </p>
            </div>
          </div>

          {pendingEntries.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
              <div className="font-semibold text-slate-800 text-sm">Verification Queue is Clear</div>
              <div className="text-slate-500 mt-1">All member M.Log submissions have been reviewed.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingEntries.map((entry) => {
                const currentMemberPoints = getMemberPks(entry.memberId);
                const currentMemberRank = getMemberRank(entry.memberId);
                const projectedMemberPoints = currentMemberPoints + entry.totalPoints;
                const projectedMemberRank = getRankTierForPks(projectedMemberPoints);
                const isRankAdvancement = projectedMemberRank.id !== currentMemberRank.id;

                return (
                  <div
                    key={entry.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <img
                          src={entry.memberAvatar}
                          alt={entry.memberName}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">{entry.memberName}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${currentMemberRank.badgeColor}`}>
                              {currentMemberRank.name} ({currentMemberPoints} PKS)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                            <span>{entry.date}</span>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="text-indigo-600 font-semibold">{entry.roleOrAward}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm font-bold text-slate-900 mt-1">{entry.eventTitle}</div>

                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        &ldquo;{entry.remarks}&rdquo;
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="text-slate-500 font-semibold uppercase text-[10px]">
                          Requested Codes:
                        </span>
                        {entry.codes.map((code) => (
                          <span
                            key={code}
                            className="font-mono text-xs px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold"
                          >
                            {code}
                          </span>
                        ))}

                        {entry.proofUrl && (
                          <button
                            type="button"
                            onClick={() => setInspectProofUrl(entry.proofUrl || null)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer ml-2 font-medium"
                          >
                            <span>Preview Proof File</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Rank Advancement Preview */}
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-slate-500 font-medium">Approval Impact:</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {currentMemberPoints} → {projectedMemberPoints} PKS
                        </span>
                        {isRankAdvancement ? (
                          <span className="ml-auto font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-[11px] animate-pulse">
                            🎉 Dynamic Promotion to {projectedMemberRank.name}!
                          </span>
                        ) : (
                          <span className="ml-auto text-slate-500 text-[11px]">
                            Remains {currentMemberRank.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions & Point Value */}
                    <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Credit Value
                        </div>
                        <div className="text-xl font-black font-mono text-indigo-600 tabular-nums">
                          +{entry.totalPoints} PKS
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => verifyMLogEntry(entry.id, 'rejected')}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => verifyMLogEntry(entry.id, 'verified')}
                          className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify & Credit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SECTION 2: Manual M.Log Tool */}
      {adminSection === 'manual_mlog' && (
        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              <span>Officer Manual M.Log Assignment Tool</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Directly credit a member&rsquo;s verified M.Log ledger with official 4-pillar codes. Automatically triggers rank badge updates in real time.
            </p>
          </div>

          <form onSubmit={handleManualMLogSubmit} className="space-y-4 max-w-2xl">
            {/* Member Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Member
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500"
              >
                {allUsers.map((u) => {
                  const pks = getMemberPks(u.id);
                  const rank = getMemberRank(u.id);
                  return (
                    <option key={u.id} value={u.id}>
                      {u.fullName} · {rank.name} ({pks} PKS){u.officerRole && u.officerRole !== 'None' ? ` [${u.officerRole}]` : ''}
                    </option>
                  );
                })}
              </select>

              {/* Dynamic Rank & Projected Promotion Preview */}
              {currentTargetMember && currentTargetRank && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Current Standing:</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${currentTargetRank.badgeColor}`}>
                      {currentTargetRank.name} ({currentTargetPoints} PKS)
                    </span>
                    {currentTargetMember.officerRole && currentTargetMember.officerRole !== 'None' && (
                      <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium">
                        {currentTargetMember.officerRole}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-slate-500">After Credit:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded ${
                        projectedTargetRank.id !== currentTargetRank.id
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'text-indigo-600'
                      }`}
                    >
                      {projectedTargetRank.name} ({projectedTargetPoints} PKS)
                      {projectedTargetRank.id !== currentTargetRank.id && ' 🎉 Rank Promotion!'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Event Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Event / Project Title
              </label>
              <input
                type="text"
                required
                value={manualEventTitle}
                onChange={(e) => setManualEventTitle(e.target.value)}
                placeholder="e.g. Foundation Day Opening Ceremony Full Coverage"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Role or Designation
              </label>
              <input
                type="text"
                required
                value={manualRole}
                onChange={(e) => setManualRole(e.target.value)}
                placeholder="e.g. Lead Videographer / Shoot Director"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Pillar Code Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Select PKS Pillar Codes ({manualCodes.length} selected)
                </label>
                <div className="text-xs font-mono font-bold text-indigo-600">
                  Sum: +{manualScore.total} PKS
                </div>
              </div>

              {!manualValidation.isValid && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                  {manualValidation.errors.map((err, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 max-h-56 overflow-y-auto">
                {(['C', 'P', 'B', 'R', 'S'] as const).map((cat) => (
                  <div key={cat} className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {cat}-Codes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PILLAR_CODES.filter((c) => c.category === cat).map((c) => {
                        const isSelected = manualCodes.includes(c.code);
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => toggleManualCode(c.code)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <span>{c.code}</span>
                            <span className="text-[10px] font-normal opacity-85">+{c.points}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Officer Remarks & Deliverables
              </label>
              <textarea
                rows={2}
                value={manualRemarks}
                onChange={(e) => setManualRemarks(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={!manualValidation.isValid || manualCodes.length === 0}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
            >
              Credit M.Log Ledger (+{manualScore.total} PKS) & Promote
            </button>
          </form>
        </section>
      )}

      {/* SECTION 3: Ledger Audit & Adjustments */}
      {adminSection === 'ledger_audit' && (
        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>M.Log Ledger Audit & Live Adjustments</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Inspect, modify codes, or retract entries. Point changes and automatic rank badges recalculate immediately.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={auditFilterMember}
                onChange={(e) => setAuditFilterMember(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:border-indigo-500"
              >
                <option value="all">All Members</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>

              <select
                value={auditFilterStatus}
                onChange={(e) => setAuditFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified Only</option>
                <option value="pending">Pending Only</option>
                <option value="rejected">Rejected Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Event / Task</th>
                  <th className="py-2.5 px-3">Codes & Breakdown</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Points</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No M.Log records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  auditEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500">{entry.date}</td>
                      <td className="py-3 px-3 flex items-center gap-2">
                        <img
                          src={entry.memberAvatar}
                          alt={entry.memberName}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                        />
                        <span className="font-semibold text-slate-900">{entry.memberName}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-900 max-w-[200px] truncate">
                        <div className="font-medium">{entry.eventTitle}</div>
                        <div className="text-[10px] text-indigo-600 font-semibold">{entry.roleOrAward}</div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="flex flex-wrap gap-1">
                          {entry.codes.map((c) => (
                            <span key={c} className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                            entry.status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : entry.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 tabular-nums">
                        +{entry.totalPoints}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditEntryModal(entry)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
                            title="Edit codes & adjust score"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMLogEntry(entry.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer border border-slate-200"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 4: Events & Contests Management */}
      {adminSection === 'create_event' && (
        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-indigo-600" />
                <span>Events, Production Shoots & Contests</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage call sheets, designate Project Heads, update details, and approve participant PKS credits.
              </p>
            </div>

            {/* Sub-view switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setEventSubView('roster')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  eventSubView === 'roster'
                    ? 'bg-white text-indigo-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Events Roster ({events.length})
              </button>
              <button
                type="button"
                onClick={() => setEventSubView('create')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  eventSubView === 'create'
                    ? 'bg-white text-indigo-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish Event</span>
              </button>
            </div>
          </div>

          {/* SUB-VIEW 1: EVENTS ROSTER */}
          {eventSubView === 'roster' ? (
            <div className="space-y-4">
              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {(['all', 'upcoming', 'ongoing', 'completed'] as const).map((filterStatus) => {
                  const count =
                    filterStatus === 'all'
                      ? events.length
                      : events.filter((e) => e.status === filterStatus).length;
                  return (
                    <button
                      key={filterStatus}
                      type="button"
                      onClick={() => setEventStatusFilter(filterStatus)}
                      className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer capitalize border ${
                        eventStatusFilter === filterStatus
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {filterStatus === 'all' ? 'All Events' : filterStatus} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Event Cards */}
              <div className="space-y-3">
                {events
                  .filter((ev) => eventStatusFilter === 'all' || ev.status === eventStatusFilter)
                  .map((ev) => {
                    const isHead = isEventProjectHead(currentUser, ev);
                    const hasAccess = canManageEvent(currentUser, ev);

                    return (
                      <div
                        key={ev.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          ev.status === 'completed'
                            ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 min-w-0">
                            <img
                              src={ev.bannerUrl}
                              alt={ev.title}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-xs"
                            />
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-700">
                                  {ev.type}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                    ev.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : ev.status === 'ongoing'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-sky-50 text-sky-700 border-sky-200'
                                  }`}
                                >
                                  {ev.status}
                                </span>
                                {isHead && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white flex items-center gap-1 shadow-xs">
                                    <Star className="w-2.5 h-2.5 fill-white" />
                                    <span>You are Project Head</span>
                                  </span>
                                )}
                              </div>

                              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                {ev.title}
                              </h3>

                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span>{ev.date}</span>
                                <span aria-hidden="true" className="text-slate-300">·</span>
                                <span>{ev.time}</span>
                                <span aria-hidden="true" className="text-slate-300">·</span>
                                <span className="truncate max-w-[150px]">{ev.location}</span>
                              </div>

                              {/* Project Head Tag & Crew Slots Count */}
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5 flex-wrap">
                                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="text-slate-500">Project Head:</span>
                                <span className="font-semibold text-slate-800">
                                  {ev.projectHeadName || 'FPC Board / Unassigned'}
                                </span>
                                {ev.crewSlots && ev.crewSlots.length > 0 ? (
                                  <span className="text-indigo-700 font-mono text-[10px] bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200 font-bold">
                                    {ev.crewSlots.length} Crew Roles ({ev.crewSlots.reduce((acc, s) => acc + s.spotsNeeded, 0)} spots)
                                  </span>
                                ) : (
                                  ev.assignedCrewIds && (
                                    <>
                                      <span aria-hidden="true" className="text-slate-300">·</span>
                                      <span>{ev.assignedCrewIds.length} Crew</span>
                                    </>
                                  )
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {ev.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => updateEventStatus(ev.id, 'completed')}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                title="Mark this event as finished"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Mark Done</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setCreditingEventAdmin(ev)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-xs ${
                                ev.status === 'completed'
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                              }`}
                              title="Approve participant credit"
                            >
                              <Award className="w-3.5 h-3.5 text-indigo-600" />
                              <span>
                                {ev.status === 'completed' ? 'Approve Credits' : 'Credits'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingEventAdmin(ev)}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Update Event Details"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* SUB-VIEW 2: PUBLISH FORM */
            <form onSubmit={handleCreateEventSubmit} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="e.g. Science Fair Video Reel & Photo Coverage"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Classification
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500"
                  >
                    <option value="shoot">Shoot & Media Coverage</option>
                    <option value="contest">Photo / Design Contest</option>
                    <option value="workshop">Multimedia Workshop</option>
                    <option value="meeting">General Assembly</option>
                    <option value="coverage">Major Institutional Coverage</option>
                  </select>
                </div>
              </div>

              {/* Project Head Assignment Dropdown */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Designate Event Project Head</span>
                </label>
                <select
                  value={eventProjectHeadId}
                  onChange={(e) => setEventProjectHeadId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-indigo-500"
                >
                  <option value="">-- No Specific Project Head (Admins Only) --</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} ({user.officerRole || user.role}) — @{user.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Call Time</label>
                  <input
                    type="text"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="8:00 AM – 3:00 PM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="SJNHS Gymnasium"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Call Sheet & Briefing
                </label>
                <textarea
                  rows={3}
                  required
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Details on camera rigs needed, shot list, coverage guidelines, and schedule..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
                />
              </div>

              {/* Contest Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isContest}
                    onChange={(e) => setIsContest(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-900">
                    Mark as Active Photo / Design Competition
                  </span>
                </label>

                {isContest && (
                  <div className="pt-2">
                    <ContestAwardsBox
                      awards={contestAwards}
                      onChange={setContestAwards}
                      draftAward={draftContestAward}
                      draftPks={draftContestPks}
                      onDraftChange={(nextAward, nextPks) => {
                        setDraftContestAward(nextAward);
                        setDraftContestPks(nextPks);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* CREW REQUIREMENTS & ROLE-SPECIFIC PKS CODES BUILDER */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        Crew Requirements & Role PKS Quotas
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[10px] font-bold">
                        {eventCrewSlots.length} Roles Defined
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Specify the type of crew needed and how many spots. Each role awards distinct PKS points based on participation level.
                    </p>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Load Preset:
                    </span>
                    {CREW_PRESET_PACKAGES.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => handlePublishApplyPreset(pkg.id)}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold transition-colors cursor-pointer shadow-xs"
                        title={pkg.description}
                      >
                        + {pkg.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Crew Slots List */}
                {eventCrewSlots.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center space-y-2 bg-white">
                    <p className="text-xs text-slate-500">
                      No specialized crew positions added yet. Click below or choose a preset package above.
                    </p>
                    <button
                      type="button"
                      onClick={() => handlePublishAddSlot('Lead Photographer / Chief Photojournalist')}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      + Add Lead Photographer Position
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eventCrewSlots.map((slot, index) => {
                      const { total: slotTotal } = calculatePksFromCodes(slot.pksCodes || []);
                      const isExpanded = expandedPublishSlotId === slot.id;

                      return (
                        <div
                          key={slot.id}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2.5 transition-all hover:border-slate-300 shadow-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono flex items-center justify-center shrink-0 font-bold border border-slate-200">
                                {index + 1}
                              </span>
                              <input
                                type="text"
                                value={slot.role}
                                onChange={(e) =>
                                  setEventCrewSlots((prev) =>
                                    prev.map((s) => (s.id === slot.id ? { ...s, role: e.target.value } : s))
                                  )
                                }
                                placeholder="Crew Role Title (e.g. Lead Photographer)"
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 flex-1 min-w-[150px] focus:outline-none focus:bg-white focus:border-indigo-500"
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
                                  onClick={() =>
                                    setEventCrewSlots((prev) =>
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
                                <span className="w-5 text-center font-mono font-bold text-slate-900 text-xs">
                                  {slot.spotsNeeded}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEventCrewSlots((prev) =>
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

                              {/* PKS Points Pill */}
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedPublishSlotId(isExpanded ? null : slot.id)
                                }
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                                  isExpanded
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                }`}
                                title="Click to edit or adjust PKS codes for this role"
                              >
                                <span>+{slotTotal} PKS</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Remove Slot */}
                              <button
                                type="button"
                                onClick={() =>
                                  setEventCrewSlots((prev) => prev.filter((s) => s.id !== slot.id))
                                }
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove position"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Notes */}
                          <input
                            type="text"
                            value={slot.notes || ''}
                            onChange={(e) =>
                              setEventCrewSlots((prev) =>
                                prev.map((s) => (s.id === slot.id ? { ...s, notes: e.target.value } : s))
                              )
                            }
                            placeholder="Brief role instructions, required lenses, or gear notes..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                          />

                          {/* Awarded Codes Pill Summary */}
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
                                Codes Awarded:
                              </span>
                              {(slot.pksCodes || []).map((code) => (
                                <span
                                  key={code}
                                  className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[10px] font-bold"
                                >
                                  {code}
                                </span>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPublishSlotId(isExpanded ? null : slot.id)
                              }
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                            >
                              {isExpanded ? 'Collapse Codes' : 'Edit Role PKS Codes →'}
                            </button>
                          </div>

                          {/* EXPANDABLE PKS CODE EDITOR FOR THIS CREW ROLE */}
                          {isExpanded && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-indigo-200 space-y-2 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                                  <Tag className="w-3 h-3 text-indigo-600" />
                                  <span>Toggle PKS Codes for "{slot.role}"</span>
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  Calculated Reward: <strong className="text-indigo-600 font-bold">+{slotTotal} PKS</strong>
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
                                          onClick={() => handlePublishToggleSlotCode(slot.id, c.code)}
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
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Role Control */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handlePublishAddSlot('Action & Courtside Camera Operator')}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Add Crew Position</span>
                  </button>

                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handlePublishAddSlot(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer shadow-xs"
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

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Publish Event to FPC Hub
                </button>
                <button
                  type="button"
                  onClick={() => setEventSubView('roster')}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* SECTION 5: Members Directory */}
      {adminSection === 'members' && (() => {
        const availableBatches = Array.from(
          new Set(
            allUsers
              .map((u) => u.batch?.trim())
              .filter((b): b is string => Boolean(b && b.length > 0))
          )
        ).sort();

        const filteredMembers = allUsers.filter((u) => {
          const matchesSearch =
            u.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
            u.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
            (u.batch && u.batch.toLowerCase().includes(memberSearch.toLowerCase())) ||
            (u.creativeGroup && u.creativeGroup.toLowerCase().includes(memberSearch.toLowerCase())) ||
            (u.officerRole && u.officerRole.toLowerCase().includes(memberSearch.toLowerCase())) ||
            (u.projectHeadRoles &&
              u.projectHeadRoles.some((p) => p.toLowerCase().includes(memberSearch.toLowerCase())));

          const matchesGroup =
            memberGroupFilter === 'all' || u.creativeGroup === memberGroupFilter;

          const isOfficer = Boolean(u.isOfficer || (u.officerRole && u.officerRole !== 'None'));
          const hasProjectHead = Boolean(u.projectHeadRoles && u.projectHeadRoles.length > 0);

          const matchesRole =
            memberRoleFilter === 'all'
              ? true
              : memberRoleFilter === 'officers'
              ? isOfficer
              : memberRoleFilter === 'members'
              ? !isOfficer
              : memberRoleFilter === 'project_heads'
              ? hasProjectHead
              : true;

          const matchesBatch =
            memberBatchFilter === 'all' ||
            (u.batch && u.batch.trim().toLowerCase() === memberBatchFilter.trim().toLowerCase());

          const matchesBirthdateFilter = !memberMissingBirthdateOnly || !u.birthdate;

          return matchesSearch && matchesGroup && matchesRole && matchesBatch && matchesBirthdateFilter;
        });

        const missingBirthdateCount = allUsers.filter((u) => !u.birthdate).length;

        return (
          <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>Members & Registrations</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Manage member records, generate self-registration invite links, and review pending applicants with direct PKS baseline allocation.
                </p>
              </div>
            </div>

            {/* Member Self-Registration Invite Link Toolbar */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/80 via-slate-50 to-amber-50/60 border border-indigo-200 rounded-2xl space-y-3.5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Member Registration Invite Link
                      </h3>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          systemSettings.inviteRegistrationActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            systemSettings.inviteRegistrationActive !== false
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-rose-500'
                          }`}
                        />
                        {systemSettings.inviteRegistrationActive !== false ? 'Active & Open' : 'Paused / Closed'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Share this permanent unique link with recruits. Applications are held for administrator approval and initial PKS point assignment.
                    </p>
                  </div>
                </div>

                {/* Invite Controls: Toggle switch & Regenerate */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleInviteRegistration(systemSettings.inviteRegistrationActive === false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                      systemSettings.inviteRegistrationActive !== false
                        ? 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                        : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                    }`}
                  >
                    {systemSettings.inviteRegistrationActive !== false ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                        <span>Pause Registrations</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-white" />
                        <span>Activate Registrations</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => regenerateInviteCode()}
                    title="Regenerate invite code"
                    className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden md:inline text-[11px]">New Code</span>
                  </button>
                </div>
              </div>

              {/* URL Display Box with Copy Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <div className="relative flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-xs">
                  <Share2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}#register?invite=${systemSettings.inviteCode || 'fpc-creative-2026'}`}
                    className="w-full bg-transparent text-xs text-slate-700 font-mono focus:outline-none select-all truncate"
                  />
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    Code: {systemSettings.inviteCode || 'fpc-creative-2026'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}#register?invite=${systemSettings.inviteCode || 'fpc-creative-2026'}`;
                    navigator.clipboard.writeText(url);
                    setCopiedInvite(true);
                    setTimeout(() => setCopiedInvite(false), 2500);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    copiedInvite
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  {copiedInvite ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Invite Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sub-Tabs: Active Members vs Pending Approvals */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMemberTabSubSection('active')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    memberTabSubSection === 'active'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Active Members</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      memberTabSubSection === 'active'
                        ? 'bg-white/20 text-white font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {allUsers.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMemberTabSubSection('pending')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    memberTabSubSection === 'pending'
                      ? 'bg-amber-500 text-black border-amber-500 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Approvals</span>
                  {pendingRegList.length > 0 ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-600 text-white animate-pulse">
                      {pendingRegList.length}
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-slate-100 text-slate-500">
                      0
                    </span>
                  )}
                </button>
              </div>

              {memberTabSubSection === 'active' && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-52">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search member, batch..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* View toggle (Blocks vs Table) */}
                  <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setMemberViewMode('blocks')}
                      title="Blocks View (Mobile Optimized)"
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        memberViewMode === 'blocks'
                          ? 'bg-white text-indigo-600 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold">Blocks</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberViewMode('table')}
                      title="Table View"
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        memberViewMode === 'table'
                          ? 'bg-white text-indigo-600 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px] font-bold">Table</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreateMemberModalOpen(true)}
                    title="Create New Member Account"
                    className="h-8.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span className="hidden sm:inline font-bold">New Member</span>
                  </button>
                </div>
              )}
            </div>

            {/* PENDING APPROVALS SUB-TAB VIEW */}
            {memberTabSubSection === 'pending' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Submitted Applications</span>
                      <span className="text-xs font-mono font-medium text-slate-500">
                        ({pendingRegList.length} awaiting review)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verify applicants, assign starting baseline PKS credit, and activate member accounts.
                    </p>
                  </div>
                </div>

                {pendingRegList.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">All Registrations Reviewed!</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        No pending applications at this time. Send the invite link above to new recruits so they can apply for membership.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {pendingRegList.map((reg) => (
                      <div
                        key={reg.id}
                        className="bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 transition-all shadow-xs flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={
                              reg.avatarUrl ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${reg.username}`
                            }
                            alt={reg.fullName}
                            className="w-12 h-12 rounded-xl bg-white border border-slate-200 object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {reg.fullName}
                              </h4>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                                Pending
                              </span>
                            </div>
                            <p className="text-xs font-mono text-slate-500">@{reg.username}</p>

                            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-medium">
                                {reg.gradeSection || 'Grade 11'}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-medium">
                                {reg.batch || 'Batch Tres'}
                              </span>
                              {reg.registrationDate && (
                                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-indigo-700 font-semibold">
                                  Reg: {reg.registrationDate}
                                </span>
                              )}
                              {reg.birthdate && (
                                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-700">
                                  DOB: {formatBirthdateDisplay(reg.birthdate)}
                                </span>
                              )}
                              {reg.creativeGroup && (
                                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold capitalize">
                                  {reg.creativeGroup}
                                </span>
                              )}
                            </div>

                            {reg.creativeTags && reg.creativeTags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {reg.creativeTags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {reg.bio && (
                              <p className="mt-2 text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                                "{reg.bio}"
                              </p>
                            )}

                            <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" /> Submitted:{' '}
                              {new Date(reg.requestedAt).toLocaleDateString()} at{' '}
                              {new Date(reg.requestedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => setSelectedPendingReg(reg)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Review & Approve (+PKS)</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ACTIVE MEMBERS DIRECTORY VIEW */}
            {memberTabSubSection === 'active' && (
              <>
                {/* Multi-filter toolbar (Officers, Members, Project Heads, Batches & Divisions) */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 space-y-2.5">
                  {/* Row 1: Role Type chips + Batch selector + Quick Clear */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-0.5 shrink-0">
                        Role:
                      </span>
                      {[
                        { id: 'all', label: 'All', count: allUsers.length },
                        {
                          id: 'officers',
                          label: 'Officers',
                          count: allUsers.filter((u) => u.isOfficer || (u.officerRole && u.officerRole !== 'None')).length,
                        },
                        {
                          id: 'members',
                          label: 'Members',
                          count: allUsers.filter((u) => !u.isOfficer && (!u.officerRole || u.officerRole === 'None')).length,
                        },
                        {
                          id: 'project_heads',
                          label: 'Project Heads',
                          count: allUsers.filter((u) => u.projectHeadRoles && u.projectHeadRoles.length > 0).length,
                        },
                      ].map((item) => {
                        const isActive = memberRoleFilter === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setMemberRoleFilter(item.id as any)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
                              isActive
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <span>{item.label}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.1 rounded-full font-mono ${
                                isActive
                                  ? 'bg-white/25 text-white font-bold'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {item.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Batch selector dropdown, Missing Birthdate Filter & Quick Clear */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 ml-auto">
                      <button
                        type="button"
                        onClick={() => setMemberMissingBirthdateOnly((prev) => !prev)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
                          memberMissingBirthdateOnly
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="Show members who still need to add their birthdate"
                      >
                        <span>Missing DOB</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.1 rounded-full font-mono ${
                            memberMissingBirthdateOnly
                              ? 'bg-black/15 text-slate-950 font-bold'
                              : missingBirthdateCount > 0
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {missingBirthdateCount}
                        </span>
                      </button>

                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-xs">
                        <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                        <select
                          value={memberBatchFilter}
                          onChange={(e) => setMemberBatchFilter(e.target.value)}
                          className="text-[11px] font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer pr-1"
                        >
                          <option value="all">All Batches</option>
                          {availableBatches.map((batch) => (
                            <option key={batch} value={batch}>
                              {batch}
                            </option>
                          ))}
                        </select>
                      </div>

                      {(memberRoleFilter !== 'all' || memberGroupFilter !== 'all' || memberBatchFilter !== 'all' || memberMissingBirthdateOnly || memberSearch) && (
                        <button
                          type="button"
                          onClick={() => {
                            setMemberRoleFilter('all');
                            setMemberGroupFilter('all');
                            setMemberBatchFilter('all');
                            setMemberMissingBirthdateOnly(false);
                            setMemberSearch('');
                          }}
                          className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Reset all filters"
                        >
                          <X className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Creative Division filter */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 pt-1.5 border-t border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-0.5 shrink-0">
                      Division:
                    </span>
                    {(['all', 'photography', 'design', 'videography'] as const).map((group) => {
                      const count =
                        group === 'all'
                          ? allUsers.length
                          : allUsers.filter((u) => u.creativeGroup === group).length;
                      const isActive = memberGroupFilter === group;

                      return (
                        <button
                          key={group}
                          type="button"
                          onClick={() => setMemberGroupFilter(group)}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-medium capitalize transition-all cursor-pointer flex items-center gap-1 border ${
                            isActive
                              ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {group === 'photography' && <Camera className="w-2.5 h-2.5 text-indigo-400" />}
                          {group === 'design' && <Palette className="w-2.5 h-2.5 text-pink-400" />}
                          {group === 'videography' && <Video className="w-2.5 h-2.5 text-amber-400" />}
                          <span>{group === 'all' ? 'All Divisions' : group}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.1 rounded-full font-mono ${
                              isActive
                                ? 'bg-white/20 text-white font-bold'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

            {/* Empty state if no member matches */}
            {filteredMembers.length === 0 && (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">No members found</p>
                <p className="text-xs text-slate-500">
                  Try adjusting your search query, role, batch, or division filter.
                </p>
                {(memberSearch || memberGroupFilter !== 'all' || memberRoleFilter !== 'all' || memberBatchFilter !== 'all' || memberMissingBirthdateOnly) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMemberSearch('');
                      setMemberGroupFilter('all');
                      setMemberRoleFilter('all');
                      setMemberBatchFilter('all');
                      setMemberMissingBirthdateOnly(false);
                    }}
                    className="mt-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-indigo-600 text-xs rounded-lg transition-colors cursor-pointer border border-slate-200 font-semibold"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}

            {/* BLOCKS TECHNIQUE VIEW (Mobile Optimized: Seamless, fits screen width, zero horizontal scrolling) */}
            {filteredMembers.length > 0 && memberViewMode === 'blocks' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMembers.map((user) => {
                  const pks = getMemberPks(user.id);
                  const rank = getMemberRank(user.id);

                  return (
                    <div
                      key={user.id}
                      className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition-all shadow-xs flex flex-col justify-between gap-3 group"
                    >
                      {/* Identity Row */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={user.avatarUrl}
                            alt={user.nickname}
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{user.fullName}</span>
                              {user.batch && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                  {user.batch}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-slate-700 font-medium">@{user.username}</span>
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              <span>{user.gradeSection}</span>
                              {user.registrationDate && (
                                <>
                                  <span aria-hidden="true" className="text-slate-300">·</span>
                                  <span className="text-slate-400">Reg: {user.registrationDate}</span>
                                </>
                              )}
                              <span aria-hidden="true" className="text-slate-300">·</span>
                              {user.birthdate ? (
                                <span className="text-slate-500">DOB: {formatBirthdateDisplay(user.birthdate)}</span>
                              ) : (
                                <span className="text-amber-600 font-semibold">Missing DOB</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditingMember(user)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 transition-all cursor-pointer shrink-0"
                          title="Edit Member"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Structured Info Blocks */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                        {/* Creative Group & Dynamic Rank */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            {user.creativeGroup === 'photography' && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 inline-flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                <span>Photography</span>
                              </span>
                            )}
                            {user.creativeGroup === 'design' && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 inline-flex items-center gap-1">
                                <Palette className="w-3 h-3" />
                                <span>Design</span>
                              </span>
                            )}
                            {user.creativeGroup === 'videography' && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 inline-flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                <span>Videography</span>
                              </span>
                            )}
                            {!user.creativeGroup && (
                              <span className="text-[10px] text-slate-500 italic px-2 py-0.5 rounded bg-slate-50 border border-slate-200 inline-block">
                                General
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${rank.badgeColor} ${rank.borderColor}`}>
                              {rank.name}
                            </span>
                            <span className="text-[10px] font-mono text-indigo-600 font-bold">
                              {pks} PKS
                            </span>
                          </div>
                        </div>

                        {/* Concurrent Officer Post & Admin Access */}
                        <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold text-slate-500">Role:</span>
                            {user.officerRole && user.officerRole !== 'None' ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
                                  {user.officerRole}
                                </span>
                                {(() => {
                                  const sync = isOfficerRoleSyncedWithMLog(
                                    user,
                                    mLogEntries,
                                    systemSettings.academicYear || '2025–2026'
                                  );
                                  if (sync.isSynced) {
                                    return (
                                      <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1 font-semibold">
                                        <Check className="w-2.5 h-2.5" />
                                        <span>M.Log Synced</span>
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          syncOfficerLeadershipMLog({
                                            memberId: user.id,
                                            officerRole: user.officerRole as OfficerRole,
                                          });
                                        }}
                                        className="text-[9px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                                        title="Click to sync role to verified M.Log ledger and credit PKS"
                                      >
                                        <Zap className="w-2.5 h-2.5 text-amber-600" />
                                        <span>Sync M.Log</span>
                                      </button>
                                    );
                                  }
                                })()}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500">Regular Member</span>
                            )}
                          </div>

                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                              user.isOfficer
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {user.isOfficer ? 'Admin Access' : 'Standard'}
                          </span>
                        </div>

                        {/* Project Head Tags if any */}
                        {user.projectHeadRoles && user.projectHeadRoles.length > 0 && (
                          <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider">
                              Projects:
                            </span>
                            {user.projectHeadRoles.map((pr) => (
                              <span
                                key={pr}
                                className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700"
                              >
                                {pr}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Action */}
                      <button
                        type="button"
                        onClick={() => setEditingMember(user)}
                        className="w-full mt-1 py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit Member</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TABLE VIEW (Available when toggled) */}
            {filteredMembers.length > 0 && memberViewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Member</th>
                      <th className="py-2.5 px-3">Creative Group</th>
                      <th className="py-2.5 px-3">Dynamic Creative Rank</th>
                      <th className="py-2.5 px-3">Concurrent Officer Post</th>
                      <th className="py-2.5 px-3">Project Head Assignments</th>
                      <th className="py-2.5 px-3">Admin Access</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredMembers.map((user) => {
                      const pks = getMemberPks(user.id);
                      const rank = getMemberRank(user.id);

                      return (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          {/* Member Identity with Registration Date & Batch */}
                          <td className="py-3 px-3 flex items-center gap-2.5">
                            <img
                              src={user.avatarUrl}
                              alt={user.nickname}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                            />
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span>{user.fullName}</span>
                                {user.batch && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {user.batch}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span>@{user.username}</span>
                                <span aria-hidden="true">·</span>
                                <span>{user.gradeSection}</span>
                                {user.registrationDate && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-slate-500">Reg: {user.registrationDate}</span>
                                  </>
                                )}
                                <span aria-hidden="true">·</span>
                                {user.birthdate ? (
                                  <span className="text-slate-600">DOB: {formatBirthdateDisplay(user.birthdate)}</span>
                                ) : (
                                  <span className="text-amber-600 font-semibold">Missing DOB</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Creative Group */}
                          <td className="py-3 px-3">
                            {user.creativeGroup === 'photography' && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 inline-flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                <span>Photography</span>
                              </span>
                            )}
                            {user.creativeGroup === 'design' && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-pink-50 border border-pink-200 text-pink-700 inline-flex items-center gap-1">
                                <Palette className="w-3 h-3" />
                                <span>Design</span>
                              </span>
                            )}
                            {user.creativeGroup === 'videography' && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 inline-flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                <span>Videography</span>
                              </span>
                            )}
                            {!user.creativeGroup && (
                              <span className="text-slate-400 text-xs italic">General</span>
                            )}
                          </td>

                          {/* Dynamic Creative Rank */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col items-start gap-0.5">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${rank.badgeColor} ${rank.borderColor}`}>
                                {rank.name}
                              </span>
                              <span className="text-[11px] font-mono text-indigo-600 font-bold">
                                {pks} PKS (Verified M.Log)
                              </span>
                            </div>
                          </td>

                          {/* Concurrent Officer Post */}
                          <td className="py-3 px-3">
                            {user.officerRole && user.officerRole !== 'None' ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                                  {user.officerRole}
                                </span>
                                {(() => {
                                  const sync = isOfficerRoleSyncedWithMLog(
                                    user,
                                    mLogEntries,
                                    systemSettings.academicYear || '2025–2026'
                                  );
                                  if (sync.isSynced) {
                                    return (
                                      <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                                        <Check className="w-2.5 h-2.5" />
                                        <span>Synced</span>
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          syncOfficerLeadershipMLog({
                                            memberId: user.id,
                                            officerRole: user.officerRole as OfficerRole,
                                          });
                                        }}
                                        className="text-[9px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                                        title="Click to sync role to verified M.Log ledger and credit PKS"
                                      >
                                        <Zap className="w-2.5 h-2.5 text-amber-600" />
                                        <span>Sync</span>
                                      </button>
                                    );
                                  }
                                })()}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Regular Member</span>
                            )}
                          </td>

                          {/* Concurrent Project Head Roles */}
                          <td className="py-3 px-3">
                            {user.projectHeadRoles && user.projectHeadRoles.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {user.projectHeadRoles.map((pr) => (
                                  <span
                                    key={pr}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 truncate"
                                  >
                                    {pr}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>

                          {/* Admin Access Status */}
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                user.isOfficer
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {user.isOfficer ? 'Admin Access' : 'Standard'}
                            </span>
                          </td>

                          {/* Actions: Edit Member */}
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setEditingMember(user)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Edit member profile, creative group, or leadership roles"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              <span>Edit Member</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
              </>
            )}
          </section>
        );
      })()}

      {/* SECTION 6: SuperAdmin Global Settings */}
      {adminSection === 'superadmin' && currentUser.role === 'SuperAdmin' && (
        <section className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <span>SuperAdmin Global System Configuration</span>
              </h2>
              <p className="text-xs text-slate-500">
                Exclusively accessible to SuperAdmin. Updates global branding, logos, and organizational metadata.
              </p>
            </div>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
              SuperAdmin Exclusive
            </span>
          </div>

          <form onSubmit={handleSaveSuperAdmin} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Web App Name
                </label>
                <input
                  type="text"
                  required
                  value={appNameInput}
                  onChange={(e) => setAppNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School / Institution
                </label>
                <input
                  type="text"
                  required
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization Tagline
                </label>
                <input
                  type="text"
                  value={taglineInput}
                  onChange={(e) => setTaglineInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={academicYearInput}
                  onChange={(e) => setAcademicYearInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* App Logo Control */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Official FPC Logo / Emblem
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-xs">
                  <img src={logoInput} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={logoInput}
                    onChange={(e) => setLogoInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Image URL or generated asset path..."
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoFileRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Upload className="w-3 h-3 text-slate-500" />
                      <span>Upload New Image</span>
                    </button>
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Announcement Banner */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Broadcast Announcement Banner
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bannerActiveInput}
                    onChange={(e) => setBannerActiveInput(e.target.checked)}
                    className="w-3.5 h-3.5 accent-indigo-600 rounded"
                  />
                  <span>Show Banner</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={bannerInput}
                onChange={(e) => setBannerInput(e.target.value)}
                placeholder="Message displayed across all member screens..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              Save SuperAdmin System Settings
            </button>
          </form>
        </section>
      )}

      {/* EDIT MEMBER MODAL (Admins and SuperAdmins can update all member profile details, creative group, and dual roles) */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}

      {/* EDIT M.LOG ENTRY MODAL */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>Adjust M.Log Entry</span>
                </h3>
                <div className="text-xs text-slate-500">
                  Editing record for <strong className="text-slate-800">{editingEntry.memberName}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event / Title</label>
                <input
                  type="text"
                  value={editEntryEventTitle}
                  onChange={(e) => setEditEntryEventTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Assigned 4-Pillar Codes
                  </label>
                  <span className="font-mono text-indigo-600 font-bold">
                    +{calculatePksFromCodes(editEntryCodes).total} PKS
                  </span>
                </div>
                <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 max-h-40 overflow-y-auto">
                  {(['C', 'P', 'B', 'R', 'S'] as const).map((cat) => (
                    <div key={cat} className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-bold w-12">{cat}-Codes:</span>
                      {PILLAR_CODES.filter((c) => c.category === cat).map((c) => {
                        const isSelected = editEntryCodes.includes(c.code);
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => toggleEditEntryCode(c.code)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold cursor-pointer border transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                            }`}
                          >
                            {c.code} (+{c.points})
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Verification Status</label>
                <select
                  value={editEntryStatus}
                  onChange={(e) =>
                    setEditEntryStatus(e.target.value as 'verified' | 'pending' | 'rejected')
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="verified">Verified (Points Count toward Rank)</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected (0 Points)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={editEntryRemarks}
                  onChange={(e) => setEditEntryRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditEntry}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors active:scale-95 cursor-pointer"
              >
                Apply Live Adjustments & Recalculate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Lightbox Modal */}
      {inspectProofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setInspectProofUrl(null)}
        >
          <div
            className="relative max-w-3xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isDisplayableImageUrl(inspectProofUrl) ? (
              <img
                src={inspectProofUrl}
                alt="Verification Proof"
                className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl space-y-3 text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  External Verification Link
                </div>
                <div className="text-sm font-mono font-semibold text-slate-800 break-all bg-slate-50 border border-slate-200 rounded-xl p-3">
                  {getLinkDomainLabel(inspectProofUrl)}
                </div>
                {normalizeSafeHttpUrl(inspectProofUrl) && (
                  <a
                    href={normalizeSafeHttpUrl(inspectProofUrl)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Open Verification Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dedicated Separate Member Account Creation Modal */}
      {isCreateMemberModalOpen && (
        <CreateMemberModal onClose={() => setIsCreateMemberModalOpen(false)} />
      )}

      {/* Edit Event / Contest Modal */}
      {editingEventAdmin && (
        <EditEventModal
          event={editingEventAdmin}
          onClose={() => setEditingEventAdmin(null)}
          onOpenCredits={() => {
            const ev = editingEventAdmin;
            setEditingEventAdmin(null);
            setCreditingEventAdmin(ev);
          }}
        />
      )}

      {/* Participant Credits Modal */}
      {creditingEventAdmin && (
        <ParticipantCreditsModal
          event={creditingEventAdmin}
          onClose={() => setCreditingEventAdmin(null)}
          onOpenEditEvent={() => {
            const ev = creditingEventAdmin;
            setCreditingEventAdmin(null);
            setEditingEventAdmin(ev);
          }}
        />
      )}

      {/* Review & Approve Registration Modal */}
      {selectedPendingReg && (
        <ApproveMemberModal
          registration={selectedPendingReg}
          onClose={() => setSelectedPendingReg(null)}
        />
      )}
    </div>
  );
};

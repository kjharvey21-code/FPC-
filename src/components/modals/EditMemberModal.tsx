import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, OfficerRole, CreativeGroup } from '../../types';
import { compressImageFile } from '../../utils/imageUtils';
import {
  X,
  Edit3,
  Camera,
  Palette,
  Video,
  Calendar,
  Layers,
  Sparkles,
  Shield,
  Briefcase,
  Check,
  Eye,
  EyeOff,
  Upload,
  UserCheck,
  Award,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { getLeadershipPksCodeForRole, isOfficerRoleSyncedWithMLog } from '../../utils/leadershipSync';
import { getTodayIsoDate, isValidBirthdate } from '../../utils/dateUtils';

interface EditMemberModalProps {
  member: User;
  onClose: () => void;
}

const OFFICER_ROLES: OfficerRole[] = [
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

const BATCH_PRESETS = ['Batch Uno', 'Batch Dos', 'Batch Tres', 'Batch Sony'];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
];

export const EditMemberModal: React.FC<EditMemberModalProps> = ({ member, onClose }) => {
  const {
    updateMemberProfile,
    deleteMember,
    currentUser,
    getMemberPks,
    getMemberRank,
    showToast,
    syncOfficerLeadershipMLog,
    systemSettings,
    mLogEntries,
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  const rank = getMemberRank(member.id);
  const pks = getMemberPks(member.id);

  const [syncWithMLog, setSyncWithMLog] = useState(true);
  const [stewardshipAcademicYear, setStewardshipAcademicYear] = useState(
    systemSettings?.academicYear || '2025–2026'
  );
  const [stewardshipRemarks, setStewardshipRemarks] = useState(
    `Official appointment as FPC ${member.officerRole || 'Officer'} for Academic Year ${systemSettings?.academicYear || '2025–2026'}.`
  );

  // Form States initialized with current member data
  const [fullName, setFullName] = useState(member.fullName || '');
  const [nickname, setNickname] = useState(member.nickname || '');
  const [username, setUsername] = useState(member.username || '');
  const [password, setPassword] = useState(member.password || 'fpc2026');
  const [showPassword, setShowPassword] = useState(false);
  const [gradeSection, setGradeSection] = useState(member.gradeSection || '');
  const [birthdate, setBirthdate] = useState(member.birthdate || '');
  const [registrationDate, setRegistrationDate] = useState(
    member.registrationDate || getTodayIsoDate()
  );
  const [batch, setBatch] = useState(member.batch || 'Batch 2026');
  const [creativeGroup, setCreativeGroup] = useState<CreativeGroup | undefined>(
    (member.creativeGroup as CreativeGroup) || undefined
  );
  const [officerRole, setOfficerRole] = useState<OfficerRole>(member.officerRole || 'None');
  const [projectHeadRoles, setProjectHeadRoles] = useState<string[]>(
    member.projectHeadRoles || []
  );
  const [newProjectTag, setNewProjectTag] = useState('');
  const [isOfficer, setIsOfficer] = useState<boolean>(!!member.isOfficer);
  const [systemRole, setSystemRole] = useState<string>(member.role || 'Member');
  const [avatarUrl, setAvatarUrl] = useState(member.avatarUrl || '');
  const [bio, setBio] = useState(member.bio || '');
  const [creativeTags, setCreativeTags] = useState(
    (member.creativeTags || []).join(', ')
  );
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'roles' | 'account'>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add project tag
  const handleAddProjectTag = () => {
    const trimmed = newProjectTag.trim();
    if (trimmed && !projectHeadRoles.includes(trimmed)) {
      setProjectHeadRoles([...projectHeadRoles, trimmed]);
      setNewProjectTag('');
    }
  };

  const handleRemoveProjectTag = (tagToRemove: string) => {
    setProjectHeadRoles(projectHeadRoles.filter((t) => t !== tagToRemove));
  };

  // Avatar upload
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 400, 400, 0.78);
      setAvatarUrl(compressed);
      showToast('Avatar compressed and ready to save.', 'info');
    } catch {
      showToast('Could not process avatar image.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      showToast('Full Name and Username are required.', 'error');
      return;
    }

    if (birthdate.trim() && !isValidBirthdate(birthdate.trim())) {
      showToast('Please enter a valid birthdate (cannot be in the future).', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedTags = creativeTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // Determine appropriate primary role and officer status
      const hasElevatedOfficer = officerRole !== 'None';
      const hasProjectHead = projectHeadRoles.length > 0;
      const officerStatus = isOfficer || hasElevatedOfficer || hasProjectHead || systemRole === 'SuperAdmin';

      let effectiveRole = systemRole;
      if (!isSuperAdmin) {
        if (hasElevatedOfficer) {
          effectiveRole = officerRole;
        } else if (hasProjectHead) {
          effectiveRole = `Project Head (${projectHeadRoles[0]})`;
        } else if (officerStatus) {
          effectiveRole = 'Admin';
        } else {
          effectiveRole = 'Member';
        }
      }

      const updates: Partial<User> = {
        fullName: fullName.trim(),
        nickname: nickname.trim() || fullName.trim().split(' ')[0],
        username: username.trim().toLowerCase(),
        password: password.trim(),
        gradeSection: gradeSection.trim(),
        birthdate: birthdate.trim(),
        registrationDate,
        batch: batch.trim(),
        creativeGroup: creativeGroup || 'photography',
        officerRole,
        projectHeadRoles,
        isOfficer: officerStatus,
        role: effectiveRole,
        bio: bio.trim(),
        creativeTags: parsedTags,
        avatarUrl: avatarUrl.trim() || member.avatarUrl,
      };

      await updateMemberProfile(member.id, updates);

      // Automatically sync leadership role with verified M.Log entry if requested
      if (officerRole !== 'None' && syncWithMLog) {
        await syncOfficerLeadershipMLog({
          memberId: member.id,
          officerRole,
          academicYear: stewardshipAcademicYear,
          remarks: stewardshipRemarks,
          projectsLed: projectHeadRoles,
        });
      }

      showToast(`Member profile for ${updates.fullName} updated successfully!`, 'success');
      onClose();
    } catch (err) {
      console.error('Failed to update member:', err);
      showToast('Error saving member update. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteMember = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteMember(member.id);
      if (success) {
        onClose();
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={avatarUrl || member.avatarUrl}
                alt={nickname || fullName}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500/40 shadow-md"
              />
              {creativeGroup && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px]">
                  {creativeGroup === 'photography' && '📷'}
                  {creativeGroup === 'design' && '🎨'}
                  {creativeGroup === 'videography' && '🎥'}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Edit Member Profile</span>
                </h3>
                <span className="text-xs text-amber-400 font-semibold">
                  ({member.fullName})
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                <span>@{member.username}</span>
                <span>•</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${rank.badgeColor}`}>
                  {rank.name} ({pks} PKS)
                </span>
                {member.officerRole && member.officerRole !== 'None' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                    {member.officerRole}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'profile'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Profile & Group</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('roles')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'roles'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Dual Roles & Leadership</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('account')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'account'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Account & Access</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="edit-member-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 pr-1 space-y-4 text-xs">
          {/* TAB 1: Profile & Group */}
          {activeSubTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Creative Group Selection (Mandatory highlight) */}
              <div>
                <label className="block font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Creative Group Division</span>
                  <span className="text-[10px] text-slate-500 font-normal">(Primary Discipline)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreativeGroup('photography')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      creativeGroup === 'photography'
                        ? 'bg-sky-500/15 border-sky-400 text-white shadow-md shadow-sky-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Camera className={`w-4 h-4 ${creativeGroup === 'photography' ? 'text-sky-400' : 'text-slate-500'}`} />
                      {creativeGroup === 'photography' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">Photography</div>
                      <div className="text-[10px] text-slate-400">Stills, Coverage</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreativeGroup('design')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      creativeGroup === 'design'
                        ? 'bg-pink-500/15 border-pink-400 text-white shadow-md shadow-pink-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Palette className={`w-4 h-4 ${creativeGroup === 'design' ? 'text-pink-400' : 'text-slate-500'}`} />
                      {creativeGroup === 'design' && <Check className="w-3.5 h-3.5 text-pink-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">Graphic Design</div>
                      <div className="text-[10px] text-slate-400">Posters, Branding</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreativeGroup('videography')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      creativeGroup === 'videography'
                        ? 'bg-purple-500/15 border-purple-400 text-white shadow-md shadow-purple-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Video className={`w-4 h-4 ${creativeGroup === 'videography' ? 'text-purple-400' : 'text-slate-500'}`} />
                      {creativeGroup === 'videography' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">Videography</div>
                      <div className="text-[10px] text-slate-400">Reels, Docu, BTS</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Registration Date & Batch (Key Fields) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Registration Date</span>
                  </label>
                  <input
                    type="date"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Batch Cohort</span>
                  </label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="e.g. Batch Uno"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex items-center gap-1 mt-1.5">
                    {BATCH_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBatch(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono transition-colors cursor-pointer ${
                          batch === preset
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Name & Nickname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Juan De La Cruz"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Callsign / Nickname
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g. Juan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Grade & Section and Birthdate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Grade Level & Section
                  </label>
                  <input
                    type="text"
                    value={gradeSection}
                    onChange={(e) => setGradeSection(e.target.value)}
                    placeholder="e.g. Grade 11 STEM-A or 12-ICT"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Birthdate</span>
                    </span>
                    {!birthdate && (
                      <span className="text-[10px] text-amber-400 font-medium">Missing</span>
                    )}
                  </label>
                  <input
                    type="date"
                    min="1950-01-01"
                    max={getTodayIsoDate()}
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono tabular-nums focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Member Bio / Profile Statement
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short creative bio or description..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Creative Specialties / Tags
                </label>
                <input
                  type="text"
                  value={creativeTags}
                  onChange={(e) => setCreativeTags(e.target.value)}
                  placeholder="e.g. Portraiture, Sports Stills, Lightroom, DaVinci Resolve"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Avatar Chooser / Upload */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Avatar Photo
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://... (image URL)"
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFile}
                      className="hidden"
                    />
                  </label>
                </div>
                {/* Preset Avatars */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">
                    Presets:
                  </span>
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-7 h-7 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        avatarUrl === url
                          ? 'border-amber-400 scale-105 shadow-sm shadow-amber-400/30'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Danger Zone: Delete Member */}
              <div className="pt-2 border-t border-slate-800">
                <div className="p-3.5 rounded-2xl bg-rose-950/25 border border-rose-900/50 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Delete Member</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Permanently remove {member.fullName} from the roster and revoke access.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isSubmitting || isDeleting}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Dual Roles & Leadership */}
          {activeSubTab === 'roles' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Dual Status Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Dual Status Model Protected</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Club officers and project heads retain their full dynamic creative rank identity (<strong>{rank.name}</strong> · {pks} PKS) earned through verified contributions in the 4-Pillar M.Log ledger.
                </p>
              </div>

              {/* Concurrent Club Officer Post */}
              <div>
                <label className="block font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Concurrent Club Officer Appointment</span>
                </label>
                <select
                  value={officerRole}
                  onChange={(e) => {
                    const nextRole = e.target.value as OfficerRole;
                    setOfficerRole(nextRole);
                    if (nextRole !== 'None') {
                      setIsOfficer(true);
                      setStewardshipRemarks(
                        `Official appointment as FPC ${nextRole} for Academic Year ${stewardshipAcademicYear}.`
                      );
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  {OFFICER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role === 'None' ? 'None (Standard Member Identity)' : role}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Select an official executive post if this member serves on the Executive Board.
                </span>

                {/* Automatic M.Log Synchronization Card */}
                {officerRole !== 'None' && (() => {
                  const pksConfig = getLeadershipPksCodeForRole(officerRole);
                  const syncStatus = isOfficerRoleSyncedWithMLog(member, mLogEntries, stewardshipAcademicYear);

                  return (
                    <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/30 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>M.Log Leadership Ledger Alignment</span>
                              {syncStatus.isSynced ? (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                                  ✓ Aligned (+{syncStatus.matchedEntry?.totalPoints} PKS)
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                                  Sync Required (+{pksConfig?.points} PKS · {pksConfig?.code})
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                              Designating an officer automatically records a verified M.Log entry awarding official PKS leadership points.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                        <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={syncWithMLog}
                            onChange={(e) => setSyncWithMLog(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                          />
                          <span className="font-semibold text-amber-300">
                            Synchronize {officerRole} to verified M.Log ledger (+{pksConfig?.points} PKS · {pksConfig?.code})
                          </span>
                        </label>

                        {syncWithMLog && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                                Academic Year
                              </label>
                              <input
                                type="text"
                                value={stewardshipAcademicYear}
                                onChange={(e) => setStewardshipAcademicYear(e.target.value)}
                                placeholder="e.g. 2025–2026"
                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-mono"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                                Stewardship Notes / Citation
                              </label>
                              <input
                                type="text"
                                value={stewardshipRemarks}
                                onChange={(e) => setStewardshipRemarks(e.target.value)}
                                placeholder="Official election citation..."
                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Concurrent Project Head Assignments */}
              <div>
                <label className="block font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  <span>Concurrent Project Head Roles</span>
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newProjectTag}
                    onChange={(e) => setNewProjectTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProjectTag();
                      }
                    }}
                    placeholder="e.g. Intramurals Courtside, Graduation Docu, Photo Exhibit..."
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddProjectTag}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    Add Assignment
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-10 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  {projectHeadRoles.length === 0 ? (
                    <span className="text-slate-500 italic text-xs">
                      No concurrent project head roles assigned.
                    </span>
                  ) : (
                    projectHeadRoles.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-medium flex items-center gap-1.5"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProjectTag(tag)}
                          className="hover:text-rose-400 cursor-pointer"
                          title="Remove project"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Badging & Title Preview on User Profile:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${rank.badgeColor} ${rank.borderColor}`}>
                    {rank.name} ({pks} PKS)
                  </span>
                  {officerRole !== 'None' && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Officer: {officerRole}
                    </span>
                  )}
                  {projectHeadRoles.map((pr) => (
                    <span
                      key={pr}
                      className="text-xs font-medium px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300"
                    >
                      Project Head: {pr}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Account & Access */}
          {activeSubTab === 'account' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    System Username <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="e.g. kent"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Used for member sign-in and identification.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Account Password (Reset)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-3 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Admins can reset forgotten passwords anytime.
                  </span>
                </div>
              </div>

              {/* Admin Privileges Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Admin Management Access</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Enables verification of M.Log submissions, publishing events, and auditing records.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOfficer}
                      onChange={(e) => setIsOfficer(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              {/* SuperAdmin Role Assignment (Only visible/editable for SuperAdmin) */}
              {isSuperAdmin && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>SuperAdmin Role Control</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    As SuperAdmin, you can elevate or alter the primary system permission level:
                  </p>
                  <select
                    value={systemRole}
                    onChange={(e) => setSystemRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="Member">Member (Standard Access)</option>
                    <option value="Admin">Admin (Officer Hub Access)</option>
                    <option value="SuperAdmin">SuperAdmin (Master Infrastructure Control)</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Modal Footer with Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 shrink-0 gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting || isDeleting}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              title="Delete member account"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete Member</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>

          <button
            type="submit"
            form="edit-member-form"
            disabled={isSubmitting || isDeleting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isSubmitting ? 'Saving Changes...' : 'Save Member Updates'}</span>
          </button>
        </div>

        {/* Delete Member Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-rose-800/80 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Delete Member Account?</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Are you sure you want to permanently delete <strong className="text-white">{member.fullName}</strong> (<span className="text-amber-400">@{member.username}</span>)? This removes their account, access credentials, and profile from FPC Hub. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Keep Member
                </button>
                <button
                  type="button"
                  onClick={handleDeleteMember}
                  disabled={isDeleting}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Member'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OfficerRole, CreativeGroup } from '../../types';
import {
  X,
  UserPlus,
  Camera,
  Palette,
  Video,
  Calendar,
  Layers,
  Sparkles,
  Shield,
  Briefcase,
  Check,
} from 'lucide-react';
import { getTodayIsoDate, isValidBirthdate } from '../../utils/dateUtils';

interface CreateMemberModalProps {
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
const PKS_PRESETS = [0, 25, 50, 75, 100];

export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({ onClose }) => {
  const { addMember } = useApp();

  // Required New Fields
  const [registrationDate, setRegistrationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [batch, setBatch] = useState('Batch 2026');
  const [creativeGroup, setCreativeGroup] = useState<CreativeGroup>('photography');

  // Standard Member Info
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('fpc2026');
  const [gradeSection, setGradeSection] = useState('Grade 11 ICT-A');
  const [birthdate, setBirthdate] = useState('');
  const [officerRole, setOfficerRole] = useState<OfficerRole>('None');
  const [projectHeadInput, setProjectHeadInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [initialPks, setInitialPks] = useState<number>(0);
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate username & nickname when full name changes (if untouched)
  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (!nickname) {
      const first = val.trim().split(' ')[0];
      if (first) setNickname(first);
    }
    if (!username) {
      const generated = val
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      if (generated) setUsername(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) return;
    if (birthdate.trim() && !isValidBirthdate(birthdate.trim())) return;

    setIsSubmitting(true);
    try {
      const projectHeadList = projectHeadInput
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const creativeTagsList = tagsInput.trim()
        ? tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : creativeGroup === 'photography'
        ? ['Photographer', 'Field Stills']
        : creativeGroup === 'design'
        ? ['Graphic Designer', 'Poster Layout']
        : ['Videographer', 'Reels Editor'];

      const isOff = officerRole !== 'None' || projectHeadList.length > 0;

      await addMember(
        {
          username: username.trim().toLowerCase(),
          password: password || 'fpc2026',
          fullName: fullName.trim(),
          nickname: nickname.trim() || fullName.trim().split(' ')[0],
          avatarUrl:
            creativeGroup === 'photography'
              ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80'
              : creativeGroup === 'design'
              ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
          role: officerRole !== 'None' ? officerRole : 'Member',
          officerRole,
          projectHeadRoles: projectHeadList,
          isOfficer: isOff,
          creativeTags: creativeTagsList,
          gradeSection: gradeSection.trim() || 'Grade 11 ICT-A',
          joinedDate: new Date().toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          }),
          registrationDate,
          ...(birthdate.trim() ? { birthdate: birthdate.trim() } : {}),
          batch: batch.trim(),
          creativeGroup,
          bio: bio.trim() || `Active creative contributor in FPC ${creativeGroup} division.`,
        },
        initialPks
      );

      onClose();
    } catch (err) {
      console.error('Failed to create member:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Admin Action
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-medium border border-slate-200/60">
                  Dual Status Ready
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Create Member Account
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form id="create-member-form" onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-white">
          {/* Creative Group Assignment (photography, design, videography) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Creative Group Assignment <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Photography */}
              <button
                type="button"
                onClick={() => setCreativeGroup('photography')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                  creativeGroup === 'photography'
                    ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 text-slate-900 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    creativeGroup === 'photography'
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'bg-slate-100 border border-slate-200 text-slate-500'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>Photography</span>
                    {creativeGroup === 'photography' && (
                      <Check className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Stills, portraits & sports action
                  </p>
                </div>
              </button>

              {/* Design */}
              <button
                type="button"
                onClick={() => setCreativeGroup('design')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                  creativeGroup === 'design'
                    ? 'bg-pink-50/70 border-pink-300 ring-2 ring-pink-400/20 text-slate-900 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    creativeGroup === 'design'
                      ? 'bg-pink-500 text-white font-bold shadow-xs'
                      : 'bg-slate-100 border border-slate-200 text-slate-500'
                  }`}
                >
                  <Palette className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>Graphic Design</span>
                    {creativeGroup === 'design' && (
                      <Check className="w-4 h-4 text-pink-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Posters, layout & digital art
                  </p>
                </div>
              </button>

              {/* Videography */}
              <button
                type="button"
                onClick={() => setCreativeGroup('videography')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                  creativeGroup === 'videography'
                    ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/20 text-slate-900 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    creativeGroup === 'videography'
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 border border-slate-200 text-slate-500'
                  }`}
                >
                  <Video className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>Videography</span>
                    {creativeGroup === 'videography' && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Reels, documentary & broadcasts
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Registration Date & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Registration Date</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Official induction date into FPC.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Batch</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="e.g. Batch Uno"
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500">Quick:</span>
                {BATCH_PRESETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBatch(b)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-colors cursor-pointer ${
                      batch === b
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Member Name and Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => handleFullNameChange(e.target.value)}
                placeholder="e.g. Maria Clara Santos"
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nickname / Display Name
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Maria"
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="e.g. maria_santos"
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Password
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grade & Section
              </label>
              <input
                type="text"
                value={gradeSection}
                onChange={(e) => setGradeSection(e.target.value)}
                placeholder="e.g. Grade 11 ICT-A"
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Birthdate</span>
              </label>
              <input
                type="date"
                min="1950-01-01"
                max={getTodayIsoDate()}
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Skills & Creative Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Action Stills, Color Grader, Prime Lens"
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          {/* Dual Roles Configuration */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Dual Status Leadership Roles (Concurrent)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Concurrent Officer Post
                </label>
                <select
                  value={officerRole}
                  onChange={(e) => setOfficerRole(e.target.value as OfficerRole)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                  {OFFICER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r === 'None' ? 'None (Standard Member Identity)' : r}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Electing an officer role grants admin hub access.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-purple-600" />
                  <span>Project Head Assignments</span>
                </label>
                <input
                  type="text"
                  value={projectHeadInput}
                  onChange={(e) => setProjectHeadInput(e.target.value)}
                  placeholder="e.g. Intramurals Courtside, Foundation Day"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Comma-separated production project titles.
                </span>
              </div>
            </div>
          </div>

          {/* Initial PKS Baseline Credit */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Initial Starting Baseline PKS</span>
              </label>
              <span className="text-xs font-bold font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                +{initialPks} PKS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={500}
                value={initialPks}
                onChange={(e) => setInitialPks(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {PKS_PRESETS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setInitialPks(val)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-mono font-semibold transition-all cursor-pointer ${
                      initialPks === val
                        ? 'bg-amber-500 text-white font-bold shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    {val === 0 ? '0 (New Applicant)' : `+${val} PKS`}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              Allocates initial verified onboarding credits to the member&rsquo;s 4-pillar ledger upon registration.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Bio / Notes
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Senior sports photojournalist specializing in fast action basketball courtside captures..."
              className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            />
          </div>
        </form>

        {/* Pinned Sticky Footer Actions (Natural Thumb Zone) */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white shrink-0 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-member-form"
            disabled={isSubmitting || !fullName.trim() || !username.trim()}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>{isSubmitting ? 'Creating...' : 'Create Member Account'}</span>
          </button>
        </div>
      </div>
    </div>

  );
};

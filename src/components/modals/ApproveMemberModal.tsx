import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PendingRegistration, OfficerRole, UserRole } from '../../types';
import { getRankTierForPks } from '../../data/pksFramework';
import {
  X,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  Shield,
  Layers,
  UserCheck,
  Calendar,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { formatBirthdateDisplay } from '../../utils/dateUtils';

interface ApproveMemberModalProps {
  registration: PendingRegistration;
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
];

const PKS_PRESETS = [0, 25, 50, 80, 100, 150];

export const ApproveMemberModal: React.FC<ApproveMemberModalProps> = ({
  registration,
  onClose,
}) => {
  const { approveRegistration, rejectRegistration } = useApp();

  const [startingPks, setStartingPks] = useState<number>(50);
  const [assignedRole, setAssignedRole] = useState<UserRole>('Member');
  const [isOfficer, setIsOfficer] = useState<boolean>(false);
  const [officerRole, setOfficerRole] = useState<OfficerRole>('None');
  const [declineReason, setDeclineReason] = useState<string>('');
  const [showDeclineConfirm, setShowDeclineConfirm] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const previewRank = getRankTierForPks(startingPks);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const success = await approveRegistration(
        registration.id,
        startingPks,
        assignedRole,
        isOfficer,
        isOfficer ? officerRole : 'None'
      );
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      const success = await rejectRegistration(registration.id, declineReason);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative px-5 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Review & Approve Registration
              </h2>
              <p className="text-xs text-slate-500">
                Grant membership standing and assign baseline PKS credit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 bg-white">
          {/* Applicant Info Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3.5">
            <img
              src={
                registration.avatarUrl ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${registration.username}`
              }
              alt={registration.fullName}
              className="w-12 h-12 rounded-xl bg-white border border-slate-200 object-cover shrink-0 shadow-2xs"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {registration.fullName}
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  Pending Review
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">@{registration.username}</p>

              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-700">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
                  {registration.gradeSection || 'Grade 11'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium text-indigo-600">
                  {registration.batch || 'Batch Tres'}
                </span>
                {registration.registrationDate && (
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[10px] text-slate-600">
                    Reg Date: {registration.registrationDate}
                  </span>
                )}
                {registration.birthdate && (
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[10px] text-slate-700">
                    Birthdate: {formatBirthdateDisplay(registration.birthdate)}
                  </span>
                )}
                {registration.creativeGroup && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 capitalize font-medium">
                    {registration.creativeGroup}
                  </span>
                )}
              </div>

              {registration.creativeTags && registration.creativeTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {registration.creativeTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {registration.bio && (
                <p className="mt-2 text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                  &ldquo;{registration.bio}&rdquo;
                </p>
              )}

              <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3" /> Requested on:{' '}
                {new Date(registration.requestedAt).toLocaleDateString()} at{' '}
                {new Date(registration.requestedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {!showDeclineConfirm ? (
            <>
              {/* Baseline PKS Assignment */}
              <div className="p-4 bg-indigo-50/40 border border-indigo-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Starting Baseline PKS Credit
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Audited baseline log
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Directly establish this member's starting points balance. This generates an official
                  verified M.Log record with balanced pillar distribution.
                </p>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {PKS_PRESETS.map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setStartingPks(pts)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-mono font-semibold transition-all cursor-pointer ${
                        startingPks === pts
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      +{pts} PKS
                    </button>
                  ))}
                </div>

                {/* Custom Number Input & Dynamic Rank Tier Preview */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Custom Points
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="2000"
                        value={startingPks}
                        onChange={(e) => setStartingPks(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono">
                        PKS
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Resulting Starting Rank
                    </label>
                    <div className="flex items-center gap-2 h-8 px-2.5 bg-white border border-slate-300 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {previewRank.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pillar Breakdown preview */}
                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between font-mono font-medium">
                  <span>C: +{Math.round(startingPks * 0.25)}</span>
                  <span>P: +{Math.round(startingPks * 0.35)}</span>
                  <span>B: +{Math.round(startingPks * 0.2)}</span>
                  <span>R: +{Math.round(startingPks * 0.1)}</span>
                  <span>S: +{Math.round(startingPks * 0.1)}</span>
                </div>
              </div>

              {/* Officer Appointment & Leadership Assignment */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Officer Appointment & Permissions
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Rank auto-set by PKS
                  </span>
                </div>

                {/* Auto PKS Rank Status */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span className="text-slate-700 font-medium">FPC Creative Standing:</span>
                  <div className="flex items-center gap-1.5 font-bold text-indigo-600">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{previewRank.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono font-normal">
                      ({startingPks} PKS)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2.5 h-auto py-2 px-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={isOfficer}
                      onChange={(e) => {
                        setIsOfficer(e.target.checked);
                        if (!e.target.checked) setOfficerRole('None');
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-slate-800">Appoint as Club Officer</span>
                      <p className="text-[10px] text-slate-500">Grants officer portal access and administrative privileges</p>
                    </div>
                  </label>
                </div>

                {isOfficer && (
                  <div className="pt-1 animate-in fade-in duration-100 space-y-1">
                    <label className="text-[11px] font-semibold text-indigo-700 block">
                      Executive Officer Role
                    </label>
                    <select
                      value={officerRole}
                      onChange={(e) => setOfficerRole(e.target.value as OfficerRole)}
                      className="w-full bg-white border border-indigo-300 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {OFFICER_ROLES.filter((r) => r !== 'None').map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Decline Reason Input */
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold">Decline Registration Application</span>
              </div>
              <p className="text-xs text-slate-600">
                Are you sure you want to decline {registration.fullName}'s application? Please provide an optional reason.
              </p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason for declining (e.g. Duplicate application, non-club member, invalid details)..."
                rows={3}
                className="w-full bg-white border border-rose-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-400 placeholder:text-slate-400"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeclineConfirm(false)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleReject}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
                >
                  {isSubmitting ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Pinned Sticky Footer Actions */}
        {!showDeclineConfirm && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowDeclineConfirm(true)}
              className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            >
              Decline Application
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApprove}
                className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isSubmitting ? (
                  'Activating...'
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Approve & Activate (+{startingPks} PKS)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

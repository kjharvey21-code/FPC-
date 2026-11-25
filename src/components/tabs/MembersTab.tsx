import React, { useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { Search, X, ArrowUpRight, Users, RotateCcw } from 'lucide-react';
import { MemberProfileModal } from '../modals/MemberProfileModal';

type DisciplineFilter = 'all' | 'photography' | 'videography' | 'design';
type RoleFilter = 'all' | 'officers' | 'heads' | 'members';

function getDisplayRole(member: User): string {
  if (member.officerRole && member.officerRole !== 'None') {
    return member.officerRole;
  }
  if (member.projectHeadRoles && member.projectHeadRoles.length > 0) {
    return `Project Head (${member.projectHeadRoles[0]})`;
  }
  return member.role || 'Member';
}

function getCreativeGroupLabel(group?: string): string {
  if (!group) return '';
  const lower = group.toLowerCase();
  if (lower.includes('photo')) return 'Photography';
  if (lower.includes('video')) return 'Videography';
  if (lower.includes('design')) return 'Design';
  return group;
}

function matchesDiscipline(member: User, filter: DisciplineFilter): boolean {
  if (filter === 'all') return true;
  const group = (member.creativeGroup || '').toLowerCase();
  const role = (member.role || '').toLowerCase();
  const tags = (member.creativeTags || []).map((t) => t.toLowerCase());

  if (filter === 'photography') {
    return (
      group.includes('photo') ||
      role.includes('photo') ||
      tags.some((t) => t.includes('photo') || t.includes('camera') || t.includes('portrait'))
    );
  }
  if (filter === 'videography') {
    return (
      group.includes('video') ||
      role.includes('video') ||
      tags.some((t) => t.includes('video') || t.includes('film') || t.includes('edit') || t.includes('drone'))
    );
  }
  if (filter === 'design') {
    return (
      group.includes('design') ||
      role.includes('design') ||
      tags.some((t) => t.includes('design') || t.includes('art') || t.includes('graphics') || t.includes('layout'))
    );
  }
  return true;
}

function matchesRoleFilter(member: User, filter: RoleFilter): boolean {
  if (filter === 'all') return true;
  const hasOfficerPost = Boolean(
    member.isOfficer || (member.officerRole && member.officerRole !== 'None') || member.role === 'SuperAdmin'
  );
  const hasProjectHead = Boolean(member.projectHeadRoles && member.projectHeadRoles.length > 0);

  if (filter === 'officers') return hasOfficerPost;
  if (filter === 'heads') return hasProjectHead;
  if (filter === 'members') return !hasOfficerPost && !hasProjectHead;
  return true;
}

export const MembersTab: React.FC = () => {
  const {
    allUsers,
    currentUser,
    getMemberPks,
    getMemberRank,
    feedPosts,
    contestSubmissions,
  } = useApp();

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<DisciplineFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [brokenAvatarIds, setBrokenAvatarIds] = useState<Record<string, boolean>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearchQuery(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    searchInputRef.current?.focus();
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setDisciplineFilter('all');
    setRoleFilter('all');
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 || disciplineFilter !== 'all' || roleFilter !== 'all';

  const portfolioCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allUsers.forEach((member) => {
      const fullLower = (member.fullName || '').toLowerCase();
      const nickLower = (member.nickname || '').toLowerCase();
      const postCount = feedPosts.filter((p) => {
        const author = (p.authorName || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        return (
          (fullLower && (author === fullLower || title.includes(fullLower))) ||
          (nickLower && (author === nickLower || title.includes(nickLower)))
        );
      }).length;
      const subCount = contestSubmissions.filter((s) => s.memberId === member.id).length;
      counts[member.id] = postCount + subCount;
    });
    return counts;
  }, [allUsers, feedPosts, contestSubmissions]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^@+/, '');

    return allUsers
      .filter((member) => {
        if (!matchesDiscipline(member, disciplineFilter)) return false;
        if (!matchesRoleFilter(member, roleFilter)) return false;
        if (!q) return true;

        const searchableFields = [
          member.fullName,
          member.nickname,
          member.username,
          member.role,
          member.officerRole,
          member.gradeSection,
          member.batch,
          member.creativeGroup,
          member.bio,
          ...(member.projectHeadRoles || []),
          ...(member.creativeTags || []),
        ]
          .filter(Boolean)
          .map((val) => String(val).toLowerCase());

        return searchableFields.some((val) => val.includes(q));
      })
      .sort((a, b) => {
        const pksDiff = getMemberPks(b.id) - getMemberPks(a.id);
        if (pksDiff !== 0) return pksDiff;
        return (a.fullName || '').localeCompare(b.fullName || '');
      });
  }, [allUsers, searchQuery, disciplineFilter, roleFilter, getMemberPks]);

  return (
    <div className="max-w-5xl mx-auto w-full space-y-5 pb-20 md:pb-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Members Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Browse registered FPC Hub creatives, officers, and project heads, and inspect their portfolios.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
          Showing {filteredMembers.length} of {allUsers.length} registered
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <section className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3">
        {/* Search Form with Explicit Search Button */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search members by name, @username, role, batch, or skill..."
              aria-label="Search registered members"
              className="w-full h-10 pl-9 pr-9 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="Clear member search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98]"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
          {/* Discipline Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto scrollbar-none max-w-full">
            {(
              [
                { id: 'all', label: 'All Divisions' },
                { id: 'photography', label: 'Photography' },
                { id: 'videography', label: 'Videography' },
                { id: 'design', label: 'Design' },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setDisciplineFilter(option.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  disciplineFilter === option.id
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Role Filter Select + Reset */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <label htmlFor="member-role-filter" className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Filter by role
            </label>
            <select
              id="member-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="officers">Officers & Admins</option>
              <option value="heads">Project Heads</option>
              <option value="members">General Members</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                title="Reset search and filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Members Directory Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-12 px-6 text-center space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900">No matching members found</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try clearing your search query or switching the division and role filters to see all registered members.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Show All Members</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredMembers.map((member) => {
            const pks = getMemberPks(member.id);
            const rank = getMemberRank(member.id);
            const roleLabel = getDisplayRole(member);
            const divisionLabel = getCreativeGroupLabel(member.creativeGroup);
            const workCount = portfolioCounts[member.id] || 0;
            const isSelf = currentUser?.id === member.id;
            const initials = (member.fullName || member.nickname || 'F')
              .split(' ')
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() || '')
              .join('');

            return (
              <article
                key={member.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 transition-colors"
              >
                {/* Top Identity & Role Summary */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {member.avatarUrl && !brokenAvatarIds[member.id] ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.fullName}
                        onError={() =>
                          setBrokenAvatarIds((prev) => ({ ...prev, [member.id]: true }))
                        }
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {member.fullName}
                          {isSelf && (
                            <span className="ml-1.5 text-xs font-medium text-indigo-600">(You)</span>
                          )}
                        </h2>
                        <span className="text-xs font-mono font-bold text-indigo-600 tabular-nums whitespace-nowrap shrink-0">
                          {pks} PKS
                        </span>
                      </div>

                      {/* Unboxed Role & Standing Metadata */}
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-600 mt-0.5">
                        <span className="font-semibold text-slate-800">{roleLabel}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>{rank.name}</span>
                        {divisionLabel && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span>{divisionLabel}</span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono">@{member.username}</span>
                        {member.gradeSection && member.gradeSection !== '-' && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="truncate max-w-[180px]">{member.gradeSection}</span>
                          </>
                        )}
                        {member.batch && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span>{member.batch}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Bio Summary */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {member.bio?.trim()
                      ? member.bio
                      : 'Active First Peek Creatives member contributing to campus media and creative productions.'}
                  </p>

                  {/* Core Skills Summary (Unboxed inline text) */}
                  {member.creativeTags && member.creativeTags.length > 0 && (
                    <div className="text-[11px] text-slate-500 truncate">
                      <span className="font-medium text-slate-700">Focus: </span>
                      <span>{member.creativeTags.slice(0, 4).join(' · ')}</span>
                    </div>
                  )}
                </div>

                {/* Footer & Quick-Connect Portfolio Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
                    {workCount} {workCount === 1 ? 'showcase item' : 'showcase items'} · Joined{' '}
                    {member.joinedDate || 'FPC'}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedMember(member)}
                    className="min-h-[38px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98]"
                  >
                    <span>View Portfolio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Member Portfolio Modal */}
      {selectedMember && (
        <MemberProfileModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
};

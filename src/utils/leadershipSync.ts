import { User, OfficerRole, MLogEntry, LeadershipTimelineItem } from '../types';

/**
 * Returns the corresponding Responsibility & Leadership PKS code and points for an officer role.
 * Executive roles receive B4 (Executive Leadership, 80 pts).
 * Committee/Group Heads receive B3 (Major Lead / Committee Chair, 50 pts).
 */
export function getLeadershipPksCodeForRole(role: OfficerRole): {
  code: 'B4' | 'B3';
  points: number;
  title: string;
} | null {
  if (!role || role === 'None') return null;

  switch (role) {
    case 'President':
    case 'VPIA':
    case 'VPCA':
    case 'Secretary':
    case 'Treasurer':
    case 'Logistics Head':
    case 'Logistics Officer':
    case 'SuperAdmin':
      return {
        code: 'B4',
        points: 80,
        title: 'Executive Leadership',
      };
    case 'PEBU Head':
    case 'Creative Head (Photography)':
    case 'Creative Head (Videography)':
    case 'Creative Head (Design)':
    case 'Project Head':
      return {
        code: 'B3',
        points: 50,
        title: 'Major Lead / Committee Chair',
      };
    default:
      return {
        code: 'B3',
        points: 50,
        title: 'Leadership Post',
      };
  }
}

/**
 * Checks whether an officer role has a corresponding verified M.Log entry for the given member.
 */
export function isOfficerRoleSyncedWithMLog(
  member: User,
  mLogEntries: MLogEntry[],
  academicYear: string = '2025–2026'
): { isSynced: boolean; matchedEntry?: MLogEntry } {
  if (!member.officerRole || member.officerRole === 'None') {
    return { isSynced: false };
  }

  const roleName = member.officerRole.toLowerCase();

  // Search for verified MLog entry matching this member, with B4 or B3, or mentioning the role
  const matched = mLogEntries.find((entry) => {
    if (entry.memberId !== member.id || entry.status !== 'verified') return false;

    const hasPksCode = entry.codes.some((c) => c === 'B4' || c === 'B3');
    const matchesRoleTitle =
      entry.roleOrAward.toLowerCase().includes(roleName) ||
      entry.eventTitle.toLowerCase().includes(roleName);

    // If academic year is explicitly noted in title, remarks, or date, check alignment
    const matchesYear =
      academicYear ? (
        entry.eventTitle.includes(academicYear) ||
        entry.remarks.includes(academicYear) ||
        entry.date.includes(academicYear.slice(0, 4))
      ) : true;

    return hasPksCode && (matchesRoleTitle || matchesYear);
  });

  return {
    isSynced: !!matched,
    matchedEntry: matched,
  };
}

/**
 * Parses and extracts major projects led from an M.Log entry's remarks or title.
 */
export function extractProjectsFromRemarks(remarks: string, eventTitle: string): string[] {
  const projects: string[] = [];

  // Check common project keywords
  const candidateText = `${eventTitle}. ${remarks}`;

  // Patterns like "Headed Division Press Con", "Led Intramurals Coverage", "Projects: A, B, C"
  const colonMatch = candidateText.match(/(?:Projects|Initiatives|Key campaigns|Coverages):\s*([^.]+)/i);
  if (colonMatch && colonMatch[1]) {
    const list = colonMatch[1].split(/[,;·]/).map((s) => s.trim()).filter(Boolean);
    if (list.length > 0) return list;
  }

  // Look for quotes or capitalized campaigns
  const knownProjects = [
    'Division Press Conference',
    'Intramurals Coverage',
    'Creative Expo',
    'Annual Media Workshop',
    'Foundation Day',
    'District Schools Press Conference',
    'Graduation Broadcast',
    'Alumni Homecoming',
  ];

  for (const kp of knownProjects) {
    if (candidateText.toLowerCase().includes(kp.toLowerCase())) {
      projects.push(kp);
    }
  }

  return projects;
}

/**
 * Extracts a member's complete leadership history trajectory (Current + Historical terms).
 * Combines active officerRole with verified M.Log records (B4, B3, B2).
 */
export function getMemberLeadershipHistory(
  member: User,
  mLogEntries: MLogEntry[],
  currentAcademicYear: string = '2025–2026'
): LeadershipTimelineItem[] {
  const items: LeadershipTimelineItem[] = [];
  const processedEntryIds = new Set<string>();

  // 1. Current Active Officer Post
  const activeRole = member.officerRole;
  const hasActiveRole = activeRole && activeRole !== 'None';

  if (hasActiveRole) {
    const pksConfig = getLeadershipPksCodeForRole(activeRole);
    const syncStatus = isOfficerRoleSyncedWithMLog(member, mLogEntries, currentAcademicYear);

    if (syncStatus.matchedEntry) {
      processedEntryIds.add(syncStatus.matchedEntry.id);
    }

    const projects = syncStatus.matchedEntry
      ? extractProjectsFromRemarks(syncStatus.matchedEntry.remarks, syncStatus.matchedEntry.eventTitle)
      : member.projectHeadRoles || [];

    items.push({
      id: syncStatus.matchedEntry ? `active_${syncStatus.matchedEntry.id}` : `active_${member.id}`,
      roleTitle: activeRole,
      academicYear: currentAcademicYear,
      isCurrent: true,
      isMLogSynced: syncStatus.isSynced,
      pksCode: pksConfig?.code || 'B4',
      pksPoints: syncStatus.matchedEntry ? syncStatus.matchedEntry.totalPoints : pksConfig?.points || 80,
      remarks:
        syncStatus.matchedEntry?.remarks ||
        `Active incumbent presiding over First Peek Creative for Academic Year ${currentAcademicYear}.`,
      verifiedBy: syncStatus.matchedEntry?.verifiedBy || 'FPC Executive Board',
      date: syncStatus.matchedEntry?.date || new Date().toISOString().split('T')[0],
      projectsLed: projects.length > 0 ? projects : undefined,
      mLogEntryId: syncStatus.matchedEntry?.id,
    });
  }

  // 2. Additional Project Head Roles on current user
  if (member.projectHeadRoles && member.projectHeadRoles.length > 0) {
    member.projectHeadRoles.forEach((proj, idx) => {
      // Avoid duplicate if already covered in projectsLed
      const isAlreadyListed = items.some((it) => it.projectsLed?.includes(proj));
      if (!isAlreadyListed) {
        items.push({
          id: `proj_head_${member.id}_${idx}`,
          roleTitle: `Project Head (${proj})`,
          academicYear: currentAcademicYear,
          isCurrent: true,
          isMLogSynced: true,
          pksCode: 'B3',
          pksPoints: 50,
          remarks: `Designated executive project head directing creative production and crew assignments for ${proj}.`,
          projectsLed: [proj],
        });
      }
    });
  }

  // 3. Historical Verified Leadership Records from M.Log
  const memberEntries = mLogEntries.filter(
    (e) => e.memberId === member.id && e.status === 'verified' && !processedEntryIds.has(e.id)
  );

  for (const entry of memberEntries) {
    const isLeadershipCode = entry.codes.some((c) => c === 'B4' || c === 'B3' || c === 'B2');
    const isOfficerMention =
      entry.roleOrAward.toLowerCase().includes('officer') ||
      entry.roleOrAward.toLowerCase().includes('president') ||
      entry.roleOrAward.toLowerCase().includes('vp') ||
      entry.roleOrAward.toLowerCase().includes('head') ||
      entry.roleOrAward.toLowerCase().includes('director') ||
      entry.roleOrAward.toLowerCase().includes('chair') ||
      entry.roleOrAward.toLowerCase().includes('treasurer') ||
      entry.roleOrAward.toLowerCase().includes('secretary');

    if (isLeadershipCode || isOfficerMention) {
      // Determine academic year from title or date
      const yearMatch = entry.eventTitle.match(/202\d[–-]202\d|A\.Y\.\s*202\d[–-]202\d/i);
      const parsedYear = yearMatch ? yearMatch[0].replace(/A\.Y\.\s*/i, '') : entry.date ? `${entry.date.slice(0, 4)}` : 'Historical Term';

      // Determine highest leadership code in this entry
      const pksCode = entry.codes.includes('B4') ? 'B4' : entry.codes.includes('B3') ? 'B3' : 'B2';
      const projects = extractProjectsFromRemarks(entry.remarks, entry.eventTitle);

      items.push({
        id: entry.id,
        roleTitle: entry.roleOrAward.replace(/^FPC Officer:\s*/i, ''),
        academicYear: parsedYear.includes('–') || parsedYear.includes('-') ? parsedYear : `A.Y. ${parsedYear}`,
        isCurrent: false, // historical
        isMLogSynced: true,
        pksCode,
        pksPoints: entry.totalPoints,
        remarks: entry.remarks,
        verifiedBy: entry.verifiedBy,
        date: entry.date,
        projectsLed: projects.length > 0 ? projects : undefined,
        mLogEntryId: entry.id,
      });
    }
  }

  return items;
}

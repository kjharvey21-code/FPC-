import { PillarCodeDefinition, RankTier } from '../types';

export const PILLAR_CODES: PillarCodeDefinition[] = [
  // C-Codes (Creative Outputs) - Requires actual creative work
  {
    code: 'C1',
    category: 'C',
    categoryName: 'Creative Output',
    title: 'Foundational Asset',
    points: 10,
    description: 'Quick graphic, single photo edit, social story graphic, or short announcement visual.',
  },
  {
    code: 'C2',
    category: 'C',
    categoryName: 'Creative Output',
    title: 'Standard Production',
    points: 20,
    description: 'Multi-frame photo set, official event poster, short edited highlight reel (under 60s), or publication banner.',
  },
  {
    code: 'C3',
    category: 'C',
    categoryName: 'Creative Output',
    title: 'Comprehensive Creative',
    points: 40,
    description: 'Official highlight video, multi-page magazine layout, high-concept branding suite, or motion graphic identity.',
  },
  {
    code: 'C4',
    category: 'C',
    categoryName: 'Creative Output',
    title: 'Flagship Masterpiece',
    points: 70,
    description: 'Full documentary film, school annual cover & full creative theme suite, or multi-day coverage portfolio.',
  },

  // P-Codes (Participation)
  {
    code: 'P1',
    category: 'P',
    categoryName: 'Participation',
    title: 'General Attendance',
    points: 8,
    description: 'Punctual attendance at general club assemblies and official production briefings.',
  },
  {
    code: 'P2',
    category: 'P',
    categoryName: 'Participation',
    title: 'Active Workshop Participant',
    points: 12,
    description: 'Active participation in hands-on workshops, peer critiques, or equipment drills.',
  },
  {
    code: 'P3',
    category: 'P',
    categoryName: 'Participation',
    title: 'Task Completion / Shoot Crew',
    points: 18,
    description: 'On-time completion of assigned duties or assisting during on-site camera coverage.',
  },
  {
    code: 'P4',
    category: 'P',
    categoryName: 'Participation',
    title: 'High Engagement Production Crew',
    points: 25,
    description: 'Extensive on-field coverage participation across entire event duration without lapses.',
  },
  {
    code: 'P5',
    category: 'P',
    categoryName: 'Participation',
    title: 'School Contest Participant',
    points: 15,
    description: 'Submitted an entry to an official school-level creative competition.',
  },
  {
    code: 'P6',
    category: 'P',
    categoryName: 'Participation',
    title: 'City / Division Competitor',
    points: 40,
    description: 'Represented SJNHS FPC in Division / City schools press conference or arts tilt.',
  },
  {
    code: 'P7',
    category: 'P',
    categoryName: 'Participation',
    title: 'Regional Competitor',
    points: 70,
    description: 'Official delegate to Regional Schools Press Conference or Regional Arts Olympiad.',
  },
  {
    code: 'P8',
    category: 'P',
    categoryName: 'Participation',
    title: 'National Competitor',
    points: 120,
    description: 'Official qualifier/competitor at the National Schools Press Conference (NSPC).',
  },
  {
    code: 'P9',
    category: 'P',
    categoryName: 'Participation',
    title: 'International Competitor',
    points: 150,
    description: 'Participated in a sanctioned international youth arts / film festival or contest.',
  },

  // B-Codes (Responsibility & Leadership)
  {
    code: 'B1',
    category: 'B',
    categoryName: 'Responsibility & Leadership',
    title: 'Peer Helper / Mentor',
    points: 15,
    description: 'Mentoring apprentices or assisting gear staging and junior member onboarding.',
  },
  {
    code: 'B2',
    category: 'B',
    categoryName: 'Responsibility & Leadership',
    title: 'Shoot Director / Team Leader',
    points: 30,
    description: 'Led a 3+ person coverage team, direct shoot staging, or managed post-production queue.',
  },
  {
    code: 'B3',
    category: 'B',
    categoryName: 'Responsibility & Leadership',
    title: 'Major Lead / Committee Chair',
    points: 50,
    description: 'Chairperson of school-wide event creative committee, logistics director, or division lead.',
  },
  {
    code: 'B4',
    category: 'B',
    categoryName: 'Responsibility & Leadership',
    title: 'Executive Leadership',
    points: 80,
    description: 'Overall executive direction by President, VP, or Project Head for major institutional events.',
  },

  // R-Codes (Recognition & Awards)
  {
    code: 'R1',
    category: 'R',
    categoryName: 'Recognition & Awards',
    title: 'School-Level Award',
    points: 25,
    description: '1st to 3rd place in SJNHS internal creative tournaments or institutional awards.',
  },
  {
    code: 'R2',
    category: 'R',
    categoryName: 'Recognition & Awards',
    title: 'City / Division Award',
    points: 50,
    description: 'Podium finish or honorable mention in city-wide/division arts and journalism contests.',
  },
  {
    code: 'R3',
    category: 'R',
    categoryName: 'Recognition & Awards',
    title: 'Regional Award',
    points: 80,
    description: 'Top-tier recognition in regional creative symposiums or press competitions.',
  },
  {
    code: 'R4',
    category: 'R',
    categoryName: 'Recognition & Awards',
    title: 'National Award',
    points: 120,
    description: 'National medalist or champion in national level high school arts/media competitions.',
  },
  {
    code: 'R5',
    category: 'R',
    categoryName: 'Recognition & Awards',
    title: 'International Award',
    points: 150,
    description: 'International recognition, showcase, or laureate prize in multimedia arts.',
  },

  // S-Codes (Special / Distinction)
  {
    code: 'S1',
    category: 'S',
    categoryName: 'Special Distinction',
    title: 'Skill Milestone',
    points: 20,
    description: 'Demonstrated mastery of a new creative workflow, certified tool, or specialized gear.',
  },
  {
    code: 'S2',
    category: 'S',
    categoryName: 'Special Distinction',
    title: 'Multi-Role Mastery',
    points: 25,
    description: 'Successfully performed multiple roles (e.g. photography + motion design) in a single event.',
  },
  {
    code: 'S3',
    category: 'S',
    categoryName: 'Special Distinction',
    title: 'Consistency Streak',
    points: 30,
    description: 'Maintained 5 consecutive verified high-quality event deliveries without delay.',
  },
  {
    code: 'S4',
    category: 'S',
    categoryName: 'Special Distinction',
    title: 'High-Impact Output',
    points: 40,
    description: 'Creative work achieved viral school reach (10k+ views) or official DepEd commendation.',
  },
  {
    code: 'S5',
    category: 'S',
    categoryName: 'Special Distinction',
    title: 'System Contribution',
    points: 45,
    description: 'Authored an FPC tutorial, conducted full training, or maintained club camera rigs.',
  },
  {
    code: 'S6',
    category: 'S',
    categoryName: 'Special Distinction',
    title: 'Trust Role / Lead Custodian',
    points: 60,
    description: 'Served as equipment master custodian or confidential high-stakes documentary lead.',
  },
];

export const RANK_TIERS: RankTier[] = [
  {
    id: 'applicant',
    name: 'Applicant',
    minPks: 0,
    maxPks: 19,
    badgeColor: 'text-slate-700 bg-slate-100',
    bgGradient: 'from-slate-100 to-slate-200',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    iconName: 'UserCheck',
    description: 'Initial onboarding stage. Complete orientation and submit first creative draft.',
    perks: ['Access to general assemblies', 'Apprentice shadowing on shoots', 'Basic gear borrowing'],
  },
  {
    id: 'member',
    name: 'Member',
    minPks: 20,
    maxPks: 79,
    badgeColor: 'text-emerald-700 bg-emerald-50',
    bgGradient: 'from-emerald-50 to-emerald-100',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    iconName: 'Sparkles',
    description: 'Active core member of First Peek Creatives with verified event participation.',
    perks: ['Eligible for official shoot credentials', 'Club press pass access', 'Voting rights in meetings'],
  },
  {
    id: 'apprentice',
    name: 'Apprentice',
    minPks: 80,
    maxPks: 159,
    badgeColor: 'text-sky-700 bg-sky-50',
    bgGradient: 'from-sky-50 to-sky-100',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
    iconName: 'Camera',
    description: 'Dedicated artisan exhibiting consistent creative output and workshop mastery.',
    perks: ['Primary camera operator rights', 'Assigned solo coverage slots', 'FPC Merchandise badge'],
  },
  {
    id: 'junior',
    name: 'Junior Creative',
    minPks: 160,
    maxPks: 259,
    badgeColor: 'text-indigo-700 bg-indigo-50',
    bgGradient: 'from-indigo-50 to-indigo-100',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    iconName: 'Award',
    description: 'Proven multi-disciplinary creative capable of leading shoot squads and mentoring.',
    perks: ['Can lead sub-crews on campus', 'Featured on FPC Hub spotlight', 'Priority gear allocation'],
  },
  {
    id: 'senior',
    name: 'Senior Creative',
    minPks: 260,
    maxPks: 379,
    badgeColor: 'text-purple-700 bg-purple-50',
    bgGradient: 'from-purple-50 to-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    iconName: 'Flame',
    description: 'Distinguished veteran creative and standard-bearer for FPC media productions.',
    perks: ['Division competition delegation', 'Directorial review over publications', 'Certificate of distinction'],
  },
  {
    id: 'lead',
    name: 'Lead Creative',
    minPks: 380,
    maxPks: 499,
    badgeColor: 'text-rose-700 bg-rose-50',
    bgGradient: 'from-rose-50 to-rose-100',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    iconName: 'Crown',
    description: 'Organizational pillar guiding creative direction, masterclasses, and major institutional campaigns.',
    perks: ['Executive committee nomination', 'Official portfolio endorsement', 'School medal recommendation'],
  },
  {
    id: 'peak',
    name: 'Peak Creative',
    minPks: 500,
    maxPks: 9999,
    badgeColor: 'text-indigo-900 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50',
    bgGradient: 'from-indigo-100 via-purple-100 to-pink-100',
    textColor: 'text-indigo-950',
    borderColor: 'border-indigo-300',
    iconName: 'ShieldAlert',
    description: 'Highest echelon of FPC creative excellence. Legendary contributions across multiple pillars.',
    perks: ['Lifetime Hall of Fame entry', 'DepEd regional honors endorsement', 'Permanent FPC alumni advisory'],
  },
];

export function getRankTierForPks(pks: number): RankTier {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (pks >= RANK_TIERS[i].minPks) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
}

export function getNextRankProgress(pks: number): {
  currentTier: RankTier;
  nextTier: RankTier | null;
  progressPercent: number;
  pointsRemaining: number;
} {
  const currentTier = getRankTierForPks(pks);
  const currentIndex = RANK_TIERS.findIndex((t) => t.id === currentTier.id);

  if (currentIndex === RANK_TIERS.length - 1) {
    return {
      currentTier,
      nextTier: null,
      progressPercent: 100,
      pointsRemaining: 0,
    };
  }

  const nextTier = RANK_TIERS[currentIndex + 1];
  const range = nextTier.minPks - currentTier.minPks;
  const currentInTier = pks - currentTier.minPks;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentInTier / range) * 100)));
  const pointsRemaining = Math.max(0, nextTier.minPks - pks);

  return {
    currentTier,
    nextTier,
    progressPercent,
    pointsRemaining,
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates selected pillar codes against the official FPC M.Log rules:
 * 1. "No Double Counting": If a B-code is used, no P-code for the same task.
 * 2. "One Code per Pillar per entry": Only the highest level code per pillar in a single entry.
 */
export function validatePksSelection(selectedCodes: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const pillarCounts: Record<string, string[]> = {
    C: [],
    P: [],
    B: [],
    R: [],
    S: [],
  };

  selectedCodes.forEach((code) => {
    const prefix = code.charAt(0);
    if (pillarCounts[prefix]) {
      pillarCounts[prefix].push(code);
    }
  });

  // Rule 1: One code per pillar per entry
  Object.entries(pillarCounts).forEach(([pillar, codes]) => {
    if (codes.length > 1) {
      errors.push(
        `Rule Violation (One Code per Pillar): You selected multiple ${pillar}-codes (${codes.join(', ')}). Only the highest code per pillar is allowed per entry.`
      );
    }
  });

  // Rule 2: No Double Counting (If B code is used, no P code for the same task)
  if (pillarCounts['B'].length > 0 && pillarCounts['P'].length > 0) {
    errors.push(
      `Rule Violation (No Double Counting): You cannot assign both a B-Code (${pillarCounts['B'].join(
        ', '
      )}) and a P-Code (${pillarCounts['P'].join(
        ', '
      )}) for the same task. Leadership responsibility (B) supersedes baseline participation (P).`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function calculatePksFromCodes(selectedCodes: string[]): {
  total: number;
  breakdown: { C: number; P: number; B: number; R: number; S: number };
} {
  const breakdown = { C: 0, P: 0, B: 0, R: 0, S: 0 };

  selectedCodes.forEach((code) => {
    const item = PILLAR_CODES.find((def) => def.code === code);
    if (item) {
      breakdown[item.category] += item.points;
    }
  });

  const total = breakdown.C + breakdown.P + breakdown.B + breakdown.R + breakdown.S;
  return { total, breakdown };
}

export function isElevatedRole(role: string): boolean {
  const elevatedRoles = [
    'SuperAdmin',
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
  return elevatedRoles.includes(role);
}

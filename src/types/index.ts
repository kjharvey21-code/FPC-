export type PillarCategory = 'C' | 'P' | 'B' | 'R' | 'S';

export interface PillarCodeDefinition {
  code: string;
  category: PillarCategory;
  categoryName: string;
  title: string;
  points: number;
  description: string;
}

export type OfficerRole =
  | 'SuperAdmin'
  | 'President'
  | 'VPIA'
  | 'VPCA'
  | 'Secretary'
  | 'Treasurer'
  | 'Logistics Head'
  | 'Logistics Officer'
  | 'PEBU Head'
  | 'Creative Head (Photography)'
  | 'Creative Head (Videography)'
  | 'Creative Head (Design)'
  | 'Project Head'
  | 'None';

export type UserRole =
  | OfficerRole
  | 'Senior Creative'
  | 'Junior Creative'
  | 'Apprentice'
  | 'Member'
  | 'Applicant';

export interface CreativeTag {
  id: string;
  name: string;
  category: 'photography' | 'videography' | 'graphic_design' | 'editorial' | 'illustration' | 'technical';
}

export type CreativeGroup = 'photography' | 'design' | 'videography';

export interface User {
  id: string;
  username: string;
  password?: string; // used for demo auth
  fullName: string;
  nickname: string;
  avatarUrl: string;
  // Dual Status Support:
  officerRole?: OfficerRole; // concurrent club officer role (e.g. President, VPIA, Head)
  projectHeadRoles?: string[]; // concurrent project head roles (e.g. "Intramurals 2026", "Foundation Day")
  role: string; // legacy or combined role descriptor
  isOfficer: boolean; // whether can access Admin tab
  creativeTags: string[];
  gradeSection: string;
  joinedDate: string;
  registrationDate?: string; // date member registered in the organization
  birthdate?: string; // birthdate of member
  batch?: string; // batch year/number e.g. "Batch 2026" / "Batch 8"
  creativeGroup?: CreativeGroup | string; // 'photography' | 'design' | 'videography'
  bio: string;
  email?: string;
  uid?: string;
}

export type RankTierId =
  | 'applicant'
  | 'member'
  | 'apprentice'
  | 'junior'
  | 'senior'
  | 'lead'
  | 'peak';

export interface RankTier {
  id: RankTierId;
  name: string;
  minPks: number;
  maxPks: number;
  badgeColor: string;
  bgGradient: string;
  textColor: string;
  borderColor: string;
  iconName: string;
  description: string;
  perks: string[];
}

export interface MLogEntry {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  eventTitle: string;
  eventId?: string;
  date: string;
  roleOrAward: string;
  codes: string[]; // e.g. ["C2", "B2"]
  pillarPoints: {
    C: number;
    P: number;
    B: number;
    R: number;
    S: number;
  };
  totalPoints: number;
  remarks: string;
  proofUrl?: string;
  status: 'verified' | 'pending' | 'rejected';
  verifiedBy?: string;
  verifiedAt?: string;
  submittedAt: string;
}

export type EventType = 'shoot' | 'contest' | 'workshop' | 'meeting' | 'coverage';

export interface EventCrewSlot {
  id: string; // unique slot identifier, e.g. "slot_photo_lead"
  role: string; // e.g. "Lead Photographer", "Action / Courtside Camera", "Livestream Switcher Operator"
  category?: 'photography' | 'videography' | 'design' | 'production' | 'general';
  spotsNeeded: number; // quota of members required for this role
  assignedMemberIds: string[]; // member IDs officially confirmed for this role slot
  volunteerMemberIds: string[]; // member IDs who volunteered/applied for this specific role
  pksCodes: string[]; // specific PKS codes awarded for this role (e.g. ['C3', 'P4', 'B2'])
  notes?: string; // brief role instructions, expected gear, or participation level
}

export interface EventAssignment {
  id: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  location: string;
  description: string;
  bannerUrl: string;
  assignedCrewIds: string[];
  volunteerCrewIds: string[];
  crewSlots?: EventCrewSlot[]; // structured role requirements, quotas, and role-specific PKS codes
  maxCrew?: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  isContest?: boolean;
  contestDeadline?: string;
  contestPrize?: string;
  submittedEntriesCount?: number;
  eligibleCodes: string[];
  projectHeadId?: string; // Member ID of the designated Project Head
  projectHeadName?: string; // Display name of Project Head
  completedAt?: string;
  creditsApproved?: boolean; // Whether participant credits have been approved
  creditedMemberIds?: string[]; // IDs of participants who received verified M.Log credits
}

export interface ContestSubmission {
  id: string;
  eventId: string;
  eventTitle: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  title: string;
  caption: string;
  imageUrl: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'featured' | 'rejected';
  awardWon?: string;
}

export interface FeedPost {
  id: string;
  title: string;
  content: string;
  category: 'announcement' | 'contest_winner' | 'showcase' | 'behind_the_scenes' | 'promotion';
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  publishedAt: string;
  imageUrl?: string;
  tags: string[];
  applauseCount: number;
  featuredPksWinner?: {
    memberName: string;
    pointsWon: number;
    rankBadge: string;
  };
  featuredPromotion?: {
    memberName: string;
    memberAvatar: string;
    prevRank: string;
    newRank: string;
    totalPks: number;
    badgeColor?: string;
  };
}

export interface SystemSettings {
  appName: string;
  schoolName: string;
  orgTagline: string;
  logoUrl: string;
  academicYear: string;
  announcementBanner: string;
  bannerActive: boolean;
  mLogSubmissionOpen: boolean;
  inviteRegistrationActive?: boolean;
  inviteCode?: string;
}

export interface PendingRegistration {
  id: string;
  fullName: string;
  nickname: string;
  username: string;
  password?: string;
  gradeSection: string;
  batch?: string;
  registrationDate?: string;
  birthdate?: string;
  creativeGroup?: CreativeGroup | string;
  creativeTags: string[];
  bio?: string;
  avatarUrl?: string;
  email?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  initialPksGranted?: number;
}

export interface LeadershipTimelineItem {
  id: string;
  roleTitle: string; // e.g. "President", "Treasurer", "PEBU Head"
  academicYear: string; // e.g. "2025–2026", "2024–2025"
  isCurrent: boolean; // whether this is the active post
  isMLogSynced: boolean; // whether backed by a verified M.Log entry
  pksCode: string; // "B4", "B3", or "B2"
  pksPoints: number; // e.g. 80 or 50
  remarks?: string;
  verifiedBy?: string;
  date?: string;
  projectsLed?: string[];
  mLogEntryId?: string;
}

export interface AppNotification {
  id: string;
  userId: string; // 'all', 'admins', or specific member ID
  title: string;
  message: string;
  eventId?: string;
  type: 'new_event' | 'event_reminder' | 'role_assigned' | 'system';
  createdAt: string;
  read: boolean;
  readBy?: string[];
  dismissedBy?: string[];
  bannerUrl?: string;
  eventType?: EventType;
  roleTitle?: string;
}

import {
  EventAssignment,
  FeedPost,
  MLogEntry,
  SystemSettings,
  User,
  ContestSubmission,
  AppNotification,
} from '../types';

export const INITIAL_SETTINGS: SystemSettings = {
  appName: 'FPC Hub',
  schoolName: 'San Jose National High School',
  orgTagline: 'Official Student-Led Multimedia & Creative Arts Organization',
  logoUrl: '/src/assets/images/fpc_org_logo_1792558822943.jpg',
  academicYear: 'A.Y. 2026–2027',
  announcementBanner: '',
  bannerActive: false,
  mLogSubmissionOpen: true,
  inviteRegistrationActive: true,
  inviteCode: 'fpc-creative-2026',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user_superadmin',
    username: 'superadmin',
    password: 'fpc2026',
    fullName: 'System Administrator (FPC ICT)',
    nickname: 'Admin',
    avatarUrl: '/src/assets/images/fpc_org_logo_1792558822943.jpg',
    officerRole: 'SuperAdmin',
    projectHeadRoles: ['Infrastructure & System Architecture'],
    role: 'SuperAdmin',
    isOfficer: true,
    creativeTags: ['System Admin', 'Broadcast Engineering', 'Archivist'],
    gradeSection: 'Faculty & ICT Advisor Liaison',
    joinedDate: 'June 2024',
    registrationDate: '2024-06-15',
    birthdate: '2005-03-12',
    batch: 'Batch 2024',
    creativeGroup: 'design',
    bio: 'FPC Hub global infrastructure custodian and root system administrator.',
    email: 'kjharvey21@gmail.com',
  },
];

export const INITIAL_EVENTS: EventAssignment[] = [];

export const INITIAL_MLOG_ENTRIES: MLogEntry[] = [];

export const INITIAL_CONTEST_SUBMISSIONS: ContestSubmission[] = [];

export const INITIAL_FEED_POSTS: FeedPost[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

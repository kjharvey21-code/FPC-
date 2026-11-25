import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  ContestSubmission,
  EventAssignment,
  EventType,
  FeedPost,
  MLogEntry,
  SystemSettings,
  User,
  UserRole,
  OfficerRole,
  RankTier,
  AppNotification,
  PendingRegistration,
} from '../types';
import {
  INITIAL_CONTEST_SUBMISSIONS,
  INITIAL_EVENTS,
  INITIAL_FEED_POSTS,
  INITIAL_MLOG_ENTRIES,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import {
  calculatePksFromCodes,
  isElevatedRole,
  getRankTierForPks,
  getNextRankProgress,
  RANK_TIERS,
} from '../data/pksFramework';
import { canManageEvent } from '../utils/permissions';
import { getLeadershipPksCodeForRole, isOfficerRoleSyncedWithMLog } from '../utils/leadershipSync';
import {
  db,
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  FirebaseUser,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  handleFirestoreError,
  OperationType,
  uploadProfilePhotoToStorage,
} from '../services/firebase';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  // Auth & Session
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loginWithGoogle: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  allUsers: User[];
  isFirestoreLive: boolean;

  // Navigation
  activeTab: 'home' | 'feed' | 'members' | 'profile' | 'admin';
  setActiveTab: (tab: 'home' | 'feed' | 'members' | 'profile' | 'admin') => void;

  // System Settings (SuperAdmin)
  systemSettings: SystemSettings;
  updateSystemSettings: (updates: Partial<SystemSettings>) => Promise<boolean>;

  // Members & Roles (Dual Status Support & Dynamic Rank)
  addMember: (memberData: Omit<User, 'id'>, initialPks?: number) => Promise<void>;
  updateMemberRole: (memberId: string, newRole: UserRole, isOfficer?: boolean) => Promise<void>;
  updateMemberDualRoles: (
    memberId: string,
    officerRole: OfficerRole,
    projectHeadRoles?: string[],
    isOfficer?: boolean
  ) => Promise<void>;
  updateMemberProfile: (memberId: string, updates: Partial<User>) => Promise<void>;
  deleteMember: (memberId: string) => Promise<boolean>;
  updateProfilePhoto: (fileOrDataUrl: File | string) => Promise<string>;
  getMemberPks: (memberId: string) => number;
  getMemberRank: (memberId: string) => RankTier;
  getMemberProgress: (memberId: string) => ReturnType<typeof getNextRankProgress>;
  getMemberPillarBreakdown: (memberId: string) => { C: number; P: number; B: number; R: number; S: number };
  syncOfficerLeadershipMLog: (params: {
    memberId: string;
    officerRole: OfficerRole;
    academicYear?: string;
    remarks?: string;
    projectsLed?: string[];
  }) => Promise<MLogEntry | null>;

  // M.Log Entries
  mLogEntries: MLogEntry[];
  addManualMLogEntry: (entry: Omit<MLogEntry, 'id' | 'submittedAt'>) => Promise<void>;
  submitMemberMLogRequest: (request: {
    eventTitle: string;
    roleOrAward: string;
    codes: string[];
    remarks: string;
    proofUrl?: string;
  }) => Promise<void>;
  verifyMLogEntry: (entryId: string, status: 'verified' | 'rejected', notes?: string) => Promise<void>;
  updateMLogEntry: (entryId: string, updates: Partial<MLogEntry>) => Promise<void>;
  deleteMLogEntry: (entryId: string) => Promise<void>;

  // Events & Contests
  events: EventAssignment[];
  createEvent: (eventData: Omit<EventAssignment, 'id' | 'assignedCrewIds' | 'volunteerCrewIds' | 'submittedEntriesCount'>) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<EventAssignment>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  toggleVolunteer: (eventId: string) => Promise<void>;
  assignCrew: (eventId: string, memberIds: string[]) => Promise<void>;
  updateEventStatus: (eventId: string, status: 'upcoming' | 'ongoing' | 'completed') => Promise<void>;
  approveParticipantCredit: (params: {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    memberId: string;
    memberName: string;
    memberAvatar: string;
    codes: string[];
    roleOrAward: string;
    remarks?: string;
  }) => Promise<void>;
  batchApproveParticipantCredits: (params: {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    participantIds: string[];
    codes: string[];
    roleOrAward: string;
  }) => Promise<void>;
  updateCrewSlotPks: (eventId: string, slotId: string, pksCodes: string[]) => Promise<void>;
  volunteerForCrewRole: (eventId: string, slotId: string) => Promise<void>;
  withdrawVolunteerCrewRole: (eventId: string, slotId: string) => Promise<void>;
  assignMemberToCrewSlot: (eventId: string, slotId: string, memberId: string) => Promise<void>;
  removeMemberFromCrewSlot: (eventId: string, slotId: string, memberId: string) => Promise<void>;

  // Contest Submissions
  contestSubmissions: ContestSubmission[];
  submitToContest: (submission: {
    eventId: string;
    eventTitle: string;
    title: string;
    caption: string;
    imageUrl: string;
  }) => Promise<void>;
  reviewSubmission: (
    submissionId: string,
    status: 'approved' | 'featured' | 'rejected',
    awardWon?: string,
    awardPksCodes?: string[]
  ) => Promise<void>;

  // Feed
  feedPosts: FeedPost[];
  createFeedPost: (postData: Omit<FeedPost, 'id' | 'publishedAt' | 'applauseCount'>) => Promise<void>;
  applaudPost: (postId: string) => Promise<void>;

  // Feedback Toasts
  toasts: ToastNotification[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;

  // Push Notifications & Activity Center
  notifications: AppNotification[];
  unreadNotificationCount: number;
  browserNotificationPermission: NotificationPermission | 'unsupported';
  requestBrowserNotificationPermission: () => Promise<boolean>;
  sendPushNotification: (title: string, options?: NotificationOptions) => void;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  selectedNotificationEventId: string | null;
  setSelectedNotificationEventId: (eventId: string | null) => void;

  // Invite Registration & Approvals
  pendingRegistrations: PendingRegistration[];
  submitRegistration: (registrationData: Omit<PendingRegistration, 'id' | 'requestedAt' | 'status'>) => Promise<{ success: boolean; message: string }>;
  approveRegistration: (
    registrationId: string,
    startingPks: number,
    assignedRole?: UserRole,
    isOfficer?: boolean,
    officerRole?: OfficerRole
  ) => Promise<boolean>;
  rejectRegistration: (registrationId: string, reason?: string) => Promise<boolean>;
  toggleInviteRegistration: (active: boolean) => Promise<boolean>;
  regenerateInviteCode: (newCode?: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'fpc_hub_current_user_id_v2',
};

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (
    value !== null &&
    typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
  ) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) {
        cleaned[key] = stripUndefinedDeep(val);
      }
    }
    return cleaned as T;
  }
  return value;
}

function getEventTypeLabel(type?: string): string {
  switch (type) {
    case 'contest':
      return 'Contest';
    case 'workshop':
      return 'Workshop';
    case 'meeting':
      return 'Meeting';
    case 'coverage':
      return 'Coverage';
    case 'shoot':
    default:
      return 'Project';
  }
}

const LEGACY_MOCK_EVENT_IDS = [
  'event_intramurals_2026',
  'event_foundation_day_reel',
  'event_street_contest',
  'event_dspc_2026',
  'event_photo_workshop_2026',
  'event_contest_golden_lens',
  'event_davinci_workshop',
  'event_street_photo_contest',
];

const LEGACY_MOCK_USER_IDS = [
  'user_president',
  'user_vpia',
  'user_photohead',
  'user_kent',
  'user_chloe',
];

const LEGACY_MOCK_FEED_IDS = [
  'feed_promo_kent_junior',
  'feed_post_1',
  'feed_post_2',
  'feed_post_3',
];

const LEGACY_MOCK_SUBMISSION_IDS = [
  'sub_01',
  'sub_02',
];

const LEGACY_MOCK_MLOG_IDS = [
  'mlog_k_01',
  'mlog_k_02',
  'mlog_k_03',
  'mlog_k_04',
  'mlog_k_05',
  'mlog_k_06',
  'mlog_01',
  'mlog_02',
  'mlog_03',
  'mlog_04',
  'mlog_05',
  'mlog_06',
  'mlog_07',
  'mlog_08',
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State synchronized with Cloud Firestore via real-time onSnapshot listeners
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
  const allUsersRef = useRef<User[]>(INITIAL_USERS);
  const [events, setEvents] = useState<EventAssignment[]>(INITIAL_EVENTS);
  const [mLogEntries, setMLogEntries] = useState<MLogEntry[]>(INITIAL_MLOG_ENTRIES);
  const [contestSubmissions, setContestSubmissions] = useState<ContestSubmission[]>(INITIAL_CONTEST_SUBMISSIONS);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(INITIAL_FEED_POSTS);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);

  // Cross-device Firestore Notifications state
  const [rawNotifications, setRawNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const seenNotifIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedNotifsRef = useRef<boolean>(false);

  const [selectedNotificationEventId, setSelectedNotificationEventId] = useState<string | null>(null);

  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || null;
    } catch {
      return null;
    }
  });

  const [isFirestoreLive, setIsFirestoreLive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'feed' | 'members' | 'profile' | 'admin'>('home');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keep track of browser notification permission changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserNotificationPermission(Notification.permission);
    }
  }, []);

  const sendPushNotification = (title: string, options?: NotificationOptions) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          icon: '/src/assets/images/fpc_org_logo_1792558822943.jpg',
          badge: '/src/assets/images/fpc_org_logo_1792558822943.jpg',
          ...options,
        });
        notif.onclick = () => {
          window.focus();
          const targetEventId = (options as any)?.data?.eventId;
          if (targetEventId) {
            setSelectedNotificationEventId(targetEventId);
          }
          notif.close();
        };
      } catch (err) {
        console.warn('Native push notification failed:', err);
      }
    }
  };

  const requestBrowserNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Browser notifications are not supported in this browser.', 'info');
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      setBrowserNotificationPermission(permission);
      if (permission === 'granted') {
        showToast('Push notifications enabled! You will be alerted when new events publish.', 'success');
        sendPushNotification('FPC Push Notifications Enabled', {
          body: 'You will receive instant alerts for upcoming shoots, contests, and workshops.',
        });
        return true;
      } else {
        showToast('Push notifications are currently blocked or dismissed in browser settings.', 'info');
        return false;
      }
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return false;
    }
  };

  const dispatchNotificationToFirestore = async (
    notifData: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'readBy' | 'dismissedBy'>
  ) => {
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const rawNotif: AppNotification = {
      ...notifData,
      id: notifId,
      title: notifData.title.slice(0, 200),
      message: notifData.message.slice(0, 1000),
      bannerUrl:
        notifData.bannerUrl && notifData.bannerUrl.length <= 2000
          ? notifData.bannerUrl
          : undefined,
      roleTitle: notifData.roleTitle ? notifData.roleTitle.slice(0, 150) : undefined,
      createdAt: new Date().toISOString(),
      read: false,
      readBy: [],
      dismissedBy: [],
    };
    const cleanNotif = stripUndefinedDeep(rawNotif);
    const path = `notifications/${notifId}`;
    try {
      await setDoc(doc(db, 'notifications', notifId), cleanNotif);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!currentUser) return;
    const target = rawNotifications.find((n) => n.id === notificationId);
    if (!target) return;
    const path = `notifications/${notificationId}`;
    try {
      const updatePayload: Record<string, unknown> = {
        readBy: arrayUnion(currentUser.id),
      };
      if (target.userId === currentUser.id) {
        updatePayload.read = true;
      }
      await updateDoc(doc(db, 'notifications', notificationId), updatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    const unread = rawNotifications.filter((n) => {
      const isRecipient =
        n.userId === 'all' ||
        n.userId === currentUser.id ||
        (n.userId === 'admins' && currentUser.isOfficer);
      if (!isRecipient) return false;
      if ((n.dismissedBy || []).includes(currentUser.id)) return false;
      return !(n.read || (n.readBy || []).includes(currentUser.id));
    });
    if (unread.length === 0) return;
    await Promise.all(
      unread.map(async (n) => {
        const path = `notifications/${n.id}`;
        try {
          const updatePayload: Record<string, unknown> = {
            readBy: arrayUnion(currentUser.id),
          };
          if (n.userId === currentUser.id) {
            updatePayload.read = true;
          }
          await updateDoc(doc(db, 'notifications', n.id), updatePayload);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        }
      })
    );
    showToast('All notifications marked as read.', 'info');
  };

  const clearAllNotifications = async () => {
    if (!currentUser) return;
    const visible = rawNotifications.filter((n) => {
      const isRecipient =
        n.userId === 'all' ||
        n.userId === currentUser.id ||
        (n.userId === 'admins' && currentUser.isOfficer);
      return isRecipient && !(n.dismissedBy || []).includes(currentUser.id);
    });
    if (visible.length === 0) return;
    await Promise.all(
      visible.map(async (n) => {
        const path = `notifications/${n.id}`;
        try {
          if (n.userId === currentUser.id) {
            await deleteDoc(doc(db, 'notifications', n.id));
          } else {
            await updateDoc(doc(db, 'notifications', n.id), {
              dismissedBy: arrayUnion(currentUser.id),
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        }
      })
    );
    showToast('Notification history cleared.', 'info');
  };

  // Keep active session user in localStorage
  useEffect(() => {
    try {
      if (currentUserId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      }
    } catch (e) {
      console.warn('Failed to save current user id', e);
    }
  }, [currentUserId]);

  useEffect(() => {
    allUsersRef.current = allUsers;
  }, [allUsers]);

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Link or create user document in Firestore
        const isRuntimeAdmin = fbUser.email === 'kjharvey21@gmail.com';
        const userDocRef = doc(db, 'users', fbUser.uid);
        const existing = allUsersRef.current.find(
          (u) => u.id === fbUser.uid || (u.email && u.email === fbUser.email)
        );

        if (!existing) {
          const newGoogleUser: User = {
            id: fbUser.uid,
            username: (fbUser.email?.split('@')[0] || 'member').toLowerCase(),
            fullName: fbUser.displayName || 'FPC Creative',
            nickname: (fbUser.displayName || 'Creative').split(' ')[0],
            avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
            role: isRuntimeAdmin ? 'SuperAdmin' : 'Member',
            officerRole: isRuntimeAdmin ? 'SuperAdmin' : 'None',
            projectHeadRoles: [],
            isOfficer: isRuntimeAdmin,
            creativeTags: isRuntimeAdmin ? ['SuperAdmin', 'Director'] : ['Photographer'],
            gradeSection: 'Grade 12 HUMSS',
            joinedDate: 'October 2026',
            registrationDate: new Date().toISOString().split('T')[0],
            batch: 'Batch 2026',
            bio: isRuntimeAdmin
              ? 'San Jose NHS FPC Administrator & Faculty Liaison.'
              : 'Active student multimedia creative in First Peek Creatives.',
            email: fbUser.email || undefined,
          };
          try {
            await setDoc(userDocRef, newGoogleUser);
          } catch (e) {
            console.warn('Could not write Google user to Firestore:', e);
          }
          setCurrentUserId(newGoogleUser.id);
        } else {
          setCurrentUserId(existing.id);
        }
        showToast(`Authenticated via Google as ${fbUser.displayName || fbUser.email}`, 'success');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // One-time safe purge for legacy mock records in Firestore
  useEffect(() => {
    const purgeLegacyMockData = async () => {
      try {
        for (const id of LEGACY_MOCK_EVENT_IDS) {
          await deleteDoc(doc(db, 'events', id)).catch(() => {});
        }
        for (const id of LEGACY_MOCK_USER_IDS) {
          await deleteDoc(doc(db, 'users', id)).catch(() => {});
        }
        for (const id of LEGACY_MOCK_FEED_IDS) {
          await deleteDoc(doc(db, 'feed_posts', id)).catch(() => {});
        }
        for (const id of LEGACY_MOCK_SUBMISSION_IDS) {
          await deleteDoc(doc(db, 'contest_submissions', id)).catch(() => {});
        }
        for (const id of LEGACY_MOCK_MLOG_IDS) {
          await deleteDoc(doc(db, 'mlog_entries', id)).catch(() => {});
        }
      } catch (e) {
        console.warn('Purge of legacy mock records:', e);
      }
    };
    purgeLegacyMockData();
  }, []);

  // Switch to superadmin if previously logged in as a removed demo user
  useEffect(() => {
    if (currentUserId && LEGACY_MOCK_USER_IDS.includes(currentUserId)) {
      setCurrentUserId('user_superadmin');
    }
  }, [currentUserId]);

  // =========================================================================
  // REAL-TIME FIRESTORE LISTENERS (onSnapshot)
  // Ensures all users see live updates without refreshing
  // =========================================================================
  useEffect(() => {
    // 1. Real-time Feed Posts Listener
    const pathFeed = 'feed_posts';
    const unsubFeed = onSnapshot(
      collection(db, pathFeed),
      (snapshot) => {
        setIsFirestoreLive(true);
        const posts: FeedPost[] = [];
        snapshot.forEach((d) => {
          if (!LEGACY_MOCK_FEED_IDS.includes(d.id)) {
            posts.push({ ...d.data(), id: d.id } as FeedPost);
          }
        });
        posts.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
        setFeedPosts(posts);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pathFeed);
      }
    );

    // 2. Real-time Events & Call Sheets Listener
    const pathEvents = 'events';
    const unsubEvents = onSnapshot(
      collection(db, pathEvents),
      (snapshot) => {
        const evts: EventAssignment[] = [];
        snapshot.forEach((d) => {
          if (!LEGACY_MOCK_EVENT_IDS.includes(d.id)) {
            const data = d.data();
            evts.push({
              ...data,
              id: d.id,
              projectHeadId: data.projectHeadId,
              projectHeadName: data.projectHeadName,
              creditedMemberIds: data.creditedMemberIds || [],
              creditsApproved: data.creditsApproved !== undefined ? data.creditsApproved : false,
              crewSlots: data.crewSlots || [],
            } as EventAssignment);
          }
        });
        setEvents(evts);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pathEvents);
      }
    );

    // 3. Real-time M.Log Ledger Entries Listener
    const pathMLog = 'mlog_entries';
    const unsubMLog = onSnapshot(
      collection(db, pathMLog),
      (snapshot) => {
        const entries: MLogEntry[] = [];
        snapshot.forEach((d) => {
          if (!LEGACY_MOCK_MLOG_IDS.includes(d.id)) {
            entries.push({ ...d.data(), id: d.id } as MLogEntry);
          }
        });
        entries.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
        setMLogEntries(entries);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pathMLog);
      }
    );

    // 4. Real-time Members & Accounts Listener (Preserves all user-created accounts + SuperAdmin)
    const pathUsers = 'users';
    const unsubUsers = onSnapshot(
      collection(db, pathUsers),
      (snapshot) => {
        const users: User[] = [];
        snapshot.forEach((d) => {
          if (!LEGACY_MOCK_USER_IDS.includes(d.id)) {
            users.push({ ...d.data(), id: d.id } as User);
          }
        });
        // Always ensure SuperAdmin account exists and carries bootstrap email
        const superAdmin = INITIAL_USERS[0];
        if (superAdmin && !users.some((u) => u.id === superAdmin.id)) {
          users.unshift(superAdmin);
          setDoc(doc(db, pathUsers, superAdmin.id), superAdmin).catch(() => {});
        } else {
          for (let i = 0; i < users.length; i++) {
            if (users[i].id === 'user_superadmin' && !users[i].email) {
              users[i] = { ...users[i], email: 'kjharvey21@gmail.com' };
            }
          }
        }
        setAllUsers(users);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pathUsers);
      }
    );

    // 5. Real-time Contest Submissions Listener
    const pathSubmissions = 'contest_submissions';
    const unsubSubmissions = onSnapshot(
      collection(db, pathSubmissions),
      (snapshot) => {
        const subs: ContestSubmission[] = [];
        snapshot.forEach((d) => {
          if (!LEGACY_MOCK_SUBMISSION_IDS.includes(d.id)) {
            subs.push({ ...d.data(), id: d.id } as ContestSubmission);
          }
        });
        setContestSubmissions(subs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pathSubmissions);
      }
    );

    // 6. Real-time System Settings Listener
    const pathSettings = 'settings/global';
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'global'),
      (docSnap) => {
        if (docSnap.exists()) {
          setSystemSettings(docSnap.data() as SystemSettings);
        } else {
          setDoc(doc(db, 'settings', 'global'), INITIAL_SETTINGS).catch((e) =>
            console.warn('Seed settings error:', e)
          );
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathSettings);
      }
    );

    // 7. Real-time Pending Registrations Listener
    const pathRegistrations = 'pending_registrations';
    const unsubRegistrations = onSnapshot(
      collection(db, 'pending_registrations'),
      (snapshot) => {
        const regs: PendingRegistration[] = [];
        snapshot.forEach((docSnap) => {
          regs.push(docSnap.data() as PendingRegistration);
        });
        regs.sort((a, b) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime());
        setPendingRegistrations(regs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pathRegistrations);
      }
    );

    // 8. Real-time Cross-Device Notifications Listener
    const pathNotifications = 'notifications';
    const unsubNotifications = onSnapshot(
      collection(db, pathNotifications),
      (snapshot) => {
        const items: AppNotification[] = [];
        snapshot.forEach((d) => {
          items.push({ ...d.data(), id: d.id } as AppNotification);
        });
        items.sort((a, b) => {
          const ta = Date.parse(a.createdAt || '');
          const tb = Date.parse(b.createdAt || '');
          if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) {
            return tb - ta;
          }
          return (b.id || '').localeCompare(a.id || '');
        });
        setRawNotifications(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pathNotifications);
      }
    );

    return () => {
      unsubFeed();
      unsubEvents();
      unsubMLog();
      unsubUsers();
      unsubSubmissions();
      unsubSettings();
      unsubRegistrations();
      unsubNotifications();
    };
  }, []);

  // Compute Active Current User:
  // Strictly null if currentUserId is null (allows real logout to AuthScreen)
  const currentUser = currentUserId ? allUsers.find((u) => u.id === currentUserId) || null : null;

  // Scope Firestore notifications to active member and compute personal read state
  const notifications = useMemo<AppNotification[]>(() => {
    if (!currentUser) return [];
    return rawNotifications
      .filter((n) => {
        const isRecipient =
          n.userId === 'all' ||
          n.userId === currentUser.id ||
          (n.userId === 'admins' && currentUser.isOfficer);
        if (!isRecipient) return false;
        if ((n.dismissedBy || []).includes(currentUser.id)) return false;
        return true;
      })
      .map((n) => ({
        ...n,
        read: Boolean(n.read || (n.readBy || []).includes(currentUser.id)),
      }));
  }, [rawNotifications, currentUser]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Dispatch native browser notifications when brand-new unread alerts arrive via Firestore
  useEffect(() => {
    if (!hasLoadedNotifsRef.current) {
      if (rawNotifications.length > 0 || isFirestoreLive) {
        rawNotifications.forEach((n) => seenNotifIdsRef.current.add(n.id));
        hasLoadedNotifsRef.current = true;
      }
      return;
    }

    rawNotifications.forEach((n) => {
      if (seenNotifIdsRef.current.has(n.id)) return;
      seenNotifIdsRef.current.add(n.id);
      if (!currentUser) return;
      const isRecipient =
        n.userId === 'all' ||
        n.userId === currentUser.id ||
        (n.userId === 'admins' && currentUser.isOfficer);
      const isDismissed = (n.dismissedBy || []).includes(currentUser.id);
      const isRead = Boolean(n.read || (n.readBy || []).includes(currentUser.id));
      if (isRecipient && !isDismissed && !isRead) {
        sendPushNotification(n.title, {
          body: n.message,
          icon: n.bannerUrl || '/src/assets/images/fpc_org_logo_1792558822943.jpg',
          badge: '/src/assets/images/fpc_org_logo_1792558822943.jpg',
          data: { eventId: n.eventId },
        });
      }
    });
  }, [rawNotifications, currentUser, isFirestoreLive]);

  // Firebase Google Auth Sign In
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      showToast(`Signed in as ${user.displayName || user.email}`, 'success');
    } catch (error: any) {
      console.warn('Google Sign-in popup error:', error);
      const errorCode = String(error?.code || '');
      if (
        errorCode === 'auth/unauthorized-domain' ||
        errorCode === 'auth/popup-blocked' ||
        errorCode === 'auth/cancelled-popup-request' ||
        errorCode === 'auth/operation-not-allowed' ||
        errorCode.includes('popup')
      ) {
        showToast(
          'Google Sign-In is unavailable or was blocked. Please sign in with your username and password.',
          'error'
        );
        return;
      }
      showToast(
        'Google Sign-In failed or was cancelled. Please sign in with your username and password.',
        'error'
      );
    }
  };

  // Flexible Authentication: Accepts username (with or without @), full name, nickname, ID, or email
  // Queries live Firestore if the initial snapshot has not delivered the user record yet
  const login = async (
    usernameInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanId = usernameInput.trim().toLowerCase().replace(/^@+/, '');
    const cleanPw = passwordInput.trim();

    if (!cleanId) {
      return { success: false, message: 'Please enter your username, full name, or email.' };
    }

    const matchesIdentifier = (u: User) => {
      const uname = (u.username || '').trim().toLowerCase();
      const uid = (u.id || '').trim().toLowerCase();
      const nick = (u.nickname || '').trim().toLowerCase();
      const full = (u.fullName || '').trim().toLowerCase();
      const email = (u.email || '').trim().toLowerCase();

      return (
        uname === cleanId ||
        uid === cleanId ||
        nick === cleanId ||
        full === cleanId ||
        (email !== '' && email === cleanId) ||
        (cleanId === 'admin' && (uname === 'superadmin' || u.role === 'SuperAdmin')) ||
        (cleanId === 'kjharvey21@gmail.com' && u.id === 'user_superadmin')
      );
    };

    let candidateUsers = allUsers;
    let matchedUser = candidateUsers.find(matchesIdentifier);

    // If not in local state yet, fetch fresh users directly from Firestore
    if (!matchedUser) {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const freshUsers: User[] = [];
        snapshot.forEach((d) => {
          if (!LEGACY_MOCK_USER_IDS.includes(d.id)) {
            freshUsers.push({ ...d.data(), id: d.id } as User);
          }
        });
        if (freshUsers.length > 0) {
          setAllUsers(freshUsers);
          candidateUsers = freshUsers;
          matchedUser = candidateUsers.find(matchesIdentifier);
        }
      } catch (err) {
        console.warn('Direct Firestore user lookup failed:', err);
      }
    }

    if (matchedUser) {
      const storedPw = (matchedUser.password || '').trim();
      const isPasswordValid = storedPw !== '' && storedPw === cleanPw;

      if (isPasswordValid) {
        setCurrentUserId(matchedUser.id);
        showToast(`Welcome back, ${matchedUser.nickname || matchedUser.fullName}!`, 'success');
        return { success: true };
      }

      if (!storedPw) {
        return {
          success: false,
          message:
            'This account does not have a password set yet. Please ask an administrator to set a password for your account.',
        };
      }

      return {
        success: false,
        message: 'Incorrect password for this account. Please check your password or ask an administrator to reset it.',
      };
    }

    // Check if the user has a pending or rejected registration application
    let regs = pendingRegistrations;
    if (regs.length === 0) {
      try {
        const regSnap = await getDocs(collection(db, 'pending_registrations'));
        const freshRegs: PendingRegistration[] = [];
        regSnap.forEach((d) => {
          freshRegs.push({ ...d.data(), id: d.id } as PendingRegistration);
        });
        if (freshRegs.length > 0) {
          regs = freshRegs;
        }
      } catch (err) {
        console.warn('Direct pending_registrations lookup failed:', err);
      }
    }

    const matchingReg = regs.find((r) => {
      const rUname = (r.username || '').trim().toLowerCase();
      const rFull = (r.fullName || '').trim().toLowerCase();
      const rNick = (r.nickname || '').trim().toLowerCase();
      const rEmail = (r.email || '').trim().toLowerCase();
      return (
        rUname === cleanId ||
        rFull === cleanId ||
        rNick === cleanId ||
        (rEmail !== '' && rEmail === cleanId)
      );
    });

    if (matchingReg) {
      if (matchingReg.status === 'pending') {
        return {
          success: false,
          message: `Your registration (@${matchingReg.username}) is awaiting administrator approval. You can sign in once an officer approves your application.`,
        };
      }
      if (matchingReg.status === 'rejected') {
        return {
          success: false,
          message: `Your registration (@${matchingReg.username}) was not approved.${
            matchingReg.rejectionReason ? ` Reason: ${matchingReg.rejectionReason}` : ' Please contact an FPC administrator.'
          }`,
        };
      }
    }

    return {
      success: false,
      message: 'Account not found. Check your username, full name, or email, or register with a club invite link.',
    };
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.warn('Firebase sign out error:', e);
    }
    setCurrentUserId(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    setActiveTab('home');
    showToast('Logged out safely. Welcome back anytime!', 'info');
  };

  const switchUser = (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      showToast(`Switched active view to ${target.nickname} (${target.role})`, 'info');
    }
  };

  // System Settings update
  const updateSystemSettings = async (updates: Partial<SystemSettings>): Promise<boolean> => {
    if (currentUser?.role !== 'SuperAdmin') {
      showToast('Unauthorized: Only SuperAdmin can modify global system settings.', 'error');
      return false;
    }
    const path = 'settings/global';
    try {
      await setDoc(doc(db, 'settings', 'global'), { ...systemSettings, ...updates }, { merge: true });
      showToast('System settings saved to Cloud Firestore.', 'success');
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return false;
    }
  };

  // Dynamic PKS & Rank Calculations
  const getMemberPks = (memberId: string): number => {
    return mLogEntries
      .filter((entry) => entry.memberId === memberId && entry.status === 'verified')
      .reduce((acc, curr) => acc + curr.totalPoints, 0);
  };

  const getMemberRank = (memberId: string): RankTier => {
    const points = getMemberPks(memberId);
    return getRankTierForPks(points);
  };

  const getMemberProgress = (memberId: string) => {
    const points = getMemberPks(memberId);
    return getNextRankProgress(points);
  };

  const getMemberPillarBreakdown = (memberId: string) => {
    const breakdown = { C: 0, P: 0, B: 0, R: 0, S: 0 };
    mLogEntries
      .filter((entry) => entry.memberId === memberId && entry.status === 'verified')
      .forEach((entry) => {
        breakdown.C += entry.pillarPoints.C || 0;
        breakdown.P += entry.pillarPoints.P || 0;
        breakdown.B += entry.pillarPoints.B || 0;
        breakdown.R += entry.pillarPoints.R || 0;
        breakdown.S += entry.pillarPoints.S || 0;
      });
    return breakdown;
  };

  // =========================================================================
  // AUTOMATIC FEED PUBLICATION FOR RANK PROMOTIONS
  // Saves directly to Cloud Firestore so all users see it immediately in real-time
  // =========================================================================
  const publishPromotionToFeed = async (
    member: { id: string; fullName: string; nickname?: string; username?: string; avatarUrl: string; gradeSection?: string },
    prevRank: RankTier,
    newRank: RankTier,
    newPoints: number,
    eventOrReason?: string
  ) => {
    if (newRank.minPks <= prevRank.minPks) return;

    const promotionPost: FeedPost = {
      id: `feed_promo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `🎉 Rank Promotion: ${member.fullName} advanced to ${newRank.name}!`,
      content: `Official FPC Merit Announcement: Salute to ${member.fullName} on officially advancing to the ${newRank.name} tier (${newPoints} PKS)! ${
        eventOrReason ? `Promoted following verified contribution in "${eventOrReason}". ` : ''
      }${newRank.description}\n\n🏆 Key Tier Privileges Unlocked:\n${newRank.perks.map((p) => `• ${p}`).join('\n')}`,
      category: 'promotion',
      authorName: currentUser ? currentUser.fullName : 'FPC Board of Officers',
      authorRole: currentUser ? `${currentUser.officerRole || currentUser.role}` : 'San Jose NHS FPC',
      authorAvatar: currentUser ? currentUser.avatarUrl : '/src/assets/images/fpc_org_logo_1792558822943.jpg',
      publishedAt: 'Just now',
      imageUrl: undefined,
      tags: ['RankPromotion', newRank.name.replace(/\s+/g, ''), 'PKSFramework', 'StudentCreatives'],
      applauseCount: 18,
      featuredPromotion: {
        memberName: member.fullName,
        memberAvatar: member.avatarUrl,
        prevRank: prevRank.name,
        newRank: newRank.name,
        totalPks: newPoints,
        badgeColor: newRank.badgeColor,
      },
    };

    const path = `feed_posts/${promotionPost.id}`;
    try {
      await setDoc(doc(db, 'feed_posts', promotionPost.id), promotionPost);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  // Add Member
  const addMember = async (memberData: Omit<User, 'id'>, initialPks: number = 0) => {
    const newId = `user_${Date.now()}`;
    const newUserRaw: User = {
      ...memberData,
      id: newId,
      officerRole: (memberData.officerRole as OfficerRole) || 'None',
      projectHeadRoles: memberData.projectHeadRoles || [],
    };
    const newUser = Object.fromEntries(
      Object.entries(newUserRaw).filter(([, v]) => v !== undefined)
    ) as User;

    const path = `users/${newId}`;
    try {
      await setDoc(doc(db, 'users', newId), newUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return;
    }

    if (initialPks > 0) {
      const baselineEntry: MLogEntry = {
        id: `mlog_init_${Date.now()}`,
        memberId: newId,
        memberName: newUser.fullName,
        memberAvatar: newUser.avatarUrl,
        eventTitle: 'Academic Year Initial Baseline / Starting PKS',
        date: new Date().toISOString().split('T')[0],
        roleOrAward: 'Starting Baseline Member Credit',
        codes: ['BASELINE_INIT'],
        pillarPoints: {
          C: Math.round(initialPks * 0.25),
          P: Math.round(initialPks * 0.35),
          B: Math.round(initialPks * 0.2),
          R: Math.round(initialPks * 0.1),
          S: Math.round(initialPks * 0.1),
        },
        totalPoints: initialPks,
        remarks: 'Initial starting PKS balance established at onboarding / app startup.',
        status: 'verified',
        verifiedBy: currentUser
          ? `${currentUser.fullName} (${currentUser.officerRole || currentUser.role})`
          : 'System Administrator',
        verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      try {
        await setDoc(doc(db, 'mlog_entries', baselineEntry.id), baselineEntry);
      } catch (e) {
        console.warn('Could not write baseline entry:', e);
      }

      const initialRank = getRankTierForPks(initialPks);
      if (initialRank.minPks > 0) {
        publishPromotionToFeed(
          newUser,
          RANK_TIERS[0],
          initialRank,
          initialPks,
          'Initial Member Standing & Service Accreditation'
        );
      }
    }

    showToast(
      `Account created for ${newUser.fullName} (@${newUser.username})${
        initialPks > 0 ? ` with +${initialPks} starting PKS baseline` : ''
      }`,
      'success'
    );
  };

  const updateMemberRole = async (memberId: string, newRole: UserRole, isOfficer?: boolean) => {
    const officerStatus = isOfficer !== undefined ? isOfficer : isElevatedRole(newRole);
    const isOffRole = isElevatedRole(newRole);
    const updates = {
      role: newRole,
      officerRole: isOffRole ? (newRole as OfficerRole) : 'None',
      isOfficer: officerStatus,
    };

    const path = `users/${memberId}`;
    try {
      await updateDoc(doc(db, 'users', memberId), updates);
      showToast('Member role & permissions updated in Cloud Firestore.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const updateMemberDualRoles = async (
    memberId: string,
    officerRole: OfficerRole,
    projectHeadRoles: string[] = [],
    isOfficer?: boolean
  ) => {
    const hasElevatedOfficer = officerRole !== 'None' && isElevatedRole(officerRole);
    const hasProjectHead = projectHeadRoles.length > 0;
    const user = allUsers.find((u) => u.id === memberId);
    const officerStatus =
      isOfficer !== undefined
        ? isOfficer
        : hasElevatedOfficer || hasProjectHead || user?.role === 'SuperAdmin';

    const primaryRole =
      officerRole !== 'None'
        ? officerRole
        : hasProjectHead
        ? `Project Head (${projectHeadRoles[0]})`
        : 'Member';

    const updates = {
      officerRole,
      projectHeadRoles,
      role: primaryRole,
      isOfficer: officerStatus,
    };

    const path = `users/${memberId}`;
    try {
      await updateDoc(doc(db, 'users', memberId), updates);
      showToast('Dual status and leadership roles updated in Cloud Firestore.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const updateMemberProfile = async (memberId: string, updates: Partial<User>) => {
    // Sanitize updates: strip any undefined fields to comply with Firestore
    const sanitizedUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        sanitizedUpdates[key] = value;
      }
    }

    // Update local state optimistically
    setAllUsers((prev) =>
      prev.map((u) => (u.id === memberId ? { ...u, ...sanitizedUpdates } : u))
    );

    const path = `users/${memberId}`;
    try {
      await updateDoc(doc(db, 'users', memberId), sanitizedUpdates);
      showToast('Member profile updated in Cloud Firestore.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteMember = async (memberId: string): Promise<boolean> => {
    if (currentUser?.role !== 'SuperAdmin' && !currentUser?.isOfficer) {
      showToast('Unauthorized: Only officers or SuperAdmin can delete members.', 'error');
      return false;
    }

    if (currentUser?.id === memberId) {
      showToast('Cannot delete your own active account while logged in.', 'error');
      return false;
    }

    const target = allUsers.find((u) => u.id === memberId);
    const path = `users/${memberId}`;
    try {
      await deleteDoc(doc(db, 'users', memberId));
      setAllUsers((prev) => prev.filter((u) => u.id !== memberId));
      showToast(`Member ${target?.fullName || memberId} deleted from Cloud Firestore.`, 'info');
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      return false;
    }
  };

  const updateProfilePhoto = async (imageSource: File | string): Promise<string> => {
    if (!currentUser) throw new Error('No user is currently authenticated.');
    showToast('Uploading photo to Firebase Storage...', 'info');
    const photoUrl = await uploadProfilePhotoToStorage(currentUser.id, imageSource);
    await updateMemberProfile(currentUser.id, { avatarUrl: photoUrl });
    showToast('Profile photo updated & saved to Firebase Storage!', 'success');
    return photoUrl;
  };

  // Manual M.Log Entry directly saved to Firestore
  const addManualMLogEntry = async (entry: Omit<MLogEntry, 'id' | 'submittedAt'>) => {
    const prevPoints = getMemberPks(entry.memberId);
    const prevRank = getRankTierForPks(prevPoints);
    const nextPoints = prevPoints + entry.totalPoints;
    const nextRank = getRankTierForPks(nextPoints);

    const newEntry: MLogEntry = {
      ...entry,
      id: `mlog_${Date.now()}`,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const path = `mlog_entries/${newEntry.id}`;
    try {
      await setDoc(doc(db, 'mlog_entries', newEntry.id), newEntry);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return;
    }

    if (nextRank.minPks > prevRank.minPks && entry.status === 'verified') {
      const member = allUsers.find((u) => u.id === entry.memberId) || {
        id: entry.memberId,
        fullName: entry.memberName,
        avatarUrl: entry.memberAvatar,
        nickname: entry.memberName.split(' ')[0],
      };
      publishPromotionToFeed(member, prevRank, nextRank, nextPoints, entry.eventTitle);
      showToast(
        `🎉 Rank Promotion! ${entry.memberName} dynamically advanced to ${nextRank.name} (${nextPoints} PKS)! Published to Feed.`,
        'success'
      );
    } else {
      showToast(`M.Log entry recorded: +${newEntry.totalPoints} PKS for ${newEntry.memberName}`, 'success');
    }
  };

  // Synchronize an officer role assignment with a verified M.Log entry (B4 / B3)
  const syncOfficerLeadershipMLog = async (params: {
    memberId: string;
    officerRole: OfficerRole;
    academicYear?: string;
    remarks?: string;
    projectsLed?: string[];
  }): Promise<MLogEntry | null> => {
    const {
      memberId,
      officerRole,
      academicYear = systemSettings.academicYear || '2025–2026',
      remarks,
      projectsLed,
    } = params;

    if (!officerRole || officerRole === 'None') return null;

    const targetUser = allUsers.find((u) => u.id === memberId);
    if (!targetUser) return null;

    const pksConfig = getLeadershipPksCodeForRole(officerRole);
    if (!pksConfig) return null;

    // Check if an entry already exists for this member and role in this academic year
    const existingSync = isOfficerRoleSyncedWithMLog(targetUser, mLogEntries, academicYear);
    if (existingSync.isSynced && existingSync.matchedEntry) {
      showToast(
        `${targetUser.fullName}'s ${officerRole} role is already aligned with M.Log (+${existingSync.matchedEntry.totalPoints} PKS).`,
        'info'
      );
      return existingSync.matchedEntry;
    }

    const projectsText = projectsLed && projectsLed.length > 0 ? ` Major projects: ${projectsLed.join(', ')}.` : '';
    const finalRemarks =
      remarks?.trim() ||
      `Official appointment / election as FPC ${officerRole} for Academic Year ${academicYear}.${projectsText}`;

    const newEntry: MLogEntry = {
      id: `mlog_officer_${memberId}_${Date.now()}`,
      memberId: targetUser.id,
      memberName: targetUser.fullName,
      memberAvatar: targetUser.avatarUrl,
      eventTitle: `Executive Board Stewardship: ${officerRole} (A.Y. ${academicYear})`,
      date: new Date().toISOString().split('T')[0],
      roleOrAward: `FPC Officer: ${officerRole}`,
      codes: [pksConfig.code, 'S6'],
      pillarPoints: {
        C: 0,
        P: 0,
        B: pksConfig.points,
        R: 0,
        S: 0,
      },
      totalPoints: pksConfig.points,
      remarks: finalRemarks,
      status: 'verified',
      verifiedBy: currentUser ? `${currentUser.fullName} (${currentUser.officerRole || 'Admin'})` : 'FPC Board of Officers',
      verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const prevPoints = getMemberPks(targetUser.id);
    const prevRank = getRankTierForPks(prevPoints);
    const nextPoints = prevPoints + newEntry.totalPoints;
    const nextRank = getRankTierForPks(nextPoints);

    const path = `mlog_entries/${newEntry.id}`;
    try {
      await setDoc(doc(db, 'mlog_entries', newEntry.id), newEntry);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return null;
    }

    if (nextRank.minPks > prevRank.minPks) {
      publishPromotionToFeed(targetUser, prevRank, nextRank, nextPoints, newEntry.eventTitle);
      showToast(
        `🎉 Rank Promotion! ${targetUser.fullName} advanced to ${nextRank.name} (${nextPoints} PKS) via Executive Leadership credit!`,
        'success'
      );
    } else {
      showToast(
        `Leadership Synced: +${newEntry.totalPoints} PKS (${pksConfig.code}) recorded in M.Log for ${targetUser.fullName} (${officerRole})`,
        'success'
      );
    }

    return newEntry;
  };

  // Member M.Log verification request
  const submitMemberMLogRequest = async (request: {
    eventTitle: string;
    roleOrAward: string;
    codes: string[];
    remarks: string;
    proofUrl?: string;
  }) => {
    if (!currentUser) return;

    const { total, breakdown } = calculatePksFromCodes(request.codes);
    const newEntry: MLogEntry = {
      id: `mlog_req_${Date.now()}`,
      memberId: currentUser.id,
      memberName: currentUser.fullName,
      memberAvatar: currentUser.avatarUrl,
      eventTitle: request.eventTitle,
      date: new Date().toISOString().split('T')[0],
      roleOrAward: request.roleOrAward,
      codes: request.codes,
      pillarPoints: breakdown,
      totalPoints: total,
      remarks: request.remarks,
      proofUrl: request.proofUrl,
      status: 'pending',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const path = `mlog_entries/${newEntry.id}`;
    try {
      await setDoc(doc(db, 'mlog_entries', newEntry.id), newEntry);
      showToast('Your M.Log entry has been queued for Officer Verification.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  // Officer verifies M.Log entry
  const verifyMLogEntry = async (entryId: string, status: 'verified' | 'rejected', notes?: string) => {
    if (!currentUser?.isOfficer) {
      showToast('Unauthorized: Only officers may verify entries.', 'error');
      return;
    }

    const targetEntry = mLogEntries.find((e) => e.id === entryId);
    if (!targetEntry) return;

    const prevPoints = getMemberPks(targetEntry.memberId);
    const prevRank = getRankTierForPks(prevPoints);
    const nextPoints = prevPoints + targetEntry.totalPoints;
    const nextRank = getRankTierForPks(nextPoints);

    const updates = {
      status,
      verifiedBy: `${currentUser.fullName} (${currentUser.officerRole || currentUser.role})`,
      verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      remarks: notes ? `${targetEntry.remarks} [Officer Note: ${notes}]` : targetEntry.remarks,
    };

    const path = `mlog_entries/${entryId}`;
    try {
      await updateDoc(doc(db, 'mlog_entries', entryId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return;
    }

    if (targetEntry && status === 'verified' && nextRank.minPks > prevRank.minPks) {
      const member = allUsers.find((u) => u.id === targetEntry.memberId) || {
        id: targetEntry.memberId,
        fullName: targetEntry.memberName,
        avatarUrl: targetEntry.memberAvatar,
        nickname: targetEntry.memberName.split(' ')[0],
      };
      publishPromotionToFeed(member, prevRank, nextRank, nextPoints, targetEntry.eventTitle);
      showToast(
        `🎉 Rank Promotion! ${targetEntry.memberName} dynamically promoted to ${nextRank.name} (${nextPoints} PKS)! Published to Feed.`,
        'success'
      );
    } else {
      showToast(
        status === 'verified' ? 'Entry verified and PKS ledger credited.' : 'Entry marked as rejected.',
        status === 'verified' ? 'success' : 'info'
      );
    }
  };

  // Officer updates/adjusts M.Log entry
  const updateMLogEntry = async (entryId: string, updates: Partial<MLogEntry>) => {
    if (!currentUser?.isOfficer) {
      showToast('Unauthorized: Only officers may modify M.Log entries.', 'error');
      return;
    }

    const targetEntry = mLogEntries.find((e) => e.id === entryId);
    if (!targetEntry) return;

    const prevPoints = getMemberPks(targetEntry.memberId);
    const prevRank = getRankTierForPks(prevPoints);

    let nextPillarPoints = updates.pillarPoints || targetEntry.pillarPoints;
    let nextTotalPoints = updates.totalPoints !== undefined ? updates.totalPoints : targetEntry.totalPoints;

    if (updates.codes && (!updates.pillarPoints || updates.totalPoints === undefined)) {
      const calc = calculatePksFromCodes(updates.codes);
      nextPillarPoints = calc.breakdown;
      nextTotalPoints = calc.total;
    }

    const payload = {
      ...updates,
      pillarPoints: nextPillarPoints,
      totalPoints: nextTotalPoints,
    };

    const path = `mlog_entries/${entryId}`;
    try {
      await updateDoc(doc(db, 'mlog_entries', entryId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return;
    }

    const targetMember = allUsers.find((u) => u.id === targetEntry.memberId);
    const nextPoints = prevPoints + (nextTotalPoints - targetEntry.totalPoints);
    const nextRank = getRankTierForPks(nextPoints);

    if (nextRank.minPks > prevRank.minPks) {
      const member = targetMember || {
        id: targetEntry.memberId,
        fullName: targetEntry.memberName,
        avatarUrl: targetEntry.memberAvatar,
        nickname: targetEntry.memberName.split(' ')[0],
      };
      publishPromotionToFeed(member, prevRank, nextRank, nextPoints, targetEntry.eventTitle);
      showToast(
        `🎉 Dynamic Rank Updated! ${targetMember?.fullName || targetEntry.memberName} rank badge is now ${nextRank.name} (${nextPoints} PKS)! Published to Feed.`,
        'success'
      );
    } else {
      showToast(`M.Log entry updated in Cloud Firestore.`, 'success');
    }
  };

  // Officer deletes entry
  const deleteMLogEntry = async (entryId: string) => {
    if (!currentUser?.isOfficer) {
      showToast('Unauthorized: Only officers may remove ledger entries.', 'error');
      return;
    }
    const path = `mlog_entries/${entryId}`;
    try {
      await deleteDoc(doc(db, 'mlog_entries', entryId));
      showToast('Ledger entry removed from Cloud Firestore.', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // Events & Contests Creation
  const createEvent = async (
    eventData: Omit<
      EventAssignment,
      'id' | 'assignedCrewIds' | 'volunteerCrewIds' | 'submittedEntriesCount'
    >
  ) => {
    const newEvent = stripUndefinedDeep<EventAssignment>({
      ...eventData,
      id: `event_${Date.now()}`,
      assignedCrewIds: [],
      volunteerCrewIds: [],
      submittedEntriesCount: 0,
    });

    const path = `events/${newEvent.id}`;
    try {
      await setDoc(doc(db, 'events', newEvent.id), newEvent);
      setEvents((prev) => (prev.some((e) => e.id === newEvent.id) ? prev : [newEvent, ...prev]));

      const eventTypeLabel = getEventTypeLabel(newEvent.type);
      await dispatchNotificationToFirestore({
        userId: 'all',
        title: `New ${eventTypeLabel}: ${newEvent.title}`,
        message: newEvent.description
          ? newEvent.description.length > 120
            ? `${newEvent.description.slice(0, 117)}...`
            : newEvent.description
          : `Scheduled on ${newEvent.date} at ${newEvent.location}. Open for volunteer crew signups.`,
        eventId: newEvent.id,
        eventType: newEvent.type,
        type: 'new_event',
        bannerUrl: newEvent.bannerUrl,
      });

      showToast(`Published: ${newEvent.title}`, 'success');
    } catch (error) {
      showToast('Failed to publish event to Cloud Firestore. Please check event details and try again.', 'error');
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const toggleVolunteer = async (eventId: string) => {
    if (!currentUser) return;
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;

    const isVolunteered = ev.volunteerCrewIds.includes(currentUser.id);
    const newVolunteers = isVolunteered
      ? ev.volunteerCrewIds.filter((id) => id !== currentUser.id)
      : [...ev.volunteerCrewIds, currentUser.id];

    const path = `events/${eventId}`;
    try {
      await updateDoc(doc(db, 'events', eventId), { volunteerCrewIds: newVolunteers });
      showToast(
        isVolunteered ? 'Withdrawn from volunteer roster.' : 'You signed up as volunteer!',
        'info'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const assignCrew = async (eventId: string, memberIds: string[]) => {
    const ev = events.find((e) => e.id === eventId);
    const prevAssigned = new Set(ev?.assignedCrewIds || []);
    const newlyAdded = memberIds.filter((id) => !prevAssigned.has(id));

    const path = `events/${eventId}`;
    try {
      await updateDoc(doc(db, 'events', eventId), { assignedCrewIds: memberIds });
      if (ev && newlyAdded.length > 0) {
        await Promise.all(
          newlyAdded.map((memberId) =>
            dispatchNotificationToFirestore({
              userId: memberId,
              title: `Crew Assignment: ${ev.title}`,
              message: `You have been assigned to the crew for "${ev.title}" on ${ev.date} at ${ev.location}.`,
              eventId: ev.id,
              eventType: ev.type,
              type: 'role_assigned',
              bannerUrl: ev.bannerUrl,
              roleTitle: 'Assigned Crew',
            })
          )
        );
      }
      showToast('Crew assignments saved to Cloud Firestore.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<EventAssignment>) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) {
      showToast('Event not found.', 'error');
      return;
    }
    if (!canManageEvent(currentUser, ev)) {
      showToast('Unauthorized: Only Admins and the designated Project Head can update this event.', 'error');
      return;
    }

    const rawPayload: Partial<EventAssignment> = { ...updates };
    if (updates.status === 'completed' && !ev.completedAt && !updates.completedAt) {
      rawPayload.completedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    }
    const cleanPayload = stripUndefinedDeep(rawPayload);

    // Detect newly assigned crew slots or general crew additions before updating state
    const notifiedKeys = new Set<string>();
    const pendingRoleAlerts: Array<{ memberId: string; roleTitle: string }> = [];

    if (cleanPayload.crewSlots) {
      cleanPayload.crewSlots.forEach((nextSlot) => {
        const prevSlot = (ev.crewSlots || []).find((s) => s.id === nextSlot.id);
        const prevAssignedSet = new Set(prevSlot?.assignedMemberIds || []);
        nextSlot.assignedMemberIds.forEach((memberId) => {
          if (!prevAssignedSet.has(memberId)) {
            const key = `${memberId}::${nextSlot.role}`;
            if (!notifiedKeys.has(key)) {
              notifiedKeys.add(key);
              pendingRoleAlerts.push({ memberId, roleTitle: nextSlot.role });
            }
          }
        });
      });
    } else if (cleanPayload.assignedCrewIds) {
      const prevOverall = new Set(ev.assignedCrewIds || []);
      cleanPayload.assignedCrewIds.forEach((memberId) => {
        if (!prevOverall.has(memberId)) {
          pendingRoleAlerts.push({ memberId, roleTitle: 'Assigned Crew' });
        }
      });
    }

    const path = `events/${eventId}`;
    try {
      await updateDoc(doc(db, 'events', eventId), cleanPayload);
      setEvents((prev) => prev.map((item) => (item.id === eventId ? { ...item, ...cleanPayload } : item)));

      if (pendingRoleAlerts.length > 0) {
        const targetTitle = cleanPayload.title || ev.title;
        const targetDate = cleanPayload.date || ev.date;
        const targetLocation = cleanPayload.location || ev.location;
        const targetType = (cleanPayload.type || ev.type) as EventType;
        const targetBanner = cleanPayload.bannerUrl ?? ev.bannerUrl;

        await Promise.all(
          pendingRoleAlerts.map(({ memberId, roleTitle }) =>
            dispatchNotificationToFirestore({
              userId: memberId,
              title: `Role Assigned: ${roleTitle}`,
              message: `You were assigned as ${roleTitle} for "${targetTitle}" on ${targetDate} at ${targetLocation}.`,
              eventId: ev.id,
              eventType: targetType,
              type: 'role_assigned',
              bannerUrl: targetBanner,
              roleTitle,
            })
          )
        );
      }

      showToast(`"${ev.title}" updated successfully in Cloud Firestore.`, 'success');
    } catch (error) {
      showToast('Failed to update event in Cloud Firestore.', 'error');
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteEvent = async (eventId: string) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;
    if (!canManageEvent(currentUser, ev)) {
      showToast('Unauthorized: Only Admins and the designated Project Head can delete this event.', 'error');
      return;
    }

    setEvents((prev) => prev.filter((item) => item.id !== eventId));

    const path = `events/${eventId}`;
    try {
      await deleteDoc(doc(db, 'events', eventId));
      showToast(`Event "${ev.title}" deleted from schedule.`, 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateEventStatus = async (eventId: string, status: 'upcoming' | 'ongoing' | 'completed') => {
    const ev = events.find((e) => e.id === eventId);
    if (ev && !canManageEvent(currentUser, ev)) {
      showToast('Unauthorized: Only Admins and the designated Project Head can update status.', 'error');
      return;
    }

    const payload: Partial<EventAssignment> = { status };
    if (status === 'completed') {
      payload.completedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    }

    setEvents((prev) => prev.map((item) => (item.id === eventId ? { ...item, ...payload } : item)));

    const path = `events/${eventId}`;
    try {
      await updateDoc(doc(db, 'events', eventId), payload);
      showToast(
        status === 'completed'
          ? `Event completed! Project Head & Admins can now approve participant credits.`
          : `Event status updated to ${status}.`,
        'info'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Participant Credit Approval for completed Events & Contests
  const approveParticipantCredit = async (params: {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    memberId: string;
    memberName: string;
    memberAvatar: string;
    codes: string[];
    roleOrAward: string;
    remarks?: string;
  }) => {
    const ev = events.find((e) => e.id === params.eventId);
    if (ev && !canManageEvent(currentUser, ev)) {
      showToast('Unauthorized: Only Admins and the designated Project Head can approve participant credits.', 'error');
      return;
    }

    const { total, breakdown } = calculatePksFromCodes(params.codes);
    const prevPoints = getMemberPks(params.memberId);
    const prevRank = getRankTierForPks(prevPoints);
    const nextPoints = prevPoints + total;
    const nextRank = getRankTierForPks(nextPoints);

    const approverName = currentUser
      ? `${currentUser.fullName} (${currentUser.officerRole || currentUser.role})`
      : 'Project Head / Board';

    const newEntry: MLogEntry = {
      id: `mlog_cred_${Date.now()}_${params.memberId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`,
      memberId: params.memberId,
      memberName: params.memberName,
      memberAvatar: params.memberAvatar,
      eventTitle: params.eventTitle,
      eventId: params.eventId,
      date: params.eventDate,
      roleOrAward: params.roleOrAward,
      codes: params.codes,
      pillarPoints: breakdown,
      totalPoints: total,
      remarks:
        params.remarks ||
        `Approved participation credit for "${params.eventTitle}". Verified by ${approverName}.`,
      status: 'verified',
      verifiedBy: approverName,
      verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const pathEntry = `mlog_entries/${newEntry.id}`;
    try {
      await setDoc(doc(db, 'mlog_entries', newEntry.id), newEntry);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, pathEntry);
      return;
    }

    // Update event credited list
    if (ev) {
      const nextCredited = Array.from(new Set([...(ev.creditedMemberIds || []), params.memberId]));
      const pathEv = `events/${ev.id}`;
      try {
        await updateDoc(doc(db, 'events', ev.id), {
          creditedMemberIds: nextCredited,
          creditsApproved: true,
        });
        setEvents((prev) =>
          prev.map((item) =>
            item.id === ev.id ? { ...item, creditedMemberIds: nextCredited, creditsApproved: true } : item
          )
        );
      } catch (e) {
        console.warn('Could not update event creditedMemberIds:', e);
      }
    }

    // Auto-verify matching pending M.Log request if present
    const existingPending = mLogEntries.find(
      (e) =>
        (e.eventId === params.eventId || e.eventTitle === params.eventTitle) &&
        e.memberId === params.memberId &&
        e.status === 'pending'
    );
    if (existingPending) {
      try {
        await updateDoc(doc(db, 'mlog_entries', existingPending.id), {
          status: 'verified',
          verifiedBy: approverName,
          verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        });
      } catch (e) {
        console.warn('Could not auto-verify existing pending entry:', e);
      }
    }

    // Celebrate dynamic rank promotion if advanced
    if (nextRank.minPks > prevRank.minPks) {
      const targetMember = allUsers.find((u) => u.id === params.memberId) || {
        id: params.memberId,
        fullName: params.memberName,
        avatarUrl: params.memberAvatar,
        nickname: params.memberName.split(' ')[0],
      };
      publishPromotionToFeed(targetMember, prevRank, nextRank, nextPoints, params.eventTitle);
      showToast(
        `🎉 Rank Promotion! ${params.memberName} advanced to ${nextRank.name} (${nextPoints} PKS)! Published to Feed.`,
        'success'
      );
    } else {
      showToast(`Credit Approved: +${total} PKS for ${params.memberName}`, 'success');
    }
  };

  const batchApproveParticipantCredits = async (params: {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    participantIds: string[];
    codes: string[];
    roleOrAward: string;
  }) => {
    const ev = events.find((e) => e.id === params.eventId);
    if (ev && !canManageEvent(currentUser, ev)) {
      showToast('Unauthorized: Only Admins and the designated Project Head can approve participant credits.', 'error');
      return;
    }

    const alreadyCredited = new Set(ev?.creditedMemberIds || []);
    const toCreditIds = params.participantIds.filter((id) => !alreadyCredited.has(id));

    if (toCreditIds.length === 0) {
      showToast('All selected participants are already credited for this event.', 'info');
      return;
    }

    for (const memberId of toCreditIds) {
      const member = allUsers.find((u) => u.id === memberId);
      if (!member) continue;
      await approveParticipantCredit({
        eventId: params.eventId,
        eventTitle: params.eventTitle,
        eventDate: params.eventDate,
        memberId: member.id,
        memberName: member.fullName,
        memberAvatar: member.avatarUrl,
        codes: params.codes,
        roleOrAward: params.roleOrAward,
      });
    }

    showToast(`Batch approved credits for ${toCreditIds.length} participant(s)!`, 'success');
  };

  // Creator & Admin: Update PKS codes for a specific crew slot
  const updateCrewSlotPks = async (eventId: string, slotId: string, pksCodes: string[]) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;
    if (!canManageEvent(currentUser, ev)) {
      showToast('Unauthorized: Only Admins and the Project Head can update role PKS codes.', 'error');
      return;
    }

    const currentSlots = ev.crewSlots || [];
    const updatedSlots = currentSlots.map((slot) =>
      slot.id === slotId ? { ...slot, pksCodes } : slot
    );

    await updateEvent(eventId, { crewSlots: updatedSlots });
    showToast('Crew role PKS codes updated in Cloud Firestore.', 'success');
  };

  // Member: Volunteer for a specific crew role
  const volunteerForCrewRole = async (eventId: string, slotId: string) => {
    if (!currentUser) return;
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;

    const currentSlots = ev.crewSlots || [];
    const targetSlot = currentSlots.find((s) => s.id === slotId);
    if (!targetSlot) return;

    const updatedSlots = currentSlots.map((slot) => {
      const withoutUser = slot.volunteerMemberIds.filter((id) => id !== currentUser.id);
      if (slot.id === slotId) {
        return {
          ...slot,
          volunteerMemberIds: withoutUser.includes(currentUser.id) ? withoutUser : [...withoutUser, currentUser.id],
        };
      }
      return {
        ...slot,
        volunteerMemberIds: withoutUser,
      };
    });

    const updatedOverallVolunteers = Array.from(new Set([...(ev.volunteerCrewIds || []), currentUser.id]));

    await updateEvent(eventId, {
      crewSlots: updatedSlots,
      volunteerCrewIds: updatedOverallVolunteers,
    });
    showToast(`You signed up as volunteer for "${targetSlot.role}"!`, 'success');
  };

  // Member: Withdraw volunteering from a specific crew role
  const withdrawVolunteerCrewRole = async (eventId: string, slotId: string) => {
    if (!currentUser) return;
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;

    const currentSlots = ev.crewSlots || [];
    const updatedSlots = currentSlots.map((slot) => {
      if (slot.id === slotId) {
        return {
          ...slot,
          volunteerMemberIds: slot.volunteerMemberIds.filter((id) => id !== currentUser.id),
        };
      }
      return slot;
    });

    const hasOtherRole = updatedSlots.some((s) => s.volunteerMemberIds.includes(currentUser.id));
    const updatedOverallVolunteers = hasOtherRole
      ? ev.volunteerCrewIds
      : (ev.volunteerCrewIds || []).filter((id) => id !== currentUser.id);

    await updateEvent(eventId, {
      crewSlots: updatedSlots,
      volunteerCrewIds: updatedOverallVolunteers,
    });
    showToast('Withdrawn from role volunteer list.', 'info');
  };

  // Creator / Admin / Head: Assign member to specific crew slot
  const assignMemberToCrewSlot = async (eventId: string, slotId: string, memberId: string) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev || !canManageEvent(currentUser, ev)) {
      showToast('Unauthorized: Only Admins and the Project Head can assign crew slots.', 'error');
      return;
    }

    const currentSlots = ev.crewSlots || [];
    const targetSlot = currentSlots.find((s) => s.id === slotId);
    if (!targetSlot) return;

    const updatedSlots = currentSlots.map((slot) => {
      if (slot.id === slotId) {
        const withoutMember = slot.assignedMemberIds.filter((id) => id !== memberId);
        return {
          ...slot,
          assignedMemberIds: [...withoutMember, memberId],
          volunteerMemberIds: slot.volunteerMemberIds.filter((id) => id !== memberId),
        };
      }
      return slot;
    });

    const updatedOverallAssigned = Array.from(new Set([...(ev.assignedCrewIds || []), memberId]));

    await updateEvent(eventId, {
      crewSlots: updatedSlots,
      assignedCrewIds: updatedOverallAssigned,
    });
    const member = allUsers.find((u) => u.id === memberId);
    showToast(`Assigned ${member?.nickname || 'member'} as ${targetSlot.role}!`, 'success');
  };

  // Creator / Admin / Head: Remove member from specific crew slot
  const removeMemberFromCrewSlot = async (eventId: string, slotId: string, memberId: string) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev || !canManageEvent(currentUser, ev)) {
      showToast('Unauthorized: Only Admins and the Project Head can manage crew slots.', 'error');
      return;
    }

    const currentSlots = ev.crewSlots || [];
    const updatedSlots = currentSlots.map((slot) => {
      if (slot.id === slotId) {
        return {
          ...slot,
          assignedMemberIds: slot.assignedMemberIds.filter((id) => id !== memberId),
        };
      }
      return slot;
    });

    const hasOtherSlot = updatedSlots.some((s) => s.assignedMemberIds.includes(memberId));
    const updatedOverallAssigned = hasOtherSlot
      ? ev.assignedCrewIds
      : (ev.assignedCrewIds || []).filter((id) => id !== memberId);

    await updateEvent(eventId, {
      crewSlots: updatedSlots,
      assignedCrewIds: updatedOverallAssigned,
    });
    showToast('Crew member removed from slot.', 'info');
  };

  // Contest Submissions
  const submitToContest = async (submission: {
    eventId: string;
    eventTitle: string;
    title: string;
    caption: string;
    imageUrl: string;
  }) => {
    if (!currentUser) return;

    const newSub: ContestSubmission = {
      id: `sub_${Date.now()}`,
      eventId: submission.eventId,
      eventTitle: submission.eventTitle,
      memberId: currentUser.id,
      memberName: currentUser.fullName,
      memberAvatar: currentUser.avatarUrl,
      title: submission.title,
      caption: submission.caption,
      imageUrl: submission.imageUrl,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending',
    };

    const pathSub = `contest_submissions/${newSub.id}`;
    try {
      await setDoc(doc(db, 'contest_submissions', newSub.id), newSub);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, pathSub);
      return;
    }

    // Increment event counter
    const ev = events.find((e) => e.id === submission.eventId);
    if (ev) {
      try {
        await updateDoc(doc(db, 'events', ev.id), {
          submittedEntriesCount: (ev.submittedEntriesCount || 0) + 1,
        });
      } catch (e) {
        console.warn('Could not increment contest count:', e);
      }
    }

    // Auto-queue P5 (15 PKS) Participation M.Log request
    const { total, breakdown } = calculatePksFromCodes(['P5']);
    const mlogReq: MLogEntry = {
      id: `mlog_sub_${Date.now()}`,
      memberId: currentUser.id,
      memberName: currentUser.fullName,
      memberAvatar: currentUser.avatarUrl,
      eventTitle: `Contest Entry: ${submission.eventTitle}`,
      date: new Date().toISOString().split('T')[0],
      roleOrAward: `Contest Participant (${submission.title})`,
      codes: ['P5'],
      pillarPoints: breakdown,
      totalPoints: total,
      remarks: `Submitted entry "${submission.title}". Eligible for P5 School Contest Participant score.`,
      proofUrl: submission.imageUrl,
      status: 'pending',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    try {
      await setDoc(doc(db, 'mlog_entries', mlogReq.id), mlogReq);
    } catch (e) {
      console.warn('Could not write participant M.Log request:', e);
    }

    showToast('Your contest entry has been saved to Cloud Firestore and queued for judging!', 'success');
  };

  const reviewSubmission = async (
    submissionId: string,
    status: 'approved' | 'featured' | 'rejected',
    awardWon?: string,
    awardPksCodes?: string[]
  ) => {
    const pathSub = `contest_submissions/${submissionId}`;
    try {
      await updateDoc(doc(db, 'contest_submissions', submissionId), {
        status,
        ...(awardWon ? { awardWon } : {}),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, pathSub);
      return;
    }

    const sub = contestSubmissions.find((s) => s.id === submissionId);
    if (sub && awardPksCodes && awardPksCodes.length > 0 && status !== 'rejected') {
      const prevPoints = getMemberPks(sub.memberId);
      const prevRank = getRankTierForPks(prevPoints);
      const { total, breakdown } = calculatePksFromCodes(awardPksCodes);
      const nextPoints = prevPoints + total;
      const nextRank = getRankTierForPks(nextPoints);

      const awardEntry: MLogEntry = {
        id: `mlog_award_${Date.now()}`,
        memberId: sub.memberId,
        memberName: sub.memberName,
        memberAvatar: sub.memberAvatar,
        eventTitle: `Contest Award: ${sub.eventTitle}`,
        date: new Date().toISOString().split('T')[0],
        roleOrAward: awardWon || 'Contest Winner / Recognition',
        codes: awardPksCodes,
        pillarPoints: breakdown,
        totalPoints: total,
        remarks: `Recognized for entry "${sub.title}": ${awardWon || 'Contest Honor'}.`,
        proofUrl: sub.imageUrl,
        status: 'verified',
        verifiedBy: currentUser ? `${currentUser.fullName} (${currentUser.role})` : 'FPC Board',
        verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };

      try {
        await setDoc(doc(db, 'mlog_entries', awardEntry.id), awardEntry);
      } catch (e) {
        console.warn('Could not write award entry:', e);
      }

      if (nextRank.minPks > prevRank.minPks) {
        const member = allUsers.find((u) => u.id === sub.memberId) || {
          id: sub.memberId,
          fullName: sub.memberName,
          avatarUrl: sub.memberAvatar,
          nickname: sub.memberName.split(' ')[0],
        };
        publishPromotionToFeed(
          member,
          prevRank,
          nextRank,
          nextPoints,
          `Contest: ${sub.eventTitle} (${awardWon || 'Contest Award'})`
        );
      }
    }

    showToast(`Submission status updated to ${status}.`, 'success');
  };

  // Feed Posts
  const createFeedPost = async (postData: Omit<FeedPost, 'id' | 'publishedAt' | 'applauseCount'>) => {
    const newPost: FeedPost = {
      ...postData,
      id: `feed_${Date.now()}`,
      publishedAt: 'Just now',
      applauseCount: 1,
    };

    const path = `feed_posts/${newPost.id}`;
    try {
      await setDoc(doc(db, 'feed_posts', newPost.id), newPost);
      showToast('Feed announcement published to Cloud Firestore.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const applaudPost = async (postId: string) => {
    const post = feedPosts.find((p) => p.id === postId);
    if (!post) return;
    const path = `feed_posts/${postId}`;
    try {
      await updateDoc(doc(db, 'feed_posts', postId), {
        applauseCount: (post.applauseCount || 0) + 1,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // =========================================================================
  // MEMBER INVITE & REGISTRATION FLOW (SuperAdmin Gated)
  // =========================================================================
  const submitRegistration = async (
    registrationData: Omit<PendingRegistration, 'id' | 'requestedAt' | 'status'>
  ): Promise<{ success: boolean; message: string }> => {
    // 1. Verify invite registration is active
    if (systemSettings.inviteRegistrationActive === false) {
      return {
        success: false,
        message: 'Member registration via invite link is currently paused by the club administrator.',
      };
    }

    const cleanUsername = registrationData.username.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'Please enter a valid username.' };
    }

    // 2. Check if username is already taken by existing active member
    const existingMember = allUsers.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        (u.nickname && u.nickname.toLowerCase() === cleanUsername)
    );
    if (existingMember) {
      return {
        success: false,
        message: 'This username or handle is already used by an active member. Please choose another username.',
      };
    }

    // 3. Check if username has a pending application
    const existingPending = pendingRegistrations.find(
      (r) => r.status === 'pending' && r.username.toLowerCase() === cleanUsername
    );
    if (existingPending) {
      return {
        success: false,
        message: 'An application under this username is already waiting for administrator review.',
      };
    }

    const newId = `reg_${Date.now()}`;
    const newRegRaw: PendingRegistration = {
      ...registrationData,
      id: newId,
      username: cleanUsername,
      avatarUrl:
        registrationData.avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
    const newReg = Object.fromEntries(
      Object.entries(newRegRaw).filter(([, v]) => v !== undefined)
    ) as PendingRegistration;

    const path = `pending_registrations/${newId}`;
    try {
      await setDoc(doc(db, 'pending_registrations', newId), newReg);

      // Create high-priority system notification for all officers/admins via Firestore
      await dispatchNotificationToFirestore({
        userId: 'admins',
        title: 'New Member Registration',
        message: `${newReg.fullName} (@${newReg.username}) submitted membership registration awaiting your approval.`,
        type: 'system',
      });

      return {
        success: true,
        message: 'Registration submitted successfully! Your account will be activated once an administrator approves it.',
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return { success: false, message: 'Failed to submit registration. Please try again.' };
    }
  };

  const approveRegistration = async (
    registrationId: string,
    startingPks: number,
    assignedRole: UserRole = 'Member',
    isOfficer: boolean = false,
    officerRole: OfficerRole = 'None'
  ): Promise<boolean> => {
    const reg = pendingRegistrations.find((r) => r.id === registrationId);
    if (!reg) {
      showToast('Registration application record not found.', 'error');
      return false;
    }

    const newUserId = `user_${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      username: reg.username,
      password: reg.password || 'fpc2026',
      fullName: reg.fullName,
      nickname: reg.nickname || reg.fullName.split(' ')[0],
      avatarUrl:
        reg.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${reg.username}`,
      role: isOfficer && officerRole !== 'None' ? officerRole : assignedRole,
      officerRole: officerRole,
      isOfficer: isOfficer,
      creativeTags: reg.creativeTags || [],
      gradeSection: reg.gradeSection || 'Grade 11 - STEM',
      joinedDate: new Date().toISOString().split('T')[0],
      registrationDate: reg.registrationDate || new Date().toISOString().split('T')[0],
      ...(reg.birthdate ? { birthdate: reg.birthdate } : {}),
      batch: reg.batch || 'Batch Tres (2025–2026)',
      creativeGroup: (reg.creativeGroup as any) || 'photography',
      bio: reg.bio || 'Creative passionate about visual storytelling and media.',
    };

    const userPath = `users/${newUserId}`;
    try {
      // 1. Create active user record in Firestore
      await setDoc(doc(db, 'users', newUserId), newUser);

      // 2. If starting PKS is set (> 0), write verified baseline entry to mlog_entries
      if (startingPks > 0) {
        const baselineEntry: MLogEntry = {
          id: `mlog_init_${Date.now()}`,
          memberId: newUserId,
          memberName: newUser.fullName,
          memberAvatar: newUser.avatarUrl,
          eventTitle: 'Academic Year Initial Baseline / Starting PKS',
          date: new Date().toISOString().split('T')[0],
          roleOrAward: 'Starting Baseline Member Credit',
          codes: ['BASELINE_INIT'],
          pillarPoints: {
            C: Math.round(startingPks * 0.25),
            P: Math.round(startingPks * 0.35),
            B: Math.round(startingPks * 0.2),
            R: Math.round(startingPks * 0.1),
            S: Math.round(startingPks * 0.1),
          },
          totalPoints: startingPks,
          remarks: `Initial baseline balance of ${startingPks} PKS assigned by ${
            currentUser?.fullName || 'SuperAdmin'
          } upon approving registration invite.`,
          status: 'verified',
          verifiedBy: currentUser
            ? `${currentUser.fullName} (${currentUser.officerRole || currentUser.role})`
            : 'SuperAdmin',
          verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
        await setDoc(doc(db, 'mlog_entries', baselineEntry.id), baselineEntry);

        const initialRank = getRankTierForPks(startingPks);
        if (initialRank.minPks > 0) {
          publishPromotionToFeed(
            newUser,
            RANK_TIERS[0],
            initialRank,
            startingPks,
            'Initial Registration Onboarding Credit'
          );
        }
      }

      // 3. Update pending registration status to approved in Firestore
      await updateDoc(doc(db, 'pending_registrations', registrationId), {
        status: 'approved',
        reviewedBy: currentUser?.fullName || 'SuperAdmin',
        reviewedAt: new Date().toISOString(),
        initialPksGranted: startingPks,
      });

      // 4. Publish welcoming post on Feed
      await createFeedPost({
        category: 'announcement',
        authorName: currentUser?.fullName || 'Flashpoint Hub SuperAdmin',
        authorRole: currentUser?.officerRole || currentUser?.role || 'SuperAdmin',
        authorAvatar: currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
        title: `Welcome our new creative: ${newUser.fullName}! 🎨`,
        content: `Official welcome to ${newUser.fullName} (@${newUser.username}) who has been verified and approved into Flashpoint Creatives (${newUser.batch || 'Batch Tres'}) with ${startingPks} starting PKS!`,
        tags: ['NewMember', 'Welcome', 'FlashpointCreatives'],
      });

      showToast(`Approved ${newUser.fullName}! Account activated with ${startingPks} starting PKS.`, 'success');
      return true;
    } catch (error) {
      console.error('Error approving registration:', error);
      handleFirestoreError(error, OperationType.CREATE, userPath);
      return false;
    }
  };

  const rejectRegistration = async (registrationId: string, reason?: string): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'pending_registrations', registrationId), {
        status: 'rejected',
        rejectionReason: reason || 'Application declined by administrator.',
        reviewedBy: currentUser?.fullName || 'SuperAdmin',
        reviewedAt: new Date().toISOString(),
      });
      showToast('Registration application was declined.', 'info');
      return true;
    } catch (error) {
      console.error('Error rejecting registration:', error);
      showToast('Failed to decline registration.', 'error');
      return false;
    }
  };

  const toggleInviteRegistration = async (active: boolean): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'settings', 'global'), {
        inviteRegistrationActive: active,
      });
      setSystemSettings((prev) => ({ ...prev, inviteRegistrationActive: active }));
      showToast(`Member invite registration is now ${active ? 'Active (Open)' : 'Paused (Closed)'}.`, 'success');
      return true;
    } catch (error) {
      console.error('Error toggling invite registration:', error);
      showToast('Failed to update invite registration setting.', 'error');
      return false;
    }
  };

  const regenerateInviteCode = async (newCode?: string): Promise<boolean> => {
    const code = (newCode || `fpc-creative-${Math.random().toString(36).substring(2, 6)}`).toLowerCase().trim();
    try {
      await updateDoc(doc(db, 'settings', 'global'), {
        inviteCode: code,
      });
      setSystemSettings((prev) => ({ ...prev, inviteCode: code }));
      showToast(`Invite code updated to: ${code}`, 'success');
      return true;
    } catch (error) {
      console.error('Error regenerating invite code:', error);
      showToast('Failed to update invite code.', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loginWithGoogle,
        login,
        logout,
        switchUser,
        allUsers,
        isFirestoreLive,
        activeTab,
        setActiveTab,
        systemSettings,
        updateSystemSettings,
        addMember,
        updateMemberRole,
        updateMemberDualRoles,
        updateMemberProfile,
        deleteMember,
        updateProfilePhoto,
        getMemberPks,
        getMemberRank,
        getMemberProgress,
        getMemberPillarBreakdown,
        syncOfficerLeadershipMLog,
        mLogEntries,
        addManualMLogEntry,
        submitMemberMLogRequest,
        verifyMLogEntry,
        updateMLogEntry,
        deleteMLogEntry,
        events,
        createEvent,
        updateEvent,
        deleteEvent,
        toggleVolunteer,
        assignCrew,
        updateEventStatus,
        approveParticipantCredit,
        batchApproveParticipantCredits,
        updateCrewSlotPks,
        volunteerForCrewRole,
        withdrawVolunteerCrewRole,
        assignMemberToCrewSlot,
        removeMemberFromCrewSlot,
        contestSubmissions,
        submitToContest,
        reviewSubmission,
        feedPosts,
        createFeedPost,
        applaudPost,
        toasts,
        showToast,
        dismissToast,
        notifications,
        unreadNotificationCount,
        browserNotificationPermission,
        requestBrowserNotificationPermission,
        sendPushNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        selectedNotificationEventId,
        setSelectedNotificationEventId,
        pendingRegistrations,
        submitRegistration,
        approveRegistration,
        rejectRegistration,
        toggleInviteRegistration,
        regenerateInviteCode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

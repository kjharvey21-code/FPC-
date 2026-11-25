import { EventCrewSlot } from '../types';
import { calculatePksFromCodes } from './pksFramework';

export interface CrewRoleTemplate {
  role: string;
  category: 'photography' | 'videography' | 'design' | 'production' | 'general';
  defaultSpots: number;
  defaultPksCodes: string[];
  notes: string;
}

export const STANDARD_CREW_ROLES: CrewRoleTemplate[] = [
  {
    role: 'Lead Photographer / Chief Photojournalist',
    category: 'photography',
    defaultSpots: 1,
    defaultPksCodes: ['C3', 'P4', 'B2'], // 40 + 25 + 20 = 85 PKS
    notes: 'Directs shot list, handles high-angle compositions, and delivers curated RAW selects.',
  },
  {
    role: 'Action & Courtside Camera Operator',
    category: 'photography',
    defaultSpots: 2,
    defaultPksCodes: ['C2', 'P4', 'B1'], // 20 + 25 + 10 = 55 PKS
    notes: 'Fast-paced courtside action, telephoto burst sequences, and celebration reactions.',
  },
  {
    role: 'Cinematographer & Highlight Reel Shooter',
    category: 'videography',
    defaultSpots: 1,
    defaultPksCodes: ['C3', 'P4', 'B2'], // 40 + 25 + 20 = 85 PKS
    notes: 'Operates 3-axis gimbal, captures cinematic 4K slow-mo, and frames visual transitions.',
  },
  {
    role: 'Livestream Switcher & Broadcast Tech',
    category: 'videography',
    defaultSpots: 1,
    defaultPksCodes: ['B3', 'P4', 'C1'], // 35 + 25 + 10 = 70 PKS
    notes: 'Mixes multi-camera RTMP feed, overlays scoreboard lower-thirds, and monitors bitrates.',
  },
  {
    role: 'Sound Engineer & Field Audio Tech',
    category: 'production',
    defaultSpots: 1,
    defaultPksCodes: ['B2', 'P3', 'C1'], // 20 + 18 + 10 = 48 PKS
    notes: 'Monitors wireless transmitters, shotgun directional boom mics, and ambient arena gain.',
  },
  {
    role: 'Grip & Lighting Assistant',
    category: 'production',
    defaultSpots: 2,
    defaultPksCodes: ['P3', 'B1'], // 18 + 10 = 28 PKS
    notes: 'Assists with C-stands, softbox positioning, battery rotation, and cable safety.',
  },
  {
    role: 'Live Social Media Poster & Graphic Runner',
    category: 'design',
    defaultSpots: 1,
    defaultPksCodes: ['C2', 'B2', 'P2'], // 20 + 20 + 12 = 52 PKS
    notes: 'Instant Lightroom grading, match scorecards, and live stories on official club feed.',
  },
  {
    role: 'Production Assistant / Field Runner',
    category: 'general',
    defaultSpots: 2,
    defaultPksCodes: ['P3', 'B1'], // 18 + 10 = 28 PKS
    notes: 'Media card shuttling, roster check-ins, timing cues, and equipment staging.',
  },
];

export interface CrewPresetPackage {
  id: string;
  name: string;
  description: string;
  roles: { role: string; spots: number; pksCodes: string[]; notes: string }[];
}

export const CREW_PRESET_PACKAGES: CrewPresetPackage[] = [
  {
    id: 'sports_action',
    name: 'Sports & Arena Coverage Crew',
    description: 'Lead stills, 2 courtside cameras, live reel videographer, and social runner.',
    roles: [
      {
        role: 'Lead Photographer / Chief Photojournalist',
        spots: 1,
        pksCodes: ['C3', 'P4', 'B2'],
        notes: 'Lead courtside coverage, anchor album delivery',
      },
      {
        role: 'Action & Courtside Camera Operator',
        spots: 2,
        pksCodes: ['C2', 'P4', 'B1'],
        notes: 'Fast-break action, spectator crowd candids',
      },
      {
        role: 'Cinematographer & Highlight Reel Shooter',
        spots: 1,
        pksCodes: ['C3', 'P4', 'B2'],
        notes: 'Vertical 60s reel & 4K cinematic montage',
      },
      {
        role: 'Live Social Media Poster & Graphic Runner',
        spots: 1,
        pksCodes: ['C2', 'B2', 'P2'],
        notes: 'Immediate live stories & final score poster',
      },
    ],
  },
  {
    id: 'broadcast_live',
    name: 'Multi-Cam Livestream & Broadcast Unit',
    description: 'Switcher operator, 2 camera operators, audio technician, and field assistant.',
    roles: [
      {
        role: 'Livestream Switcher & Broadcast Tech',
        spots: 1,
        pksCodes: ['B3', 'P4', 'C1'],
        notes: 'Master switcher, graphic lower thirds, RTMP stream',
      },
      {
        role: 'Action & Courtside Camera Operator',
        spots: 2,
        pksCodes: ['C2', 'P4', 'B1'],
        notes: 'Stationary main camera & roving wireless handheld',
      },
      {
        role: 'Sound Engineer & Field Audio Tech',
        spots: 1,
        pksCodes: ['B2', 'P3', 'C1'],
        notes: 'Direct feed from soundboard & stage microphones',
      },
      {
        role: 'Production Assistant / Field Runner',
        spots: 1,
        pksCodes: ['P3', 'B1'],
        notes: 'Cable management, tally sync, talent communications',
      },
    ],
  },
  {
    id: 'photo_dispatch',
    name: 'Campus Beat Photojournalism Dispatch',
    description: 'Lead photographer, junior apprentice shooter, and live digital editor.',
    roles: [
      {
        role: 'Lead Photographer / Chief Photojournalist',
        spots: 1,
        pksCodes: ['C3', 'P4', 'B2'],
        notes: 'Hero stills, high-impact portraits, keynote coverage',
      },
      {
        role: 'Action & Courtside Camera Operator',
        spots: 1,
        pksCodes: ['C2', 'P3', 'B1'],
        notes: 'B-roll candids, secondary angles, guest arrivals',
      },
      {
        role: 'Live Social Media Poster & Graphic Runner',
        spots: 1,
        pksCodes: ['C2', 'B2', 'P2'],
        notes: 'Card ingestion, color correction, and immediate feed push',
      },
    ],
  },
];

export function generateCrewSlot(
  role: string,
  spotsNeeded: number = 1,
  pksCodes?: string[],
  notes?: string,
  category: 'photography' | 'videography' | 'design' | 'production' | 'general' = 'photography'
): EventCrewSlot {
  const template = STANDARD_CREW_ROLES.find((r) => r.role.toLowerCase() === role.toLowerCase());
  return {
    id: `slot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    role,
    category: template ? template.category : category,
    spotsNeeded,
    assignedMemberIds: [],
    volunteerMemberIds: [],
    pksCodes: pksCodes || (template ? template.defaultPksCodes : ['C2', 'P3']),
    notes: notes || (template ? template.notes : 'General shoot coverage duties.'),
  };
}

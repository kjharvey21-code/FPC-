import { User, EventAssignment } from '../types';

/**
 * Checks whether a given user has authority to manage (edit/update and approve credits) for an event or contest.
 * Authority is granted to:
 * 1. SuperAdmins (role === 'SuperAdmin', officerRole === 'SuperAdmin', or runtime admin email)
 * 2. Club Admins / Officers (isOfficer === true, President, VPIA, VPCA, etc.)
 * 3. Specially the Project Head of the specific event or contest:
 *    - event.projectHeadId matches user.id
 *    - event.projectHeadName matches user.fullName or user.nickname
 *    - user.projectHeadRoles matches or contains the event title or keyword
 *    - user.officerRole === 'Project Head' and assigned to this project
 */
export function canManageEvent(user: User | null, event: EventAssignment): boolean {
  if (!user) return false;

  // 1. SuperAdmin / Runtime Admin
  if (
    user.role === 'SuperAdmin' ||
    user.officerRole === 'SuperAdmin' ||
    user.email === 'kjharvey21@gmail.com'
  ) {
    return true;
  }

  // 2. Club Admins / Executive Officers
  if (
    user.isOfficer ||
    user.officerRole === 'President' ||
    user.officerRole === 'VPIA' ||
    user.officerRole === 'VPCA' ||
    user.officerRole === 'Secretary' ||
    user.officerRole === 'Treasurer' ||
    user.officerRole === 'Logistics Head' ||
    user.officerRole === 'Logistics Officer' ||
    user.officerRole === 'PEBU Head' ||
    user.officerRole === 'Creative Head (Photography)' ||
    user.officerRole === 'Creative Head (Videography)' ||
    user.officerRole === 'Creative Head (Design)' ||
    user.role.toLowerCase().includes('admin')
  ) {
    return true;
  }

  // 3. Project Head of THIS specific event or contest
  if (isEventProjectHead(user, event)) {
    return true;
  }

  return false;
}

/**
 * Determines whether a user is specifically the Project Head for an event or contest.
 */
export function isEventProjectHead(user: User | null, event: EventAssignment): boolean {
  if (!user) return false;

  // Direct ID linkage
  if (event.projectHeadId && event.projectHeadId === user.id) {
    return true;
  }

  // Name linkage
  if (
    event.projectHeadName &&
    (event.projectHeadName.toLowerCase() === user.fullName.toLowerCase() ||
      event.projectHeadName.toLowerCase() === user.nickname.toLowerCase())
  ) {
    return true;
  }

  // Linked via user's projectHeadRoles array
  if (user.projectHeadRoles && user.projectHeadRoles.length > 0) {
    const eventTitleLower = event.title.toLowerCase();
    const matchesProject = user.projectHeadRoles.some((roleName) => {
      const roleLower = roleName.toLowerCase();
      return (
        eventTitleLower.includes(roleLower) ||
        roleLower.includes(eventTitleLower) ||
        (roleLower.includes('intramurals') && eventTitleLower.includes('intramurals')) ||
        (roleLower.includes('street') && eventTitleLower.includes('street')) ||
        (roleLower.includes('press') && eventTitleLower.includes('press')) ||
        (roleLower.includes('davinci') && eventTitleLower.includes('davinci')) ||
        (roleLower.includes('foundation') && eventTitleLower.includes('foundation'))
      );
    });
    if (matchesProject) return true;
  }

  return false;
}

/**
 * Returns a descriptive badge for the user's management capacity for this event.
 */
export function getEventManagementBadge(
  user: User | null,
  event: EventAssignment
): { label: string; roleType: 'superadmin' | 'project_head' | 'admin' } | null {
  if (!user || !canManageEvent(user, event)) return null;

  if (
    user.role === 'SuperAdmin' ||
    user.officerRole === 'SuperAdmin' ||
    user.email === 'kjharvey21@gmail.com'
  ) {
    return { label: 'SuperAdmin Access', roleType: 'superadmin' };
  }

  if (isEventProjectHead(user, event)) {
    return { label: 'Project Head', roleType: 'project_head' };
  }

  return { label: 'Admin Access', roleType: 'admin' };
}

/**
 * Role Display Utility
 * Maps role codes to display configuration with i18n support
 */

export type UserRole = 'platform_admin' | 'owner' | 'delegate' | 'member';

export interface RoleDisplayConfig {
  i18nKey: string;
  color: string;
  bgColor: string;
  icon?: string;
}

const roleDisplayMap: Record<UserRole, RoleDisplayConfig> = {
  platform_admin: {
    i18nKey: 'roles:platform_admin',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '👑',
  },
  owner: {
    i18nKey: 'roles:owner',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '🔑',
  },
  delegate: {
    i18nKey: 'roles:delegate',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: '👤',
  },
  member: {
    i18nKey: 'roles:member',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '👥',
  },
};

/**
 * Get display configuration for a role
 */
export function getRoleDisplay(role: UserRole | null): RoleDisplayConfig {
  if (!role || !roleDisplayMap[role]) {
    return roleDisplayMap.member;
  }
  return roleDisplayMap[role];
}

/**
 * Get i18n key for a role
 */
export function getRoleLabel(role: UserRole | null): string {
  return getRoleDisplay(role).i18nKey;
}

/**
 * Get Tailwind color class for a role
 */
export function getRoleColor(role: UserRole | null): string {
  return getRoleDisplay(role).color;
}

/**
 * Get background color class for a role badge
 */
export function getRoleBgColor(role: UserRole | null): string {
  return getRoleDisplay(role).bgColor;
}

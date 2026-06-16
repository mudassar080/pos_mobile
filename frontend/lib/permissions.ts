export type AppRole = 'superadmin' | 'admin' | 'staff';

export const ALL_ROLES: AppRole[] = ['superadmin', 'admin', 'staff'];
export const ADMIN_ROLES: AppRole[] = ['superadmin', 'admin'];

export function isStaff(role?: string) {
  return role === 'staff';
}

export function isFullAccess(role?: string) {
  return role === 'superadmin' || role === 'admin';
}

/** Routes staff may open (view + create flows only; no edit/returns). */
export function canAccessPath(role: string | undefined, pathname: string): boolean {
  if (!role) return false;
  if (isFullAccess(role)) return true;

  if (pathname.includes('/edit') || pathname.includes('/returns')) {
    return false;
  }

  const exactAllowed = new Set([
    '/dashboard',
    '/products',
    '/stock',
    '/expenses',
    '/sales',
    '/sales/new',
    '/purchases',
    '/purchases/new',
  ]);

  if (exactAllowed.has(pathname)) return true;

  // Sale detail view only (not edit)
  if (/^\/sales\/[a-f\d]{24}$/i.test(pathname)) return true;

  return false;
}

export function canSeeMenuItem(role: string | undefined, allowedRoles?: AppRole[]) {
  if (!role) return false;
  const roles = allowedRoles ?? ADMIN_ROLES;
  return roles.includes(role as AppRole);
}

export function getPermissions(role?: string) {
  const staff = isStaff(role);
  return {
    isStaff: staff,
    isFullAccess: isFullAccess(role),
    canEdit: !staff,
    canDelete: !staff,
    canAccessUsers: role === 'superadmin',
    canViewActivityLogs: isFullAccess(role),
    canAddProduct: true,
    canAddSale: true,
    canAddPurchase: true,
    canAddExpense: true,
  };
}

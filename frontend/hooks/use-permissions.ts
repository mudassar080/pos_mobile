'use client';

import { useAuth } from '@/lib/auth-context';
import { getPermissions } from '@/lib/permissions';

export function usePermissions() {
  const { user } = useAuth();
  return getPermissions(user?.role);
}

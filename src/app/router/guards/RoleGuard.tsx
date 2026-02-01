import { ReactNode } from 'react';
import { usePermissions } from '@/features/permissions/hooks/usePermissions';
import { type UserRole } from '@/shared/utils/roleDisplay';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo = '/' }: RoleGuardProps) {
  const { role, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role as UserRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page.
          </p>
          <a
            href={redirectTo}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-4 py-2 hover:bg-primary/90"
          >
            Go Back
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function PlatformAdminGuard({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['platform_admin']} redirectTo="/">
      {children}
    </RoleGuard>
  );
}

export function OrganizationAdminGuard({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['platform_admin', 'owner', 'delegate']} redirectTo="/">
      {children}
    </RoleGuard>
  );
}

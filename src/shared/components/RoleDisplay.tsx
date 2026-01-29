import { useTranslation } from 'react-i18next';
import { getRoleDisplay, type UserRole } from '@/shared/utils/roleDisplay';

interface RoleDisplayProps {
  role: UserRole | null;
  variant?: 'text' | 'badge';
}

export function RoleDisplay({ role, variant = 'text' }: RoleDisplayProps) {
  const { t } = useTranslation('roles');
  const config = getRoleDisplay(role);

  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}
      >
        {config.icon && <span>{config.icon}</span>}
        {t(role || 'member')}
      </span>
    );
  }

  return <span className={config.color}>{t(role || 'member')}</span>;
}

export function RoleDisplaySkeleton() {
  return (
    <span className="inline-block h-4 w-24 bg-muted animate-pulse rounded" />
  );
}

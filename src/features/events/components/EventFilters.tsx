import { useTranslation } from 'react-i18next';
import { Search, Filter, X, Calendar, List } from 'lucide-react';
import type { EventType, EventStatus, EventFilters as Filters } from '../types';
import { EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_STATUSES, EVENT_STATUS_LABELS } from '../types';

interface EventFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  view: 'list' | 'calendar';
  onViewChange: (view: 'list' | 'calendar') => void;
}

export default function EventFilters({
  filters,
  onFilterChange,
  view,
  onViewChange,
}: EventFiltersProps) {
  const { t } = useTranslation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value || undefined });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      event_type: value ? (value as EventType) : undefined,
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      status: value ? (value as EventStatus) : undefined,
    });
  };

  const handlePublicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      is_public: value === '' ? undefined : value === 'true',
    });
  };

  const handleDateRangeChange = (field: 'start_date' | 'end_date', value: string) => {
    onFilterChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters =
    filters.search ||
    filters.event_type ||
    filters.status ||
    filters.is_public !== undefined ||
    filters.start_date ||
    filters.end_date;

  return (
    <div className="space-y-4">
      {/* Top Row: Search and View Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search
              size={18}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={filters.search || ''}
              onChange={handleSearchChange}
              placeholder={t('events.searchPlaceholder') || 'Search events...'}
              className="w-full ps-10 pe-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => onViewChange('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'list'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List size={16} />
            {t('events.listView') || 'List'}
          </button>
          <button
            onClick={() => onViewChange('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'calendar'
                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar size={16} />
            {t('events.calendarView') || 'Calendar'}
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          <Filter size={16} />
          {t('events.filters') || 'Filters'}:
        </div>

        {/* Event Type */}
        <select
          value={filters.event_type || ''}
          onChange={handleTypeChange}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">{t('events.allTypes') || 'All Types'}</option>
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`events.types.${type}`) || EVENT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filters.status as string || ''}
          onChange={handleStatusChange}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">{t('events.allStatuses') || 'All Statuses'}</option>
          {EVENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`events.status.${status}`) || EVENT_STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        {/* Visibility */}
        <select
          value={filters.is_public === undefined ? '' : String(filters.is_public)}
          onChange={handlePublicChange}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">{t('events.allVisibility') || 'All Visibility'}</option>
          <option value="true">{t('events.public') || 'Public'}</option>
          <option value="false">{t('events.private') || 'Private'}</option>
        </select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.start_date || ''}
            onChange={(e) => handleDateRangeChange('start_date', e.target.value)}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('events.from') || 'From'}
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            value={filters.end_date || ''}
            onChange={(e) => handleDateRangeChange('end_date', e.target.value)}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('events.to') || 'To'}
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <X size={14} />
            {t('events.clearFilters') || 'Clear'}
          </button>
        )}
      </div>
    </div>
  );
}

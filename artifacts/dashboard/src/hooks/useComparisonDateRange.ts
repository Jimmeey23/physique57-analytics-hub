
/**
 * Hook for period-over-period date range comparison.
 */

export const getComparisonRange = (
  primary: { start: string; end: string },
  mode: 'prior_year' | 'prior_month'
): { start: string; end: string } => {
  const startDate = new Date(primary.start);
  const endDate = new Date(primary.end);

  let compStart: Date;
  let compEnd: Date;

  if (mode === 'prior_year') {
    compStart = new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate());
    compEnd = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
  } else {
    // prior_month
    compStart = new Date(startDate.getFullYear(), startDate.getMonth() - 1, startDate.getDate());
    compEnd = new Date(endDate.getFullYear(), endDate.getMonth() - 1, endDate.getDate());
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    start: formatDate(compStart),
    end: formatDate(compEnd),
  };
};

export const useComparisonDateRange = (
  primary: { start: string; end: string },
  mode: 'off' | 'prior_year' | 'prior_month'
) => {
  if (mode === 'off') return null;
  return getComparisonRange(primary, mode === 'prior_year' ? 'prior_year' : 'prior_month');
};

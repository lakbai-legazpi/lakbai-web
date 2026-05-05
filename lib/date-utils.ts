export const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const CURRENT_MONTH_INDEX = new Date().getMonth();
export const FLEXIBLE_MONTH_OPTIONS = Array.from(
  { length: 12 },
  (_, index) => MONTH_NAMES[(CURRENT_MONTH_INDEX + index) % 12]
);

export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function monthLabel(date: Date) {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function buildMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number; iso: string } | null> = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const current = new Date(year, month, day);
    cells.push({ day, iso: toISODate(current) });
  }

  return cells;
}

export function formatDateSelection(startDate: string, endDate: string) {
  if (!startDate || !endDate) return '';

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} - ${endDate}`;
  }

  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();

  const startMonth = start.toLocaleString('en-US', { month: 'short' });
  const endMonth = end.toLocaleString('en-US', { month: 'short' });

  if (sameMonth) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}`;
  }

  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
}

export function sortMonthsByTimeline(months: string[]) {
  const monthOrder = new Map(
    FLEXIBLE_MONTH_OPTIONS.map((monthName, index) => [monthName, index])
  );

  return [...months].sort((a, b) => {
    const aIndex = monthOrder.get(a) ?? 999;
    const bIndex = monthOrder.get(b) ?? 999;
    return aIndex - bIndex;
  });
}

export function formatFlexibleSelection(days: number, months: string[]) {
  if (months.length === 0) return '';
  const sortedMonths = sortMonthsByTimeline(months);
  return `${days} days in ${sortedMonths.map(month => month.slice(0, 3)).join(', ')}`;
}

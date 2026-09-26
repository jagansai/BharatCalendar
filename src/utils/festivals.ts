export type FestivalDay = {
  date: string;
  isoDate: string;
  Thidi: string;
  year: string;
  festivals: string[];
};

const ISO_DATE_PATTERN = /\((\d{4}-\d{2}-\d{2})\)/;
const STANDALONE_ISO_DATE_PATTERN = /\d{4}-\d{2}-\d{2}/;

export function extractIsoDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const embeddedDate = value.match(ISO_DATE_PATTERN)?.[1];
  if (embeddedDate) return embeddedDate;

  return value.match(STANDALONE_ISO_DATE_PATTERN)?.[0] || null;
}

export function parseFestivalDay(value: unknown): FestivalDay | null {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Record<string, unknown>;
  const date = String(raw.date ?? '');
  const isoDate = extractIsoDate(date);
  if (!isoDate) return null;

  const festivals = Array.isArray(raw.festivals)
    ? raw.festivals.filter(
        (festival): festival is string =>
          typeof festival === 'string' && festival.trim().length > 0,
      )
    : [];

  return {
    date,
    isoDate,
    Thidi: String(raw.Thidi ?? ''),
    year: String(raw.year ?? ''),
    festivals,
  };
}

export function sortFestivalDays(days: FestivalDay[]): FestivalDay[] {
  return [...days].sort((left, right) =>
    left.isoDate.localeCompare(right.isoDate),
  );
}

export function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase().normalize('NFC');
}

export function searchFestivalDays(
  days: FestivalDay[],
  query: string,
  todayIsoDate: string,
): FestivalDay[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  return sortFestivalDays(days).filter(
    day =>
      day.isoDate >= todayIsoDate &&
      day.festivals.some(festival =>
        normalizeSearchText(festival).includes(normalizedQuery),
      ),
  );
}

export function isoDateFromDate(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

export function getTodayIsoDate(date: Date = new Date()): string {
  return isoDateFromDate(date);
}

export function dateFromIso(isoDate: string): Date | null {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function getMonthKey(year: number, monthIndex: number): string {
  return `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`;
}

export function differenceInCalendarDays(
  fromIsoDate: string,
  toIsoDate: string,
): number | null {
  const from = dateFromIso(fromIsoDate);
  const to = dateFromIso(toIsoDate);
  if (!from || !to) return null;

  const fromUtc = Date.UTC(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
  );
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / (24 * 60 * 60 * 1000));
}

import {
  dateFromIso,
  differenceInCalendarDays,
  extractIsoDate,
  FestivalDay,
  normalizeSearchText,
  parseFestivalDay,
  searchFestivalDays,
  sortFestivalDays,
} from '../src/utils/festivals';

describe('festival data helpers', () => {
  test('extracts embedded and standalone ISO dates', () => {
    expect(extractIsoDate('10 ఆగస్టు, 2025 (2025-08-10)')).toBe('2025-08-10');
    expect(extractIsoDate('2026-06-01')).toBe('2026-06-01');
    expect(extractIsoDate('తేదీ లేదు')).toBeNull();
  });

  test('normalizes a raw festival record', () => {
    expect(
      parseFestivalDay({
        date: '2 అక్టోబర్, 2026 (2026-10-02)',
        Thidi: 'ఆశ్వయుజ శుద్ధ దశమి',
        year: 'శ్రీ పరాభవ నామ సంవత్సరం',
        festivals: ['దసరా', '', 42],
      }),
    ).toEqual({
      date: '2 అక్టోబర్, 2026 (2026-10-02)',
      isoDate: '2026-10-02',
      Thidi: 'ఆశ్వయుజ శుద్ధ దశమి',
      year: 'శ్రీ పరాభవ నామ సంవత్సరం',
      festivals: ['దసరా'],
    });
  });

  test('sorts dates chronologically without mutating the input', () => {
    const days = [
      parseFestivalDay({ date: '2 జనవరి, 2026 (2026-01-02)' }),
      parseFestivalDay({ date: '1 జనవరి, 2026 (2026-01-01)' }),
    ].filter((day): day is FestivalDay => day !== null);

    expect(sortFestivalDays(days).map(day => day.isoDate)).toEqual([
      '2026-01-01',
      '2026-01-02',
    ]);
    expect(days[0]?.isoDate).toBe('2026-01-02');
  });

  test('supports Telugu search normalization and calendar-day differences', () => {
    expect(normalizeSearchText('  దీపావళి  ')).toBe('దీపావళి');
    expect(differenceInCalendarDays('2026-09-27', '2026-10-02')).toBe(5);
    expect(differenceInCalendarDays('2026-10-02', '2026-09-27')).toBe(-5);
    expect(dateFromIso('2026-02-30')).toBeNull();
  });

  test('searches only current and upcoming festival matches', () => {
    const days = [
      parseFestivalDay({
        date: '20 అక్టోబర్, 2025 (2025-10-20)',
        festivals: ['దీపావళి'],
      }),
      parseFestivalDay({
        date: '8 నవంబర్, 2026 (2026-11-08)',
        festivals: ['దీపావళి'],
      }),
    ].filter((day): day is FestivalDay => day !== null);

    expect(searchFestivalDays(days, 'దీపావళి', '2026-09-27')).toEqual([
      expect.objectContaining({ isoDate: '2026-11-08' }),
    ]);
  });
});

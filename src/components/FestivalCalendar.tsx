import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import language from '../languages/selected';
import { formatDateFromIso } from '../utils/date';
import {
  dateFromIso,
  differenceInCalendarDays,
  FestivalDay,
  getMonthKey,
  getTodayIsoDate,
  normalizeSearchText,
  searchFestivalDays,
  sortFestivalDays,
} from '../utils/festivals';

type Props = {
  festivalDays: FestivalDay[];
  isDarkMode: boolean;
};

type Palette = {
  surface: string;
  card: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
  accentSoft: string;
  today: string;
  todaySoft: string;
  input: string;
};

const lightPalette: Palette = {
  surface: '#ffffff',
  card: '#fffaf0',
  text: '#1d2433',
  mutedText: '#667085',
  border: '#e2e8f0',
  accent: '#b45309',
  accentSoft: '#ffedd5',
  today: '#2563eb',
  todaySoft: '#eff6ff',
  input: '#f8fafc',
};

const darkPalette: Palette = {
  surface: '#1f2937',
  card: '#332a1b',
  text: '#f8fafc',
  mutedText: '#aab4c3',
  border: '#374151',
  accent: '#fdba74',
  accentSoft: '#51331c',
  today: '#93c5fd',
  todaySoft: '#1e3a5f',
  input: '#111827',
};

function getMonthCells(month: Date): Array<string | null> {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const dayOfMonth = index - firstWeekday + 1;
    if (dayOfMonth < 1 || dayOfMonth > daysInMonth) return null;

    const day = dayOfMonth.toString().padStart(2, '0');
    const monthNumber = (monthIndex + 1).toString().padStart(2, '0');
    return `${year}-${monthNumber}-${day}`;
  });
}

export default function FestivalCalendar({
  festivalDays,
  isDarkMode,
}: Props) {
  const palette = isDarkMode ? darkPalette : lightPalette;
  const sortedDays = useMemo(() => sortFestivalDays(festivalDays), [festivalDays]);
  const daysByIsoDate = useMemo(
    () => new Map(sortedDays.map(day => [day.isoDate, day])),
    [sortedDays],
  );
  const todayIsoDate = getTodayIsoDate();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = dateFromIso(todayIsoDate) || new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(
    todayIsoDate,
  );
  const [searchQuery, setSearchQuery] = useState('');

  const monthKey = getMonthKey(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
  );
  const monthCells = useMemo(() => getMonthCells(visibleMonth), [visibleMonth]);
  const selectedDay = selectedIsoDate
    ? daysByIsoDate.get(selectedIsoDate)
    : undefined;
  const normalizedQuery = normalizeSearchText(searchQuery);
  const searchResults = searchFestivalDays(
    sortedDays,
    searchQuery,
    todayIsoDate,
  );
  const upcomingFestivalDays = sortedDays
    .filter(
      day => day.isoDate >= todayIsoDate && day.festivals.length > 0,
    )
    .slice(0, 6);
  const festivalDaysThisMonth = sortedDays.filter(
    day => day.isoDate.startsWith(monthKey) && day.festivals.length > 0,
  ).length;

  const selectDay = (day: FestivalDay) => {
    const date = dateFromIso(day.isoDate);
    if (date) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
    setSelectedIsoDate(day.isoDate);
    setSearchQuery('');
  };

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + offset,
      1,
    );
    setVisibleMonth(nextMonth);
    const nextMonthKey = getMonthKey(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
    );
    const firstAvailableDay = sortedDays.find(day =>
      day.isoDate.startsWith(nextMonthKey),
    );
    setSelectedIsoDate(firstAvailableDay?.isoDate || null);
  };

  const goToToday = () => {
    const today = dateFromIso(todayIsoDate) || new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedIsoDate(
      daysByIsoDate.has(todayIsoDate) ? todayIsoDate : null,
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={[styles.title, { color: palette.text }]}>
            {language.calendar}
          </Text>
          <Text style={[styles.subtitle, { color: palette.mutedText }]}>
            {festivalDaysThisMonth} {language.festivalDaysThisMonth}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={language.goToToday}
          onPress={goToToday}
          style={[styles.todayButton, { backgroundColor: palette.todaySoft }]}
        >
          <Text style={[styles.todayButtonText, { color: palette.today }]}>{language.today}</Text>
        </Pressable>
      </View>

      <TextInput
        accessibilityLabel={language.search}
        autoCorrect={false}
        onChangeText={setSearchQuery}
        placeholder={language.searchPlaceholder}
        placeholderTextColor={palette.mutedText}
        style={[
          styles.searchInput,
          {
            backgroundColor: palette.input,
            borderColor: palette.border,
            color: palette.text,
          },
        ]}
        value={searchQuery}
      />

      {normalizedQuery ? (
        <View style={styles.searchSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {language.searchResults}
            </Text>
            <Text style={[styles.resultCount, { color: palette.mutedText }]}>
              {searchResults.length}
            </Text>
          </View>
          {searchResults.length > 0 ? (
            searchResults.map(day => (
              <Pressable
                accessibilityRole="button"
                key={day.isoDate}
                onPress={() => selectDay(day)}
                style={[
                  styles.searchResult,
                  { backgroundColor: palette.card, borderColor: palette.border },
                ]}
              >
                <Text
                  numberOfLines={2}
                  style={[styles.searchFestival, { color: palette.accent }]}
                >
                  {day.festivals.join(' • ')}
                </Text>
                <Text style={[styles.searchDate, { color: palette.text }]}>
                  {formatDateFromIso(day.isoDate, language)}
                </Text>
                <Text style={[styles.searchThidi, { color: palette.mutedText }]}>
                  {day.Thidi}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: palette.mutedText }]}>
              {language.noSearchResults}
            </Text>
          )}
        </View>
      ) : (
        <>
          <View style={styles.monthToolbar}>
            <Pressable
              accessibilityLabel={language.previousMonth}
              accessibilityRole="button"
              onPress={() => changeMonth(-1)}
              style={[styles.monthButton, { borderColor: palette.border }]}
            >
              <Text style={[styles.monthButtonText, { color: palette.text }]}>‹</Text>
            </Pressable>
            <Text style={[styles.monthTitle, { color: palette.text }]}>
              {language.months[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
            </Text>
            <Pressable
              accessibilityLabel={language.nextMonth}
              accessibilityRole="button"
              onPress={() => changeMonth(1)}
              style={[styles.monthButton, { borderColor: palette.border }]}
            >
              <Text style={[styles.monthButtonText, { color: palette.text }]}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {language.weekdays.map(weekday => (
              <Text
                key={weekday}
                style={[styles.weekday, { color: palette.mutedText }]}
              >
                {weekday}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {monthCells.map((isoDate, index) => {
              if (!isoDate) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const day = daysByIsoDate.get(isoDate);
              const hasFestival = Boolean(day && day.festivals.length > 0);
              const isToday = isoDate === todayIsoDate;
              const isSelected = isoDate === selectedIsoDate;

              return (
                <Pressable
                  accessibilityLabel={day?.festivals.join(', ') || isoDate}
                  accessibilityRole="button"
                  disabled={!day}
                  key={isoDate}
                  onPress={() => day && selectDay(day)}
                  style={[
                    styles.dayCell,
                    { borderColor: palette.border },
                    hasFestival && {
                      backgroundColor: palette.accentSoft,
                      borderColor: palette.accent,
                    },
                    isToday && {
                      borderColor: palette.today,
                      borderWidth: 2,
                    },
                    isSelected && styles.selectedDayCell,
                    !day && styles.unavailableDayCell,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: day ? palette.text : palette.mutedText },
                      hasFestival && { color: palette.accent, fontWeight: '800' },
                      isToday && { color: palette.today },
                    ]}
                  >
                    {dateFromIso(isoDate)?.getDate()}
                  </Text>
                  {hasFestival && (
                    <View
                      style={[styles.festivalDot, { backgroundColor: palette.accent }]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendSwatch, { backgroundColor: palette.accentSoft }]}
              />
              <Text style={[styles.legendText, { color: palette.mutedText }]}>
                {language.festivalDay}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendSwatch,
                  { backgroundColor: palette.todaySoft, borderColor: palette.today },
                ]}
              />
              <Text style={[styles.legendText, { color: palette.mutedText }]}>
                {language.today}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.detailsCard,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {language.dayDetails}
            </Text>
            {selectedDay ? (
              <>
                <Text style={[styles.detailDate, { color: palette.accent }]}>{formatDateFromIso(selectedDay.isoDate, language)}</Text>
                <Text style={[styles.detailValue, { color: palette.text }]}><Text style={styles.detailLabel}>{language.thidi}: </Text>{selectedDay.Thidi}</Text>
                <Text style={[styles.detailValue, { color: palette.text }]}>
                  <Text style={styles.detailLabel}>{language.year}: </Text>
                  {selectedDay.year}
                </Text>
                <Text style={[styles.detailValue, { color: palette.text }]}><Text style={styles.detailLabel}>{language.festivals}: </Text>{selectedDay.festivals.length > 0 ? selectedDay.festivals.join(' • ') : language.noFestivalData}</Text>
              </>
            ) : (
              <Text style={[styles.emptyText, { color: palette.mutedText }]}>
                {language.selectDate}
              </Text>
            )}
          </View>

          <View style={styles.upcomingSection}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {language.upcomingFestivals}
            </Text>
            {upcomingFestivalDays.length > 0 ? (
              upcomingFestivalDays.map(day => {
                const daysAway = differenceInCalendarDays(todayIsoDate, day.isoDate);
                const timing =
                  daysAway === 0
                    ? language.today
                    : daysAway === null
                      ? ''
                      : `${daysAway} ${language.daysUntil}`;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={day.isoDate}
                    onPress={() => selectDay(day)}
                    style={[
                      styles.upcomingRow,
                      { borderBottomColor: palette.border },
                    ]}
                  >
                    <View style={styles.upcomingCopy}>
                      <Text style={[styles.upcomingFestival, { color: palette.accent }]}>
                        {day.festivals.join(' • ')}
                      </Text>
                      <Text style={[styles.upcomingDate, { color: palette.mutedText }]}>
                        {formatDateFromIso(day.isoDate, language)}
                      </Text>
                    </View>
                    <Text style={[styles.upcomingTiming, { color: palette.today }]}>{timing}</Text>
                  </Pressable>
                );
              })
            ) : (
              <Text style={[styles.emptyText, { color: palette.mutedText }]}>
                {language.noUpcomingFestivals}
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleCopy: { flex: 1 },
  title: { fontSize: 21, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 3 },
  todayButton: { borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 },
  todayButtonText: { fontSize: 12, fontWeight: '800' },
  searchInput: {
    borderRadius: 11,
    borderWidth: 1,
    fontSize: 15,
    marginBottom: 16,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  searchSection: { marginBottom: 4 },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 9 },
  resultCount: { fontSize: 13, fontWeight: '700' },
  searchResult: {
    borderRadius: 11,
    borderWidth: 1,
    marginBottom: 8,
    padding: 12,
  },
  searchFestival: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  searchDate: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  searchThidi: { fontSize: 13 },
  monthToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthTitle: { fontSize: 18, fontWeight: '800' },
  monthButton: {
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  monthButtonText: { fontSize: 26, fontWeight: '300', lineHeight: 28 },
  weekdayRow: { flexDirection: 'row', marginBottom: 5 },
  weekday: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    marginBottom: 4,
    marginHorizontal: '0.7%',
    width: '12.8857%',
  },
  selectedDayCell: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 2, elevation: 2 },
  unavailableDayCell: { opacity: 0.45 },
  dayNumber: { fontSize: 15, fontWeight: '600' },
  festivalDot: { borderRadius: 3, height: 5, marginTop: 4, width: 5 },
  legendRow: { flexDirection: 'row', marginBottom: 15, marginTop: 6 },
  legendItem: { alignItems: 'center', flexDirection: 'row', marginRight: 16 },
  legendSwatch: { borderRadius: 4, borderWidth: 1, height: 12, marginRight: 5, width: 12 },
  legendText: { fontSize: 11 },
  detailsCard: { borderRadius: 12, borderWidth: 1, marginBottom: 18, padding: 13 },
  detailDate: { fontSize: 16, fontWeight: '800', marginBottom: 7 },
  detailValue: { fontSize: 14, lineHeight: 21 },
  detailLabel: { fontWeight: '800' },
  upcomingSection: { marginBottom: 2 },
  upcomingRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  upcomingCopy: { flex: 1, paddingRight: 8 },
  upcomingFestival: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  upcomingDate: { fontSize: 12 },
  upcomingTiming: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
  emptyText: { fontSize: 14, lineHeight: 21 },
});

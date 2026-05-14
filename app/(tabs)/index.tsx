// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  StatusBar,
  PixelRatio,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Responsive Helpers ────────────────────────────────────────────────────────

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const IS_SMALL   = SCREEN_W < 375;                      // iPhone SE / small Android
const IS_TABLET  = SCREEN_W >= 768;
const FONT_SCALE = Math.min(PixelRatio.getFontScale(), 1.2); // cap system font scale

/** Scale a font size and respect accessibility, but cap blow-up */
const fs = (size: number) => Math.round(size / FONT_SCALE);

/** Responsive width unit — 1 unit = 1% of screen width */
const wp = (pct: number) => (SCREEN_W * pct) / 100;

const CELL = Math.floor((SCREEN_W - 32 - 32) / 7); // calendar cell

// ── Platform Shadow ───────────────────────────────────────────────────────────

const shadow = (elevation = 3): object =>
  Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation },
      shadowOpacity: 0.08,
      shadowRadius: elevation * 2,
    },
    android: { elevation },
    default: {},
  }) as object;

// ── Mock Data ─────────────────────────────────────────────────────────────────

const EMPLOYEE = {
  name: 'Harsh Kumar',
  id: 'EMP-2401',
  department: 'Engineering',
  designation: 'Full Stack Developer',
  avatar: 'HK',
};

const SALARY = {
  month: 'April 2026',
  netPay: 85000,
  basic: 50000,
  hra: 20000,
  allowances: 8000,
  pf: 6000,
  tax: 7000,
  creditedOn: 'Apr 1, 2026',
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

const calcDuration = (start: Date, end: Date) => {
  const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
};

const generateAttendance = (year: number, month: number) => {
  const today = new Date();
  const days = new Date(year, month + 1, 0).getDate();
  const records: Record<number, string> = {};
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    const isToday = date.toDateString() === today.toDateString();
    const isPast  = date < today && !isToday;
    if (isToday)    records[d] = 'T';
    else if (dow === 0 || dow === 6) records[d] = 'W';
    else if (!isPast) records[d] = '';
    else {
      const seed = d * 7 + month;
      if      (seed % 9  === 0) records[d] = 'A';
      else if (seed % 11 === 0) records[d] = 'L';
      else if (seed % 13 === 0) records[d] = 'H';
      else                      records[d] = 'P';
    }
  }
  return records;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark      = colorScheme === 'dark';
  const insets      = useSafeAreaInsets();           // safe area (notch, home bar)

  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear,  setCalYear]  = useState(today.getFullYear());

  const [checkInTime,  setCheckInTime]  = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [elapsed,      setElapsed]      = useState('0h 0m');
  const [isCheckedIn,  setIsCheckedIn]  = useState(false);

  // Live elapsed timer
  useEffect(() => {
    if (!isCheckedIn || !checkInTime) return;
    const timer = setInterval(() => setElapsed(calcDuration(checkInTime, new Date())), 1000);
    return () => clearInterval(timer);
  }, [isCheckedIn, checkInTime]);

  const handleCheckIn = () => {
    const now = new Date();
    Alert.alert(
      'Confirm Check In',
      `Check in at ${formatTime(now)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In',
          onPress: () => {
            setCheckInTime(now);
            setCheckOutTime(null);
            setIsCheckedIn(true);
            setElapsed('0h 0m');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCheckOut = () => {
    if (!checkInTime) return;
    const now = new Date();
    Alert.alert(
      'Confirm Check Out',
      `Check out at ${formatTime(now)}?\nTotal: ${calcDuration(checkInTime, now)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out',
          style: 'destructive',
          onPress: () => {
            setCheckOutTime(now);
            setIsCheckedIn(false);
            setElapsed(calcDuration(checkInTime, now));
          },
        },
      ],
      { cancelable: true }
    );
  };

  const attendanceStatus = !checkInTime
    ? { label: 'Not Checked In', color: '#94a3b8' }
    : isCheckedIn
    ? { label: 'Working',        color: '#22c55e' }
    : { label: 'Completed',      color: '#0ea5e9' };

  const attendance  = generateAttendance(calYear, calMonth);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay    = new Date(calYear, calMonth, 1).getDay();

  const stats = Object.values(attendance).reduce(
    (acc, s) => {
      if      (s === 'P' || s === 'T') acc.present++;
      else if (s === 'A')              acc.absent++;
      else if (s === 'L')              acc.leave++;
      else if (s === 'H')              acc.halfDay++;
      return acc;
    },
    { present: 0, absent: 0, leave: 0, halfDay: 0 }
  );

  // ── Colors ─────────────────────────────────────────────────────────────────
  const C = {
    bg:          isDark ? '#0f172a' : '#f1f5f9',
    card:        isDark ? '#1e293b' : '#ffffff',
    border:      isDark ? '#334155' : '#e2e8f0',
    text:        isDark ? '#f1f5f9' : '#0f172a',
    muted:       isDark ? '#94a3b8' : '#64748b',
    primary:     '#0ea5e9',
    present:     '#22c55e',
    absent:      '#ef4444',
    leave:       '#f59e0b',
    halfDay:     '#8b5cf6',
    weekend:     isDark ? '#1e293b' : '#f1f5f9',
    weekendText: isDark ? '#475569' : '#cbd5e1',
    future:      isDark ? '#1e293b' : '#f8fafc',
  };

  const getDayBg    = (s: string) => ({ T: C.primary, P: C.present, A: C.absent, L: C.leave, H: C.halfDay, W: C.weekend }[s] ?? C.future);
  const getDayColor = (s: string) => ['T','P','A','L','H'].includes(s) ? '#fff' : s === 'W' ? C.weekendText : C.muted;

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

  const prevMonth = () => calMonth === 0 ? (setCalMonth(11), setCalYear(y => y - 1)) : setCalMonth(m => m - 1);
  const nextMonth = () => calMonth === 11 ? (setCalMonth(0), setCalYear(y => y + 1)) : setCalMonth(m => m + 1);

  const cells: Array<{ day: number | null; status: string }> = [
    ...Array(firstDay).fill({ day: null, status: '' }),
    ...Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, status: attendance[i + 1] })),
  ];

  // ── StatusBar tint ─────────────────────────────────────────────────────────
  const statusBarStyle = isDark ? 'light-content' : 'dark-content';

  return (
    <>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={C.primary}        // Android status bar bg
        translucent={false}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{
          padding: IS_TABLET ? 24 : 16,
          paddingTop: Platform.OS === 'android'
            ? 16
            : insets.top > 0 ? 8 : 16,      // iOS: respect notch
          paddingBottom: insets.bottom + 32, // home-bar clearance
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Employee Header ─────────────────────────────────── */}
        <View style={[
          s.card,
          { backgroundColor: C.primary, borderColor: 'transparent', marginBottom: 16 },
          shadow(4),
        ]}>
          <View style={s.row}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt} allowFontScaling={false}>{EMPLOYEE.avatar}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.empName} allowFontScaling={false} numberOfLines={1}>
                {EMPLOYEE.name}
              </Text>
              <Text style={s.empSub} allowFontScaling={false} numberOfLines={1}>
                {EMPLOYEE.designation}
              </Text>
              <Text style={s.empSub} allowFontScaling={false} numberOfLines={1}>
                {EMPLOYEE.department} · {EMPLOYEE.id}
              </Text>
            </View>
            <View style={s.dateBadge}>
              <Text style={s.dateDay} allowFontScaling={false}>{today.getDate()}</Text>
              <Text style={s.dateMon} allowFontScaling={false}>
                {MONTH_NAMES[today.getMonth()].slice(0, 3).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Today's Attendance ─────────────────────────────── */}
        <Text style={[s.sectionTitle, { color: C.text }]} allowFontScaling={false}>
          Today's Attendance
        </Text>
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border, marginBottom: 16 }, shadow(3)]}>

          {/* Status row */}
          <View style={[s.row, { marginBottom: 14, flexWrap: 'wrap', gap: 6 }]}>
            <Text style={[s.label, { color: C.muted, flex: 1 }]} allowFontScaling={false}>
              {today.toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
            <View style={[s.badge, {
              backgroundColor: attendanceStatus.color + '22',
              borderColor: attendanceStatus.color,
            }]}>
              <View style={[s.dot, { backgroundColor: attendanceStatus.color }]} />
              <Text style={[s.badgeTxt, { color: attendanceStatus.color }]} allowFontScaling={false}>
                {attendanceStatus.label}
              </Text>
            </View>
          </View>

          {/* Check In row */}
          <View style={[s.attendRow, { borderBottomColor: C.border }]}>
            <View style={[s.iconCircle, { backgroundColor: C.present + '20' }]}>
              <Ionicons name="log-in-outline" size={IS_SMALL ? 19 : 22} color={C.present} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.attendLabel, { color: C.muted }]} allowFontScaling={false}>Check In</Text>
              <Text style={[s.attendTime, { color: C.text }]} allowFontScaling={false}>
                {checkInTime ? formatTime(checkInTime) : '--:-- --'}
              </Text>
            </View>
            {checkInTime && (
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Ionicons name="time-outline" size={15} color={C.primary} />
                <Text style={[s.hoursText, { color: C.primary }]} allowFontScaling={false}>{elapsed}</Text>
              </View>
            )}
          </View>

          {/* Check Out row */}
          <View style={[s.attendRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={[s.iconCircle, { backgroundColor: C.absent + '20' }]}>
              <Ionicons name="log-out-outline" size={IS_SMALL ? 19 : 22} color={C.absent} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.attendLabel, { color: C.muted }]} allowFontScaling={false}>Check Out</Text>
              <Text style={[s.attendTime, { color: C.text }]} allowFontScaling={false}>
                {checkOutTime ? formatTime(checkOutTime) : '--:-- --'}
              </Text>
            </View>
            {checkOutTime && checkInTime && (
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-circle-outline" size={15} color={C.present} />
                <Text style={[s.hoursText, { color: C.present }]} allowFontScaling={false}>
                  {calcDuration(checkInTime, checkOutTime)}
                </Text>
              </View>
            )}
          </View>

          {/* ── Buttons ──────────────────────────────────────── */}
          <View style={[s.row, { gap: 12, marginTop: 16 }]}>
            <TouchableOpacity
              style={[
                s.btn,
                {
                  flex: 1,
                  backgroundColor: isCheckedIn ? C.card : C.present,
                  borderColor:     isCheckedIn ? C.border : C.present,
                  opacity:         isCheckedIn ? 0.45 : 1,
                },
                shadow(isCheckedIn ? 0 : 3),
              ]}
              onPress={handleCheckIn}
              disabled={isCheckedIn}
              activeOpacity={0.75}
              accessibilityLabel="Check In"
              accessibilityRole="button"
              accessibilityState={{ disabled: isCheckedIn }}
            >
              <Ionicons name="log-in-outline" size={18} color={isCheckedIn ? C.present : '#fff'} />
              <Text style={[s.btnTxt, { color: isCheckedIn ? C.present : '#fff' }]} allowFontScaling={false}>
                Check In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.btn,
                {
                  flex: 1,
                  backgroundColor: isCheckedIn ? C.absent : C.card,
                  borderColor:     isCheckedIn ? C.absent : C.border,
                  opacity:         !isCheckedIn ? 0.45 : 1,
                },
                shadow(isCheckedIn ? 3 : 0),
              ]}
              onPress={handleCheckOut}
              disabled={!isCheckedIn}
              activeOpacity={0.75}
              accessibilityLabel="Check Out"
              accessibilityRole="button"
              accessibilityState={{ disabled: !isCheckedIn }}
            >
              <Ionicons name="log-out-outline" size={18} color={isCheckedIn ? '#fff' : C.absent} />
              <Text style={[s.btnTxt, { color: isCheckedIn ? '#fff' : C.absent }]} allowFontScaling={false}>
                Check Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Monthly Stats ─────────────────────────────────── */}
        <View style={[s.row, { gap: IS_SMALL ? 6 : 10, marginBottom: 16 }]}>
          {[
            { label: 'Present',  value: stats.present,  color: C.present,  icon: 'checkmark-circle-outline' },
            { label: 'Absent',   value: stats.absent,   color: C.absent,   icon: 'close-circle-outline' },
            { label: 'Leave',    value: stats.leave,    color: C.leave,    icon: 'calendar-outline' },
            { label: 'Half Day', value: stats.halfDay,  color: C.halfDay,  icon: 'remove-circle-outline' },
          ].map(item => (
            <View key={item.label} style={[s.statCard, { backgroundColor: C.card, borderColor: C.border, flex: 1 }, shadow(2)]}>
              <Ionicons name={item.icon as any} size={IS_SMALL ? 16 : 20} color={item.color} />
              <Text style={[s.statVal, { color: C.text, fontSize: IS_SMALL ? 18 : 22 }]} allowFontScaling={false}>
                {item.value}
              </Text>
              <Text style={[s.statLabel, { color: C.muted, fontSize: IS_SMALL ? 9 : 10 }]} allowFontScaling={false}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Salary Card ───────────────────────────────────── */}
        <Text style={[s.sectionTitle, { color: C.text }]} allowFontScaling={false}>
          Salary — {SALARY.month}
        </Text>
        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border, marginBottom: 16 }, shadow(3)]}>
          <View style={[s.row, { marginBottom: 14, alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.label, { color: C.muted }]} allowFontScaling={false}>Net Pay</Text>
              <Text style={[s.salaryAmt, { color: C.text, fontSize: IS_SMALL ? 24 : 30 }]} allowFontScaling={false}>
                {fmt(SALARY.netPay)}
              </Text>
            </View>
            <View style={[s.badge, { backgroundColor: C.present + '22', borderColor: C.present }]}>
              <Ionicons name="checkmark-circle" size={12} color={C.present} />
              <Text style={[s.badgeTxt, { color: C.present, marginLeft: 4 }]} allowFontScaling={false}>
                Credited {SALARY.creditedOn}
              </Text>
            </View>
          </View>

          <View style={[s.divider, { backgroundColor: C.border }]} />
          <Text style={[s.salaryGroup, { color: C.muted }]} allowFontScaling={false}>EARNINGS</Text>
          {[
            { label: 'Basic Salary',      value: SALARY.basic },
            { label: 'HRA',               value: SALARY.hra },
            { label: 'Other Allowances',  value: SALARY.allowances },
          ].map(item => (
            <View key={item.label} style={[s.row, { marginBottom: 8 }]}>
              <Text style={[s.salaryRow, { color: C.text }]} allowFontScaling={false}>{item.label}</Text>
              <Text style={[s.salaryRow, { color: C.present, textAlign: 'right' }]} allowFontScaling={false}>
                + {fmt(item.value)}
              </Text>
            </View>
          ))}

          <Text style={[s.salaryGroup, { color: C.muted, marginTop: 8 }]} allowFontScaling={false}>DEDUCTIONS</Text>
          {[
            { label: 'Provident Fund (PF)', value: SALARY.pf },
            { label: 'Income Tax (TDS)',    value: SALARY.tax },
          ].map(item => (
            <View key={item.label} style={[s.row, { marginBottom: 8 }]}>
              <Text style={[s.salaryRow, { color: C.text }]} allowFontScaling={false}>{item.label}</Text>
              <Text style={[s.salaryRow, { color: C.absent, textAlign: 'right' }]} allowFontScaling={false}>
                - {fmt(item.value)}
              </Text>
            </View>
          ))}

          <View style={[s.divider, { backgroundColor: C.border, marginVertical: 8 }]} />
          <View style={s.row}>
            <Text style={[s.salaryRow, { color: C.text, fontWeight: '700' }]} allowFontScaling={false}>
              Net Salary
            </Text>
            <Text style={[s.salaryRow, { color: C.primary, fontWeight: '700', fontSize: 16, textAlign: 'right' }]} allowFontScaling={false}>
              {fmt(SALARY.netPay)}
            </Text>
          </View>
        </View>

        {/* ── Attendance Calendar ───────────────────────────── */}
        <View style={[s.row, { marginBottom: 10, alignItems: 'center' }]}>
          <Text style={[s.sectionTitle, { color: C.text, marginBottom: 0, flex: 1 }]} allowFontScaling={false}>
            Attendance Calendar
          </Text>
          <TouchableOpacity onPress={prevMonth} style={s.navBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={[s.calMonthLabel, { color: C.text }]} allowFontScaling={false}>
            {MONTH_NAMES[calMonth].slice(0, 3)} {calYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={s.navBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-forward" size={20} color={C.text} />
          </TouchableOpacity>
        </View>

        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }, shadow(3)]}>
          {/* Day headers */}
          <View style={[s.row, { marginBottom: 6 }]}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <View key={i} style={s.calCell}>
                <Text style={[s.calHeader, { color: i === 0 || i === 6 ? C.absent : C.muted }]} allowFontScaling={false}>
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
          <View style={s.calGrid}>
            {cells.map((cell, i) => (
              <View key={i} style={s.calCell}>
                {cell.day !== null ? (
                  <View style={[s.calDay, { backgroundColor: getDayBg(cell.status) }]}>
                    <Text style={[s.calDayTxt, { color: getDayColor(cell.status) }]} allowFontScaling={false}>
                      {cell.day}
                    </Text>
                  </View>
                ) : <View style={s.calDay} />}
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={[s.divider, { backgroundColor: C.border, marginTop: 12, marginBottom: 10 }]} />
          <View style={[s.row, { flexWrap: 'wrap', gap: 10 }]}>
            {[
              { label: 'Present',  color: C.present },
              { label: 'Absent',   color: C.absent },
              { label: 'Leave',    color: C.leave },
              { label: 'Half Day', color: C.halfDay },
              { label: 'Weekend',  color: C.weekend, border: C.border },
              { label: 'Today',    color: C.primary },
            ].map(item => (
              <View key={item.label} style={s.legendItem}>
                <View style={[s.legendDot, {
                  backgroundColor: item.color,
                  borderWidth: item.border ? 1 : 0,
                  borderColor: item.border ?? 'transparent',
                }]} />
                <Text style={[s.legendTxt, { color: C.muted }]} allowFontScaling={false}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: IS_SMALL ? 12 : 16,
    borderWidth: StyleSheet.hairlineWidth,  // crisp 1px on all pixel densities
    marginBottom: 0,
  },
  row:          { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: IS_SMALL ? 13 : 15, fontWeight: '700', marginBottom: 10 },
  label:        { fontSize: IS_SMALL ? 11 : 12 },
  divider:      { height: StyleSheet.hairlineWidth },

  // Header
  avatar: {
    width: IS_SMALL ? 44 : 52,
    height: IS_SMALL ? 44 : 52,
    borderRadius: IS_SMALL ? 22 : 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { fontSize: IS_SMALL ? 15 : 18, fontWeight: '800', color: '#fff' },
  empName:   { fontSize: IS_SMALL ? 15 : 18, fontWeight: '700', color: '#fff' },
  empSub:    { fontSize: IS_SMALL ? 11 : 12, color: 'rgba(255,255,255,0.82)', marginTop: 2 },
  dateBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 48,
  },
  dateDay: { fontSize: IS_SMALL ? 18 : 22, fontWeight: '800', color: '#fff' },
  dateMon: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  // Badges & dots
  badge: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  dot:      { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  badgeTxt: { fontSize: 11, fontWeight: '600' },

  // Attendance rows
  attendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IS_SMALL ? 10 : 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: IS_SMALL ? 36 : 42,
    height: IS_SMALL ? 36 : 42,
    borderRadius: IS_SMALL ? 18 : 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendLabel: { fontSize: 11, marginBottom: 1 },
  attendTime:  { fontSize: IS_SMALL ? 17 : 20, fontWeight: '700' },
  hoursText:   { fontSize: 12, fontWeight: '700' },

  // Buttons — min 44pt touch target (Apple HIG + Android Material)
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,              // ≥ 44pt Apple HIG / 48dp Android Material
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  btnTxt: { fontSize: IS_SMALL ? 13 : 15, fontWeight: '700' },

  // Stats
  statCard: {
    borderRadius: 12,
    padding: IS_SMALL ? 8 : 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 4,
  },
  statVal:   { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  // Salary
  salaryAmt:   { fontSize: 30, fontWeight: '800', marginTop: 2 },
  salaryGroup: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 12 },
  salaryRow:   { flex: 1, fontSize: IS_SMALL ? 12 : 13, fontWeight: '500' },

  // Calendar
  navBtn:        { padding: 6 },
  calMonthLabel: { fontSize: 13, fontWeight: '700', marginHorizontal: 6 },
  calGrid:       { flexDirection: 'row', flexWrap: 'wrap' },
  calCell:       { width: `${100 / 7}%`, alignItems: 'center', marginBottom: 4 },
  calDay: {
    width: CELL - 4,
    height: CELL - 4,
    borderRadius: (CELL - 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calHeader: { fontSize: IS_SMALL ? 10 : 12, fontWeight: '700' },
  calDayTxt: { fontSize: IS_SMALL ? 10 : 12, fontWeight: '600' },

  // Legend
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendTxt:  { fontSize: IS_SMALL ? 10 : 11 },
}); 
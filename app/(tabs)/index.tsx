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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '@/context/AuthContext';
import api from '@/app/lib/api';

// ── Responsive Helpers ────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const IS_SMALL = SCREEN_W < 375;
const IS_TABLET = SCREEN_W >= 768;
const FONT_SCALE = Math.min(PixelRatio.getFontScale(), 1.2);

const fs = (size: number) => Math.round(size / FONT_SCALE);
const wp = (pct: number) => (SCREEN_W * pct) / 100;
const CELL = Math.floor((SCREEN_W - 32 - 32) / 7);

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

// Employee & salary will be loaded from backend

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const calcDuration = (start: Date, end: Date) => {
  const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { logout, user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() },
      ],
      { cancelable: true }
    );
  };

  const today = new Date();
  const [employee, setEmployee] = useState<any | null>(null);
  const [salary, setSalary] = useState<any | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState('0h 0m');
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const [locationText, setLocationText] = useState('Fetching location...');
  const [locationLoading, setLocationLoading] = useState(true);

  // Live elapsed timer
  useEffect(() => {
    if (!isCheckedIn || !checkInTime) return;
    const timer = setInterval(() => {
      setElapsed(calcDuration(checkInTime, new Date()));
    }, 1000);

    return () => clearInterval(timer);
  }, [isCheckedIn, checkInTime]);

  // Fetch location
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        if (user?.id) {
          // fetch staff profile (may be under /users/profile or /staff/me)
          try {
            const profile = await api.apiGet('/users/profile');
            if (mounted) setEmployee(profile);
          } catch (e) {
            // fallback: attempt staff/me
            try {
              const s = await api.apiGet('/staff/me');
              if (mounted) setEmployee(s);
            } catch (e2) {
              // leave employee null
            }
          }

          // fetch salary history and attendance (best-effort)
          try {
            const staffId = (user && user.id) || (employee && employee.id);
            if (staffId) {
              const sal = await api.apiGet(`/salary/staff/${staffId}`);
              if (mounted && Array.isArray(sal) && sal.length > 0) setSalary(sal[0]);

              const att = await api.apiGet(`/staff/${staffId}/attendance`);
              if (mounted && Array.isArray(att)) setAttendanceRecords(att);
            }
          } catch (e) {
            // ignore fetch errors
          }
        }
      } catch (error) {
        // ignore
      }
    };

    const getLocation = async () => {
      try {
        setLocationLoading(true);

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          if (mounted) setLocationText('Location services are off');
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (mounted) setLocationText('Location permission denied');
          return;
        }

        const lastKnown = await Location.getLastKnownPositionAsync();
        const current =
          lastKnown ||
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));

        const { latitude, longitude } = current.coords;
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        const place = places?.[0];

        const readable = place
          ? [place.name, place.city, place.region].filter(Boolean).join(', ')
          : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        if (mounted) setLocationText(readable);
      } catch (error) {
        if (mounted) setLocationText('Unable to fetch location');
      } finally {
        if (mounted) setLocationLoading(false);
      }
    };

    getLocation();
    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleCheckIn = () => {
    const now = new Date();
    Alert.alert(
      'Confirm Check In',
      `Check in at ${formatTime(now)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In',
          onPress: async () => {
            try {
              const staffId = (employee && employee.id) || (user && user.id);
              if (!staffId) throw new Error('Staff id not available');
              const att = await api.apiPost(`/staff/${staffId}/check-in`);
              const ci = att?.check_in ? new Date(att.check_in) : new Date();
              setCheckInTime(ci);
              setCheckOutTime(null);
              setIsCheckedIn(true);
              setElapsed('0h 0m');
            } catch (e: any) {
              Alert.alert('Check In Failed', e.message || 'Unable to check in');
            }
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
          onPress: async () => {
            try {
              const staffId = (employee && employee.id) || (user && user.id);
              if (!staffId) throw new Error('Staff id not available');
              const att = await api.apiPost(`/staff/${staffId}/check-out`);
              const co = att?.check_out ? new Date(att.check_out) : new Date();
              setCheckOutTime(co);
              setIsCheckedIn(false);
              setElapsed(calcDuration(checkInTime, co));
            } catch (e: any) {
              Alert.alert('Check Out Failed', e.message || 'Unable to check out');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const attendanceStatus = !checkInTime
    ? { label: 'Not Checked In', color: '#94a3b8' }
    : isCheckedIn
    ? { label: 'Working', color: '#22c55e' }
    : { label: 'Completed', color: '#0ea5e9' };

  const buildAttendanceMap = (records: any[], year: number, month: number) => {
    const map: Record<number, string> = {};
    records.forEach((r) => {
      try {
        const d = new Date(r.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate();
          if (r.check_in && r.check_out) map[day] = 'P';
          else if (r.check_in) map[day] = 'T';
          else if (r.status) map[day] = r.status[0] ?? 'P';
        }
      } catch (e) {
        // ignore
      }
    });
    return map;
  };

  const attendance = buildAttendanceMap(attendanceRecords, calYear, calMonth);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();

  const stats = Object.values(attendance).reduce(
    (acc, s) => {
      if (s === 'P' || s === 'T') acc.present++;
      else if (s === 'A') acc.absent++;
      else if (s === 'L') acc.leave++;
      else if (s === 'H') acc.halfDay++;
      return acc;
    },
    { present: 0, absent: 0, leave: 0, halfDay: 0 }
  );

  const C = {
    bg: isDark ? '#0f172a' : '#f1f5f9',
    card: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    muted: isDark ? '#94a3b8' : '#64748b',
    primary: '#0ea5e9',
    present: '#22c55e',
    absent: '#ef4444',
    leave: '#f59e0b',
    halfDay: '#8b5cf6',
    weekend: isDark ? '#1e293b' : '#f1f5f9',
    weekendText: isDark ? '#475569' : '#cbd5e1',
    future: isDark ? '#1e293b' : '#f8fafc',
  };

  const getDayBg = (s: string) =>
    ({ T: C.primary, P: C.present, A: C.absent, L: C.leave, H: C.halfDay, W: C.weekend }[s] ?? C.future);

  const getDayColor = (s: string) =>
    ['T', 'P', 'A', 'L', 'H'].includes(s) ? '#fff' : s === 'W' ? C.weekendText : C.muted;

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

  const prevMonth = () =>
    calMonth === 0 ? (setCalMonth(11), setCalYear((y) => y - 1)) : setCalMonth((m) => m - 1);

  const nextMonth = () =>
    calMonth === 11 ? (setCalMonth(0), setCalYear((y) => y + 1)) : setCalMonth((m) => m + 1);

  const cells: Array<{ day: number | null; status: string }> = [
    ...Array(firstDay).fill({ day: null, status: '' }),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      status: attendance[i + 1],
    })),
  ];

  const statusBarStyle = isDark ? 'light-content' : 'dark-content';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: C.bg }}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={C.primary}
        translucent={false}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{
          padding: IS_TABLET ? 24 : 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 90,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Top Header Bar ───────────────────────────────── */}
        <View style={s.headerBar}>
          <Text style={[s.headerTitle, { color: C.text }]} allowFontScaling={false}>Employer Portal</Text>
          <TouchableOpacity onPress={handleLogout} style={s.headerLogoutBtn} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={16} color={C.primary} />
            <Text style={[s.headerLogoutTxt, { color: C.primary }]} allowFontScaling={false}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* ── Location Card ─────────────────────────────────── */}
        <View
          style={[
            s.card,
            {
              backgroundColor: C.card,
              borderColor: C.border,
              marginBottom: 12,
              paddingVertical: 12,
            },
            shadow(2),
          ]}
        >
          <View style={s.row}>
            <View
              style={[
                s.iconCircle,
                {
                  backgroundColor: C.primary + '20',
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                },
              ]}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={C.primary} />
              ) : (
                <Ionicons name="location-outline" size={18} color={C.primary} />
              )}
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.attendLabel, { color: C.muted }]} allowFontScaling={false}>
                Current Location
              </Text>
              <Text
                style={[
                  s.attendTime,
                  { color: C.text, fontSize: IS_SMALL ? 14 : 16, marginTop: 2 },
                ]}
                allowFontScaling={false}
                numberOfLines={1}
              >
                {locationText}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Employee Header ───────────────────────────────── */}
        <View
          style={[
            s.card,
            { backgroundColor: C.primary, borderColor: 'transparent', marginBottom: 16 },
            shadow(4),
          ]}
        >
          <View style={s.row}>
              <View style={s.avatar}>
                <Text style={s.avatarTxt} allowFontScaling={false}>
                  {(employee?.name || user?.name || 'User')
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')}
                </Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.empName} allowFontScaling={false} numberOfLines={1}>
                  {employee?.name || user?.name || 'Unknown'}
                </Text>
                <Text style={s.empSub} allowFontScaling={false} numberOfLines={1}>
                  {employee?.designation || employee?.role || ''}
                </Text>
                <Text style={s.empSub} allowFontScaling={false} numberOfLines={1}>
                  {(employee?.department || '') + (employee?.id ? ` · ${employee.id}` : '')}
                </Text>
              </View>

            <View style={s.dateBadge}>
              <Text style={s.dateDay} allowFontScaling={false}>
                {today.getDate()}
              </Text>
              <Text style={s.dateMon} allowFontScaling={false}>
                {MONTH_NAMES[today.getMonth()].slice(0, 3).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Today's Attendance ────────────────────────────── */}
        <Text style={[s.sectionTitle, { color: C.text }]} allowFontScaling={false}>
          Today's Attendance
        </Text>

        <View
          style={[
            s.card,
            { backgroundColor: C.card, borderColor: C.border, marginBottom: 16 },
            shadow(3),
          ]}
        >
          <View style={[s.row, { marginBottom: 14, flexWrap: 'wrap', gap: 6 }]}>
            <Text style={[s.label, { color: C.muted, flex: 1 }]} allowFontScaling={false}>
              {today.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>

            <View
              style={[
                s.badge,
                {
                  backgroundColor: attendanceStatus.color + '22',
                  borderColor: attendanceStatus.color,
                },
              ]}
            >
              <View style={[s.dot, { backgroundColor: attendanceStatus.color }]} />
              <Text style={[s.badgeTxt, { color: attendanceStatus.color }]} allowFontScaling={false}>
                {attendanceStatus.label}
              </Text>
            </View>
          </View>

          <View style={[s.attendRow, { borderBottomColor: C.border }]}>
            <View style={[s.iconCircle, { backgroundColor: C.present + '20' }]}>
              <Ionicons
                name="log-in-outline"
                size={IS_SMALL ? 19 : 22}
                color={C.present}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.attendLabel, { color: C.muted }]} allowFontScaling={false}>
                Check In
              </Text>
              <Text style={[s.attendTime, { color: C.text }]} allowFontScaling={false}>
                {checkInTime ? formatTime(checkInTime) : '--:-- --'}
              </Text>
            </View>

            {checkInTime && (
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Ionicons name="time-outline" size={15} color={C.primary} />
                <Text style={[s.hoursText, { color: C.primary }]} allowFontScaling={false}>
                  {elapsed}
                </Text>
              </View>
            )}
          </View>

          <View style={[s.attendRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={[s.iconCircle, { backgroundColor: C.absent + '20' }]}>
              <Ionicons
                name="log-out-outline"
                size={IS_SMALL ? 19 : 22}
                color={C.absent}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.attendLabel, { color: C.muted }]} allowFontScaling={false}>
                Check Out
              </Text>
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

          <View style={[s.row, { gap: 12, marginTop: 16 }]}>
            <TouchableOpacity
              style={[
                s.btn,
                {
                  flex: 1,
                  backgroundColor: isCheckedIn ? C.card : C.present,
                  borderColor: isCheckedIn ? C.border : C.present,
                  opacity: isCheckedIn ? 0.45 : 1,
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
              <Ionicons
                name="log-in-outline"
                size={18}
                color={isCheckedIn ? C.present : '#fff'}
              />
              <Text
                style={[s.btnTxt, { color: isCheckedIn ? C.present : '#fff' }]}
                allowFontScaling={false}
              >
                Check In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.btn,
                {
                  flex: 1,
                  backgroundColor: isCheckedIn ? C.absent : C.card,
                  borderColor: isCheckedIn ? C.absent : C.border,
                  opacity: !isCheckedIn ? 0.45 : 1,
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
              <Ionicons
                name="log-out-outline"
                size={18}
                color={isCheckedIn ? '#fff' : C.absent}
              />
              <Text
                style={[s.btnTxt, { color: isCheckedIn ? '#fff' : C.absent }]}
                allowFontScaling={false}
              >
                Check Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Monthly Stats ─────────────────────────────────── */}
        <View style={[s.row, { gap: IS_SMALL ? 6 : 10, marginBottom: 16 }]}>
          {[
            { label: 'Present', value: stats.present, color: C.present, icon: 'checkmark-circle-outline' },
            { label: 'Absent', value: stats.absent, color: C.absent, icon: 'close-circle-outline' },
            { label: 'Leave', value: stats.leave, color: C.leave, icon: 'calendar-outline' },
            { label: 'Half Day', value: stats.halfDay, color: C.halfDay, icon: 'remove-circle-outline' },
          ].map((item) => (
            <View
              key={item.label}
              style={[
                s.statCard,
                { backgroundColor: C.card, borderColor: C.border, flex: 1 },
                shadow(2),
              ]}
            >
              <Ionicons name={item.icon as any} size={IS_SMALL ? 16 : 20} color={item.color} />
              <Text
                style={[s.statVal, { color: C.text, fontSize: IS_SMALL ? 18 : 22 }]}
                allowFontScaling={false}
              >
                {item.value}
              </Text>
              <Text
                style={[s.statLabel, { color: C.muted, fontSize: IS_SMALL ? 9 : 10 }]}
                allowFontScaling={false}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Salary Card ───────────────────────────────────── */}
        <Text style={[s.sectionTitle, { color: C.text }]} allowFontScaling={false}>
          Salary — {salary?.month ?? '—'}
        </Text>

        <View
          style={[
            s.card,
            { backgroundColor: C.card, borderColor: C.border, marginBottom: 16 },
            shadow(3),
          ]}
        >
          <View style={[s.row, { marginBottom: 14, alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.label, { color: C.muted }]} allowFontScaling={false}>
                Net Pay
              </Text>
              <Text
                style={[s.salaryAmt, { color: C.text, fontSize: IS_SMALL ? 24 : 30 }]}
                allowFontScaling={false}
              >
                {fmt(salary?.netPay ?? 0)}
              </Text>
            </View>

            <View style={[s.badge, { backgroundColor: C.present + '22', borderColor: C.present }]}>
              <Ionicons name="checkmark-circle" size={12} color={C.present} />
              <Text style={[s.badgeTxt, { color: C.present, marginLeft: 4 }]} allowFontScaling={false}>
                Credited {salary?.creditedOn ?? '—'}
              </Text>
            </View>
          </View>

          <View style={[s.divider, { backgroundColor: C.border }]} />

          <Text style={[s.salaryGroup, { color: C.muted }]} allowFontScaling={false}>
            EARNINGS
          </Text>

          {[
            { label: 'Basic Salary', value: salary?.basic ?? 0 },
            { label: 'HRA', value: salary?.hra ?? 0 },
            { label: 'Other Allowances', value: salary?.allowances ?? 0 },
          ].map((item) => (
            <View key={item.label} style={[s.row, { marginBottom: 8 }]}>
              <Text style={[s.salaryRow, { color: C.text }]} allowFontScaling={false}>
                {item.label}
              </Text>
              <Text
                style={[s.salaryRow, { color: C.present, textAlign: 'right' }]}
                allowFontScaling={false}
              >
                + {fmt(item.value)}
              </Text>
            </View>
          ))}

          <Text
            style={[s.salaryGroup, { color: C.muted, marginTop: 8 }]}
            allowFontScaling={false}
          >
            DEDUCTIONS
          </Text>

          {[
            { label: 'Provident Fund (PF)', value: salary?.pf ?? 0 },
            { label: 'Income Tax (TDS)', value: salary?.tax ?? 0 },
          ].map((item) => (
            <View key={item.label} style={[s.row, { marginBottom: 8 }]}>
              <Text style={[s.salaryRow, { color: C.text }]} allowFontScaling={false}>
                {item.label}
              </Text>
              <Text
                style={[s.salaryRow, { color: C.absent, textAlign: 'right' }]}
                allowFontScaling={false}
              >
                - {fmt(item.value)}
              </Text>
            </View>
          ))}

          <View style={[s.divider, { backgroundColor: C.border, marginVertical: 8 }]} />

          <View style={s.row}>
            <Text
              style={[s.salaryRow, { color: C.text, fontWeight: '700' }]}
              allowFontScaling={false}
            >
              Net Salary
            </Text>
            <Text
              style={[
                s.salaryRow,
                { color: C.primary, fontWeight: '700', fontSize: 16, textAlign: 'right' },
              ]}
              allowFontScaling={false}
            >
              {fmt(salary?.netPay ?? 0)}
            </Text>
          </View>
        </View>

        {/* ── Attendance Calendar ───────────────────────────── */}
        <View style={[s.row, { marginBottom: 10, alignItems: 'center' }]}>
          <Text
            style={[s.sectionTitle, { color: C.text, marginBottom: 0, flex: 1 }]}
            allowFontScaling={false}
          >
            Attendance Calendar
          </Text>

          <TouchableOpacity
            onPress={prevMonth}
            style={s.navBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>

          <Text style={[s.calMonthLabel, { color: C.text }]} allowFontScaling={false}>
            {MONTH_NAMES[calMonth].slice(0, 3)} {calYear}
          </Text>

          <TouchableOpacity
            onPress={nextMonth}
            style={s.navBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={20} color={C.text} />
          </TouchableOpacity>
        </View>

        <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }, shadow(3)]}>
          <View style={[s.row, { marginBottom: 6 }]}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <View key={i} style={s.calCell}>
                <Text
                  style={[s.calHeader, { color: i === 0 || i === 6 ? C.absent : C.muted }]}
                  allowFontScaling={false}
                >
                  {d}
                </Text>
              </View>
            ))}
          </View>

          <View style={s.calGrid}>
            {cells.map((cell, i) => (
              <View key={i} style={s.calCell}>
                {cell.day !== null ? (
                  <View style={[s.calDay, { backgroundColor: getDayBg(cell.status) }]}>
                    <Text
                      style={[s.calDayTxt, { color: getDayColor(cell.status) }]}
                      allowFontScaling={false}
                    >
                      {cell.day}
                    </Text>
                  </View>
                ) : (
                  <View style={s.calDay} />
                )}
              </View>
            ))}
          </View>

          <View style={[s.divider, { backgroundColor: C.border, marginTop: 12, marginBottom: 10 }]} />

          <View style={[s.row, { flexWrap: 'wrap', gap: 10 }]}>
            {[
              { label: 'Present', color: C.present },
              { label: 'Absent', color: C.absent },
              { label: 'Leave', color: C.leave },
              { label: 'Half Day', color: C.halfDay },
              { label: 'Weekend', color: C.weekend, border: C.border },
              { label: 'Today', color: C.primary },
            ].map((item) => (
              <View key={item.label} style={s.legendItem}>
                <View
                  style={[
                    s.legendDot,
                    {
                      backgroundColor: item.color,
                      borderWidth: item.border ? 1 : 0,
                      borderColor: item.border ?? 'transparent',
                    },
                  ]}
                />
                <Text style={[s.legendTxt, { color: C.muted }]} allowFontScaling={false}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: IS_SMALL ? 18 : 22,
    fontWeight: '800',
  },
  headerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  headerLogoutTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    padding: IS_SMALL ? 12 : 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 0,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: IS_SMALL ? 13 : 15, fontWeight: '700', marginBottom: 10 },
  label: { fontSize: IS_SMALL ? 11 : 12 },
  divider: { height: StyleSheet.hairlineWidth },

  avatar: {
    width: IS_SMALL ? 44 : 52,
    height: IS_SMALL ? 44 : 52,
    borderRadius: IS_SMALL ? 22 : 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { fontSize: IS_SMALL ? 15 : 18, fontWeight: '800', color: '#fff' },
  empName: { fontSize: IS_SMALL ? 15 : 18, fontWeight: '700', color: '#fff' },
  empSub: { fontSize: IS_SMALL ? 11 : 12, color: 'rgba(255,255,255,0.82)', marginTop: 2 },
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

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  badgeTxt: { fontSize: 11, fontWeight: '600' },

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
  attendTime: { fontSize: IS_SMALL ? 17 : 20, fontWeight: '700' },
  hoursText: { fontSize: 12, fontWeight: '700' },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  btnTxt: { fontSize: IS_SMALL ? 13 : 15, fontWeight: '700' },

  statCard: {
    borderRadius: 12,
    padding: IS_SMALL ? 8 : 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 4,
  },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  salaryAmt: { fontSize: 30, fontWeight: '800', marginTop: 2 },
  salaryGroup: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 12 },
  salaryRow: { flex: 1, fontSize: IS_SMALL ? 12 : 13, fontWeight: '500' },

  navBtn: { padding: 6 },
  calMonthLabel: { fontSize: 13, fontWeight: '700', marginHorizontal: 6 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', marginBottom: 4 },
  calDay: {
    width: CELL - 4,
    height: CELL - 4,
    borderRadius: (CELL - 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calHeader: { fontSize: IS_SMALL ? 10 : 12, fontWeight: '700' },
  calDayTxt: { fontSize: IS_SMALL ? 10 : 12, fontWeight: '600' },

  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendTxt: { fontSize: IS_SMALL ? 10 : 11 },
});
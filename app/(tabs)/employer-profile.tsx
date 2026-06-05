// app/(tabs)/employer-profile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Switch,
  useColorScheme,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_SMALL = SCREEN_WIDTH < 375;

export default function EmployerProfileScreen() {
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const C = {
    bg: isDark ? '#0f172a' : '#f1f5f9',
    card: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    muted: isDark ? '#94a3b8' : '#64748b',
    primary: '#0ea5e9',
    primaryGlow: 'rgba(14, 165, 233, 0.15)',
    danger: '#ef4444',
    dangerGlow: 'rgba(239, 68, 68, 0.1)',
    success: '#22c55e',
    successGlow: 'rgba(34, 197, 94, 0.1)',
  };

  const shadow = (elevation = 3) =>
    Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: elevation },
        shadowOpacity: 0.08,
        shadowRadius: elevation * 2,
      },
      android: { elevation },
      default: {},
    });

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to exit your administrator session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ],
      { cancelable: true }
    );
  };

  const handleAction = (actionName: string) => {
    Alert.alert('Quick Action', `${actionName} is simulated in this workspace.`);
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 100, // extra padding for the floating tab bar
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.titleText, { color: C.text }]}>Employer Profile</Text>
          <Text style={[styles.subtitleText, { color: C.muted }]}>Workspace administration & details</Text>
        </View>

        {/* Company Identity Card */}
        <View style={[styles.companyCard, { backgroundColor: C.card, borderColor: C.border }, shadow(4)]}>
          <View style={styles.cardHeader}>
            <View style={[styles.logoContainer, { backgroundColor: C.primaryGlow }]}>
              <Ionicons name="business" size={32} color={C.primary} />
            </View>
            <View style={styles.companyMeta}>
              <View style={styles.nameRow}>
                <Text style={[styles.companyName, { color: C.text }]}>TechSolutions Group</Text>
                <View style={[styles.verifiedBadge, { backgroundColor: C.successGlow }]}>
                  <Ionicons name="checkmark-circle" size={14} color={C.success} />
                  <Text style={[styles.verifiedText, { color: C.success }]}>Verified</Text>
                </View>
              </View>
              <Text style={[styles.industryText, { color: C.muted }]}>Software & IT Services</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: C.border }]} />

          <View style={styles.adminMeta}>
            <Ionicons name="person-circle-outline" size={20} color={C.muted} />
            <Text style={[styles.adminLabel, { color: C.muted }]}>Admin:</Text>
            <Text style={[styles.adminValue, { color: C.text }]}>{user?.name || 'Harsh Kumar'}</Text>
          </View>

          <View style={styles.adminMeta}>
            <Ionicons name="mail-outline" size={20} color={C.muted} />
            <Text style={[styles.adminLabel, { color: C.muted }]}>Email:</Text>
            <Text style={[styles.adminValue, { color: C.text }]} numberOfLines={1}>
              {user?.email || 'admin@employer.com'}
            </Text>
          </View>
        </View>

        {/* Analytics Stats Grid */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: C.card, borderColor: C.border }, shadow(2)]}>
            <Text style={[styles.statValue, { color: C.text }]}>124</Text>
            <Text style={[styles.statLabel, { color: C.muted }]}>Total Staff</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: C.card, borderColor: C.border }, shadow(2)]}>
            <Text style={[styles.statValue, { color: C.text }]}>Active</Text>
            <Text style={[styles.statLabel, { color: C.muted }]}>Shifts Live</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: C.card, borderColor: C.border }, shadow(2)]}>
            <Text style={[styles.statValue, { color: C.text }]}>96.8%</Text>
            <Text style={[styles.statLabel, { color: C.muted }]}>Attendance</Text>
          </View>
        </View>

        {/* Section: Administrative Quick Actions */}
        <Text style={[styles.sectionHeading, { color: C.text }]}>Administrative Controls</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.card, borderColor: C.border }, shadow(2)]}
            onPress={() => handleAction('Edit Company Profile')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(14, 165, 233, 0.1)' }]}>
              <Ionicons name="create-outline" size={22} color="#0ea5e9" />
            </View>
            <Text style={[styles.actionBtnTitle, { color: C.text }]}>Edit Details</Text>
            <Text style={[styles.actionBtnDesc, { color: C.muted }]}>Update office address & info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.card, borderColor: C.border }, shadow(2)]}
            onPress={() => handleAction('Manage Employees')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Ionicons name="people-outline" size={22} color="#22c55e" />
            </View>
            <Text style={[styles.actionBtnTitle, { color: C.text }]}>Manage Staff</Text>
            <Text style={[styles.actionBtnDesc, { color: C.muted }]}>Add/remove employee credentials</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.card, borderColor: C.border }, shadow(2)]}
            onPress={() => handleAction('Leave & Shifts')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
              <Ionicons name="calendar-outline" size={22} color="#a855f7" />
            </View>
            <Text style={[styles.actionBtnTitle, { color: C.text }]}>Leave & Shifts</Text>
            <Text style={[styles.actionBtnDesc, { color: C.muted }]}>Review leave requests & schedules</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: C.card, borderColor: C.border }, shadow(2)]}
            onPress={() => handleAction('Payroll & Billing')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
              <Ionicons name="card-outline" size={22} color="#eab308" />
            </View>
            <Text style={[styles.actionBtnTitle, { color: C.text }]}>Billing Details</Text>
            <Text style={[styles.actionBtnDesc, { color: C.muted }]}>Invoices & active subscriptions</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Organization Details */}
        <Text style={[styles.sectionHeading, { color: C.text }]}>Organization Details</Text>
        <View style={[styles.detailsContainer, { backgroundColor: C.card, borderColor: C.border }, shadow(2)]}>
          {[
            { label: 'Register ID', val: 'TSG-2026-N09', icon: 'finger-print-outline' },
            { label: 'Incorporation', val: 'January 12, 2021', icon: 'calendar-outline' },
            { label: 'Office Address', val: 'Sector 62, Noida, UP, India', icon: 'location-outline' },
            { label: 'Primary Website', val: 'https://techsolutions.corp', icon: 'globe-outline', link: 'https://techsolutions.corp' },
            { label: 'Support Hotline', val: '+91 98765 43210', icon: 'call-outline', link: 'tel:+919876543210' },
          ].map((detail, idx) => (
            <View key={idx}>
              {idx > 0 && <View style={[styles.divider, { backgroundColor: C.border, marginVertical: 0 }]} />}
              <TouchableOpacity
                style={styles.detailRow}
                disabled={!detail.link}
                onPress={() => detail.link && openLink(detail.link)}
                activeOpacity={0.6}
              >
                <View style={styles.detailLeft}>
                  <Ionicons name={detail.icon as any} size={18} color={C.muted} />
                  <Text style={[styles.detailLabel, { color: C.muted }]}>{detail.label}</Text>
                </View>
                <Text style={[styles.detailValue, { color: detail.link ? C.primary : C.text }]}>
                  {detail.val}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Section: App Settings */}
        <Text style={[styles.sectionHeading, { color: C.text }]}>System Preferences</Text>
        <View style={[styles.detailsContainer, { backgroundColor: C.card, borderColor: C.border }, shadow(2)]}>
          <View style={styles.settingsRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="notifications-outline" size={18} color={C.muted} />
              <Text style={[styles.detailLabel, { color: C.text, fontWeight: '500' }]}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: '#38bdf8' }}
              thumbColor={notificationsEnabled ? C.primary : '#f4f3f4'}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: C.border, marginVertical: 0 }]} />
          <View style={styles.settingsRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="finger-print-outline" size={18} color={C.muted} />
              <Text style={[styles.detailLabel, { color: C.text, fontWeight: '500' }]}>Biometric Lock</Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#767577', true: '#38bdf8' }}
              thumbColor={biometricsEnabled ? C.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Session Log out */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: C.danger, backgroundColor: C.dangerGlow }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={C.danger} />
          <Text style={[styles.logoutText, { color: C.danger }]}>Terminate Administrator Session</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? 12 : 6,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 14,
    marginTop: 4,
  },
  companyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyMeta: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '800',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  industryText: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  adminMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  adminLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 50,
  },
  adminValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    width: (SCREEN_WIDTH - 32 - 12) / 2 - 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  actionIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  detailsContainer: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    gap: 16,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Truck, CheckCircle2, Route, Star, MessageSquare } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useBookingStore } from '../store/useBookingStore';
import { AMBULANCE_TYPES } from '../constants/ambulanceTypes';

export const BookingHistoryScreen: React.FC = () => {
  const {
    bookingStatus,
    activeBookingId,
    selectedHospital,
    selectedAmbulanceType,
    bookingHistory,
    setCurrentScreen,
  } = useBookingStore();

  const isTripActive =
    bookingStatus === 'searching' ||
    bookingStatus === 'driver_assigned' ||
    bookingStatus === 'driver_arriving' ||
    bookingStatus === 'patient_picked_up' ||
    bookingStatus === 'en_route_hospital';

  /**
   * Opens the global FeedbackPrompt in App.tsx for the given booking.
   * App.tsx registers __savlife_openFeedback on globalThis so any screen can trigger it.
   */
  const handleOpenFeedback = (bookingId: string) => {
    const openFn = (globalThis as any).__savlife_openFeedback;
    if (typeof openFn === 'function') openFn(bookingId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Ambulance Bookings</Text>
          <Text style={styles.headerSubtitle}>Live Tracking &amp; Emergency Medical History</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Active Booking Banner if Trip in Progress */}
          {isTripActive && (
            <View style={styles.activeCard}>
              <View style={styles.activeCardHeader}>
                <View style={styles.activeTag}>
                  <View style={styles.blinkingDot} />
                  <Text style={styles.activeTagText}>TRIP IN PROGRESS</Text>
                </View>
                <Text style={styles.activeBookingId}>#{activeBookingId}</Text>
              </View>

              <Text style={styles.activeHospitalTitle}>
                {selectedHospital?.name || 'Emergency Hospital'}
              </Text>
              <Text style={styles.activeType}>
                {AMBULANCE_TYPES[selectedAmbulanceType]?.name}
              </Text>

              <TouchableOpacity
                style={styles.resumeTrackingBtn}
                activeOpacity={0.85}
                onPress={() => {
                  if (bookingStatus === 'searching') {
                    setCurrentScreen('searching_dispatch');
                  } else {
                    setCurrentScreen('live_tracking');
                  }
                }}
              >
                <Route size={16} color="#FFFFFF" />
                <Text style={styles.resumeTrackingBtnText}>Resume Live Tracking Map</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* New Emergency Booking CTA */}
          {!isTripActive && (
            <TouchableOpacity
              style={styles.bookNewBtn}
              activeOpacity={0.88}
              onPress={() => setCurrentScreen('hospital_select')}
            >
              <Truck size={18} color="#FFFFFF" />
              <Text style={styles.bookNewBtnText}>Book Emergency Ambulance Now</Text>
            </TouchableOpacity>
          )}

          {/* Booking History Section */}
          <Text style={styles.sectionHeader}>Past Emergency Dispatches</Text>

          {bookingHistory.map((item) => {
            const config = AMBULANCE_TYPES[item.ambulanceType] || AMBULANCE_TYPES.bls;
            const hasFeedback = !!item.feedback;
            const needsFeedback = item.status === 'completed' && !hasFeedback;

            return (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyTopRow}>
                  <View style={styles.iconCircle}>
                    <Truck size={20} color={COLORS.primaryDark} />
                  </View>

                  <View style={styles.historyInfo}>
                    <Text style={styles.historyHospitalName}>{item.hospital.name}</Text>
                    <Text style={styles.historyDate}>{item.timestamp}</Text>
                  </View>

                  <Text style={styles.fareAmount}>{item.fare.formattedTotal}</Text>
                </View>

                {/* Details Bar */}
                <View style={styles.historyDetailsBar}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{config.name}</Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <CheckCircle2 size={12} color={COLORS.primary} />
                    <Text style={styles.statusText}>Completed</Text>
                  </View>
                </View>

                <View style={styles.driverInfoRow}>
                  <Text style={styles.driverText}>
                    EMT: {item.driverName} • {item.ambulanceNumber}
                  </Text>
                </View>

                {/* ─── Feedback Section ───────────────────────────────── */}
                {hasFeedback ? (
                  // Already rated — show submitted stars summary
                  <View style={styles.feedbackDoneRow}>
                    <View style={styles.feedbackDoneBadge}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.feedbackDoneText}>
                        Hospital {item.feedback!.hospitalRating}★ · Ambulance {item.feedback!.ambulanceRating}★
                      </Text>
                    </View>
                    <Text style={styles.feedbackDoneLabel}>Feedback submitted</Text>
                  </View>
                ) : needsFeedback ? (
                  // Not yet rated — show "Give Feedback" button
                  <TouchableOpacity
                    style={styles.feedbackBtn}
                    activeOpacity={0.85}
                    onPress={() => handleOpenFeedback(item.id)}
                  >
                    <MessageSquare size={14} color="#0E9F6E" />
                    <Text style={styles.feedbackBtnText}>Rate this trip</Text>
                  </TouchableOpacity>
                ) : null}
                {/* ──────────────────────────────────────────────────────── */}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  activeCard: {
    backgroundColor: COLORS.alertRedLight,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
    marginBottom: 20,
    shadowColor: COLORS.alertRed,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.alertRed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  blinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  activeBookingId: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.alertRed,
  },
  activeHospitalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  activeType: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 12,
  },
  resumeTrackingBtn: {
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.alertRed,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resumeTrackingBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  bookNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.alertRed,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 16,
    shadowColor: COLORS.alertRed,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  bookNewBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  historyInfo: {
    flex: 1,
  },
  historyHospitalName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  fareAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  historyDetailsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  typeBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  driverInfoRow: {
    marginTop: 6,
  },
  driverText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // ── Feedback styles ──────────────────────────────────────────
  feedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
  },
  feedbackBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  feedbackDoneRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  feedbackDoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  feedbackDoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  feedbackDoneLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});

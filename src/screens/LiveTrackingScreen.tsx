// 🗺️ Live Ambulance Tracking Screen - Cloned from Rapido Ride-Booking UX
// Pixel-perfect Rapido layout with animated incoming route line, live arrival state, and in-screen OTP

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Image,
  Share,
  Platform,
  Linking,
} from 'react-native';
import { LiveMapView } from '../components/map/LiveMapView';
import { useBookingStore } from '../store/useBookingStore';
import { useDriverStore } from '../store/useDriverStore';
import { useDriverSimulation } from '../hooks/useDriverSimulation';
import { COLORS } from '../constants/colors';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  Activity,
  Send,
  X,
  HeartPulse,
  Phone,
  Share2,
  Shield,
  Edit2,
  Navigation,
  CheckCircle,
  PhoneCall,
  Copy,
  Sparkles,
} from 'lucide-react-native';

export const LiveTrackingScreen: React.FC = () => {
  // 🚑 Booking Store - Live state & OTP
  const {
    pickupLocation,
    selectedHospital,
    selectedAmbulanceType,
    activeBookingId,
    cancelActiveBooking,
    setCurrentScreen,
    otpCode,
    otpVerified,
    setOtpVerified,
    fareCalculation,
  } = useBookingStore();

  // 🚗 Driver Store - Live coordinates, route polyline & telemetry
  const {
    driver,
    currentCoord,
    heading,
    tripPhase,
    etaMinutesRemaining,
    etaSecondsRemaining,
    routeCoordinates,
    setTripPhase,
  } = useDriverStore();

  // 🗺️ Start road network simulation
  useDriverSimulation();

  // Modals & States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'driver'; text: string; time: string }>>([
    {
      sender: 'driver',
      text: 'Emergency lights active! Approaching Pragati Marg now. Keep patient resting.',
      time: 'Just now',
    },
  ]);

  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isTripDetailsOpen, setIsTripDetailsOpen] = useState(false);
  const [patientStatus, setPatientStatus] = useState('Conscious & Breathing');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const isEnRouteToHospital = tripPhase === 'en_route_hospital' || tripPhase === 'arrived_hospital';
  const hasArrived = tripPhase === 'pickup_wait' || etaSecondsRemaining <= 0;

  // Split 4-digit OTP into 4 individual characters for separate boxes
  const pinDigits = (otpCode || '2979').slice(0, 4).split('');

  const handleShareTrip = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(
          `SavLife Live Ambulance Tracking: Unit ${driver.ambulanceNumber} is en route. ETA: ${etaMinutesRemaining} mins. Emergency PIN: ${otpCode}. Track: http://localhost:8081`
        );
        Alert.alert('Tracking Link Copied', 'Live GPS ambulance tracking link copied to clipboard!');
      } else {
        await Share.share({
          message: `SavLife Live Ambulance Tracking: Unit ${driver.ambulanceNumber} is en route. ETA: ${etaMinutesRemaining} mins. Emergency PIN: ${otpCode}.`,
        });
      }
    } catch (e) {}
  };

  const handleCopyPin = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(otpCode || '2979');
        setCopiedPin(true);
        setTimeout(() => setCopiedPin(false), 2000);
      }
    } catch (e) {}
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const newMsg = {
      sender: 'user' as const,
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setChatMessage('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'driver',
          text: 'Understood. Paramedic team informed.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  const handleStartHospitalTransit = () => {
    setTripPhase('en_route_hospital');
  };

  return (
    <View style={styles.container}>
      {/* 🗺️ Full Interactive Map Area with Live Animated Incoming Route Line */}
      <View style={styles.mapContainer}>
        <LiveMapView
          pickupLocation={pickupLocation}
          driverLocation={{
            latitude: currentCoord.latitude,
            longitude: currentCoord.longitude,
            heading,
          }}
          destinationHospital={isEnRouteToHospital ? selectedHospital : null}
          routeCoordinates={routeCoordinates}
          showPickupPuck={!isEnRouteToHospital}
          showDriverMarker={true}
          showDestinationMarker={isEnRouteToHospital}
        />

        {/* 🔙 Floating Top Back Button */}
        <SafeAreaView style={styles.topBarSafe}>
          <TouchableOpacity
            style={styles.floatingBackBtn}
            activeOpacity={0.85}
            onPress={() => setCurrentScreen('home')}
          >
            <ArrowLeft size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* ✏️ Floating "Pickup" Pill over Map */}
        <View style={styles.floatingPickupTag}>
          <Text style={styles.floatingPickupTagText}>Pickup</Text>
          <Edit2 size={12} color={COLORS.textPrimary} style={{ marginLeft: 4 }} />
        </View>

        {/* 🔘 Floating Map Bottom-Right Buttons: [ Share ] & [ 🛡️ Safety ] */}
        <View style={styles.mapFloatingActions}>
          <TouchableOpacity
            style={styles.shareRoundBtn}
            activeOpacity={0.88}
            onPress={handleShareTrip}
          >
            <Share2 size={18} color="#2563EB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.safetyPillBtn}
            activeOpacity={0.88}
            onPress={() => setIsSafetyModalOpen(true)}
          >
            <Shield size={16} color="#2563EB" fill="#2563EB" />
            <Text style={styles.safetyPillText}>Safety</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 📱 Bottom Sheet Card (Pixel-Perfect Rapido Clone) */}
      <View style={styles.bottomSheetWrapper}>
        {/* Drag Handle */}
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        {/* 🔷 Header Banner: Dynamic (En Route vs ARRIVED) */}
        <View style={[styles.blueHeaderBanner, hasArrived && styles.arrivedHeaderBanner]}>
          <Text style={styles.blueHeaderBannerText}>
            {hasArrived
              ? '🚨 AMBULANCE ARRIVED AT YOUR LOCATION'
              : isEnRouteToHospital
              ? 'En route to Emergency Hospital'
              : 'Walk to your pickup-point'}
          </Text>

          {/* White Card nested inside header banner */}
          <View style={styles.etaWhiteCard}>
            {hasArrived ? (
              <View style={{ alignItems: 'center' }}>
                <View style={styles.arrivedPillRow}>
                  <View style={styles.arrivedBlinkingDot} />
                  <Text style={styles.arrivedMainTitle}>Arrived • Paramedic Waiting</Text>
                </View>
                <Text style={styles.etaSubtitle}>
                  Unit {driver.ambulanceNumber} is outside • Share PIN below
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.etaMainTitle}>
                  Pickup in <Text style={styles.etaHighlightGreen}>{Math.max(1, etaMinutesRemaining)} mins</Text>
                </Text>
                <Text style={styles.etaSubtitle}>
                  Captain {Math.max(80, etaSecondsRemaining * 3)} m away
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 🔢 PIN / OTP Section (Displayed Right on Screen) */}
        <View style={styles.pinSectionRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.pinSectionLabel}>Start your order with PIN</Text>
            {copiedPin && (
              <Text style={{ fontSize: 10, color: COLORS.primaryDark, fontWeight: '800' }}>✓ Copied</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.pinBoxesContainer}
            activeOpacity={0.8}
            onPress={handleCopyPin}
          >
            {pinDigits.map((digit, index) => (
              <View key={index} style={styles.pinSingleBox}>
                <Text style={styles.pinDigitText}>{digit}</Text>
              </View>
            ))}
          </TouchableOpacity>
        </View>

        {/* If Arrived: Show "Patient On-board ➔ Start Hospital Transit" Button */}
        {hasArrived && !isEnRouteToHospital && (
          <TouchableOpacity
            style={styles.startTransitBtn}
            activeOpacity={0.88}
            onPress={handleStartHospitalTransit}
          >
            <Navigation size={16} color="#FFFFFF" />
            <Text style={styles.startTransitBtnText}>Patient On-board • Start Transit to Hospital</Text>
          </TouchableOpacity>
        )}

        {/* 👨‍✈️ Captain / Driver Card */}
        <View style={styles.captainCard}>
          {/* Top Recommendation Banner */}
          <View style={styles.captainHeaderRow}>
            <View style={styles.mascotAvatar}>
              <Text style={{ fontSize: 22 }}>👨‍⚕️</Text>
            </View>
            <Text style={styles.captainRecommendText}>
              This is the best captain for you, right now.
            </Text>
          </View>

          {/* Vehicle & Driver Details */}
          <View style={styles.driverInfoBody}>
            <View style={styles.vehicleDetailsCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Text style={styles.vehicleNumberText}>
                  {driver.ambulanceNumber.replace(/\s+/g, '')}
                </Text>
                <View style={[styles.typePillBadge, selectedAmbulanceType === 'als' ? styles.typePillAls : styles.typePillBls]}>
                  <Text style={[styles.typePillText, selectedAmbulanceType === 'als' ? { color: COLORS.alertRed } : { color: COLORS.primaryDark }]}>
                    {selectedAmbulanceType === 'als' ? 'ALS ICU' : 'BLS'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.vehicleModelText}>
                {selectedAmbulanceType === 'als' ? 'FORCE TRAVELLER 3350 ICU' : 'TATA WINGER BLS EMERGENCY'}
              </Text>
              
              <Text style={styles.equipmentSummaryText}>
                {selectedAmbulanceType === 'als' ? 'Ventilator • Defibrillator • 12-Lead ECG' : 'Hydraulic Stretcher • 2000L O2 Kit'}
              </Text>

              <Text style={styles.driverNameText}>
                {driver.name}
              </Text>
            </View>

            {/* Driver Photo with "Never Cancels ⭐" badge */}
            <View style={styles.driverPhotoContainer}>
              <Image
                source={{ uri: driver.photoUrl }}
                style={styles.driverPhoto}
              />
              <View style={styles.neverCancelsBadge}>
                <Text style={styles.neverCancelsBadgeText}>Never Cancels</Text>
                <View style={styles.starCircle}>
                  <Text style={{ fontSize: 8, color: '#FFFFFF' }}>★</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 💬 Message Captain Pill Input */}
          <TouchableOpacity
            style={styles.messageCaptainPill}
            activeOpacity={0.85}
            onPress={() => setIsChatOpen(true)}
          >
            <Phone size={16} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.messageCaptainText}>
              Message {driver.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 📍 Bottom Footer: "Pickup From" & "Trip Details" Button */}
        <View style={styles.footerRow}>
          <View style={styles.pickupAddressCol}>
            <Text style={styles.pickupFromLabel}>Pickup From</Text>
            <Text style={styles.pickupAddressText} numberOfLines={1}>
              {pickupLocation.address || 'Tower 4, Jaypee Greens Wish Town, Sector 128...'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.tripDetailsBtn}
            activeOpacity={0.85}
            onPress={() => setIsTripDetailsOpen(true)}
          >
            <Text style={styles.tripDetailsBtnText}>Trip Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 💬 EMT Direct Message Modal */}
      <Modal visible={isChatOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>EMT {driver.name} (Direct Line)</Text>
              <TouchableOpacity onPress={() => setIsChatOpen(false)}>
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.chatScroll} contentContainerStyle={{ padding: 12, gap: 8 }}>
              {messages.map((m, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chatMsg,
                    m.sender === 'user' ? styles.chatMsgUser : styles.chatMsgDriver,
                  ]}
                >
                  <Text
                    style={[
                      styles.chatMsgText,
                      m.sender === 'user' ? styles.chatMsgTextUser : styles.chatMsgTextDriver,
                    ]}
                  >
                    {m.text}
                  </Text>
                  <Text style={styles.chatMsgTime}>{m.time}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Send gate code, landmark, or patient update..."
                placeholderTextColor={COLORS.textPlaceholder}
                value={chatMessage}
                onChangeText={setChatMessage}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity style={styles.sendChatBtn} onPress={handleSendMessage}>
                <Send size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🛡️ Emergency Safety Modal */}
      <Modal visible={isSafetyModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SavLife Emergency Safety Toolkit</Text>
              <TouchableOpacity onPress={() => setIsSafetyModalOpen(false)}>
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16, gap: 12 }}>
              <TouchableOpacity
                style={styles.safetyOptionCard}
                onPress={() => {
                  setIsSafetyModalOpen(false);
                  setIsVitalsModalOpen(true);
                }}
              >
                <HeartPulse size={20} color={COLORS.alertRed} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.safetyOptionTitle}>Pre-Submit Patient Vitals</Text>
                  <Text style={styles.safetyOptionSub}>Transmit pulse, oxygen & condition to oncoming EMT</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.safetyOptionCard}
                onPress={handleShareTrip}
              >
                <Share2 size={20} color="#2563EB" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.safetyOptionTitle}>Share Live Tracking Link</Text>
                  <Text style={styles.safetyOptionSub}>Send real-time GPS coordinates to family</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.safetyOptionCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                onPress={() => {
                  setIsSafetyModalOpen(false);
                  Linking.openURL('tel:112');
                }}
              >
                <PhoneCall size={20} color={COLORS.alertRed} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.safetyOptionTitle, { color: COLORS.alertRed }]}>Dial 112 / Police Hotline</Text>
                  <Text style={styles.safetyOptionSub}>Direct national emergency response</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📋 Trip Details & Cancellation Modal */}
      <Modal visible={isTripDetailsOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Emergency Trip Details</Text>
              <TouchableOpacity onPress={() => setIsTripDetailsOpen(false)}>
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16, gap: 14 }}>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>Booking ID:</Text>
                <Text style={styles.tripDetailValue}>#{activeBookingId || 'BK-8821'}</Text>
              </View>

              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>Ambulance Service:</Text>
                <Text style={styles.tripDetailValue}>
                  {selectedAmbulanceType === 'als' ? 'Advanced Life Support (ALS ICU)' : 'Basic Life Support (BLS)'}
                </Text>
              </View>

              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>Destination Hospital:</Text>
                <Text style={styles.tripDetailValue}>{selectedHospital?.name || 'Jaypee Hospital (Sector 128)'}</Text>
              </View>

              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>Estimated Fare:</Text>
                <Text style={[styles.tripDetailValue, { color: COLORS.primaryDark, fontWeight: '800' }]}>
                  {fareCalculation?.formattedTotal || '₹280'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.cancelTripBtn}
                activeOpacity={0.88}
                onPress={() => {
                  setIsTripDetailsOpen(false);
                  setShowCancelConfirm(true);
                }}
              >
                <Text style={styles.cancelTripBtnText}>Cancel Emergency Ambulance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ❌ 5-Minute Arrival Cancellation Protection Modal */}
      <Modal visible={showCancelConfirm} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.cancelAlertIconBox}>
              <ShieldAlert size={36} color={COLORS.alertRed} />
            </View>

            <Text style={styles.cancelAlertTitle}>Ambulance is 5 Mins Away</Text>
            <Text style={styles.cancelAlertSub}>
              🚑 Paramedic unit {driver.ambulanceNumber} is speeding towards your pickup point. Are you sure you want to cancel?
            </Text>

            <TouchableOpacity
              style={styles.keepBookingBtn}
              activeOpacity={0.88}
              onPress={() => setShowCancelConfirm(false)}
            >
              <Text style={styles.keepBookingBtnText}>Keep Booking — Ambulance Aa Rahi Hai</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmCancelBtn}
              activeOpacity={0.88}
              onPress={() => {
                setShowCancelConfirm(false);
                cancelActiveBooking();
              }}
            >
              <Text style={styles.confirmCancelBtnText}>Cancel Anyway ❌</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🩺 Pre-Submit Vitals Modal */}
      <Modal visible={isVitalsModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pre-Submit Patient Condition</Text>
              <TouchableOpacity onPress={() => setIsVitalsModalOpen(false)}>
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16, gap: 10 }}>
              {['Conscious & Breathing', 'Unconscious but Breathing', 'Severe Chest Pain (Cardiac)', 'Difficulty Breathing (Asthma/O2)', 'Severe Bleeding / Trauma'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.vitalsOption,
                    patientStatus === status && styles.vitalsOptionSelected,
                  ]}
                  onPress={() => setPatientStatus(status)}
                >
                  <Text
                    style={[
                      styles.vitalsOptionText,
                      patientStatus === status && styles.vitalsOptionTextSelected,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.transmitBtn}
                onPress={() => {
                  setIsVitalsModalOpen(false);
                  Alert.alert('Vitals Transmitted', `Paramedic unit updated: ${patientStatus}`);
                }}
              >
                <Text style={styles.transmitBtnText}>Transmit to Paramedic Unit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  topBarSafe: {
    position: 'absolute',
    top: 10,
    left: 14,
    zIndex: 30,
  },
  floatingBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  floatingPickupTag: {
    position: 'absolute',
    top: '32%',
    left: '20%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
  },
  floatingPickupTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  mapFloatingActions: {
    position: 'absolute',
    bottom: 24,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 25,
  },
  shareRoundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  safetyPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  safetyPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  bottomSheetWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 12,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  blueHeaderBanner: {
    backgroundColor: '#1E40AF',
    borderRadius: 14,
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    marginBottom: 12,
  },
  arrivedHeaderBanner: {
    backgroundColor: '#047857',
  },
  blueHeaderBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  etaWhiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  arrivedPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrivedBlinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  arrivedMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#047857',
  },
  etaMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  etaHighlightGreen: {
    color: '#15803D',
    fontWeight: '900',
  },
  etaSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  pinSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  pinSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pinBoxesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinSingleBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDigitText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  startTransitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047857',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 10,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  startTransitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  captainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  captainHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 10,
  },
  mascotAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captainRecommendText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  driverInfoBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  vehicleDetailsCol: {
    flex: 1,
  },
  vehicleNumberText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  typePillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  typePillAls: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  typePillBls: {
    backgroundColor: '#ECFDF5',
    borderColor: '#BBF7D0',
  },
  typePillText: {
    fontSize: 9,
    fontWeight: '900',
  },
  vehicleModelText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '800',
    marginTop: 1,
  },
  equipmentSummaryText: {
    fontSize: 10,
    color: COLORS.primaryDark,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
  },
  driverNameText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  driverPhotoContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  driverPhoto: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  neverCancelsBadge: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#C084FC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  neverCancelsBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7E22CE',
  },
  starCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7E22CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageCaptainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  messageCaptainText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    gap: 12,
  },
  pickupAddressCol: {
    flex: 1,
  },
  pickupFromLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  pickupAddressText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  tripDetailsBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  tripDetailsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  chatScroll: {
    maxHeight: 280,
  },
  chatMsg: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
  },
  chatMsgUser: {
    backgroundColor: COLORS.secondaryBlue,
    alignSelf: 'flex-end',
  },
  chatMsgDriver: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
  },
  chatMsgText: {
    fontSize: 13,
  },
  chatMsgTextUser: {
    color: '#FFFFFF',
  },
  chatMsgTextDriver: {
    color: COLORS.textPrimary,
  },
  chatMsgTime: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  safetyOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  safetyOptionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tripDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tripDetailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tripDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cancelTripBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelTripBtnText: {
    color: COLORS.alertRed,
    fontSize: 13,
    fontWeight: '800',
  },
  cancelAlertIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 16,
  },
  cancelAlertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 12,
  },
  cancelAlertSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  keepBookingBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 14,
    marginHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  keepBookingBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  confirmCancelBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 14,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  confirmCancelBtnText: {
    color: COLORS.alertRed,
    fontSize: 13,
    fontWeight: '700',
  },
  vitalsOption: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalsOptionSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: COLORS.primary,
  },
  vitalsOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  vitalsOptionTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  transmitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  transmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

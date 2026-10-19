import React from 'react';
import { StyleSheet, View, Platform, SafeAreaView, Modal, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useBookingStore } from './src/store/useBookingStore';
import { COLORS } from './src/constants/colors';
import { Star, X, MessageSquare, CheckCircle } from 'lucide-react-native';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { HospitalSelectScreen } from './src/screens/HospitalSelectScreen';
import { DispatchSearchScreen } from './src/screens/DispatchSearchScreen';
import { LiveTrackingScreen } from './src/screens/LiveTrackingScreen';
import { AiAssistantScreen } from './src/screens/AiAssistantScreen';
import { HospitalListScreen } from './src/screens/HospitalListScreen';
import { BookingHistoryScreen } from './src/screens/BookingHistoryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { DestinationSearchScreen } from './src/screens/DestinationSearchScreen';

// Common Components
import { BottomNavBar } from './src/components/common/BottomNavBar';


function FeedbackPrompt({
  visible,
  booking,
  onLater,
  onSubmit,
}: {
  visible: boolean;
  booking: { id: string; hospital: { name: string }; driverName?: string; ambulanceNumber?: string };
  onLater: () => void;
  onSubmit: (feedback: { hospitalRating: number; ambulanceRating: number; comment: string }) => void;
}) {
  const [hospitalRating, setHospitalRating] = React.useState(0);
  const [ambulanceRating, setAmbulanceRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const canSubmit = hospitalRating > 0 && ambulanceRating > 0;
  const stars = (value: number, setValue: (rating: number) => void) => (
    <View style={feedbackStyles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} accessibilityLabel={`${star} star rating`} onPress={() => setValue(star)} style={feedbackStyles.starButton}>
          <Star size={25} color={star <= value ? '#F59E0B' : '#CBD5E1'} fill={star <= value ? '#F59E0B' : 'transparent'} />
        </TouchableOpacity>
      ))}
    </View>
  );
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={feedbackStyles.backdrop}>
        <ScrollView contentContainerStyle={feedbackStyles.scrollContent}>
          <View style={feedbackStyles.card}>
            <View style={feedbackStyles.headerRow}>
              <View style={feedbackStyles.icon}><MessageSquare size={20} color="#FFFFFF" /></View>
              <TouchableOpacity onPress={onLater} accessibilityLabel="Close feedback"><X size={21} color="#64748B" /></TouchableOpacity>
            </View>
            <Text style={feedbackStyles.eyebrow}>WELCOME BACK TO SAVLIFE</Text>
            <Text style={feedbackStyles.title}>How was your last emergency trip?</Text>
            <Text style={feedbackStyles.subtitle}>Your feedback helps patients choose safer hospitals and helps ambulance teams improve.</Text>
            <View style={feedbackStyles.tripCard}>
              <Text style={feedbackStyles.tripLabel}>COMPLETED BOOKING</Text>
              <Text style={feedbackStyles.tripHospital}>{booking.hospital.name}</Text>
              <Text style={feedbackStyles.tripMeta}>{booking.driverName || 'SavLife ambulance team'}{booking.ambulanceNumber ? ` · ${booking.ambulanceNumber}` : ''}</Text>
            </View>
            <Text style={feedbackStyles.question}>Rate the hospital</Text>
            {stars(hospitalRating, setHospitalRating)}
            <Text style={feedbackStyles.question}>Rate the ambulance service</Text>
            {stars(ambulanceRating, setAmbulanceRating)}
            <TextInput value={comment} onChangeText={setComment} placeholder="Optional: tell us what went well or what could improve" placeholderTextColor="#94A3B8" multiline style={feedbackStyles.input} />
            <TouchableOpacity disabled={!canSubmit} onPress={() => onSubmit({ hospitalRating, ambulanceRating, comment: comment.trim() })} style={[feedbackStyles.submit, !canSubmit && feedbackStyles.submitDisabled]}>
              <CheckCircle size={18} color="#FFFFFF" /><Text style={feedbackStyles.submitText}>Submit feedback</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onLater} style={feedbackStyles.later}><Text style={feedbackStyles.laterText}>Remind me next time</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const feedbackStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2, 15, 30, 0.66)' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 24, elevation: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#0E9F6E', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { marginTop: 18, color: '#0E9F6E', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { marginTop: 6, color: '#102A43', fontSize: 25, fontWeight: '800', lineHeight: 31 },
  subtitle: { marginTop: 8, color: '#627D98', fontSize: 14, lineHeight: 21 },
  tripCard: { marginTop: 18, padding: 14, borderRadius: 14, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#BBF7D0' },
  tripLabel: { color: '#047857', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  tripHospital: { marginTop: 5, color: '#102A43', fontSize: 15, fontWeight: '800' },
  tripMeta: { marginTop: 4, color: '#52708A', fontSize: 12 },
  question: { marginTop: 18, color: '#243B53', fontSize: 14, fontWeight: '800' },
  stars: { flexDirection: 'row', marginTop: 7 },
  starButton: { paddingRight: 6 },
  input: { minHeight: 74, marginTop: 18, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#D9E2EC', color: '#102A43', fontSize: 13, textAlignVertical: 'top' },
  submit: { marginTop: 16, minHeight: 48, borderRadius: 14, backgroundColor: '#0E9F6E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitDisabled: { backgroundColor: '#A7B7C5' },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  later: { alignItems: 'center', paddingTop: 14 },
  laterText: { color: '#627D98', fontSize: 13, fontWeight: '700' },
});

export default function App() {
  const { currentScreen, setCurrentScreen, bookingHistory, submitFeedback } = useBookingStore();
  const [feedbackVisible, setFeedbackVisible] = React.useState(false);
  const [feedbackDismissed, setFeedbackDismissed] = React.useState(false);
  const pendingFeedback = bookingHistory.find((booking) => booking.status === 'completed' && !booking.feedback);

  React.useEffect(() => {
    if (pendingFeedback && !feedbackDismissed) setFeedbackVisible(true);
  }, [pendingFeedback?.id, feedbackDismissed]);

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'hospital_select':
        return <HospitalSelectScreen />;
      case 'searching_dispatch':
        return <DispatchSearchScreen />;
      case 'live_tracking':
        return <LiveTrackingScreen />;
      case 'ai_assistant':
        return <AiAssistantScreen />;
      case 'hospital_list':
        return <HospitalListScreen />;
      case 'booking_history':
        return <BookingHistoryScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'destination_search':
        return <DestinationSearchScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const showBottomNav =
    currentScreen === 'home' ||
    currentScreen === 'hospital_list' ||
    currentScreen === 'booking_history' ||
    currentScreen === 'profile' ||
    currentScreen === 'ai_assistant';

  return (
    <SafeAreaProvider>
      <View style={styles.outerContainer}>
        <View style={styles.appContainer}>
          <StatusBar style="dark" backgroundColor="transparent" translucent />

          {/* Active Screen Content */}
          <View style={styles.screenWrapper}>
            {renderCurrentScreen()}
          </View>

          {/* Global Bottom Navigation Bar */}
          {showBottomNav && (
            <BottomNavBar
              activeScreen={currentScreen}
              onNavigate={(screen) => setCurrentScreen(screen)}
            />
          )}

          {pendingFeedback && (
            <FeedbackPrompt
              visible={feedbackVisible}
              booking={pendingFeedback}
              onLater={() => { setFeedbackVisible(false); setFeedbackDismissed(true); }}
              onSubmit={(feedback) => { submitFeedback(pendingFeedback.id, feedback); setFeedbackVisible(false); setFeedbackDismissed(true); }}
            />
          )}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#081524',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#F7FAFC',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.36,
    shadowRadius: 28,
    elevation: 12,
    maxHeight: Platform.OS === 'web' ? 900 : undefined,
    height: '100%',
    borderRadius: Platform.OS === 'web' ? 30 : 0,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  screenWrapper: {
    flex: 1,
    position: 'relative',
  },
});

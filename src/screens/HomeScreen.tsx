// 🏠 SavLife Home Screen - Hyper-Modern Emergency Dispatch & Hospital Discovery
// Sector 128 Noida Live GPS, Siren Audio, 1-Tap SOS, Hospital Carousel, Blinkit Staff & Facilities

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Image,
  Linking,
  Modal,
  Platform,
} from 'react-native';
import {
  Truck,
  Building2,
  Zap,
  Stethoscope,
  HeartPulse,
  ShieldAlert,
  Flame,
  UserCheck,
  Search,
  MapPin,
  Shield,
  CheckCircle,
  ChevronRight,
  Activity,
  Thermometer,
  Pill,
  Heart,
  Volume2,
  VolumeX,
  PhoneCall,
  BedDouble,
  Sparkles,
  Radio,
  X,
  Crosshair,
  Check,
} from 'lucide-react-native';

import { LiveMapView } from '../components/map/LiveMapView';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { useBookingStore } from '../store/useBookingStore';
import { COLORS } from '../constants/colors';
import { soundService } from '../services/soundService';
import { getNearbyHospitalsMock, Hospital } from '../services/mockDataService';
import { fetchNearbyHospitals } from '../services/googleMapsService';
import { NOIDA_PICKUP_PRESETS, getCurrentUserLocation, UserLocation } from '../services/locationService';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.38;

export function HomeScreen() {
  // 📍 User live coordinates (Sector 128, Noida default)
  const { location } = useLiveLocation();
  const { pickupLocation, setPickupLocation, setCurrentScreen, startBookingFlow } = useBookingStore();
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const list = await fetchNearbyHospitals(pickupLocation.latitude, pickupLocation.longitude, 6000);
        setNearbyHospitals(list.slice(0, 4));
      } catch {
        setNearbyHospitals(getNearbyHospitalsMock(pickupLocation.latitude, pickupLocation.longitude).slice(0, 4));
      }
    }
    load();
  }, [pickupLocation]);

  // 🛰️ Automatically detect real user GPS on app start
  useEffect(() => {
    async function autoDetectLocation() {
      try {
        const live = await getCurrentUserLocation();
        if (live && live.latitude && live.longitude) {
          setPickupLocation(live);
        }
      } catch (err) {
        console.log('Using default Sector 128 Wish Town location');
      }
    }
    autoDetectLocation();
  }, []);

  const handleSosEmergency = () => {
    soundService.playSonarPing();
    startBookingFlow(undefined, 'als');
  };

  const handleCallHelpline = () => {
    Linking.openURL('tel:112');
  };

  const handleDetectLiveGps = async () => {
    setDetectingGps(true);
    try {
      const live = await getCurrentUserLocation();
      setPickupLocation(live);
      setIsPickupModalOpen(false);
    } catch (e) {
    } finally {
      setDetectingGps(false);
    }
  };

  const handleSelectPreset = (preset: UserLocation) => {
    setPickupLocation(preset);
    setIsPickupModalOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* 🗺️ Real-time Leaflet Map Section */}
      <View style={styles.mapContainer}>
        <LiveMapView 
          pickupLocation={pickupLocation} 
          showPickupPuck={true}
        />

        {/* 🏥 Top Floating Header Bar over Map (Centered Brand Box & Floating SOS Button) */}
        <SafeAreaView style={styles.mapTopFloatingRow}>
          {/* Left spacer for visual center balance */}
          <View style={styles.headerBalanceSpacer} />

          {/* Centered SavLife Brand Box */}
          <View style={styles.brandFloatingBox}>
            <View style={styles.brandIconBox}>
              <HeartPulse size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandTitleText}>SavLife</Text>
              <Text style={styles.brandCaptionText}>EMERGENCY CARE</Text>
            </View>
          </View>

          {/* Right Floating SOS 112 Action */}
          <TouchableOpacity
            style={styles.sosFloatingBtn}
            activeOpacity={0.88}
            onPress={handleSosEmergency}
          >
            <Zap size={14} color="#FFFFFF" />
            <Text style={styles.sosFloatingBtnText}>SOS 112</Text>
          </TouchableOpacity>
        </SafeAreaView>

        {/* 📡 Live Patrol Telemetry Badge */}
        <View style={styles.patrolBadge}>
          <View style={styles.patrolPulseDot} />
          <Text style={styles.patrolBadgeText}>3 ALS Units in Sector 128</Text>
        </View>
        
        {/* 📍 Reverse-Geocoded Sector 128 Address Chip (Tapping opens Pickup Switcher) */}
        <TouchableOpacity
          style={styles.addressChipContainer}
          activeOpacity={0.88}
          onPress={() => setIsPickupModalOpen(true)}
        >
          <View style={styles.addressChip}>
            <View style={styles.greenDotRing}>
              <View style={styles.greenDotInner} />
            </View>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressTitle}>Current Emergency Pickup • Tap to change</Text>
              <Text style={styles.addressSubtitle} numberOfLines={1}>
                {pickupLocation.address || 'Tower 4, Jaypee Greens Wish Town, Sector 128, Noida, UP'}
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* 📱 Smooth Scrollable Bottom Sheet */}
      <ScrollView 
        style={styles.bottomSheet}
        contentContainerStyle={styles.bottomSheetContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        {/* 🔍 Search Pill "Where is the emergency?" */}
        <TouchableOpacity 
          style={styles.searchPill}
          activeOpacity={0.88}
          onPress={() => setCurrentScreen('destination_search')}
        >
          <Search size={20} color={COLORS.primary} style={styles.searchIcon} />
          <Text style={styles.searchText}>Where is the emergency?</Text>
          <View style={styles.searchArrowCircle}>
            <ChevronRight size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* ⚡ Availability Telemetry Header with Green Corridor Badge */}
        <View style={styles.headerSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={styles.headerTitle}>Emergency Response</Text>
            <View style={styles.greenCorridorBadge}>
              <Radio size={10} color="#15803D" />
              <Text style={styles.greenCorridorText}>GREEN CORRIDOR ACTIVE</Text>
            </View>
          </View>

          <View style={styles.availabilityPill}>
            <View style={styles.liveGreenBeacon} />
            <Text style={styles.availabilityText}>
              Avg response: <Text style={{ fontWeight: '900' }}>3.4 mins</Text> in Sector 128 Wish Town • 3 ALS Units Active
            </Text>
          </View>
        </View>

        {/* 🚑 Dual Hero Service Cards (Emergency Ambulance + Find Hospital) */}
        <View style={styles.serviceCardsContainer}>
          {/* Card A: Emergency Ambulance */}
          <TouchableOpacity 
            style={[styles.serviceCard, styles.emergencyCard]}
            activeOpacity={0.88}
            onPress={() => startBookingFlow(undefined, 'als')}
          >
            <View style={styles.badgeRed}>
              <Text style={styles.badgeTextRed}>3–4 MIN</Text>
            </View>
            <Truck size={32} color={COLORS.alertRed} style={styles.cardIcon} />
            <Text style={styles.serviceTitle}>Emergency{'\n'}Ambulance</Text>
            <Text style={styles.serviceSubtitle}>ICU on Wheels • Ventilator</Text>
            
            <View style={styles.cardCtaRow}>
              <Text style={styles.cardCtaTextRed}>Book Ambulance ➔</Text>
            </View>
          </TouchableOpacity>

          {/* Card B: Find Hospital */}
          <TouchableOpacity 
            style={[styles.serviceCard, styles.hospitalCard]}
            activeOpacity={0.88}
            onPress={() => setCurrentScreen('hospital_list')}
          >
            <View style={styles.badgeGreen}>
              <Text style={styles.badgeTextGreen}>18 BEDS LIVE</Text>
            </View>
            <Building2 size={32} color={COLORS.primary} style={styles.cardIcon} />
            <Text style={styles.serviceTitle}>Find{'\n'}Hospital</Text>
            <Text style={styles.serviceSubtitle}>Live ICU & Doctor Roster</Text>
            
            <View style={styles.cardCtaRow}>
              <Text style={styles.cardCtaTextGreen}>View Centers ➔</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 🏷️ Instant Emergency Category Tags (Cardiac, Trauma, Burn, Elderly) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.subSectionTitle}>Instant Emergency Dispatch</Text>
          <Text style={styles.subSectionSubtitle}>Pre-configured ICU units</Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tagsScrollContent}
          style={styles.tagsContainer}
        >
          <EmergencyTag icon={<HeartPulse size={15} color={COLORS.alertRed} />} text="Cardiac ICU (ALS)" onPress={() => startBookingFlow(undefined, 'als')} />
          <EmergencyTag icon={<ShieldAlert size={15} color="#D97706" />} text="Level-1 Trauma" onPress={() => startBookingFlow(undefined, 'als')} />
          <EmergencyTag icon={<Flame size={15} color="#EA580C" />} text="Burn Care Unit" onPress={() => startBookingFlow(undefined, 'als')} />
          <EmergencyTag icon={<UserCheck size={15} color={COLORS.primary} />} text="Elderly (BLS)" onPress={() => startBookingFlow(undefined, 'bls')} />
          <EmergencyTag icon={<Sparkles size={15} color="#7C3AED" />} text="Pediatric ICU" onPress={() => startBookingFlow(undefined, 'als')} />
        </ScrollView>

        {/* 🏥 SECTION: Nearest Verified Sector 128 Hospitals (Live Carousel) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.subSectionTitle}>Nearest Sector 128 Hospitals</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('hospital_list')}>
            <Text style={styles.viewAllText}>View All ({nearbyHospitals.length + 3}) ➔</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hospitalCarouselScroll}
        >
          {nearbyHospitals.map((hospital) => (
            <TouchableOpacity
              key={hospital.id}
              style={styles.hospitalCarouselCard}
              activeOpacity={0.88}
              onPress={() => startBookingFlow(hospital)}
            >
              <Image
                source={{ uri: hospital.imageUrl }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
              <View style={styles.carouselDistanceBadge}>
                <Text style={styles.carouselDistanceText}>{hospital.distanceKm} km • {hospital.etaMinutes}m</Text>
              </View>

              <View style={styles.carouselBody}>
                <Text style={styles.carouselTitle} numberOfLines={1}>{hospital.name}</Text>
                
                {/* On Duty Doctor */}
                <View style={styles.carouselDoctorRow}>
                  <UserCheck size={12} color={COLORS.primaryDark} />
                  <Text style={styles.carouselDoctorText} numberOfLines={1}>
                    {hospital.doctorName}
                  </Text>
                </View>

                {/* ICU Beds & Action */}
                <View style={styles.carouselFooter}>
                  <View style={styles.carouselBedBadge}>
                    <BedDouble size={11} color={COLORS.primaryDark} />
                    <Text style={styles.carouselBedText}>{hospital.icuBedsAvailable} ICU</Text>
                  </View>
                  <View style={styles.carouselBookBtn}>
                    <Text style={styles.carouselBookBtnText}>Book</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 👨‍⚕️ SECTION: Ambulance Staff (Blinkit Luxury Dark Section) */}
        <View style={styles.darkSection}>
          <View style={styles.darkSectionHeader}>
            <View style={styles.darkBadgeRow}>
              <Sparkles size={13} color="#38BDF8" />
              <Text style={styles.darkBadgeText}>PROFESSIONAL CREW</Text>
            </View>
            <Text style={styles.darkSectionTitle}>Ambulance Staff</Text>
            <Text style={styles.darkSectionSubtitle}>Equipped and certified to deliver critical ICU care on the road</Text>
          </View>

          <View style={styles.staffList}>
            <StaffItem 
              icon={<Stethoscope size={26} color={COLORS.primary} />}
              title="Paramedic Lead"
              subtitle="IV Cannulation, Intubation & Defibrillator Expert"
              bgColor="#ECFDF5"
              borderColor="#A7F3D0"
            />
            <StaffItem 
              icon={<Truck size={26} color="#0284C7" />}
              title="Emergency Pilot"
              subtitle="Certified High-Speed Green Corridor Driver"
              bgColor="#F0F9FF"
              borderColor="#BAE6FD"
            />
            <StaffItem 
              icon={<Heart size={26} color="#D97706" />}
              title="Duty Assistant"
              subtitle="Hydraulic Stretcher, Patient Lifting & Mobilization"
              bgColor="#FFFBEB"
              borderColor="#FDE68A"
            />
          </View>
        </View>

        {/* 🩺 SECTION: On-board ICU Facilities Carousel */}
        <View style={[styles.darkSection, styles.darkSectionBottom]}>
          <View style={styles.darkSectionHeader}>
            <View style={styles.darkBadgeRow}>
              <Activity size={13} color="#10B981" />
              <Text style={styles.darkBadgeText}>ADVANCED ICU EQUIPMENT</Text>
            </View>
            <Text style={styles.darkSectionTitle}>On-board Facilities</Text>
            <Text style={styles.darkSectionSubtitle}>State-of-the-art life support systems inside every ambulance</Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.facilitiesScrollContent}
          >
            <FacilityCard 
              icon={<Activity size={24} color={COLORS.primary} />}
              text="Hydraulic Shock Stretcher"
              detail="Spinal scoop + Transit wheelchair"
            />
            <FacilityCard 
              icon={<Thermometer size={24} color="#0284C7" />}
              text="Multi-Para Vitals Monitor"
              detail="12-Lead ECG + SpO2 + NIBP"
            />
            <FacilityCard 
              icon={<Pill size={24} color="#D97706" />}
              text="Essential ACLS Drug Kit"
              detail="Epinephrine, Atropine, Defib pads"
            />
            <FacilityCard 
              icon={<Zap size={24} color="#DC2626" />}
              text="Portable Transport Ventilator"
              detail="High-flow O2 + CPAP/BiPAP modes"
            />
          </ScrollView>
        </View>

        {/* 🛡️ Safety & Trust Verification */}
        <View style={styles.trustSection}>
          <Text style={styles.trustSectionTitle}>SavLife Medical Trust & Standards</Text>
          <View style={styles.trustItems}>
            <TrustItem icon={<MapPin size={18} color={COLORS.primary} />} text="Live GPS Tracked" />
            <TrustItem icon={<CheckCircle size={18} color={COLORS.primary} />} text="NABH Certified" />
            <TrustItem icon={<Shield size={18} color={COLORS.primary} />} text="Zero Surge Rate" />
            <TrustItem icon={<HeartPulse size={18} color={COLORS.alertRed} />} text="Govt 112 Linked" />
          </View>
        </View>

        {/* 📞 24/7 Toll-Free Emergency Helpline Banner */}
        <View style={styles.helplineBanner}>
          <View style={styles.helplineIconBox}>
            <PhoneCall size={20} color="#FFFFFF" />
          </View>
          <View style={styles.helplineInfo}>
            <Text style={styles.helplineTitle}>24/7 National Emergency SOS</Text>
            <Text style={styles.helplineNumber}>Dial 112 / 108 Emergency Control Room</Text>
          </View>
          <TouchableOpacity style={styles.callNowBtn} onPress={handleCallHelpline}>
            <Text style={styles.callNowBtnText}>Call Now</Text>
          </TouchableOpacity>
        </View>

        {/* 🚨 Bottom Book Emergency Ambulance CTA Banner */}
        <View style={styles.homeBottomFloatingBar}>
          <TouchableOpacity
            style={styles.homeBookAmbulanceBtn}
            activeOpacity={0.88}
            onPress={() => startBookingFlow(undefined, 'als')}
          >
            <View style={styles.homeBookBtnLeft}>
              <View style={styles.homeBookIconBox}>
                <Truck size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.homeBookBtnTitle}>Book Emergency Ambulance</Text>
                <Text style={styles.homeBookBtnSub}>From ₹100 • 3–4 mins response in Sector 128</Text>
              </View>
            </View>
            <View style={styles.homeBookArrowBox}>
              <ChevronRight size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Nav Spacer */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 📍 Real Pickup Location Selector Modal */}
      <Modal visible={isPickupModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Emergency Pickup Location</Text>
              <TouchableOpacity onPress={() => setIsPickupModalOpen(false)}>
                <X size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16, gap: 12 }}>
              {/* 📡 Detect Real Live GPS Button */}
              <TouchableOpacity
                style={styles.gpsDetectBtn}
                activeOpacity={0.85}
                onPress={handleDetectLiveGps}
              >
                <Crosshair size={18} color="#FFFFFF" />
                <Text style={styles.gpsDetectBtnText}>
                  {detectingGps ? 'Locating device via GPS...' : 'Use My Current Live GPS Location'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.presetsLabel}>Sector 128 & Noida Expressway Presets:</Text>

              {/* Noida Presets List */}
              <ScrollView style={{ maxHeight: 260 }}>
                {NOIDA_PICKUP_PRESETS.map((preset, idx) => {
                  const isSelected = pickupLocation.address === preset.address;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.presetItem, isSelected && styles.presetItemSelected]}
                      onPress={() => handleSelectPreset(preset)}
                    >
                      <MapPin size={16} color={isSelected ? COLORS.primaryDark : COLORS.textSecondary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.presetItemText, isSelected && styles.presetItemTextSelected]}>
                          {preset.address}
                        </Text>
                      </View>
                      {isSelected && <Check size={16} color={COLORS.primaryDark} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function EmergencyTag({ icon, text, onPress }: { icon: React.ReactNode; text: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tag} onPress={onPress} activeOpacity={0.85}>
      {icon}
      <Text style={styles.tagText}>{text}</Text>
    </TouchableOpacity>
  );
}

function StaffItem({
  icon,
  title,
  subtitle,
  bgColor,
  borderColor,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <View style={styles.staffItem}>
      <View style={[styles.staffAvatar, { backgroundColor: bgColor, borderColor: borderColor }]}>
        {icon}
        <View style={styles.verifiedBadge}>
          <CheckCircle size={10} color="#FFF" fill="#0284C7" />
        </View>
      </View>
      <View style={styles.staffInfo}>
        <Text style={styles.staffTitle}>{title}</Text>
        <Text style={styles.staffSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function FacilityCard({ icon, text, detail }: { icon: React.ReactNode; text: string; detail: string }) {
  return (
    <View style={styles.facilityCard}>
      <View style={styles.facilityIconContainer}>
        {icon}
      </View>
      <Text style={styles.facilityText}>{text}</Text>
      <Text style={styles.facilityDetailText}>{detail}</Text>
    </View>
  );
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.trustItem}>
      {icon}
      <Text style={styles.trustText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mapTopFloatingRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 12 : 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 25,
  },
  headerBalanceSpacer: {
    width: 60,
  },
  brandFloatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  brandIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.alertRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
    lineHeight: 16,
    letterSpacing: -0.3,
  },
  brandCaptionText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: 0.6,
  },
  sosFloatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.alertRed,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: COLORS.alertRed,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  sosFloatingBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  patrolBadge: {
    position: 'absolute',
    top: 54,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 15,
  },
  patrolPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  patrolBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  addressChipContainer: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 15,
  },
  addressChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  greenDotRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  greenDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 9,
    color: COLORS.primaryDark,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  addressSubtitle: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -16,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomSheetContent: {
    paddingBottom: 90,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.dragHandle,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginHorizontal: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  searchArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  greenCorridorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  greenCorridorText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  availabilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  liveGreenBeacon: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  availabilityText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  serviceCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 10,
  },
  serviceCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    position: 'relative',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 145,
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  hospitalCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  cardIcon: {
    marginBottom: 8,
    marginTop: 4,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 3,
    lineHeight: 19,
  },
  serviceSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardCtaRow: {
    marginTop: 'auto',
  },
  cardCtaTextRed: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.alertRed,
  },
  cardCtaTextGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  badgeRed: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.alertRed,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTextRed: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  badgeGreen: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTextGreen: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subSectionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tagsContainer: {
    marginBottom: 18,
  },
  tagsScrollContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginRight: 6,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  hospitalCarouselScroll: {
    paddingHorizontal: 14,
    gap: 12,
    marginBottom: 20,
  },
  hospitalCarouselCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  carouselImage: {
    width: '100%',
    height: 85,
    backgroundColor: '#CBD5E1',
  },
  carouselDistanceBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  carouselDistanceText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  carouselBody: {
    padding: 10,
  },
  carouselTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  carouselDoctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  carouselDoctorText: {
    fontSize: 10,
    color: COLORS.primaryDark,
    fontWeight: '600',
    flex: 1,
  },
  carouselFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carouselBedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  carouselBedText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  carouselBookBtn: {
    backgroundColor: COLORS.alertRed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  carouselBookBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  darkSection: {
    backgroundColor: '#0F172A',
    paddingVertical: 20,
  },
  darkSectionBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  darkSectionHeader: {
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  darkBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  darkBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  darkSectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  darkSectionSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  staffList: {
    paddingHorizontal: 14,
    gap: 12,
  },
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    position: 'relative',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffInfo: {
    flex: 1,
  },
  staffTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  staffSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },
  facilitiesScrollContent: {
    paddingHorizontal: 14,
    gap: 10,
  },
  facilityCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    width: 155,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  facilityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  facilityText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  facilityDetailText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  trustSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  trustSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  trustItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
  },
  trustText: {
    marginTop: 5,
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
  },
  helplineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 14,
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 10,
  },
  helplineIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.alertRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helplineInfo: {
    flex: 1,
  },
  helplineTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.alertRed,
  },
  helplineNumber: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  callNowBtn: {
    backgroundColor: COLORS.alertRed,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  callNowBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  homeBottomFloatingBar: {
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 6,
  },
  homeBookAmbulanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.alertRed,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: COLORS.alertRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  homeBookBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  homeBookIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBookBtnTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  homeBookBtnSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  homeBookArrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPadding: {
    height: 20,
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
    paddingBottom: 28,
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
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
    marginBottom: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsDetectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  presetsLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 10,
    backgroundColor: '#F8FAFC',
  },
  presetItemSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: COLORS.primary,
  },
  presetItemText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  presetItemTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
});

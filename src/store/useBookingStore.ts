// 🏪 Booking Store - App ka main state management
// Yeh store poori booking ki state handle karta hai - screen, hospital, ambulance, fare, OTP sab kuch

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Hospital, getNearbyHospitalsMock } from '../services/mockDataService';
import { FareCalculationResult, computeFare } from '../services/fareCalculator';
import { RouteInfo, fetchDirectionsRoute } from '../services/googleMapsService';
import { UserLocation, DEFAULT_LOCATION } from '../services/locationService';

// Default hospital for immediate booking
const defaultInitialHospital = getNearbyHospitalsMock(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude)[0];

// 🏠 Screen Management - Konsa screen dikhana hai
export type ScreenType =
  | 'home'
  | 'hospital_select'
  | 'searching_dispatch'
  | 'live_tracking'
  | 'ai_assistant'
  | 'hospital_list'
  | 'booking_history'
  | 'profile'
  | 'destination_search';

// 📋 Booking Status - Booking ki current state
export type BookingStatus =
  | 'idle'
  | 'searching'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'patient_picked_up'
  | 'en_route_hospital'
  | 'completed'
  | 'cancelled';

// 📜 Booking Record - Ek booking ka pura record
export interface BookingRecord {
  id: string;
  timestamp: string;
  hospital: Hospital;
  ambulanceType: 'bls' | 'als'; // 🚑 Sirf BLS ya ALS - Bike hata diya
  fare: FareCalculationResult;
  status: BookingStatus;
  driverName?: string;
  ambulanceNumber?: string;
  feedback?: { hospitalRating: number; ambulanceRating: number; comment: string; submittedAt: string };
}

interface BookingState {
  // 🏠 Current Screen - Abhi konsa screen dikh raha hai
  currentScreen: ScreenType;

  // 📍 Pickup Location - User ki current GPS location
  pickupLocation: UserLocation;

  // 🏥 Hospital Selection - Konsa hospital chuna gaya hai
  selectedHospital: Hospital | null;

  // 🚑 Ambulance Type - BLS ya ALS ambulance
  selectedAmbulanceType: 'bls' | 'als';

  // 🗺️ Route Info - Pickup se hospital tak ka raasta
  routeToPickup: RouteInfo | null;
  routeToHospital: RouteInfo | null;

  // 💰 Fare Calculation - Kitna paisa lagega
  fareCalculation: FareCalculationResult | null;

  // 📋 Booking Status - Booking ki current state
  bookingStatus: BookingStatus;
  activeBookingId: string | null;

  // 🔢 OTP Verification - Driver ke saath verify karne ke liye OTP
  otpCode: string;
  otpVerified: boolean;

  // 📜 Booking History - Purani bookings ka record
  bookingHistory: BookingRecord[];

  // 🎬 Actions - State change karne ke functions
  setCurrentScreen: (screen: ScreenType) => void;
  setPickupLocation: (location: UserLocation) => void;
  setSelectedHospital: (hospital: Hospital) => void;
  setSelectedAmbulanceType: (type: 'bls' | 'als') => void;
  calculateAndSetFare: (distanceKm?: number) => void;
  startBookingFlow: (hospital?: Hospital, ambulanceType?: 'bls' | 'als') => void;
  confirmBookingAndSearch: () => void;
  setBookingStatus: (status: BookingStatus) => void;
  cancelActiveBooking: () => void;
  completeTrip: () => void;
  loadHospitalRoute: () => Promise<void>;
  generateOtp: () => void;
  setOtpVerified: (verified: boolean) => void;
  submitFeedback: (bookingId: string, feedback: { hospitalRating: number; ambulanceRating: number; comment: string }) => void;
}

export const useBookingStore = create<BookingState>()(persist((set, get) => ({
  // 🏠 Default Screen - App kholte hi home screen dikhega
  currentScreen: 'home',

  // 📍 Default Location - Sector 128, Noida ki default location
  pickupLocation: DEFAULT_LOCATION,

  // 🏥 Default Hospital - Jaypee Hospital (Sector 128)
  selectedHospital: defaultInitialHospital,

  // 🚑 Default ambulance type ALS ICU
  selectedAmbulanceType: 'als',

  // 🗺️ Route abhi available nahi hai
  routeToPickup: null,
  routeToHospital: null,

  // 💰 Pre-calculated fare for Jaypee Hospital
  fareCalculation: computeFare(0.8, 'als'),

  // 📋 Booking idle hai - koi active booking nahi
  bookingStatus: 'idle',
  activeBookingId: null,

  // 🔢 OTP default - booking confirm hone pe naya generate hoga
  otpCode: '1234',
  otpVerified: false,

  // 📜 Sample booking history - pichli ek booking ka record
  bookingHistory: [
    {
      id: 'BK-8821',
      timestamp: 'Yesterday, 10:14 PM',
      hospital: {
        id: 'hosp-1',
        name: 'Jaypee Hospital (Sector 128)',
        address: 'Jaypee Greens Wish Town, Sector 128, Noida, UP 201304',
        latitude: 28.5130,
        longitude: 77.3780,
        distanceKm: 0.8,
        etaMinutes: 3,
        rating: 4.9,
        userRatingsTotal: 4820,
        phone: '+91-120-4122222',
        emergencyAvailable: true,
        icuBedsAvailable: 18,
        specialties: ['Level-1 Trauma', 'Cardiac Care'],
        openNow: true,
        imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80',
        doctorOnDuty: true,
        doctorName: 'Dr. Ananya Verma',
        doctorSpecialty: 'Chief of Trauma & Emergency Medicine',
        emergencyDoctorsCount: 6,
      },
      ambulanceType: 'als',
      fare: computeFare(4.2, 'als'),
      status: 'completed',
      driverName: 'Rajesh Kumar (EMT-Adv)',
      ambulanceNumber: 'UP 16 EM 4092',
    },
  ],

  // 🏠 Screen Change - Ek screen se doosre pe jaao
  setCurrentScreen: (screen) => set({ currentScreen: screen }),

  // 📍 Pickup Location Update - User ki location change hui
  setPickupLocation: (loc) => {
    set({ pickupLocation: loc });
    const { selectedHospital } = get();
    if (selectedHospital) {
      get().calculateAndSetFare();
    }
  },

  // 🏥 Hospital Select - User ne hospital chuna
  setSelectedHospital: (hospital) => {
    set({ selectedHospital: hospital });
    if (hospital) {
      get().calculateAndSetFare(hospital.distanceKm);
      get().loadHospitalRoute();
    }
  },

  // 🚑 Ambulance Type Change - BLS ya ALS select kiya
  setSelectedAmbulanceType: (type) => {
    set({ selectedAmbulanceType: type });
    get().calculateAndSetFare();
  },

  // 💰 Fare Calculate - Distance ke hisaab se paisa calculate karo
  calculateAndSetFare: (customDistanceKm?: number) => {
    const { selectedHospital, selectedAmbulanceType } = get();
    const dist = customDistanceKm ?? selectedHospital?.distanceKm ?? 3.5;
    const fare = computeFare(dist, selectedAmbulanceType);
    set({ fareCalculation: fare });
  },

  // 🗺️ Hospital Route Load - Hospital tak ka raasta load karo (OSRM/Google se)
  loadHospitalRoute: async () => {
    const { pickupLocation, selectedHospital } = get();
    if (!selectedHospital) return;

    try {
      const route = await fetchDirectionsRoute(
        { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
        { latitude: selectedHospital.latitude, longitude: selectedHospital.longitude }
      );
      set({ routeToHospital: route });
    } catch (err) {
      console.warn('Route load error:', err);
    }
  },

  // 🚀 Booking Flow Start - Hospital select karke booking shuru karo
  startBookingFlow: (hospital, ambulanceType) => {
    const activeHosp = hospital || get().selectedHospital || defaultInitialHospital;
    const activeType = ambulanceType || get().selectedAmbulanceType || 'als';
    set({
      selectedHospital: activeHosp,
      selectedAmbulanceType: activeType,
      currentScreen: 'hospital_select',
    });
    get().calculateAndSetFare(activeHosp.distanceKm);
    get().loadHospitalRoute();
  },

  // ✅ Booking Confirm - Ambulance search shuru karo, OTP generate karo
  confirmBookingAndSearch: () => {
    const bookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    // 🔢 Naya OTP generate karo booking confirm hone pe
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    set({
      bookingStatus: 'searching',
      activeBookingId: bookingId,
      currentScreen: 'searching_dispatch',
      otpCode: otp,
      otpVerified: false,
    });
  },

  // 📋 Status Update - Booking ka status change karo
  setBookingStatus: (status) => set({ bookingStatus: status }),

  // ❌ Cancel Booking - Booking cancel karo, home pe jaao
  cancelActiveBooking: () => {
    set({
      bookingStatus: 'cancelled',
      currentScreen: 'home',
      activeBookingId: null,
      otpVerified: false,
    });
  },

  // 🏁 Trip Complete - Safar pura hua, history mein save karo
  completeTrip: () => {
    const { selectedHospital, selectedAmbulanceType, fareCalculation, activeBookingId, bookingHistory } = get();
    if (selectedHospital && fareCalculation) {
      const record: BookingRecord = {
        id: activeBookingId || `BK-${Date.now()}`,
        timestamp: 'Just now',
        hospital: selectedHospital,
        ambulanceType: selectedAmbulanceType,
        fare: fareCalculation,
        status: 'completed',
        driverName: 'Rajesh Kumar (EMT-Adv)',
        ambulanceNumber: 'UP 16 EM 4092',
      };
      set({
        bookingHistory: [record, ...bookingHistory],
        bookingStatus: 'completed',
        currentScreen: 'booking_history',
        activeBookingId: null,
        otpVerified: false,
      });
    } else {
      set({ bookingStatus: 'idle', currentScreen: 'home', activeBookingId: null });
    }
  },

  // 🔢 OTP Generate - Naya 4-digit OTP banao
  generateOtp: () => {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    set({ otpCode: otp, otpVerified: false });
  },

  // ✅ OTP Verify - Driver ne sahi OTP daala ya nahi
  setOtpVerified: (verified) => set({ otpVerified: verified }),

  // ⭐ Patient feedback - completed booking ke baad hospital aur ambulance review save karo
  submitFeedback: (bookingId, feedback) => set((state) => ({
    bookingHistory: state.bookingHistory.map((booking) => booking.id === bookingId
      ? { ...booking, feedback: { ...feedback, submittedAt: new Date().toISOString() } }
      : booking),
  })),
}), {
  name: 'savlife-booking-state',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    bookingHistory: state.bookingHistory,
    selectedHospital: state.selectedHospital,
    selectedAmbulanceType: state.selectedAmbulanceType,
    fareCalculation: state.fareCalculation,
  }),
}));

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {
  User,
  Heart,
  PhoneCall,
  Shield,
  MapPin,
  FileText,
  ChevronRight,
  AlertTriangle,
  Plus,
} from 'lucide-react-native';
import { COLORS } from '../constants/colors';

export const ProfileScreen: React.FC = () => {
  const [contacts, setContacts] = useState([
    { id: '1', name: 'Priya Sharma (Spouse)', phone: '+91-9876501234', relation: 'Spouse' },
    { id: '2', name: 'Dr. Alok Verma (Family Doc)', phone: '+91-9811234567', relation: 'Doctor' },
  ]);

  const handleCallContact = (phone: string, name: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Calling Contact', `Dialing ${name}: ${phone}`);
    });
  };

  const handleSosBroadcast = () => {
    Alert.alert(
      '🚨 Send Emergency SOS Alert?',
      'This will instantly transmit your live GPS location and medical profile to all registered emergency contacts and local emergency services.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Broadcast SOS Now',
          style: 'destructive',
          onPress: () => {
            Alert.alert('SOS Broadcast Sent', 'Your emergency contacts have been notified with your live coordinates.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarCircle}>
            <User size={36} color={COLORS.primaryDark} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>Rahul Sharma</Text>
            <Text style={styles.userPhone}>+91 98765 43210</Text>
            <View style={styles.medicalIdPill}>
              <Shield size={12} color={COLORS.primary} />
              <Text style={styles.medicalIdText}>SavLife Medical ID: SL-99201</Text>
            </View>
          </View>
        </View>

        {/* SOS Emergency Broadcast Banner */}
        <TouchableOpacity
          style={styles.sosBanner}
          activeOpacity={0.88}
          onPress={handleSosBroadcast}
        >
          <AlertTriangle size={24} color="#FFFFFF" />
          <View style={styles.sosTextCol}>
            <Text style={styles.sosTitle}>EMERGENCY SOS BROADCAST</Text>
            <Text style={styles.sosSubtitle}>1-Tap notify all emergency contacts & 112</Text>
          </View>
        </TouchableOpacity>

        {/* Medical Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical ID & Health Profile</Text>

          <View style={styles.medicalGrid}>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>Blood Group</Text>
              <Text style={styles.gridValueRed}>O +ve</Text>
            </View>

            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>Organ Donor</Text>
              <Text style={styles.gridValueGreen}>YES (Registered)</Text>
            </View>

            <View style={styles.gridCardFull}>
              <Text style={styles.gridLabel}>Known Allergies</Text>
              <Text style={styles.gridValue}>Penicillin, NSAIDs, Sulfa drugs</Text>
            </View>

            <View style={styles.gridCardFull}>
              <Text style={styles.gridLabel}>Pre-existing Conditions</Text>
              <Text style={styles.gridValue}>Mild Asthma (Inhaler user)</Text>
            </View>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Emergency SOS Contacts</Text>
            <TouchableOpacity style={styles.addContactBtn}>
              <Plus size={14} color={COLORS.primary} />
              <Text style={styles.addContactText}>Add</Text>
            </TouchableOpacity>
          </View>

          {contacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactIcon}>
                <Heart size={18} color={COLORS.alertRed} />
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>

              <TouchableOpacity
                style={styles.contactCallBtn}
                activeOpacity={0.8}
                onPress={() => handleCallContact(contact.phone, contact.name)}
              >
                <PhoneCall size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Saved Addresses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Emergency Locations</Text>

          <View style={styles.addressCard}>
            <MapPin size={20} color={COLORS.primary} />
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>Home (Default Pickup)</Text>
              <Text style={styles.addressSub} numberOfLines={1}>
                136, Pocket A 2, New Kondli, Delhi, 110096
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  medicalIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  medicalIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  sosBanner: {
    backgroundColor: COLORS.alertRed,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    shadowColor: COLORS.alertRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sosTextCol: {
    flex: 1,
  },
  sosTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sosSubtitle: {
    color: '#FFFFFF',
    fontSize: 11,
    opacity: 0.9,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  addContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  addContactText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  medicalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  gridCardFull: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  gridLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  gridValueRed: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.alertRed,
    marginTop: 2,
  },
  gridValueGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 4,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 8,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.alertRedLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  contactPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  contactCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addressSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

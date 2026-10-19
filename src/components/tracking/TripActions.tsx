import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Share2, XCircle, ShieldAlert } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

interface TripActionsProps {
  onCancel: () => void;
  bookingId: string;
  driverName: string;
  vehicleNo: string;
  hospitalName?: string;
}

export const TripActions: React.FC<TripActionsProps> = ({
  onCancel,
  bookingId,
  driverName,
  vehicleNo,
  hospitalName,
}) => {
  const handleShare = () => {
    const text = `🚨 Emergency SavLife Live Tracking: Ambulance ${vehicleNo} (Driver: ${driverName}) is currently en route to ${hospitalName || 'the Hospital'}. Track live dispatch status here: https://savelife.app/track/${bookingId}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(whatsappUrl);
        } else {
          // Fallback to SMS
          const smsUrl = `sms:?body=${encodeURIComponent(text)}`;
          Linking.openURL(smsUrl).catch(() => {
            Alert.alert('Live Tracking Link', text);
          });
        }
      })
      .catch(() => {
        Alert.alert('Live Tracking Link', text);
      });
  };

  const handleCancelPrompt = () => {
    Alert.alert(
      'Cancel Emergency Dispatch?',
      'An ambulance is already rushing to your location. Are you sure you want to cancel this emergency request?',
      [
        { text: 'No, Keep Ambulance', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: onCancel },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Share Trip Status Button */}
      <TouchableOpacity
        style={[styles.btn, styles.shareBtn]}
        activeOpacity={0.8}
        onPress={handleShare}
      >
        <Share2 size={18} color={COLORS.secondaryBlue} />
        <Text style={styles.shareBtnText}>Share Live Status</Text>
      </TouchableOpacity>

      {/* Cancel Booking Button */}
      <TouchableOpacity
        style={[styles.btn, styles.cancelBtn]}
        activeOpacity={0.8}
        onPress={handleCancelPrompt}
      >
        <XCircle size={18} color={COLORS.alertRed} />
        <Text style={styles.cancelBtnText}>Cancel Booking</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
  },
  shareBtn: {
    borderColor: COLORS.secondaryBlue,
    backgroundColor: '#F0F6FF',
  },
  shareBtnText: {
    color: COLORS.secondaryBlue,
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF5F5',
  },
  cancelBtnText: {
    color: COLORS.alertRed,
    fontSize: 13,
    fontWeight: '700',
  },
});

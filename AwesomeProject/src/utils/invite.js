import { Platform, Linking, Alert } from 'react-native';

const APP_INVITE_LINK = 'https://your-app-link.com'; // Update with your app link

// Open SMS with invite message
export const inviteViaSMS = (phoneNumber) => {
  const message = `Hey! Join me on this awesome chat app: ${APP_INVITE_LINK}`;
  const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
  
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        Alert.alert('Error', 'SMS is not available on this device');
      }
    })
    .catch((err) => {
      console.error('Error opening SMS:', err);
      Alert.alert('Error', 'Failed to open SMS');
    });
};

// Open WhatsApp with invite message
export const inviteViaWhatsApp = (phoneNumber) => {
  // Remove + and spaces from phone number
  const cleanPhone = phoneNumber.replace(/[\s\+]/g, '');
  const message = `Hey! Join me on this awesome chat app: ${APP_INVITE_LINK}`;
  const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        // Fallback to SMS if WhatsApp not installed
        inviteViaSMS(phoneNumber);
      }
    })
    .catch((err) => {
      console.error('Error opening WhatsApp:', err);
      // Fallback to SMS
      inviteViaSMS(phoneNumber);
    });
};

// Show invite options
export const showInviteOptions = (phoneNumber) => {
  Alert.alert(
    'Invite Contact',
    'Choose how to invite this contact:',
    [
      {
        text: 'WhatsApp',
        onPress: () => inviteViaWhatsApp(phoneNumber),
      },
      {
        text: 'SMS',
        onPress: () => inviteViaSMS(phoneNumber),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ],
    { cancelable: true }
  );
};


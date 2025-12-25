import Contacts from 'react-native-contacts';
import { Platform, Linking, Alert } from 'react-native';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';

// Request contacts permission
export const requestContactsPermission = async () => {
  try {
    const permission = Platform.select({
      android: PERMISSIONS.ANDROID.READ_CONTACTS,
      ios: PERMISSIONS.IOS.CONTACTS,
    });

    if (!permission) {
      return false;
    }

    const result = await request(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting contacts permission:', error);
    return false;
  }
};

// Get all contacts from device
export const getAllContacts = async () => {
  try {
    const hasPermission = await requestContactsPermission();
    
    if (!hasPermission) {
      throw new Error('Contacts permission denied');
    }

    const contacts = await Contacts.getAll();
    
    // Extract name and phone numbers
    const formattedContacts = contacts
      .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
      .map(contact => {
        // Get primary phone number or first available
        const phoneNumber = contact.phoneNumbers[0]?.number || '';
        
        return {
          name: contact.displayName || contact.givenName || 'Unknown',
          phone: phoneNumber,
          rawContact: contact,
        };
      })
      .filter(contact => contact.phone && contact.phone.trim() !== '');

    return formattedContacts;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};

// Normalize phone number for comparison
export const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters
  return phone.replace(/[\s\-\(\)\+\.]/g, '').replace(/^0+/, '');
};


import API from './api';

// Normalize phone number for consistent comparison
export const normalizePhoneNumber = phone => {
  return phone.replace(/[^0-9+]/g, '');
};

// Create or get chat by phone number
export const createChatByPhone = async phoneNumber => {
  try {
    const response = await API.post('/chats/by-phone', {
      phoneNumber: normalizePhoneNumber(phoneNumber),
    });

    return {
      success: true,
      chat: response.data,
      isRegistered: response.data.isRegistered,
      targetUser: response.data.targetUser,
    };
  } catch (error) {
    console.error('Error creating chat by phone:', error);

    if (error.response?.status === 404) {
      return {
        success: false,
        isRegistered: false,
        phoneNumber: phoneNumber,
        message: 'This number is not registered with the app',
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create chat',
    };
  }
};

// Format phone number for display
export const formatPhoneNumber = phone => {
  const cleaned = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6,
    )}`;
  }

  // For international numbers, just add spaces
  if (cleaned.length > 10) {
    return cleaned.replace(/(\d{1,3})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4');
  }

  return phone;
};

// Check if phone number is valid
export const isValidPhoneNumber = phone => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

import { NativeEventEmitter, NativeModules } from 'react-native';

const emitter = new NativeEventEmitter(NativeModules.DeviceEventManagerModule);

export const listenForContactIntent = (
  callback: (phoneNumber: string) => void,
) => {
  const subscription = emitter.addListener('OPEN_CHAT', callback);
  return subscription;
};

export const removeContactIntentListener = (subscription: any) => {
  subscription?.remove();
};

// Utility function for phone number normalization
export const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/[^0-9+]/g, '');
};

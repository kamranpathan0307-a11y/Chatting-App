import {
  normalizePhoneNumber,
  formatPhoneNumber,
  isValidPhoneNumber,
} from '../phoneUtils';

describe('Phone Utils', () => {
  describe('normalizePhoneNumber', () => {
    test('removes non-numeric characters except +', () => {
      expect(normalizePhoneNumber('(555) 123-4567')).toBe('5551234567');
      expect(normalizePhoneNumber('+1 (555) 123-4567')).toBe('+15551234567');
      expect(normalizePhoneNumber('555.123.4567')).toBe('5551234567');
      expect(normalizePhoneNumber('555 123 4567')).toBe('5551234567');
    });
  });

  describe('formatPhoneNumber', () => {
    test('formats US numbers correctly', () => {
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    });

    test('formats international numbers', () => {
      expect(formatPhoneNumber('15551234567')).toBe('+1 555 123 4567');
    });
  });

  describe('isValidPhoneNumber', () => {
    test('validates phone numbers correctly', () => {
      expect(isValidPhoneNumber('5551234567')).toBe(true);
      expect(isValidPhoneNumber('555123456')).toBe(false);
      expect(isValidPhoneNumber('555123456789012345')).toBe(false);
    });
  });
});

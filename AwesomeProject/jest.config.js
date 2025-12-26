module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-image-picker|react-native-image-crop-picker|react-native-document-picker|react-native-audio-recorder-player|react-native-permissions|react-native-fs|@react-native-community|react-native-gesture-handler|react-native-reanimated|react-native-svg|react-native-worklets)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['<rootDir>/jest.setup.js'],
};

/* eslint-env jest */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// Mock Notifee
jest.mock('@notifee/react-native', () => ({
  default: {
    createChannel: jest.fn(async () => 'festival-reminder'),
    requestPermission: jest.fn(async () => true),
    cancelAllNotifications: jest.fn(async () => {}),
    createTriggerNotification: jest.fn(async () => {}),
  },
  AndroidImportance: { HIGH: 4 },
  AndroidColor: { PURPLE: 0 },
  TriggerType: { TIMESTAMP: 0 },
}));


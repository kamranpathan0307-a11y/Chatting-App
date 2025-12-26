// Mock messages data
const now = Date.now();
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * 60 * 60 * 1000;

export const messages = {
  1: [
    {
      id: 'm1',
      text: 'Hey! Are we still on for the design review later?',
      senderId: '1',
      timestamp: now - 2 * oneHour,
      messageType: 'text',
      deliveryStatus: 'read',
    },
    {
      id: 'm2',
      text: 'Absolutely! I just finished the mockups.',
      senderId: 'current-user',
      timestamp: now - 2 * oneHour + 1 * 60 * 1000,
      messageType: 'text',
      deliveryStatus: 'read',
    },
    {
      id: 'm3',
      text: 'Great, send them over when you can.',
      senderId: '1',
      timestamp: now - 2 * oneHour + 4 * 60 * 1000,
      messageType: 'text',
      deliveryStatus: 'read',
    },
    {
      id: 'm4',
      text: null,
      senderId: 'current-user',
      timestamp: now - 2 * oneHour + 7 * 60 * 1000,
      messageType: 'image',
      mediaUrl: 'https://picsum.photos/400/300?random=1',
      thumbnailUrl: 'https://picsum.photos/400/300?random=1',
      fileName: 'design_mockup.jpg',
      fileSize: 245760, // 240KB
      mimeType: 'image/jpeg',
      width: 400,
      height: 300,
      uploadStatus: 'uploaded',
      uploadProgress: 100,
      deliveryStatus: 'read',
    },
    {
      id: 'm5',
      text: 'Here is the first draft. Let me know what you think!',
      senderId: 'current-user',
      timestamp: now - 2 * oneHour + 7 * 60 * 1000 + 10 * 1000,
      messageType: 'text',
      deliveryStatus: 'read',
    },
  ],
  2: [
    {
      id: 'm6',
      text: 'Are we still meeting for lunch? 🥗',
      senderId: '2',
      timestamp: now - 3 * oneHour,
      messageType: 'text',
      deliveryStatus: 'read',
    },
  ],
  3: [
    {
      id: 'm7',
      text: 'Call me when you get this!',
      senderId: '3',
      timestamp: now - 3 * oneDay,
      messageType: 'text',
      deliveryStatus: 'read',
    },
  ],
  4: [
    {
      id: 'm8',
      text: "Yeah, I'm thinking I'm back.",
      senderId: '4',
      timestamp: now - 4 * oneDay,
      messageType: 'text',
      deliveryStatus: 'read',
    },
  ],
  5: [
    {
      id: 'm9',
      text: "Who's bringing the tent?",
      senderId: '6',
      timestamp: now - 7 * oneDay,
      messageType: 'text',
      deliveryStatus: 'read',
    },
  ],
};

// Helper function to create media message
export const createMediaMessage = ({
  id,
  senderId,
  chatId,
  messageType,
  mediaUrl,
  thumbnailUrl,
  fileName,
  fileSize,
  mimeType,
  width,
  height,
  duration,
  text = null,
  uploadStatus = 'uploaded',
  uploadProgress = 100,
  deliveryStatus = 'sent',
  timestamp = Date.now(),
}) => ({
  id,
  senderId,
  chatId,
  text,
  messageType,
  mediaUrl,
  thumbnailUrl,
  fileName,
  fileSize,
  mimeType,
  width,
  height,
  duration,
  uploadStatus,
  uploadProgress,
  deliveryStatus,
  timestamp,
});

// Helper function to create text message
export const createTextMessage = ({
  id,
  senderId,
  chatId,
  text,
  deliveryStatus = 'sent',
  timestamp = Date.now(),
}) => ({
  id,
  senderId,
  chatId,
  text,
  messageType: 'text',
  deliveryStatus,
  timestamp,
});

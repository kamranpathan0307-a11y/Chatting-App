// Mock messages data
const now = Date.now();
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * 60 * 60 * 1000;

export const messages = {
  '1': [
    {
      id: 'm1',
      text: 'Hey! Are we still on for the design review later?',
      senderId: '1',
      timestamp: now - 2 * oneHour,
      type: 'text',
      status: 'read',
    },
    {
      id: 'm2',
      text: 'Absolutely! I just finished the mockups.',
      senderId: 'current-user',
      timestamp: now - 2 * oneHour + 1 * 60 * 1000,
      type: 'text',
      status: 'read',
    },
    {
      id: 'm3',
      text: 'Great, send them over when you can.',
      senderId: '1',
      timestamp: now - 2 * oneHour + 4 * 60 * 1000,
      type: 'text',
      status: 'read',
    },
    {
      id: 'm4',
      text: null,
      senderId: 'current-user',
      timestamp: now - 2 * oneHour + 7 * 60 * 1000,
      type: 'image',
      imageUrl: 'https://picsum.photos/400/300?random=1',
      status: 'read',
    },
    {
      id: 'm5',
      text: 'Here is the first draft. Let me know what you think!',
      senderId: 'current-user',
      timestamp: now - 2 * oneHour + 7 * 60 * 1000 + 10 * 1000,
      type: 'text',
      status: 'read',
    },
  ],
  '2': [
    {
      id: 'm6',
      text: 'Are we still meeting for lunch? 🥗',
      senderId: '2',
      timestamp: now - 3 * oneHour,
      type: 'text',
      status: 'read',
    },
  ],
  '3': [
    {
      id: 'm7',
      text: 'Call me when you get this!',
      senderId: '3',
      timestamp: now - 3 * oneDay,
      type: 'text',
      status: 'read',
    },
  ],
  '4': [
    {
      id: 'm8',
      text: "Yeah, I'm thinking I'm back.",
      senderId: '4',
      timestamp: now - 4 * oneDay,
      type: 'text',
      status: 'read',
    },
  ],
  '5': [
    {
      id: 'm9',
      text: "Who's bringing the tent?",
      senderId: '6',
      timestamp: now - 7 * oneDay,
      type: 'text',
      status: 'read',
    },
  ],
};


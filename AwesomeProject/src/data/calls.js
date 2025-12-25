// Mock calls data
const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000;

export const calls = [
  {
    id: 'c1',
    contactId: '1',
    name: 'Sanskar Joshi',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    type: 'video',
    direction: 'incoming',
    timestamp: now - 2 * 60 * 60 * 1000,
    duration: 1250, // seconds
    missed: false,
  },
  {
    id: 'c2',
    contactId: '2',
    name: 'Akshay Nazare',
    avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
    type: 'voice',
    direction: 'outgoing',
    timestamp: now - 5 * 60 * 60 * 1000,
    duration: 320,
    missed: false,
  },
  {
    id: 'c3',
    contactId: '3',
    name: 'Mom',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    type: 'voice',
    direction: 'incoming',
    timestamp: now - 1 * oneDay,
    duration: 0,
    missed: true,
  },
  {
    id: 'c4',
    contactId: '4',
    name: 'Pavan Mundhw',
    avatar: null,
    initials: 'JW',
    type: 'video',
    direction: 'outgoing',
    timestamp: now - 2 * oneDay,
    duration: 0,
    missed: true,
  },
  {
    id: 'c5',
    contactId: '1',
    name: 'Sidhhant Gaikwad',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    type: 'voice',
    direction: 'incoming',
    timestamp: now - 3 * oneDay,
    duration: 1800,
    missed: false,
  },
];

// Sort calls by timestamp (most recent first)
export const getSortedCalls = () => {
  return [...calls].sort((a, b) => b.timestamp - a.timestamp);
};


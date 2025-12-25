// Mock chats data
import { messages } from './messages';
import { formatTime } from '../utils/formatTime';

const getLastMessage = (chatId) => {
  const chatMessages = messages[chatId];
  if (!chatMessages || chatMessages.length === 0) return null;
  return chatMessages[chatMessages.length - 1];
};

export const chats = [
  {
    id: '1',
    name: 'Sanskar Joshi',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    lastMessage: getLastMessage('1'),
    unreadCount: 0,
    timestamp: getLastMessage('1')?.timestamp || Date.now(),
    isGroup: false,
    participants: ['current-user', '1'],
  },
  {
    id: '2',
    name: 'Akshay Nazare',
    avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
    lastMessage: getLastMessage('2'),
    unreadCount: 2,
    timestamp: getLastMessage('2')?.timestamp || Date.now(),
    isGroup: false,
    participants: ['current-user', '2'],
  },
  {
    id: '3',
    name: 'Pavan Mundhe',
    avatar: null,
    lastMessage: {
      id: 'm10',
      text: 'Files have been uploaded to Drive.',
      senderId: '1',
      timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
      type: 'text',
      status: 'read',
    },
    unreadCount: 0,
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
    isGroup: true,
    participants: ['current-user', '1', '2', '4'],
  },
  {
    id: '4',
    name: 'Mom ❤️',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    lastMessage: getLastMessage('3'),
    unreadCount: 0,
    timestamp: getLastMessage('3')?.timestamp || Date.now(),
    isGroup: false,
    participants: ['current-user', '3'],
  },
  {
    id: '5',
    name: 'Sidhhant Gaikwad',
    avatar: null,
    initials: 'JW',
    lastMessage: getLastMessage('4'),
    unreadCount: 0,
    timestamp: getLastMessage('4')?.timestamp || Date.now(),
    isGroup: false,
    participants: ['current-user', '4'],
  },
  {
    id: '6',
    name: 'Weekend Trip 🏕️',
    avatar: null,
    lastMessage: getLastMessage('5'),
    unreadCount: 0,
    timestamp: getLastMessage('5')?.timestamp || Date.now(),
    isGroup: true,
    participants: ['current-user', '5', '6'],
  },
  {
    id: '7',
    name: 'Alex Chen',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    lastMessage: null,
    unreadCount: 0,
    timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000,
    isGroup: false,
    participants: ['current-user', '5'],
  },
];

// Sort chats by timestamp (most recent first)
export const getSortedChats = () => {
  return [...chats].sort((a, b) => b.timestamp - a.timestamp);
};


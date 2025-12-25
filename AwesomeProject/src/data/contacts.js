// Mock contacts data
import { users } from './users';

export const contacts = users.map(user => ({
  ...user,
  isContact: true,
}));

// Add some additional contacts
export const allContacts = [
  ...contacts,
  {
    id: '7',
    name: 'Emma Wilson',
    phone: '+1 (555) 777-8888',
    email: 'emma.wilson@example.com',
    avatar: 'https://randomuser.me/api/portraits/women/50.jpg',
    status: 'Available',
    lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isContact: true,
  },
  {
    id: '8',
    name: 'David Brown',
    phone: '+1 (555) 888-9999',
    email: 'david.brown@example.com',
    avatar: null,
    initials: 'DB',
    status: 'Offline',
    lastSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isContact: true,
  },
];


// Mock user data
export const currentUser = {
  id: 'current-user',
  name: 'Alex Johnson',
  phone: '+1 (555) 123-4567',
  email: 'alex.johnson@example.com',
  avatar: null,
  status: 'At the movies 🍿',
  lastSeen: new Date().toISOString(),
};

export const users = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    phone: '+1 (555) 111-2222',
    email: 'sarah.jenkins@example.com',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    status: 'Online',
    lastSeen: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Sarah Connor',
    phone: '+1 (555) 222-3333',
    email: 'sarah.connor@example.com',
    avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
    status: 'Available',
    lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Mom',
    phone: '+1 (555) 333-4444',
    email: 'mom@example.com',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    status: 'Available',
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    name: 'John Wick',
    phone: '+1 (555) 444-5555',
    email: 'john.wick@example.com',
    avatar: null,
    initials: 'JW',
    status: 'Offline',
    lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    name: 'Alex Chen',
    phone: '+1 (555) 555-6666',
    email: 'alex.chen@example.com',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    status: 'Available',
    lastSeen: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    name: 'Mike Johnson',
    phone: '+1 (555) 666-7777',
    email: 'mike.johnson@example.com',
    avatar: 'https://randomuser.me/api/portraits/men/85.jpg',
    status: 'Available',
    lastSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];


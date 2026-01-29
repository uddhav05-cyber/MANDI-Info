/**
 * Mock Data for Demo Mode
 * Provides sample data when running without database
 */

export const mockProducts = [
  {
    id: '1',
    vendorId: 'vendor-1',
    name: 'Fresh Tomatoes',
    nameTranslations: {
      en: 'Fresh Tomatoes',
      hi: 'ताज़ा टमाटर',
      mr: 'ताजे टोमॅटो',
    },
    categoryId: 'cat-1',
    price: 50,
    unit: 'kg',
    quantity: 100,
    imageUrl: null,
    qrCode: null,
    isAvailable: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    vendorId: 'vendor-1',
    name: 'Fresh Potatoes',
    nameTranslations: {
      en: 'Fresh Potatoes',
      hi: 'ताज़ा आलू',
      mr: 'ताजे बटाटे',
    },
    categoryId: 'cat-1',
    price: 30,
    unit: 'kg',
    quantity: 150,
    imageUrl: null,
    qrCode: null,
    isAvailable: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    vendorId: 'vendor-2',
    name: 'Fresh Onions',
    nameTranslations: {
      en: 'Fresh Onions',
      hi: 'ताज़ा प्याज',
      mr: 'ताजे कांदे',
    },
    categoryId: 'cat-1',
    price: 40,
    unit: 'kg',
    quantity: 80,
    imageUrl: null,
    qrCode: null,
    isAvailable: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const mockVendors = [
  {
    id: 'vendor-1',
    userId: 'user-1',
    shopName: 'Fresh Mart',
    shopNameTranslations: {
      en: 'Fresh Mart',
      hi: 'फ्रेश मार्ट',
    },
    description: 'Quality vegetables and fruits',
    businessHours: { open: '08:00', close: '20:00' },
    verified: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'vendor-2',
    userId: 'user-2',
    shopName: 'Green Valley',
    shopNameTranslations: {
      en: 'Green Valley',
      hi: 'ग्रीन वैली',
    },
    description: 'Organic produce',
    businessHours: { open: '07:00', close: '19:00' },
    verified: true,
    createdAt: new Date('2024-01-01'),
  },
];

export const mockUsers = [
  {
    id: 'user-1',
    phoneNumber: '919876543210',
    name: 'Rajesh Kumar',
    userType: 'vendor',
    preferredLanguage: 'hi',
    locationLatitude: null,
    locationLongitude: null,
    locationAddress: 'Mumbai, Maharashtra',
    rating: 4.5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2',
    phoneNumber: '919876543211',
    name: 'Priya Sharma',
    userType: 'vendor',
    preferredLanguage: 'hi',
    locationLatitude: null,
    locationLongitude: null,
    locationAddress: 'Delhi, India',
    rating: 4.8,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const mockCategories = [
  {
    id: 'cat-1',
    name: 'Vegetables',
    nameTranslations: {
      en: 'Vegetables',
      hi: 'सब्जियाँ',
      mr: 'भाज्या',
    },
    icon: '🥬',
    parentId: null,
  },
  {
    id: 'cat-2',
    name: 'Fruits',
    nameTranslations: {
      en: 'Fruits',
      hi: 'फल',
      mr: 'फळे',
    },
    icon: '🍎',
    parentId: null,
  },
];

// LocalStorage Database Manager for Airbnb Booking & Property Management System

const DB_KEY_PREFIX = 'airbnb_db_';

// Initial Seed Data
const INITIAL_AMENITIES = [
  { id: 'wifi', name: 'High-Speed Wi-Fi', icon: 'Wifi' },
  { id: 'kitchen', name: 'Fully Equipped Kitchen', icon: 'ChefHat' },
  { id: 'parking', name: 'Free Parking', icon: 'Car' },
  { id: 'pool', name: 'Infinity Pool', icon: 'Waves' },
  { id: 'ac', name: 'Air Conditioning', icon: 'Wind' },
  { id: 'tv', name: 'Smart TV', icon: 'Tv' },
  { id: 'washer', name: 'Washer & Dryer', icon: 'WashingMachine' },
  { id: 'workspace', name: 'Dedicated Workspace', icon: 'Briefcase' },
  { id: 'hottub', name: 'Hot Tub', icon: 'Bath' },
  { id: 'gym', name: 'Fitness Gym', icon: 'Dumbbell' }
];

const INITIAL_USERS = [
  { id: 'u1', name: 'Jane Doe', email: 'jane@example.com', password: 'password123', phone: '+1 555-0199', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', verified: true, createdAt: '2026-01-10T12:00:00Z' },
  { id: 'u2', name: 'John Doe', email: 'john@example.com', password: 'password123', phone: '+1 555-0144', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', verified: true, createdAt: '2026-02-14T09:30:00Z' },
  { id: 'u3', name: 'Guest User', email: 'guest@example.com', password: 'password123', phone: '+1 555-0122', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', verified: true, createdAt: '2026-06-01T15:45:00Z' }
];

const INITIAL_ADMINS = [
  { id: 'a1', name: 'Sarah Jenkins', email: 'admin@booking.com', password: 'admin123', role: 'Super Admin', createdAt: '2026-01-01T08:00:00Z' },
  { id: 'a2', name: 'Mike Ross', email: 'manager@booking.com', password: 'manager123', role: 'Manager', createdAt: '2026-03-01T09:00:00Z' }
];

const INITIAL_PROPERTIES = [
  {
    id: 'p1',
    title: 'Villa Azure - Cliffside Sunset Infinity Pool',
    description: 'Perched on the scenic cliffs overlooking the pristine blue ocean, Villa Azure offers an unparalleled luxury escape. Features glass walls that open directly to an expansive wooden deck, featuring a heated infinity pool and cozy dining loungers. Perfect for couples or families seeking serenity, style, and world-class sunset views.',
    category: 'Beachfront',
    pricePerNight: 380,
    location: { city: 'Malibu', country: 'United States', address: '24800 Pacific Coast Hwy' },
    beds: 3,
    baths: 2.5,
    guests: 6,
    amenities: ['wifi', 'kitchen', 'parking', 'pool', 'ac', 'tv', 'hottub'],
    status: 'available',
    seasonalPricing: [
      { month: 6, priceMultiplier: 1.3 }, // June: +30%
      { month: 7, priceMultiplier: 1.4 }, // July: +40%
      { month: 8, priceMultiplier: 1.4 }, // August: +40%
      { month: 12, priceMultiplier: 1.2 } // December: +20%
    ],
    discounts: [
      { minDays: 3, percentage: 5 },  // 3+ nights: 5% off
      { minDays: 7, percentage: 12 }  // 7+ nights: 12% off
    ]
  },
  {
    id: 'p2',
    title: 'The Alpine Glass A-Frame Cabin',
    description: 'Immerse yourself in nature in this stunning A-Frame cabin. Constructed with double-height glass walls, the cabin offers deep panoramic views of a tranquil snowy pine forest. Featuring high-end cozy interior design, an indoor stone fireplace, and a private redwood deck with a wood-fired cedar hot tub.',
    category: 'Cabins',
    pricePerNight: 240,
    location: { city: 'Aspen', country: 'United States', address: '780 Maroon Creek Rd' },
    beds: 2,
    baths: 1.5,
    guests: 4,
    amenities: ['wifi', 'kitchen', 'parking', 'ac', 'tv', 'hottub', 'workspace'],
    status: 'available',
    seasonalPricing: [
      { month: 12, priceMultiplier: 1.5 }, // Dec: +50%
      { month: 1, priceMultiplier: 1.4 },  // Jan: +40%
      { month: 2, priceMultiplier: 1.3 }   // Feb: +30%
    ],
    discounts: [
      { minDays: 5, percentage: 10 }
    ]
  },
  {
    id: 'p3',
    title: 'The Heights - Skyline Luxury Penthouse',
    description: 'Experience Manhattan from the sky. This ultra-sleek, minimalist penthouse features spectacular double-height glass windows overlooking the dramatic city skyline. Fully automated lighting, smart curtains, custom white marble flooring, chef\'s kitchen, and a private terrace overlooking Central Park.',
    category: 'Trending',
    pricePerNight: 650,
    location: { city: 'New York', country: 'United States', address: '150 Central Park South' },
    beds: 2,
    baths: 2,
    guests: 4,
    amenities: ['wifi', 'kitchen', 'ac', 'tv', 'workspace', 'gym'],
    status: 'available',
    seasonalPricing: [
      { month: 9, priceMultiplier: 1.15 }, // Sep: +15%
      { month: 10, priceMultiplier: 1.15 }, // Oct: +15%
      { month: 12, priceMultiplier: 1.3 }  // Dec: +30%
    ],
    discounts: [
      { minDays: 4, percentage: 8 }
    ]
  },
  {
    id: 'p4',
    title: 'Kyoto Zen Forest Sanctuary',
    description: 'Restore balance in this masterfully crafted authentic wooden retreat, blended harmoniously with traditional tatami mats and sleek glass architecture. Includes a private, curated Japanese stone garden, flowing tea house room, and an indoor-outdoor private hot mineral spring (Onsen).',
    category: 'Countryside',
    pricePerNight: 310,
    location: { city: 'Kyoto', country: 'Japan', address: '12 Sagano Shingo-cho' },
    beds: 3,
    baths: 2,
    guests: 5,
    amenities: ['wifi', 'kitchen', 'parking', 'ac', 'hottub', 'workspace'],
    status: 'available',
    seasonalPricing: [
      { month: 3, priceMultiplier: 1.35 }, // Cherry Blossom season (March): +35%
      { month: 4, priceMultiplier: 1.4 },  // Cherry Blossom season (April): +40%
      { month: 10, priceMultiplier: 1.25 } // Autumn leaves (October): +25%
    ],
    discounts: [
      { minDays: 7, percentage: 15 }
    ]
  },
  {
    id: 'p5',
    title: 'Modernist Beachfront Glass Pavilion',
    description: 'Hovering gracefully over the golden sand, this architectural marvel is constructed with structural steel and floor-to-ceiling glass. Features a massive wrap-around cantilevered deck, a private beach ramp, custom designer Italian furniture, and high-end built-in acoustics.',
    category: 'Beachfront',
    pricePerNight: 490,
    location: { city: 'Malibu', country: 'United States', address: '30700 Broad Beach Rd' },
    beds: 4,
    baths: 4,
    guests: 8,
    amenities: ['wifi', 'kitchen', 'parking', 'pool', 'ac', 'tv', 'washer', 'gym'],
    status: 'available',
    seasonalPricing: [
      { month: 6, priceMultiplier: 1.3 },
      { month: 7, priceMultiplier: 1.3 },
      { month: 8, priceMultiplier: 1.3 }
    ],
    discounts: [
      { minDays: 3, percentage: 5 },
      { minDays: 7, percentage: 10 }
    ]
  }
];

const INITIAL_PROPERTY_IMAGES = [
  { id: 'pi1', propertyId: 'p1', url: '/beach_villa.png', isCover: true },
  { id: 'pi2', propertyId: 'p2', url: '/mountain_cabin.png', isCover: true },
  { id: 'pi3', propertyId: 'p3', url: '/urban_penthouse.png', isCover: true },
  { id: 'pi4', propertyId: 'p4', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80', isCover: true },
  { id: 'pi5', propertyId: 'p5', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', isCover: true },
  
  // Secondary images for details page
  { id: 'pi6', propertyId: 'p1', url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80', isCover: false },
  { id: 'pi7', propertyId: 'p1', url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80', isCover: false },
  { id: 'pi8', propertyId: 'p2', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', isCover: false },
  { id: 'pi9', propertyId: 'p3', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80', isCover: false },
  { id: 'pi10', propertyId: 'p4', url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80', isCover: false }
];

const INITIAL_PROPERTY_UNITS = [
  { id: 'pu_p1_entire', propertyId: 'p1', unitName: 'Entire Villa Azure', unitType: 'Entire Property', description: 'Luxurious cliffside entire villa, sunset views, infinity pool access', maxGuests: 6, pricePerNight: 380, status: 'available', photoUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80' },
  { id: 'pu_p1_queen', propertyId: 'p1', unitName: 'Ocean Queen Room', unitType: 'Room', description: 'Elegant ocean-facing room with Queen size bed', maxGuests: 2, pricePerNight: 150, status: 'available', photoUrl: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80' },
  { id: 'pu_p1_king', propertyId: 'p1', unitName: 'Sunset King Room', unitType: 'Room', description: 'Premium suite with King size bed and private balcony access', maxGuests: 2, pricePerNight: 180, status: 'available', photoUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80' },
  
  { id: 'pu_p2_entire', propertyId: 'p2', unitName: 'Entire Glass Cabin', unitType: 'Entire Property', description: 'Cozy modern A-frame glass cabin nestled in the forest', maxGuests: 4, pricePerNight: 240, status: 'available', photoUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' },
  { id: 'pu_p2_room', propertyId: 'p2', unitName: 'Pine View Loft Bed', unitType: 'Room', description: 'Charming loft space room with scenic pine view', maxGuests: 2, pricePerNight: 120, status: 'available', photoUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' },
  
  { id: 'pu_p3_entire', propertyId: 'p3', unitName: 'Entire Skyline Penthouse', unitType: 'Entire Property', description: 'Full luxury penthouse overlooking Manhattan', maxGuests: 4, pricePerNight: 650, status: 'available', photoUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' },
  { id: 'pu_p3_room', propertyId: 'p3', unitName: 'Metropolis Master Room', unitType: 'Room', description: 'Master suite featuring automated blinds and central park view', maxGuests: 2, pricePerNight: 300, status: 'available', photoUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' },
  
  { id: 'pu_p4_entire', propertyId: 'p4', unitName: 'Entire Zen Forest Sanctuary', unitType: 'Entire Property', description: 'Traditional Japanese wooden sanctuary in the forest', maxGuests: 5, pricePerNight: 310, status: 'available', photoUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80' },
  { id: 'pu_p4_room', propertyId: 'p4', unitName: 'Classic Tatami Room', unitType: 'Room', description: 'Serene authentic tatami room with shoji screen sliding doors', maxGuests: 2, pricePerNight: 160, status: 'available', photoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80' },
  
  { id: 'pu_p5_entire', propertyId: 'p5', unitName: 'Entire Beachfront Pavilion', unitType: 'Entire Property', description: 'Architectural beachfront steel and glass pavilion', maxGuests: 8, pricePerNight: 490, status: 'available', photoUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' },
  { id: 'pu_p5_room', propertyId: 'p5', unitName: 'Golden Sand Room', unitType: 'Room', description: 'Minimalist room with immediate beachfront ramp exit', maxGuests: 2, pricePerNight: 200, status: 'available', photoUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' }
];

const INITIAL_BOOKINGS = [
  { id: 'b1', propertyId: 'p1', unitId: 'pu_p1_entire', userId: 'u1', checkIn: '2026-05-10', checkOut: '2026-05-15', totalPrice: 1900, totalAmount: 1900, paymentStatus: 'verified', bookingStatus: 'completed', status: 'completed', guestsCount: 2, createdAt: '2026-05-01T10:00:00Z' },
  { id: 'b2', propertyId: 'p2', unitId: 'pu_p2_entire', userId: 'u2', checkIn: '2026-06-01', checkOut: '2026-06-05', totalPrice: 960, totalAmount: 960, paymentStatus: 'verified', bookingStatus: 'completed', status: 'completed', guestsCount: 3, createdAt: '2026-05-15T14:20:00Z' },
  { id: 'b3', propertyId: 'p1', unitId: 'pu_p1_entire', userId: 'u2', checkIn: '2026-06-25', checkOut: '2026-06-30', totalPrice: 2223, totalAmount: 2223, paymentStatus: 'verified', bookingStatus: 'approved', status: 'approved', guestsCount: 4, createdAt: '2026-06-05T11:10:00Z' },
  { id: 'b4', propertyId: 'p3', unitId: 'pu_p3_entire', userId: 'u1', checkIn: '2026-07-02', checkOut: '2026-07-08', totalPrice: 3900, totalAmount: 3900, paymentStatus: 'pending', bookingStatus: 'pending', status: 'pending', guestsCount: 2, createdAt: '2026-06-18T16:00:00Z' },
  { id: 'b5', propertyId: 'p2', unitId: 'pu_p2_entire', userId: 'u3', checkIn: '2026-07-12', checkOut: '2026-07-15', totalPrice: 720, totalAmount: 720, paymentStatus: 'verified', bookingStatus: 'approved', status: 'approved', guestsCount: 2, createdAt: '2026-06-19T08:30:00Z' }
];

const INITIAL_PAYMENTS = [
  { id: 'pay1', bookingId: 'b1', amount: 1900, method: 'Credit Card', status: 'verified', transactionRef: 'TXN-9847192', createdAt: '2026-05-01T10:05:00Z' },
  { id: 'pay2', bookingId: 'b2', amount: 960, method: 'PayPal', status: 'verified', transactionRef: 'TXN-4837261', createdAt: '2026-05-15T14:25:00Z' },
  { id: 'pay3', bookingId: 'b3', amount: 2223, method: 'Credit Card', status: 'verified', transactionRef: 'TXN-7362810', createdAt: '2026-06-05T11:15:00Z' },
  { id: 'pay4', bookingId: 'b4', amount: 3900, method: 'Bank Transfer', status: 'pending', transactionRef: 'TXN-8274912', createdAt: '2026-06-18T16:05:00Z' },
  { id: 'pay5', bookingId: 'b5', amount: 720, method: 'Credit Card', status: 'verified', transactionRef: 'TXN-1029384', createdAt: '2026-06-19T08:35:00Z' }
];

const INITIAL_REVIEWS = [
  { id: 'r1', propertyId: 'p1', userId: 'u1', rating: 5, comment: 'Absolutely breathtaking! The sunset views were unreal and the infinity pool was incredibly soothing. We had everything we needed.', response: 'Thank you Jane! We are delighted to hear you loved the sunsets and infinity pool. Welcome back anytime!', createdAt: '2026-05-16T09:00:00Z' },
  { id: 'r2', propertyId: 'p2', userId: 'u2', rating: 4.8, comment: 'Waking up to snowy pines through those huge glass windows was like living in a fairytale. The hot tub was amazing, though it took some time to heat up.', response: 'Glad you enjoyed the cabin and scenery, John! Yes, wood-fired hot tubs require a little patience, but the heat is truly organic and calming. See you again!', createdAt: '2026-06-06T10:30:00Z' },
  { id: 'r3', propertyId: 'p1', userId: 'u2', rating: 5, comment: 'A masterclass in modern seaside architecture. The sounds of waves crashed below our bedroom all night. Worth every single penny.', response: '', createdAt: '2026-06-15T14:00:00Z' }
];

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', userId: 'a1', message: 'New booking request received for Skyline Penthouse from Jane Doe', type: 'info', read: false, createdAt: '2026-06-18T16:00:00Z' },
  { id: 'n2', userId: 'u1', message: 'Your payment for Villa Azure has been verified successfully.', type: 'success', read: false, createdAt: '2026-05-01T10:05:00Z' },
  { id: 'n3', userId: 'a1', message: 'Guest User submitted a new booking request for Alpine Glass Cabin', type: 'info', read: true, createdAt: '2026-06-19T08:30:00Z' }
];

const INITIAL_ACTIVITY_LOGS = [
  { id: 'l1', adminId: 'a1', action: 'Initialize Database', details: 'Preloaded database tables with sample properties, listings, and seed accounts.', timestamp: '2026-06-19T03:00:00Z' },
  { id: 'l2', adminId: 'a1', action: 'Update Price Rule', details: 'Added 40% peak multiplier for July-August on Villa Azure.', timestamp: '2026-06-19T04:15:00Z' }
];

const INITIAL_SETTINGS = {
  logoText: 'HavenShare',
  logoIcon: 'Home',
  bannerTitle: 'Discover extraordinary stays.',
  bannerSubtitle: 'Book unique places to live, work, or relax across the globe.',
  bannerImage: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1600&q=80',
  contactEmail: 'support@havenshare.com',
  contactPhone: '+1 (800) 555-0123',
  address: '100 Ocean Drive, Suite 400, Miami, FL 33139',
  socialFacebook: 'https://facebook.com/havenshare',
  socialInstagram: 'https://instagram.com/havenshare',
  socialTwitter: 'https://twitter.com/havenshare',
  categories: ['Beachfront', 'Cabins', 'Trending', 'Countryside', 'Treehouses', 'Mansions'],
  faqs: [
    { id: 'faq1', question: 'How do check-ins and check-outs work?', answer: 'Check-in is typically after 3:00 PM, and check-out is before 11:00 AM. Administrators will send detailed door codes and lockbox details upon booking verification.' },
    { id: 'faq2', question: 'What is the cancellation policy?', answer: 'Bookings cancelled up to 5 days before the scheduled check-in receive a full refund. Cancellations made within 5 days of arrival are subject to a 50% penalty.' },
    { id: 'faq3', question: 'Are pets allowed in the properties?', answer: 'Pets are permitted in select properties only (indicated on the listing details page under amenities). Please check with the property rules prior to booking.' }
  ]
};

// Database Initialization Helper
export function initDB() {
  const tables = {
    users: INITIAL_USERS,
    admins: INITIAL_ADMINS,
    properties: INITIAL_PROPERTIES,
    property_units: INITIAL_PROPERTY_UNITS,
    property_images: INITIAL_PROPERTY_IMAGES,
    bookings: INITIAL_BOOKINGS,
    payments: INITIAL_PAYMENTS,
    reviews: INITIAL_REVIEWS,
    amenities: INITIAL_AMENITIES,
    notifications: INITIAL_NOTIFICATIONS,
    activity_logs: INITIAL_ACTIVITY_LOGS,
    settings: INITIAL_SETTINGS
  };

  Object.entries(tables).forEach(([key, val]) => {
    const fullKey = DB_KEY_PREFIX + key;
    if (!localStorage.getItem(fullKey)) {
      localStorage.setItem(fullKey, JSON.stringify(val));
    }
  });
}

// Table CRUD Helpers
export function getTable(name) {
  const fullKey = DB_KEY_PREFIX + name;
  const data = localStorage.getItem(fullKey);
  return data ? JSON.parse(data) : [];
}

export function saveTable(name, data) {
  const fullKey = DB_KEY_PREFIX + name;
  localStorage.setItem(fullKey, JSON.stringify(data));
  // Dispatch custom event to notify all React components of changes
  window.dispatchEvent(new Event('airbnb_db_update'));
}

export function insertRecord(tableName, record) {
  const table = getTable(tableName);
  const newRecord = {
    id: record.id || (tableName.charAt(0) + Math.random().toString(36).substr(2, 9)),
    ...record,
    createdAt: record.createdAt || new Date().toISOString()
  };
  table.push(newRecord);
  saveTable(tableName, table);
  return newRecord;
}

export function updateRecord(tableName, id, updatedFields) {
  const table = getTable(tableName);
  const index = table.findIndex(r => r.id === id);
  if (index !== -1) {
    table[index] = { ...table[index], ...updatedFields };
    saveTable(tableName, table);
    return table[index];
  }
  return null;
}

export function deleteRecord(tableName, id) {
  const table = getTable(tableName);
  const updatedTable = table.filter(r => r.id !== id);
  saveTable(tableName, updatedTable);
}

// Logging helper for activity audits
export function logActivity(adminId, action, details) {
  insertRecord('activity_logs', {
    adminId,
    action,
    details,
    timestamp: new Date().toISOString()
  });
}

// Helper to check overlapping bookings
export function hasDoubleBooking(propertyId, unitId, checkInStr, checkOutStr, excludeBookingId = null) {
  const bookings = getTable('bookings');
  const units = getTable('property_units');
  const targetUnit = units.find(u => u.id === unitId);
  if (!targetUnit) return false;

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  // Find all bookings for this property that overlap and are active
  const overlappingBookings = bookings.filter(b => {
    if (b.propertyId !== propertyId) return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.status === 'cancelled' || b.status === 'rejected') return false;

    const bIn = new Date(b.checkIn);
    const bOut = new Date(b.checkOut);
    return (checkIn < bOut) && (checkOut > bIn);
  });

  // Rule 1: If there is any booking in this period for an 'Entire Property' unit:
  // Then the property is fully blocked, so this unit is unavailable.
  const hasEntirePropertyBooking = overlappingBookings.some(b => {
    const unit = units.find(u => u.id === b.unitId);
    return unit && unit.unitType === 'Entire Property';
  });
  if (hasEntirePropertyBooking) return true;

  // Rule 2/3: If we are booking the 'Entire Property':
  // If there is ANY active booking in this period (either another entire property booking, or any room booking), it is unavailable.
  if (targetUnit.unitType === 'Entire Property') {
    if (overlappingBookings.length > 0) return true;
  }

  // Rule 4: If we are booking a specific 'Room':
  // It is blocked if that specific Room has a booking.
  if (targetUnit.unitType === 'Room') {
    const isRoomBooked = overlappingBookings.some(b => b.unitId === unitId);
    if (isRoomBooked) return true;
  }

  return false;
}

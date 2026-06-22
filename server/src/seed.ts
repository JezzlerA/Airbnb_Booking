import 'dotenv/config';
import { pool } from './config/db';
import { hashPassword } from './services/password';

const adminEmail = 'admin@havenshare.local';
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

const taxes = [
  { name: 'VAT', rate: 0.08, type: 'percentage', country_code: 'US', active: true },
  { name: 'Tourism Fee', rate: 0.12, type: 'percentage', country_code: 'US', active: true },
  { name: 'GST', rate: 0.10, type: 'percentage', country_code: 'AU', active: true }
];

const amenitiesCatalog = [
  { name: 'WiFi', category: 'essentials', icon: 'wifi' },
  { name: 'Kitchen', category: 'essentials', icon: 'chef-hat' },
  { name: 'Parking', category: 'features', icon: 'parking-circle' },
  { name: 'Pool', category: 'features', icon: 'pool' },
  { name: 'Hot Tub', category: 'features', icon: 'hot-tub' },
  { name: 'Air Conditioning', category: 'features', icon: 'snowflake' },
  { name: 'TV', category: 'essentials', icon: 'tv' },
  { name: 'Workspace', category: 'features', icon: 'desk' },
  { name: 'Gym', category: 'features', icon: 'dumbbell' },
  { name: 'Smoke Alarm', category: 'safety', icon: 'alert-triangle' }
];

const properties = [
  {
    title: 'Villa Azure - Cliffside Sunset Infinity Pool',
    description: 'Perched on scenic cliffs overlooking the ocean, Villa Azure offers glass walls, a heated infinity pool, sunset deck, and luxury interiors for couples or families.',
    category: 'Beachfront',
    pricePerNight: 380,
    beds: 3,
    baths: 2.5,
    guests: 6,
    location: { city: 'Malibu', country: 'United States', address: '24800 Pacific Coast Hwy' },
    amenities: ['wifi', 'kitchen', 'parking', 'pool', 'ac', 'tv', 'hottub'],
    seasonalPricing: [
      { month: 6, priceMultiplier: 1.3 },
      { month: 7, priceMultiplier: 1.4 },
      { month: 8, priceMultiplier: 1.4 },
      { month: 12, priceMultiplier: 1.2 }
    ],
    discounts: [
      { minDays: 3, percentage: 5 },
      { minDays: 7, percentage: 12 }
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80', altText: 'Beach villa exterior', isCover: true, sortOrder: 0 },
      { url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80', altText: 'Villa lounge', isCover: false, sortOrder: 1 }
    ]
  },
  {
    title: 'The Alpine Glass A-Frame Cabin',
    description: 'A double-height glass cabin with panoramic pine forest views, stone fireplace, cedar hot tub, and a private redwood deck.',
    category: 'Cabins',
    pricePerNight: 240,
    beds: 2,
    baths: 1.5,
    guests: 4,
    location: { city: 'Aspen', country: 'United States', address: '780 Maroon Creek Rd' },
    amenities: ['wifi', 'kitchen', 'parking', 'ac', 'tv', 'hottub', 'workspace'],
    seasonalPricing: [
      { month: 12, priceMultiplier: 1.5 },
      { month: 1, priceMultiplier: 1.4 },
      { month: 2, priceMultiplier: 1.3 }
    ],
    discounts: [{ minDays: 5, percentage: 10 }],
    images: [
      { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', altText: 'Mountain cabin exterior', isCover: true, sortOrder: 0 }
    ]
  },
  {
    title: 'The Heights - Skyline Luxury Penthouse',
    description: 'A minimalist penthouse with double-height windows, skyline views, automated lighting, marble floors, chef kitchen, and private terrace.',
    category: 'Trending',
    pricePerNight: 650,
    beds: 2,
    baths: 2,
    guests: 4,
    location: { city: 'New York', country: 'United States', address: '150 Central Park South' },
    amenities: ['wifi', 'kitchen', 'ac', 'tv', 'workspace', 'gym'],
    seasonalPricing: [
      { month: 9, priceMultiplier: 1.15 },
      { month: 10, priceMultiplier: 1.15 },
      { month: 12, priceMultiplier: 1.3 }
    ],
    discounts: [{ minDays: 4, percentage: 8 }],
    images: [
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80', altText: 'Penthouse living area', isCover: true, sortOrder: 0 }
    ]
  }
];

async function ensureAdmin() {
  const existing = await pool.query('select id from users where email = $1', [adminEmail]);

  if (existing.rowCount && existing.rowCount > 0) {
    return existing.rows[0].id;
  }

  const passwordHash = await hashPassword(adminPassword);
  const result = await pool.query(
    `insert into users (name, email, password_hash, role, verified)
     values ($1, $2, $3, 'admin', true)
     returning id`,
    ['HavenShare Admin', adminEmail, passwordHash]
  );

  return result.rows[0].id;
}

async function seedProperties(ownerId: string) {
  const count = await pool.query('select count(*) as count from properties');

  if (Number(count.rows[0]?.count ?? 0) > 0) {
    console.log('Properties already exist. Skipping property seed.');
    return;
  }

  for (const property of properties) {
    const result = await pool.query(
      `insert into properties (
         owner_id, title, description, category, price_per_night, beds, baths, guests,
         location, amenities, seasonal_pricing, discounts, status
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'available')
       returning id`,
      [
        ownerId,
        property.title,
        property.description,
        property.category,
        property.pricePerNight,
        property.beds,
        property.baths,
        property.guests,
        property.location,
        property.amenities,
        property.seasonalPricing,
        property.discounts
      ]
    );

    const propertyId = result.rows[0].id;

    await pool.query(
      `insert into property_images (property_id, url, alt_text, is_cover, sort_order)
       values ${property.images.map((_image, index) => `($1, $${2 + index * 5}, $${3 + index * 5}, $${4 + index * 5}, $${5 + index * 5})`).join(', ')}`,
      property.images.flatMap((image) => [propertyId, image.url, image.altText, image.isCover, image.sortOrder])
    );

    // Seed units for the property
    let units = [];
    if (property.title.includes('Villa Azure')) {
      units = [
        { name: 'Entire Villa Azure', type: 'Entire Property', desc: 'Luxurious cliffside entire villa, sunset views, infinity pool access', maxGuests: 6, price: 380, photo: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80' },
        { name: 'Ocean Queen Room', type: 'Room', desc: 'Elegant ocean-facing room with Queen size bed', maxGuests: 2, price: 150, photo: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80' },
        { name: 'Sunset King Room', type: 'Room', desc: 'Premium suite with King size bed and private balcony access', maxGuests: 2, price: 180, photo: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80' }
      ];
    } else if (property.title.includes('Alpine Glass')) {
      units = [
        { name: 'Entire Glass Cabin', type: 'Entire Property', desc: 'Cozy modern A-frame glass cabin nestled in the forest', maxGuests: 4, price: 240, photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' },
        { name: 'Pine View Loft Bed', type: 'Room', desc: 'Charming loft space room with scenic pine view', maxGuests: 2, price: 120, photo: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80' }
      ];
    } else {
      units = [
        { name: `Entire ${property.title}`, type: 'Entire Property', desc: `Entire property booking for ${property.title}`, maxGuests: property.guests, price: property.pricePerNight, photo: property.images[0]?.url || '' },
        { name: 'Master Suite', type: 'Room', desc: 'Luxurious master suite with premium finishes', maxGuests: Math.ceil(property.guests / 2), price: Math.round(property.pricePerNight * 0.6), photo: property.images[0]?.url || '' }
      ];
    }

    for (const u of units) {
      await pool.query(
        `insert into property_units (property_id, unit_name, unit_type, description, max_guests, price_per_night, status, photo_url)
         values ($1, $2, $3, $4, $5, $6, 'available', $7)`,
        [propertyId, u.name, u.type, u.desc, u.maxGuests, u.price, u.photo]
      );
    }
  }
}

async function seed() {
  const ownerId = await ensureAdmin();
  await seedProperties(ownerId);
  await seedTaxes();
  await seedAmenitiesCatalog();
  console.log('Seed data completed.');
}

async function seedTaxes() {
  const count = await pool.query('select count(*) as count from taxes');
  if (Number(count.rows[0]?.count ?? 0) > 0) {
    console.log('Taxes already exist. Skipping tax seed.');
    return;
  }
  for (const tax of taxes) {
    await pool.query(
      `insert into taxes (name, rate, type, country_code, active)
       values ($1, $2, $3, $4, $5)`,
      [tax.name, tax.rate, tax.type, tax.country_code, tax.active]
    );
  }
}

async function seedAmenitiesCatalog() {
  const count = await pool.query('select count(*) as count from property_amenities_catalog');
  if (Number(count.rows[0]?.count ?? 0) > 0) {
    console.log('Amenities catalog already exists. Skipping amenities seed.');
    return;
  }
  for (const amenity of amenitiesCatalog) {
    await pool.query(
      `insert into property_amenities_catalog (name, category, icon)
       values ($1, $2, $3)`,
      [amenity.name, amenity.category, amenity.icon]
    );
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });

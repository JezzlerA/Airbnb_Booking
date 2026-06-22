-- ============================================================
-- HavenShare - Airbnb Booking & Property Management System
-- Supabase PostgreSQL Schema + Seed Data
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- -------------------------------------------------------
-- DROP EXISTING TABLES (for clean re-runs)
-- -------------------------------------------------------
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.property_images CASCADE;
DROP TABLE IF EXISTS public.property_units CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.amenities CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- -------------------------------------------------------
-- TABLE: amenities
-- -------------------------------------------------------
CREATE TABLE public.amenities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL
);

-- -------------------------------------------------------
-- TABLE: users
-- -------------------------------------------------------
CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLE: admins
-- -------------------------------------------------------
CREATE TABLE public.admins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Super Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLE: properties
-- -------------------------------------------------------
CREATE TABLE public.properties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price_per_night NUMERIC NOT NULL,
  beds INTEGER NOT NULL,
  baths NUMERIC NOT NULL,
  guests INTEGER NOT NULL,
  location JSONB NOT NULL DEFAULT '{}',
  amenities JSONB NOT NULL DEFAULT '[]',
  seasonal_pricing JSONB DEFAULT '[]',
  discounts JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLE: property_units
-- -------------------------------------------------------
CREATE TABLE public.property_units (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_name TEXT NOT NULL,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('Entire Property', 'Room')),
  description TEXT,
  max_guests INTEGER NOT NULL,
  price_per_night NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLE: property_images
-- -------------------------------------------------------
CREATE TABLE public.property_images (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLE: bookings
-- -------------------------------------------------------
CREATE TABLE public.bookings (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id TEXT REFERENCES public.property_units(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price NUMERIC NOT NULL,
  total_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  booking_status TEXT DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'pending',
  guests_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLE: payments
-- -------------------------------------------------------
CREATE TABLE public.payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_ref TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLE: reviews
-- -------------------------------------------------------
CREATE TABLE public.reviews (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  rating NUMERIC NOT NULL,
  comment TEXT NOT NULL,
  response TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLE: notifications
-- -------------------------------------------------------
CREATE TABLE public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLE: activity_logs
-- -------------------------------------------------------
CREATE TABLE public.activity_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- TABLE: settings (key-value store)
-- -------------------------------------------------------
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- -------------------------------------------------------
-- SEED: amenities
-- -------------------------------------------------------
INSERT INTO public.amenities (id, name, icon) VALUES
  ('wifi',      'High-Speed Wi-Fi',        'Wifi'),
  ('kitchen',   'Fully Equipped Kitchen',  'ChefHat'),
  ('parking',   'Free Parking',            'Car'),
  ('pool',      'Infinity Pool',           'Waves'),
  ('ac',        'Air Conditioning',        'Wind'),
  ('tv',        'Smart TV',               'Tv'),
  ('washer',    'Washer & Dryer',         'WashingMachine'),
  ('workspace', 'Dedicated Workspace',    'Briefcase'),
  ('hottub',    'Hot Tub',               'Bath'),
  ('gym',       'Fitness Gym',           'Dumbbell');

-- -------------------------------------------------------
-- SEED: users
-- -------------------------------------------------------
INSERT INTO public.users (id, name, email, password_hash, phone, avatar, verified) VALUES
  ('u1', 'Jane Doe',   'jane@example.com',  'password123', '+1 555-0199',
   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', TRUE),
  ('u2', 'John Doe',   'john@example.com',  'password123', '+1 555-0144',
   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', TRUE),
  ('u3', 'Guest User', 'guest@example.com', 'password123', '+1 555-0122',
   'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', TRUE);

-- -------------------------------------------------------
-- SEED: admins
-- -------------------------------------------------------
INSERT INTO public.admins (id, name, email, password_hash, role) VALUES
  ('a1', 'Sarah Jenkins', 'admin@booking.com',   'admin123',   'Super Admin'),
  ('a2', 'Mike Ross',     'manager@booking.com', 'manager123', 'Manager');

-- -------------------------------------------------------
-- SEED: properties
-- -------------------------------------------------------
INSERT INTO public.properties (id, title, description, category, price_per_night, beds, baths, guests, location, amenities, seasonal_pricing, discounts, status) VALUES
(
  'p1',
  'Villa Azure - Cliffside Sunset Infinity Pool',
  'Perched on the scenic cliffs overlooking the pristine blue ocean, Villa Azure offers an unparalleled luxury escape. Features glass walls that open directly to an expansive wooden deck, featuring a heated infinity pool and cozy dining loungers.',
  'Beachfront', 380, 3, 2.5, 6,
  '{"city":"Malibu","country":"United States","address":"24800 Pacific Coast Hwy"}',
  '["wifi","kitchen","parking","pool","ac","tv","hottub"]',
  '[{"month":6,"priceMultiplier":1.3},{"month":7,"priceMultiplier":1.4},{"month":8,"priceMultiplier":1.4},{"month":12,"priceMultiplier":1.2}]',
  '[{"minDays":3,"percentage":5},{"minDays":7,"percentage":12}]',
  'available'
),
(
  'p2',
  'The Alpine Glass A-Frame Cabin',
  'Immerse yourself in nature in this stunning A-Frame cabin. Constructed with double-height glass walls, the cabin offers deep panoramic views of a tranquil snowy pine forest. Featuring high-end cozy interior design, an indoor stone fireplace, and a private redwood deck.',
  'Cabins', 240, 2, 1.5, 4,
  '{"city":"Aspen","country":"United States","address":"780 Maroon Creek Rd"}',
  '["wifi","kitchen","parking","ac","tv","hottub","workspace"]',
  '[{"month":12,"priceMultiplier":1.5},{"month":1,"priceMultiplier":1.4},{"month":2,"priceMultiplier":1.3}]',
  '[{"minDays":5,"percentage":10}]',
  'available'
),
(
  'p3',
  'The Heights - Skyline Luxury Penthouse',
  'Experience Manhattan from the sky. This ultra-sleek, minimalist penthouse features spectacular double-height glass windows overlooking the dramatic city skyline. Fully automated lighting, smart curtains, custom white marble flooring, and a private terrace.',
  'Trending', 650, 2, 2, 4,
  '{"city":"New York","country":"United States","address":"150 Central Park South"}',
  '["wifi","kitchen","ac","tv","workspace","gym"]',
  '[{"month":9,"priceMultiplier":1.15},{"month":10,"priceMultiplier":1.15},{"month":12,"priceMultiplier":1.3}]',
  '[{"minDays":4,"percentage":8}]',
  'available'
),
(
  'p4',
  'Kyoto Zen Forest Sanctuary',
  'Restore balance in this masterfully crafted authentic wooden retreat, blended harmoniously with traditional tatami mats and sleek glass architecture. Includes a private curated Japanese stone garden and an indoor-outdoor hot mineral spring.',
  'Countryside', 310, 3, 2, 5,
  '{"city":"Kyoto","country":"Japan","address":"12 Sagano Shingo-cho"}',
  '["wifi","kitchen","parking","ac","hottub","workspace"]',
  '[{"month":3,"priceMultiplier":1.35},{"month":4,"priceMultiplier":1.4},{"month":10,"priceMultiplier":1.25}]',
  '[{"minDays":7,"percentage":15}]',
  'available'
),
(
  'p5',
  'Modernist Beachfront Glass Pavilion',
  'Hovering gracefully over the golden sand, this architectural marvel is constructed with structural steel and floor-to-ceiling glass. Features a massive wrap-around cantilevered deck, a private beach ramp, and custom designer Italian furniture.',
  'Beachfront', 490, 4, 4, 8,
  '{"city":"Malibu","country":"United States","address":"30700 Broad Beach Rd"}',
  '["wifi","kitchen","parking","pool","ac","tv","washer","gym"]',
  '[{"month":6,"priceMultiplier":1.3},{"month":7,"priceMultiplier":1.3},{"month":8,"priceMultiplier":1.3}]',
  '[{"minDays":3,"percentage":5},{"minDays":7,"percentage":10}]',
  'available'
);

-- -------------------------------------------------------
-- SEED: property_images
-- -------------------------------------------------------
INSERT INTO public.property_images (id, property_id, url, is_cover) VALUES
  ('pi1',  'p1', '/beach_villa.png',    TRUE),
  ('pi2',  'p2', '/mountain_cabin.png', TRUE),
  ('pi3',  'p3', '/urban_penthouse.png',TRUE),
  ('pi4',  'p4', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80', TRUE),
  ('pi5',  'p5', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', TRUE),
  ('pi6',  'p1', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80', FALSE),
  ('pi7',  'p1', 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80', FALSE),
  ('pi8',  'p2', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', FALSE),
  ('pi9',  'p3', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80', FALSE),
  ('pi10', 'p4', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80', FALSE);

-- -------------------------------------------------------
-- SEED: property_units
-- -------------------------------------------------------
INSERT INTO public.property_units (id, property_id, unit_name, unit_type, description, max_guests, price_per_night, status, photo_url) VALUES
  ('pu_p1_entire', 'p1', 'Entire Villa Azure', 'Entire Property', 'Luxurious cliffside entire villa, sunset views, infinity pool access', 6, 380, 'available', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80'),
  ('pu_p1_queen',  'p1', 'Ocean Queen Room', 'Room', 'Elegant ocean-facing room with Queen size bed', 2, 150, 'available', 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80'),
  ('pu_p1_king',   'p1', 'Sunset King Room', 'Room', 'Premium suite with King size bed and private balcony access', 2, 180, 'available', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80'),
  
  ('pu_p2_entire', 'p2', 'Entire Glass Cabin', 'Entire Property', 'Cozy modern A-frame glass cabin nestled in the forest', 4, 240, 'available', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'),
  ('pu_p2_room',   'p2', 'Pine View Loft Bed', 'Room', 'Charming loft space room with scenic pine view', 2, 120, 'available', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'),
  
  ('pu_p3_entire', 'p3', 'Entire Skyline Penthouse', 'Entire Property', 'Full luxury penthouse overlooking Manhattan', 4, 650, 'available', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'),
  ('pu_p3_room',   'p3', 'Metropolis Master Room', 'Room', 'Master suite featuring automated blinds and central park view', 2, 300, 'available', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'),
  
  ('pu_p4_entire', 'p4', 'Entire Zen Forest Sanctuary', 'Entire Property', 'Traditional Japanese wooden sanctuary in the forest', 5, 310, 'available', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'),
  ('pu_p4_room',   'p4', 'Classic Tatami Room', 'Room', 'Serene authentic tatami room with shoji screen sliding doors', 2, 160, 'available', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'),
  
  ('pu_p5_entire', 'p5', 'Entire Beachfront Pavilion', 'Entire Property', 'Architectural beachfront steel and glass pavilion', 8, 490, 'available', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'),
  ('pu_p5_room',   'p5', 'Golden Sand Room', 'Room', 'Minimalist room with immediate beachfront ramp exit', 2, 200, 'available', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80');

-- -------------------------------------------------------
-- SEED: bookings
-- -------------------------------------------------------
INSERT INTO public.bookings (id, property_id, unit_id, user_id, check_in, check_out, total_price, total_amount, payment_status, booking_status, status, guests_count) VALUES
  ('b1', 'p1', 'pu_p1_entire', 'u1', '2026-05-10', '2026-05-15', 1900, 1900, 'verified', 'completed', 'completed', 2),
  ('b2', 'p2', 'pu_p2_entire', 'u2', '2026-06-01', '2026-06-05', 960,  960,  'verified', 'completed', 'completed', 3),
  ('b3', 'p1', 'pu_p1_entire', 'u2', '2026-06-25', '2026-06-30', 2223, 2223, 'verified', 'approved',  'approved',  4),
  ('b4', 'p3', 'pu_p3_entire', 'u1', '2026-07-02', '2026-07-08', 3900, 3900, 'pending',  'pending',   'pending',   2),
  ('b5', 'p2', 'pu_p2_entire', 'u3', '2026-07-12', '2026-07-15', 720,  720,  'verified', 'approved',  'approved',  2);

-- -------------------------------------------------------
-- SEED: payments
-- -------------------------------------------------------
INSERT INTO public.payments (id, booking_id, amount, method, status, transaction_ref) VALUES
  ('pay1', 'b1', 1900, 'Credit Card',   'verified', 'TXN-9847192'),
  ('pay2', 'b2', 960,  'PayPal',        'verified', 'TXN-4837261'),
  ('pay3', 'b3', 2223, 'Credit Card',   'verified', 'TXN-7362810'),
  ('pay4', 'b4', 3900, 'Bank Transfer', 'pending',  'TXN-8274912'),
  ('pay5', 'b5', 720,  'Credit Card',   'verified', 'TXN-1029384');

-- -------------------------------------------------------
-- SEED: reviews
-- -------------------------------------------------------
INSERT INTO public.reviews (id, property_id, user_id, rating, comment, response) VALUES
  ('r1', 'p1', 'u1', 5,   'Absolutely breathtaking! The sunset views were unreal and the infinity pool was incredibly soothing.', 'Thank you Jane! We are delighted to hear you loved the sunsets and infinity pool. Welcome back anytime!'),
  ('r2', 'p2', 'u2', 4.8, 'Waking up to snowy pines through those huge glass windows was like living in a fairytale.', 'Glad you enjoyed the cabin, John! The wood-fired hot tub is truly organic and calming. See you again!'),
  ('r3', 'p1', 'u2', 5,   'A masterclass in modern seaside architecture. The sounds of waves crashed below our bedroom all night.', '');

-- -------------------------------------------------------
-- SEED: notifications
-- -------------------------------------------------------
INSERT INTO public.notifications (id, user_id, message, type, read) VALUES
  ('n1', 'a1', 'New booking request received for Skyline Penthouse from Jane Doe', 'info', FALSE),
  ('n2', 'u1', 'Your payment for Villa Azure has been verified successfully.', 'success', FALSE),
  ('n3', 'a1', 'Guest User submitted a new booking request for Alpine Glass Cabin', 'info', TRUE);

-- -------------------------------------------------------
-- SEED: activity_logs
-- -------------------------------------------------------
INSERT INTO public.activity_logs (id, admin_id, action, details) VALUES
  ('l1', 'a1', 'Initialize Database', 'Preloaded database tables with sample properties, listings, and seed accounts.'),
  ('l2', 'a1', 'Update Price Rule',   'Added 40% peak multiplier for July-August on Villa Azure.');

-- -------------------------------------------------------
-- SEED: settings
-- -------------------------------------------------------
INSERT INTO public.settings (key, value) VALUES
  ('logoText',         '"HavenShare"'),
  ('logoIcon',         '"Home"'),
  ('bannerTitle',      '"Discover extraordinary stays."'),
  ('bannerSubtitle',   '"Book unique places to live, work, or relax across the globe."'),
  ('bannerImage',      '"https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1600&q=80"'),
  ('contactEmail',     '"support@havenshare.com"'),
  ('contactPhone',     '"+1 (800) 555-0123"'),
  ('address',          '"100 Ocean Drive, Suite 400, Miami, FL 33139"'),
  ('socialFacebook',   '"https://facebook.com/havenshare"'),
  ('socialInstagram',  '"https://instagram.com/havenshare"'),
  ('socialTwitter',    '"https://twitter.com/havenshare"'),
  ('categories',       '["Beachfront","Cabins","Trending","Countryside","Treehouses","Mansions"]'),
  ('faqs', '[
    {"id":"faq1","question":"How do check-ins and check-outs work?","answer":"Check-in is typically after 3:00 PM, and check-out is before 11:00 AM. Administrators will send detailed door codes upon booking verification."},
    {"id":"faq2","question":"What is the cancellation policy?","answer":"Bookings cancelled up to 5 days before check-in receive a full refund. Cancellations within 5 days are subject to a 50% penalty."},
    {"id":"faq3","question":"Are pets allowed?","answer":"Pets are permitted in select properties only (indicated on the listing details page under amenities)."}
  ]');

-- -------------------------------------------------------
-- Enable Row Level Security (open for demo — tighten in production)
-- -------------------------------------------------------
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities       ENABLE ROW LEVEL SECURITY;

-- Allow full read/write access via anon key (for this demo SPA)
CREATE POLICY "Allow all for anon" ON public.users           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.admins          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.properties      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.property_images FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.bookings        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.payments        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.reviews         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.notifications   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.activity_logs   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.settings        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.amenities       FOR ALL TO anon USING (true) WITH CHECK (true);

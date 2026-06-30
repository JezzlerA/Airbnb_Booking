CREATE TABLE IF NOT EXISTS property_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_name TEXT NOT NULL,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('Entire Property', 'Room')),
  description TEXT,
  max_guests INTEGER NOT NULL CHECK (max_guests > 0),
  price_per_night NUMERIC(10, 2) NOT NULL CHECK (price_per_night >= 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'blocked')),
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES property_units(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_status TEXT DEFAULT 'pending';

-- Drop the old per-property bookings overlapping constraint because it prevents booking individual rooms on the same property
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;

-- Enable RLS and add policy for property_units
ALTER TABLE property_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON public.property_units FOR ALL TO anon USING (true) WITH CHECK (true);

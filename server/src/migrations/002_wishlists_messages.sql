CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wishlist_items_unique UNIQUE (wishlist_id, property_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  subject TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conversation_participants_unique UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 5000),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_property ON wishlist_items(property_id);
CREATE INDEX IF NOT EXISTS idx_conversations_property ON conversations(property_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, read) WHERE read = FALSE;

DROP TRIGGER IF EXISTS set_wishlists_updated_at ON wishlists;
CREATE TRIGGER set_wishlists_updated_at
BEFORE UPDATE ON wishlists
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_conversations_updated_at ON conversations;
CREATE TRIGGER set_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS property_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  question TEXT NOT NULL CHECK (length(question) BETWEEN 5 AND 300),
  answer TEXT NOT NULL CHECK (length(answer) BETWEEN 10 AND 2000),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('flexible', 'moderate', 'strict', 'super_strict')),
  description TEXT NOT NULL,
  refundable_days INTEGER NOT NULL CHECK (refundable_days >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cancellation_policies_one_per_property UNIQUE (property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_faqs_property ON property_faqs(property_id, sort_order);

DROP TRIGGER IF EXISTS set_property_faqs_updated_at ON property_faqs;
CREATE TRIGGER set_property_faqs_updated_at
BEFORE UPDATE ON property_faqs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_cancellation_policies_updated_at ON cancellation_policies;
CREATE TRIGGER set_cancellation_policies_updated_at
BEFORE UPDATE ON cancellation_policies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS property_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'blocked', 'maintenance')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT property_availability_unique UNIQUE (property_id, date)
);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value >= 0),
  min_booking_amount NUMERIC(12, 2) CHECK (min_booking_amount >= 0),
  max_uses INTEGER CHECK (max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
  discount_amount NUMERIC(12, 2) NOT NULL CHECK (discount_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT booking_coupons_unique UNIQUE (booking_id, coupon_id)
);

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  payout_method TEXT NOT NULL,
  payout_reference TEXT,
  scheduled_at DATE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account', 'paypal')),
  provider TEXT NOT NULL,
  provider_payment_method_id TEXT NOT NULL,
  card_last4 TEXT,
  card_brand TEXT,
  card_exp_month INTEGER CHECK (card_exp_month >= 1 AND card_exp_month <= 12),
  card_exp_year INTEGER CHECK (card_exp_year >= 2024),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_availability_property_date ON property_availability(property_id, date);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_coupons_expires ON coupons(expires_at) WHERE active = TRUE AND expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payouts_host ON payouts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id, is_default DESC);

DROP TRIGGER IF EXISTS set_property_availability_updated_at ON property_availability;
CREATE TRIGGER set_property_availability_updated_at
BEFORE UPDATE ON property_availability
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_coupons_updated_at ON coupons;
CREATE TRIGGER set_coupons_updated_at
BEFORE UPDATE ON coupons
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS house_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('smoking', 'parties', 'pets', 'parking', 'check_in', 'check_out', 'other')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT house_rules_unique UNIQUE (property_id, rule_type)
);

CREATE TABLE IF NOT EXISTS taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate NUMERIC(5, 4) NOT NULL CHECK (rate >= 0 AND rate <= 1),
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  country_code CHAR(2),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tax_id UUID NOT NULL REFERENCES taxes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT property_taxes_unique UNIQUE (property_id, tax_id)
);

CREATE INDEX IF NOT EXISTS idx_house_rules_property ON house_rules(property_id);
CREATE INDEX IF NOT EXISTS idx_taxes_country ON taxes(country_code) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_property_taxes_property ON property_taxes(property_id);

DROP TRIGGER IF EXISTS set_taxes_updated_at ON taxes;
CREATE TRIGGER set_taxes_updated_at
BEFORE UPDATE ON taxes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  query_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  alert_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_type TEXT NOT NULL CHECK (addon_type IN ('cleaning', 'airport_pickup', 'late_checkout', 'early_checkin', 'theft_protection', 'other')),
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_amenities_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  category TEXT NOT NULL CHECK (category IN ('essentials', 'features', 'location', 'safety')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_addons_booking ON booking_addons(booking_id);
CREATE INDEX IF NOT EXISTS idx_property_amenities_catalog_category ON property_amenities_catalog(category);

CREATE TABLE IF NOT EXISTS property_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('blocked', 'maintenance', 'pricing_override', 'minimum_stay', 'custom_note')),
  amount NUMERIC(12, 2) CHECK (amount >= 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT property_calendar_events_unique UNIQUE (property_id, date, event_type)
);

CREATE INDEX IF NOT EXISTS idx_property_calendar_events_property_date ON property_calendar_events(property_id, date);
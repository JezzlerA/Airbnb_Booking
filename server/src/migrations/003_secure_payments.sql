-- Detect if we have a consistent schema or mixed types
DO $$
DECLARE
  users_id_is_uuid BOOLEAN;
  bookings_user_id_is_uuid BOOLEAN;
BEGIN
  users_id_is_uuid := EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id' AND udt_name = 'uuid'
  );
  
  bookings_user_id_is_uuid := EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'user_id' AND udt_name = 'uuid'
  );
  
  -- Determine the target type for all ID columns
  IF users_id_is_uuid AND bookings_user_id_is_uuid THEN
    -- Both are UUID - use UUID
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
    ALTER TABLE payments DROP COLUMN IF EXISTS user_id;
    ALTER TABLE payments ADD COLUMN user_id UUID;
    
    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_id_fkey;
    ALTER TABLE bookings DROP COLUMN IF EXISTS payment_id;
    ALTER TABLE bookings ADD COLUMN payment_id UUID;
  ELSE
    -- Either users.id is TEXT, or we have mixed schema
    -- Use TEXT for compatibility
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
    ALTER TABLE payments DROP COLUMN IF EXISTS user_id;
    ALTER TABLE payments ADD COLUMN user_id TEXT;
    
    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_id_fkey;
    ALTER TABLE bookings DROP COLUMN IF EXISTS payment_id;
    ALTER TABLE bookings ADD COLUMN payment_id TEXT;
  END IF;
END $$;

-- Populate user_id from bookings
UPDATE payments p
SET user_id = b.user_id
FROM bookings b
WHERE p.booking_id = b.id AND p.user_id IS NULL;

-- Add payment_status and booking_status columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_status TEXT NOT NULL DEFAULT 'pending_payment';

-- Update status values in bookings
UPDATE bookings
SET payment_status = CASE
  WHEN payment_status IN ('verified', 'paid') THEN 'paid'
  WHEN payment_status IN ('refunded') THEN 'refunded'
  WHEN payment_status IN ('failed') THEN 'failed'
  ELSE 'pending'
END;

UPDATE bookings
SET booking_status = CASE
  WHEN booking_status IN ('approved', 'confirmed') OR status IN ('approved', 'confirmed') THEN 'confirmed'
  WHEN booking_status IN ('completed') OR status = 'completed' THEN 'completed'
  WHEN booking_status IN ('checked_in') OR status = 'checked_in' THEN 'checked_in'
  WHEN booking_status IN ('checked_out') OR status = 'checked_out' THEN 'checked_out'
  WHEN booking_status IN ('cancelled') OR status = 'cancelled' THEN 'cancelled'
  WHEN booking_status IN ('rejected') OR status = 'rejected' THEN 'rejected'
  ELSE 'pending_payment'
END;

UPDATE bookings
SET status = CASE
  WHEN status = 'approved' THEN 'confirmed'
  WHEN status = 'pending' THEN 'pending_payment'
  ELSE status
END;

-- Apply check constraints for bookings
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'checked_in', 'checked_out', 'completed', 'rejected'));

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_check
CHECK (booking_status IN ('pending_payment', 'confirmed', 'cancelled', 'checked_in', 'checked_out', 'completed', 'rejected'));

-- Set defaults for bookings
ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'pending_payment';
ALTER TABLE bookings ALTER COLUMN booking_status SET DEFAULT 'pending_payment';
ALTER TABLE bookings ALTER COLUMN payment_status SET DEFAULT 'pending';

-- Add NOT NULL columns to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'PHP';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_response JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add FK constraints (only if types are consistent)
DO $$
DECLARE
  user_id_type TEXT;
  users_id_type TEXT;
BEGIN
  SELECT udt_name INTO user_id_type
  FROM information_schema.columns
  WHERE table_name = 'payments' AND column_name = 'user_id';
  
  SELECT udt_name INTO users_id_type
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'id';
  
  -- Only add FK if types match
  IF user_id_type = users_id_type THEN
    ALTER TABLE payments ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE bookings ADD CONSTRAINT bookings_payment_id_fkey
FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- Map old payment columns (only if they exist in the schema)
DO $$
BEGIN
  -- Map transaction_ref to transaction_id if transaction_ref exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'transaction_ref'
  ) THEN
    UPDATE payments SET transaction_id = transaction_ref WHERE transaction_id IS NULL AND transaction_ref IS NOT NULL;
  END IF;
  
  -- Map method to payment_method if method column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'method'
  ) THEN
    UPDATE payments SET payment_method = method WHERE payment_method IS NULL AND method IS NOT NULL;
  END IF;
  
  -- Map provider_response to gateway_response if provider_response column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'provider_response'
  ) THEN
    UPDATE payments SET gateway_response = provider_response WHERE gateway_response IS NULL AND provider_response IS NOT NULL;
  END IF;
END $$;

UPDATE payments
SET payment_method = CASE lower(payment_method)
  WHEN 'credit card' THEN 'credit_card'
  WHEN 'credit/debit card' THEN 'credit_card'
  WHEN 'debit card' THEN 'debit_card'
  WHEN 'bank transfer' THEN 'bank_transfer'
  WHEN 'direct bank transfer' THEN 'bank_transfer'
  WHEN 'paymaya' THEN 'maya'
  WHEN 'maya' THEN 'maya'
  WHEN 'gcash' THEN 'gcash'
  WHEN 'paypal' THEN 'paypal'
  WHEN 'paypal account' THEN 'paypal'
  ELSE payment_method
END;

-- Map status to payment_status if status column exists (server schema has both status and payment_status)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'status'
  ) THEN
    UPDATE payments
    SET payment_status = CASE
      WHEN status = 'verified' THEN 'paid'
      WHEN status = 'processing' THEN 'pending'
      WHEN status IN ('pending', 'failed', 'refunded') THEN status
      ELSE 'pending'
    END
    WHERE payment_status IS NULL;
  END IF;
END $$;

-- Fill NULL values before setting NOT NULL constraints
UPDATE payments SET gateway_response = '{}' WHERE gateway_response IS NULL;
UPDATE payments SET transaction_id = '' WHERE transaction_id IS NULL;
UPDATE payments SET payment_method = 'bank_transfer' WHERE payment_method IS NULL;
UPDATE payments SET payment_status = 'pending' WHERE payment_status IS NULL;

-- Apply NOT NULL and defaults to payments
ALTER TABLE payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN transaction_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN payment_method SET NOT NULL;
ALTER TABLE payments ALTER COLUMN gateway_response SET DEFAULT '{}'::jsonb;
ALTER TABLE payments ALTER COLUMN gateway_response SET NOT NULL;
ALTER TABLE payments ALTER COLUMN payment_status SET DEFAULT 'pending';
ALTER TABLE payments ALTER COLUMN payment_status SET NOT NULL;

-- Apply check constraints for payments
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_status_check
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check
CHECK (payment_method IN ('gcash', 'maya', 'credit_card', 'debit_card', 'paypal', 'bank_transfer', 'apple_pay', 'google_pay'));

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_currency_check;
ALTER TABLE payments ADD CONSTRAINT payments_currency_check CHECK (currency ~ '^[A-Z]{3}$');

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status, booking_status);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS set_payments_updated_at ON payments;
CREATE TRIGGER set_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Create payment_receipts and email_outbox tables
-- Use TEXT by default for Supabase compatibility, UUID if server schema detected
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id' AND udt_name = 'text'
  ) THEN
    CREATE TABLE IF NOT EXISTS payment_receipts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      payment_id TEXT NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
      booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      receipt_number TEXT NOT NULL UNIQUE,
      invoice_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS email_outbox (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'failed')),
      sent_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  ELSE
    -- Server schema (UUID) - only create if table doesn't exist yet
    CREATE TABLE IF NOT EXISTS payment_receipts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      payment_id UUID NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      receipt_number TEXT NOT NULL UNIQUE,
      invoice_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS email_outbox (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'failed')),
      sent_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_receipts_booking ON payment_receipts(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_outbox_user_created ON email_outbox(user_id, created_at DESC);
import crypto from 'node:crypto';
import type { PoolClient } from 'pg';
import { z } from 'zod';
import { env } from '../../config/env';
import { pool } from '../../config/db';
import { createHttpError, type UserRole } from '../../utils/http-error';

const PAYMENT_METHODS = [
  'gcash',
  'maya',
  'credit_card',
  'debit_card',
  'paypal',
  'bank_transfer',
  'apple_pay',
  'google_pay'
] as const;

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'] as const;
const ACTIVE_BOOKING_STATUSES = ['pending_payment', 'confirmed', 'checked_in', 'checked_out', 'completed'];
const CLEANING_FEE_MINIMUM = 150;
const SERVICE_FEE_RATE = 0.05;

type PaymentMethod = (typeof PAYMENT_METHODS)[number];
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
type GatewayCheckout = {
  gateway: 'paymongo' | 'xendit' | 'mock';
  transactionId: string;
  checkoutUrl: string;
  response: Record<string, unknown>;
};

export const createCheckoutSessionSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestsCount: z.coerce.number().int().positive(),
  paymentMethod: z.enum(PAYMENT_METHODS).default('gcash')
});

export const refundPaymentSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  reason: z.string().trim().max(500).optional()
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

type PricingBreakdown = {
  nightlyRate: number;
  nights: number;
  nightlySubtotal: number;
  discountAmount: number;
  cleaningFee: number;
  serviceFee: number;
  totalAmount: number;
  currency: string;
};

type PaymentRow = {
  id: string;
  booking_id: string;
  user_id: string;
  transaction_id: string;
  payment_method: string;
  amount: string;
  currency: string;
  payment_status: string;
  gateway_response: Record<string, unknown>;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  booking_number: string | null;
  property_title: string | null;
  unit_name: string | null;
  check_in: string | null;
  check_out: string | null;
  guest_email: string | null;
};

type BookingPaymentRow = PaymentRow & {
  property_id: string;
  unit_id: string | null;
  booking_status: string;
  status: string;
  guests_count: number;
  property_owner_id: string | null;
  unit_type: string | null;
};

type PropertyPricingRow = {
  id: string;
  title: string;
  price_per_night: string;
  guests: number;
  seasonal_pricing: unknown;
  discounts: unknown;
};

type UnitPricingRow = {
  id: string;
  unit_name: string;
  unit_type: string;
  max_guests: number;
  price_per_night: string;
};

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  transactionId: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  bookingNumber?: string;
  propertyTitle?: string;
  unitName?: string;
  checkIn?: string;
  checkOut?: string;
  guestEmail?: string;
}

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    bookingId: row.booking_id,
    userId: row.user_id,
    transactionId: row.transaction_id,
    paymentMethod: row.payment_method,
    amount: Number(row.amount),
    currency: row.currency,
    paymentStatus: row.payment_status,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    bookingNumber: row.booking_number ?? undefined,
    propertyTitle: row.property_title ?? undefined,
    unitName: row.unit_name ?? undefined,
    checkIn: row.check_in ?? undefined,
    checkOut: row.check_out ?? undefined,
    guestEmail: row.guest_email ?? undefined
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown, key: string) {
  if (!isRecord(value)) return null;
  const next = value[key];
  return isRecord(next) ? next : null;
}

function getString(value: unknown, key: string) {
  if (!isRecord(value)) return null;
  const next = value[key];
  return typeof next === 'string' ? next : null;
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toMoney(value: number) {
  return Number(value.toFixed(2));
}

function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T00:00:00.000Z`);
  const end = new Date(`${checkOut}T00:00:00.000Z`);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (!Number.isFinite(diff) || diff <= 0) {
    throw createHttpError(400, 'validation_error', 'checkOut must be after checkIn.');
  }

  return diff;
}

async function getPricing(input: CreateCheckoutSessionInput): Promise<{
  property: PropertyPricingRow;
  unit: UnitPricingRow | null;
  pricing: PricingBreakdown;
}> {
  const propertyResult = await pool.query<PropertyPricingRow>(
    `select id, title, price_per_night, guests, seasonal_pricing, discounts
     from properties
     where id = $1 and status = 'available'`,
    [input.propertyId]
  );
  const property = propertyResult.rows[0];

  if (!property) {
    throw createHttpError(404, 'not_found', 'Property is not available for booking.');
  }

  let unit: UnitPricingRow | null = null;
  if (input.unitId) {
    const unitResult = await pool.query<UnitPricingRow>(
      `select id, unit_name, unit_type, max_guests, price_per_night
       from property_units
       where id = $1 and property_id = $2 and status = 'available'`,
      [input.unitId, input.propertyId]
    );
    unit = unitResult.rows[0] ?? null;

    if (!unit) {
      throw createHttpError(404, 'not_found', 'Unit is not available for booking.');
    }
  }

  const maxGuests = unit?.max_guests ?? property.guests;
  if (input.guestsCount > maxGuests) {
    throw createHttpError(400, 'validation_error', `This booking option supports up to ${maxGuests} guests.`);
  }

  const nights = nightsBetween(input.checkIn, input.checkOut);
  const nightlyRate = Number(unit?.price_per_night ?? property.price_per_night);
  const seasonalPricing = toArray<{ month: number; priceMultiplier?: number; multiplier?: number }>(property.seasonal_pricing);
  const discounts = toArray<{ minDays: number; percentage: number }>(property.discounts);
  const checkInDate = new Date(`${input.checkIn}T00:00:00.000Z`);
  let nightlySubtotal = 0;

  for (let day = 0; day < nights; day += 1) {
    const date = new Date(checkInDate);
    date.setUTCDate(checkInDate.getUTCDate() + day);
    const month = date.getUTCMonth() + 1;
    const seasonal = seasonalPricing.find((rule) => Number(rule.month) === month);
    const multiplier = Number(seasonal?.priceMultiplier ?? seasonal?.multiplier ?? 1);
    nightlySubtotal += nightlyRate * multiplier;
  }

  const applicableDiscount = discounts
    .filter((rule) => nights >= Number(rule.minDays))
    .sort((a, b) => Number(b.percentage) - Number(a.percentage))[0];
  const discountRate = Number(applicableDiscount?.percentage ?? 0) / 100;
  const discountAmount = toMoney(nightlySubtotal * discountRate);
  const discountedSubtotal = nightlySubtotal - discountAmount;
  const cleaningFee = toMoney(Math.max(CLEANING_FEE_MINIMUM, nightlyRate * 0.15));
  const serviceFee = toMoney(discountedSubtotal * SERVICE_FEE_RATE);
  const totalAmount = toMoney(discountedSubtotal + cleaningFee + serviceFee);

  return {
    property,
    unit,
    pricing: {
      nightlyRate: toMoney(nightlyRate),
      nights,
      nightlySubtotal: toMoney(nightlySubtotal),
      discountAmount,
      cleaningFee,
      serviceFee,
      totalAmount,
      currency: env.PAYMENT_CURRENCY.toUpperCase()
    }
  };
}

async function assertNoOverlap(
  client: PoolClient,
  input: { propertyId: string; unitId?: string; checkIn: string; checkOut: string },
  targetUnit: UnitPricingRow | null,
  excludeBookingId?: string
) {
  const values: Array<string | string[]> = [input.propertyId, input.checkOut, input.checkIn, ACTIVE_BOOKING_STATUSES];
  const excludeClause = excludeBookingId ? `and b.id <> $${values.push(excludeBookingId)}` : '';
  const { rows } = await client.query<{ id: string; unit_id: string | null; unit_type: string | null }>(
    `select b.id, b.unit_id, pu.unit_type
     from bookings b
     left join property_units pu on pu.id = b.unit_id
     where b.property_id = $1
       and b.check_in < $2::date
       and b.check_out > $3::date
       and b.status = any($4::text[])
       ${excludeClause}
     for update of b`,
    values
  );

  if (rows.length === 0) return;

  const conflict = !targetUnit ||
    targetUnit.unit_type === 'Entire Property' ||
    rows.some((row) => row.unit_id === null || row.unit_type === 'Entire Property' || row.unit_id === input.unitId);

  if (conflict) {
    throw createHttpError(409, 'conflict', 'This booking option is already reserved for the selected dates.');
  }
}

const paymongoMethodMap: Partial<Record<PaymentMethod, string[]>> = {
  gcash: ['gcash'],
  maya: ['paymaya'],
  credit_card: ['card'],
  debit_card: ['card'],
  paypal: [],
  bank_transfer: ['dob'],
  apple_pay: [],
  google_pay: []
};

async function createGatewayCheckoutSession(args: {
  paymentId: string;
  bookingId: string;
  userId: string;
  userEmail: string;
  propertyTitle: string;
  unitName?: string;
  paymentMethod: PaymentMethod;
  pricing: PricingBreakdown;
}): Promise<GatewayCheckout> {
  const mockCheckout = () => {
    const transactionId = `mock_${crypto.randomUUID()}`;
    return {
      gateway: 'mock' as const,
      transactionId,
      checkoutUrl: `${env.APP_PUBLIC_URL}/payment/mock?payment_id=${args.paymentId}&booking_id=${args.bookingId}`,
      response: {
        id: transactionId,
        mode: 'mock',
        message: 'Configure PAYMONGO_SECRET_KEY to create a live hosted checkout session.'
      }
    };
  };

  const paymentMethodTypes = paymongoMethodMap[args.paymentMethod];
  if (env.PAYMENT_GATEWAY === 'xendit') {
    return createXenditCheckoutSession(args);
  }
  if (env.PAYMENT_GATEWAY === 'mock' || !env.PAYMONGO_SECRET_KEY || !paymentMethodTypes) {
    return mockCheckout();
  }

  const amountInCentavos = Math.round(args.pricing.totalAmount * 100);
  const auth = Buffer.from(`${env.PAYMONGO_SECRET_KEY}:`).toString('base64');
  const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: `Basic ${auth}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          success_url: `${env.APP_PUBLIC_URL}/payments/success?booking_id=${args.bookingId}`,
          cancel_url: `${env.APP_PUBLIC_URL}/payments/cancelled?booking_id=${args.bookingId}`,
          payment_method_types: paymentMethodTypes,
          description: `Booking ${args.bookingId} for ${args.propertyTitle}`,
          line_items: [
            {
              currency: args.pricing.currency,
              amount: amountInCentavos,
              name: args.unitName ? `${args.propertyTitle} - ${args.unitName}` : args.propertyTitle,
              quantity: 1,
              description: `${args.pricing.nights} night stay with cleaning and service fees`
            }
          ],
          metadata: {
            booking_id: args.bookingId,
            payment_id: args.paymentId,
            user_id: args.userId,
            guest_email: args.userEmail,
            payment_method: args.paymentMethod
          }
        }
      }
    })
  });

  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    throw createHttpError(502, 'internal_error', 'Payment gateway checkout session failed.', body);
  }

  const data = getRecord(body, 'data');
  const attributes = getRecord(data, 'attributes');
  const checkoutUrl = getString(attributes, 'checkout_url');
  const transactionId = getString(data, 'id');

  if (!checkoutUrl || !transactionId) {
    throw createHttpError(502, 'internal_error', 'Payment gateway did not return a checkout URL.', body);
  }

  return {
    gateway: 'paymongo',
    transactionId,
    checkoutUrl,
    response: body
  };
}

const xenditMethodMap: Partial<Record<PaymentMethod, string>> = {
  gcash: 'GCASH',
  maya: 'OVO',
  credit_card: 'CARD',
  debit_card: 'CARD',
  paypal: 'PAYPAL',
  bank_transfer: 'BANK_TRANSFER',
  apple_pay: 'APPLE_PAY',
  google_pay: 'GOOGLE_PAY'
};

async function createXenditCheckoutSession(args: {
  paymentId: string;
  bookingId: string;
  userId: string;
  userEmail: string;
  propertyTitle: string;
  unitName?: string;
  paymentMethod: PaymentMethod;
  pricing: PricingBreakdown;
}): Promise<GatewayCheckout> {
  const mockCheckout = () => {
    const transactionId = `mock_${crypto.randomUUID()}`;
    return {
      gateway: 'mock' as const,
      transactionId,
      checkoutUrl: `${env.APP_PUBLIC_URL}/payment/mock?payment_id=${args.paymentId}&booking_id=${args.bookingId}`,
      response: {
        id: transactionId,
        mode: 'mock',
        message: 'Configure XENDIT_SECRET_KEY to create a live checkout session.'
      }
    };
  };

  const paymentMethodType = xenditMethodMap[args.paymentMethod];
  if (env.PAYMENT_GATEWAY !== 'xendit' || !env.XENDIT_SECRET_KEY || !paymentMethodType) {
    return mockCheckout();
  }

  const externalId = `booking_${args.bookingId.slice(0, 8)}`;
  const response = await fetch('https://api.xendit.co/v2/invoices', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: `Basic ${Buffer.from(env.XENDIT_SECRET_KEY).toString('base64')}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      external_id: externalId,
      amount: args.pricing.totalAmount,
      currency: args.pricing.currency,
      payer_email: args.userEmail,
      description: `Booking ${args.bookingId} for ${args.propertyTitle}`,
      success_redirect_url: `${env.APP_PUBLIC_URL}/payments/success?booking_id=${args.bookingId}`,
      failure_redirect_url: `${env.APP_PUBLIC_URL}/payments/cancelled?booking_id=${args.bookingId}`,
      payment_methods: [paymentMethodType],
      items: [
        {
          name: args.unitName ? `${args.propertyTitle} - ${args.unitName}` : args.propertyTitle,
          quantity: args.pricing.nights,
          price: args.pricing.nightlyRate,
          category: 'Accommodation'
        }
      ]
    })
  });

  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    throw createHttpError(502, 'internal_error', 'Xendit checkout session failed.', body);
  }

  const checkoutUrl = getString(body, 'invoice_url');
  const transactionId = getString(body, 'id') || externalId;

  if (!checkoutUrl) {
    throw createHttpError(502, 'internal_error', 'Xendit did not return an invoice URL.', body);
  }

  return {
    gateway: 'xendit',
    transactionId,
    checkoutUrl,
    response: body
  };
}

export async function createCheckoutSession(
  user: { id: string; email: string },
  input: CreateCheckoutSessionInput
) {
  const { property, unit, pricing } = await getPricing(input);
  const client = await pool.connect();
  let bookingId = '';
  let paymentId = '';

  try {
    await client.query('begin isolation level serializable');
    await assertNoOverlap(client, input, unit);

    const bookingResult = await client.query<{ id: string }>(
      `insert into bookings (
         property_id, unit_id, user_id, check_in, check_out, total_price, total_amount,
         status, booking_status, payment_status, guests_count
       )
       values ($1, $2, $3, $4, $5, $6, $6, 'pending_payment', 'pending_payment', 'pending', $7)
       returning id`,
      [input.propertyId, unit?.id ?? null, user.id, input.checkIn, input.checkOut, pricing.totalAmount, input.guestsCount]
    );
    bookingId = bookingResult.rows[0]?.id ?? '';

    const paymentResult = await client.query<{ id: string }>(
      `insert into payments (
         booking_id, user_id, transaction_id, payment_method, amount, currency, payment_status, gateway_response
       )
       values ($1, $2, $3, $4, $5, $6, 'pending', $7::jsonb)
       returning id`,
      [
        bookingId,
        user.id,
        `pending_${crypto.randomUUID()}`,
        input.paymentMethod,
        pricing.totalAmount,
        pricing.currency,
        JSON.stringify({ pricing })
      ]
    );
    paymentId = paymentResult.rows[0]?.id ?? '';

    await client.query(`update bookings set payment_id = $1 where id = $2`, [paymentId, bookingId]);
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }

  try {
    const checkout = await createGatewayCheckoutSession({
      paymentId,
      bookingId,
      userId: user.id,
      userEmail: user.email,
      propertyTitle: property.title,
      unitName: unit?.unit_name,
      paymentMethod: input.paymentMethod,
      pricing
    });

    await pool.query(
      `update payments
       set transaction_id = $1,
           gateway_response = gateway_response || $2::jsonb,
           updated_at = now()
       where id = $3`,
      [
        checkout.transactionId,
        JSON.stringify({ gateway: checkout.gateway, checkout: checkout.response }),
        paymentId
      ]
    );

    await pool.query(
      `insert into activity_logs (actor_user_id, action, details)
       values ($1, 'Payment Checkout Created', $2::jsonb)`,
      [user.id, JSON.stringify({ bookingId, paymentId, gateway: checkout.gateway, paymentMethod: input.paymentMethod })]
    );

    return {
      bookingId,
      paymentId,
      paymentStatus: 'pending' as const,
      bookingStatus: 'pending_payment' as const,
      checkoutUrl: checkout.checkoutUrl,
      gateway: checkout.gateway,
      pricing
    };
  } catch (error) {
    await pool.query(
      `update payments set payment_status = 'failed', gateway_response = gateway_response || $1::jsonb where id = $2`,
      [JSON.stringify({ checkoutError: error instanceof Error ? error.message : 'Unknown gateway error' }), paymentId]
    );
    await pool.query(
      `update bookings
       set status = 'cancelled', booking_status = 'cancelled', payment_status = 'failed'
       where id = $1`,
      [bookingId]
    );
    throw error;
  }
}

async function ensureReceipt(client: PoolClient, payment: BookingPaymentRow) {
  const receiptNumber = `RCPT-${new Date().getUTCFullYear()}-${payment.id.slice(0, 8).toUpperCase()}`;
  await client.query(
    `insert into payment_receipts (payment_id, booking_id, receipt_number, invoice_data)
     values ($1, $2, $3, $4::jsonb)
     on conflict (payment_id) do nothing`,
    [
      payment.id,
      payment.booking_id,
      receiptNumber,
      JSON.stringify({
        receiptNumber,
        propertyName: payment.property_title,
        unitName: payment.unit_name,
        checkIn: payment.check_in,
        checkOut: payment.check_out,
        amountPaid: Number(payment.amount),
        currency: payment.currency,
        transactionNumber: payment.transaction_id
      })
    ]
  );
}

async function blockAvailability(client: PoolClient, payment: BookingPaymentRow) {
  await client.query(
    `insert into property_availability (property_id, date, status, note)
     select $1, day::date, 'blocked', $4
     from generate_series($2::date, ($3::date - interval '1 day')::date, interval '1 day') as day
     on conflict (property_id, date) do update
     set status = excluded.status,
         note = excluded.note,
         updated_at = now()`,
    [payment.property_id, payment.check_in, payment.check_out, `Confirmed booking payment ${payment.id}`]
  );
}

async function sendConfirmationRecords(client: PoolClient, payment: BookingPaymentRow) {
  const bookingNumber = payment.booking_number ?? payment.booking_id;
  const body = [
    'Booking Confirmed',
    '',
    `Property: ${payment.property_title ?? 'Property'}`,
    `Check-In: ${payment.check_in ?? ''}`,
    `Check-Out: ${payment.check_out ?? ''}`,
    `Amount Paid: ${payment.currency} ${Number(payment.amount).toLocaleString()}`,
    `Booking Number: ${bookingNumber}`,
    `Transaction Number: ${payment.transaction_id}`
  ].join('\n');

  await client.query(
    `insert into email_outbox (user_id, recipient_email, subject, body, status, sent_at)
     values ($1, $2, $3, $4, 'sent', now())`,
    [payment.user_id, payment.guest_email, `Booking Confirmed - ${bookingNumber}`, body]
  );

  await client.query(
    `insert into notifications (user_id, message, type)
     values ($1, $2, 'success')`,
    [
      payment.user_id,
      `Booking confirmed for ${payment.property_title ?? 'your stay'}. Payment ${payment.transaction_id} is paid.`
    ]
  );

  await client.query(
    `insert into notifications (user_id, message, type)
     select id, $1, 'success'
     from users
     where role in ('admin', 'host')`,
    [
      `New booking received. Payment successfully completed for ${payment.property_title ?? 'property'} (${bookingNumber}).`
    ]
  );
}

async function getPaymentForUpdate(client: PoolClient, paymentId: string) {
  const { rows } = await client.query<BookingPaymentRow>(
    `select
       p.*,
       b.id::text as booking_number,
       b.property_id,
       b.unit_id,
       b.booking_status,
       b.status,
       b.guests_count,
       b.check_in::text,
       b.check_out::text,
       pr.title as property_title,
       pr.owner_id as property_owner_id,
       pu.unit_name,
       pu.unit_type,
       u.email as guest_email
     from payments p
     join bookings b on b.id = p.booking_id
     join properties pr on pr.id = b.property_id
     left join property_units pu on pu.id = b.unit_id
     join users u on u.id = p.user_id
     where p.id = $1
     for update of p, b`,
    [paymentId]
  );

  const payment = rows[0];
  if (!payment) {
    throw createHttpError(404, 'not_found', 'Payment not found.');
  }
  return payment;
}

export async function confirmPaidPayment(paymentId: string, transactionId: string, gatewayResponse: unknown) {
  const client = await pool.connect();

  try {
    await client.query('begin isolation level serializable');
    const payment = await getPaymentForUpdate(client, paymentId);

    if (payment.payment_status === 'paid') {
      await client.query('commit');
      return mapPayment(payment);
    }

    await assertNoOverlap(
      client,
      {
        propertyId: payment.property_id,
        unitId: payment.unit_id ?? undefined,
        checkIn: payment.check_in ?? '',
        checkOut: payment.check_out ?? ''
      },
      payment.unit_id
        ? {
            id: payment.unit_id,
            unit_name: payment.unit_name ?? '',
            unit_type: payment.unit_type ?? 'Room',
            max_guests: payment.guests_count,
            price_per_night: payment.amount
          }
        : null,
      payment.booking_id
    );

    const mergedGatewayResponse = isRecord(gatewayResponse) ? gatewayResponse : { event: gatewayResponse };
    const updateResult = await client.query<PaymentRow>(
      `update payments
       set payment_status = 'paid',
           status = 'verified',
           transaction_id = $1,
           gateway_response = gateway_response || $2::jsonb,
           paid_at = now(),
           updated_at = now()
       where id = $3
       returning *, $4::text as booking_number, $5::text as property_title, $6::text as unit_name,
                 $7::text as check_in, $8::text as check_out, $9::text as guest_email`,
      [
        transactionId,
        JSON.stringify(mergedGatewayResponse),
        payment.id,
        payment.booking_number,
        payment.property_title,
        payment.unit_name,
        payment.check_in,
        payment.check_out,
        payment.guest_email
      ]
    );

    await client.query(
      `update bookings
       set payment_id = $1,
           payment_status = 'paid',
           booking_status = 'confirmed',
           status = 'confirmed',
           updated_at = now()
       where id = $2`,
      [payment.id, payment.booking_id]
    );

    await blockAvailability(client, payment);
    await ensureReceipt(client, { ...payment, transaction_id: transactionId });
    await sendConfirmationRecords(client, { ...payment, transaction_id: transactionId });

    await client.query(
      `insert into activity_logs (actor_user_id, action, details)
       values ($1, 'Payment Completed', $2::jsonb)`,
      [payment.user_id, JSON.stringify({ bookingId: payment.booking_id, paymentId: payment.id, transactionId })]
    );

    await client.query('commit');
    return mapPayment(updateResult.rows[0] ?? { ...payment, transaction_id: transactionId, payment_status: 'paid' });
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function markPaymentFailed(paymentId: string, transactionId: string, gatewayResponse: unknown) {
  await pool.query(
    `update payments
     set payment_status = 'failed',
         transaction_id = $1,
         gateway_response = gateway_response || $2::jsonb,
         updated_at = now()
     where id = $3`,
    [transactionId, JSON.stringify(isRecord(gatewayResponse) ? gatewayResponse : { event: gatewayResponse }), paymentId]
  );
  await pool.query(
    `update bookings b
     set payment_status = 'failed',
         booking_status = 'cancelled',
         status = 'cancelled',
         updated_at = now()
     from payments p
     where p.booking_id = b.id and p.id = $1`,
    [paymentId]
  );
}

function verifyPaymongoSignature(rawBody: Buffer, signatureHeader?: string) {
  if (!env.PAYMONGO_WEBHOOK_SECRET) {
    if (env.NODE_ENV === 'production') {
      throw createHttpError(401, 'unauthorized', 'PAYMONGO_WEBHOOK_SECRET is required in production.');
    }
    return;
  }

  if (!signatureHeader) {
    throw createHttpError(401, 'unauthorized', 'Missing PayMongo webhook signature.');
  }

  const parts = signatureHeader.split(',').reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split('=');
    if (!key || !value) return acc;
    acc[key] = [...(acc[key] ?? []), value];
    return acc;
  }, {});

  const timestamp = parts.t?.[0];
  const signatures = [...(parts.v1 ?? []), ...(parts.te ?? []), ...(parts.li ?? [])];
  const payloads = timestamp ? [`${timestamp}.${rawBody.toString('utf8')}`, rawBody.toString('utf8')] : [rawBody.toString('utf8')];
  const valid = payloads.some((payload) => {
    const expected = crypto.createHmac('sha256', env.PAYMONGO_WEBHOOK_SECRET!).update(payload).digest('hex');
    return signatures.some((signature) => {
      const expectedBuffer = Buffer.from(expected);
      const signatureBuffer = Buffer.from(signature);
      return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    });
  });

  if (!valid) {
    throw createHttpError(401, 'unauthorized', 'Invalid PayMongo webhook signature.');
  }
}

function extractWebhookPayment(event: unknown) {
  const data = getRecord(event, 'data');
  const eventAttributes = getRecord(data, 'attributes') ?? data ?? getRecord(event, 'attributes') ?? {};
  const eventType = getString(eventAttributes, 'type') ?? getString(event, 'type') ?? '';
  const resource = getRecord(eventAttributes, 'data') ?? data ?? event;
  const resourceAttributes = getRecord(resource, 'attributes') ?? {};
  const metadata = getRecord(resourceAttributes, 'metadata') ?? getRecord(eventAttributes, 'metadata') ?? {};
  const paymentId = getString(metadata, 'payment_id') ?? getString(metadata, 'paymentId');
  const bookingId = getString(metadata, 'booking_id') ?? getString(metadata, 'bookingId');
  const status = getString(resourceAttributes, 'status') ?? getString(eventAttributes, 'status') ?? '';
  const transactionId =
    getString(resource, 'id') ??
    getString(data, 'id') ??
    getString(resourceAttributes, 'payment_intent_id') ??
    getString(resourceAttributes, 'checkout_session_id') ??
    `webhook_${crypto.randomUUID()}`;

  return {
    eventType,
    paymentId,
    bookingId,
    status,
    transactionId
  };
}

async function findPendingPaymentId(bookingId: string) {
  const { rows } = await pool.query<{ id: string }>(
    `select id
     from payments
     where booking_id = $1 and payment_status = 'pending'
     order by created_at desc
     limit 1`,
    [bookingId]
  );
  return rows[0]?.id;
}

export async function handlePaymongoWebhook(rawBody: Buffer, signatureHeader?: string) {
  verifyPaymongoSignature(rawBody, signatureHeader);

  let event: unknown;
  try {
    event = JSON.parse(rawBody.toString('utf8')) as unknown;
  } catch {
    throw createHttpError(400, 'validation_error', 'Webhook body is not valid JSON.');
  }

  const extracted = extractWebhookPayment(event);
  const paymentId = extracted.paymentId ?? (extracted.bookingId ? await findPendingPaymentId(extracted.bookingId) : undefined);

  if (!paymentId) {
    await pool.query(
      `insert into activity_logs (action, details)
       values ('Payment Webhook Ignored', $1::jsonb)`,
      [JSON.stringify({ reason: 'payment metadata missing', eventType: extracted.eventType })]
    );
    return { handled: false };
  }

  const normalizedType = extracted.eventType.toLowerCase();
  const normalizedStatus = extracted.status.toLowerCase();
  const isPaid = normalizedType.includes('paid') || ['paid', 'succeeded', 'success'].includes(normalizedStatus);
  const isFailed = normalizedType.includes('fail') || ['failed', 'expired', 'cancelled', 'canceled'].includes(normalizedStatus);

  if (isPaid) {
    await confirmPaidPayment(paymentId, extracted.transactionId, event);
    return { handled: true, status: 'paid' };
  }

  if (isFailed) {
    await markPaymentFailed(paymentId, extracted.transactionId, event);
    return { handled: true, status: 'failed' };
  }

  return { handled: false, status: extracted.status || extracted.eventType };
}

function verifyXenditSignature(rawBody: Buffer, signatureHeader?: string) {
  if (!env.XENDIT_WEBHOOK_SECRET) {
    if (env.NODE_ENV === 'production') {
      throw createHttpError(401, 'unauthorized', 'XENDIT_WEBHOOK_SECRET is required in production.');
    }
    return;
  }

  if (!signatureHeader) {
    throw createHttpError(401, 'unauthorized', 'Missing Xendit webhook signature.');
  }

  const expected = crypto.createHmac('sha256', env.XENDIT_WEBHOOK_SECRET).update(rawBody.toString('utf8')).digest('hex');
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    throw createHttpError(401, 'unauthorized', 'Invalid Xendit webhook signature.');
  }
}

export async function handleXenditWebhook(rawBody: Buffer, signatureHeader?: string) {
  verifyXenditSignature(rawBody, signatureHeader);

  let event: unknown;
  try {
    event = JSON.parse(rawBody.toString('utf8')) as unknown;
  } catch {
    throw createHttpError(400, 'validation_error', 'Webhook body is not valid JSON.');
  }

  const extracted = extractWebhookPayment(event);
  const paymentId = extracted.paymentId ?? (extracted.bookingId ? await findPendingPaymentId(extracted.bookingId) : undefined);

  if (!paymentId) {
    await pool.query(
      `insert into activity_logs (action, details)
       values ('Payment Webhook Ignored', $1::jsonb)`,
      [JSON.stringify({ reason: 'payment metadata missing', eventType: extracted.eventType, gateway: 'xendit' })]
    );
    return { handled: false };
  }

  const normalizedStatus = (extracted.status || '').toLowerCase();
  const isPaid = ['paid', 'settled', 'completed'].includes(normalizedStatus);
  const isFailed = normalizedStatus.includes('failed') || ['expired', 'cancelled', 'canceled'].includes(normalizedStatus);

  if (isPaid) {
    await confirmPaidPayment(paymentId, extracted.transactionId, event);
    return { handled: true, status: 'paid' };
  }

  if (isFailed) {
    await markPaymentFailed(paymentId, extracted.transactionId, event);
    return { handled: true, status: 'failed' };
  }

  return { handled: false, status: extracted.status || extracted.eventType };
}

function assertPaymentAccess(payment: PaymentRow | BookingPaymentRow, actor: { id: string; role: UserRole }) {
  if (actor.role === 'admin') return;
  if ('property_owner_id' in payment && actor.role === 'host' && payment.property_owner_id === actor.id) return;
  if (payment.user_id === actor.id) return;
  throw createHttpError(403, 'forbidden', 'You do not have access to this payment.');
}

export async function listPayments(filters: {
  actor: { id: string; role: UserRole };
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (filters.actor.role === 'guest') {
    values.push(filters.actor.id);
    conditions.push(`p.user_id = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`p.payment_status = $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`(p.transaction_id ilike $${values.length} or b.id::text ilike $${values.length} or u.email ilike $${values.length})`);
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
  const page = Math.max(filters.page ?? 1, 1);
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
  const offset = (page - 1) * limit;

  const countResult = await pool.query<{ count: string }>(
    `select count(*)::int as count
     from payments p
     join bookings b on b.id = p.booking_id
     join users u on u.id = p.user_id
     ${where}`,
    values
  );

  const dataValues = [...values, limit, offset];
  const dataResult = await pool.query<PaymentRow>(
    `select
       p.*,
       b.id::text as booking_number,
       b.check_in::text,
       b.check_out::text,
       pr.title as property_title,
       pu.unit_name,
       u.email as guest_email
     from payments p
     join bookings b on b.id = p.booking_id
     join properties pr on pr.id = b.property_id
     left join property_units pu on pu.id = b.unit_id
     join users u on u.id = p.user_id
     ${where}
     order by p.created_at desc
     limit $${dataValues.length - 1} offset $${dataValues.length}`,
    dataValues
  );

  return {
    data: dataResult.rows.map(mapPayment),
    pagination: {
      page,
      limit,
      total: Number(countResult.rows[0]?.count ?? 0)
    }
  };
}

export async function getPaymentById(paymentId: string, actor: { id: string; role: UserRole }) {
  const { rows } = await pool.query<BookingPaymentRow>(
    `select
       p.*,
       b.id::text as booking_number,
       b.property_id,
       b.unit_id,
       b.booking_status,
       b.status,
       b.guests_count,
       b.check_in::text,
       b.check_out::text,
       pr.title as property_title,
       pr.owner_id as property_owner_id,
       pu.unit_name,
       pu.unit_type,
       u.email as guest_email
     from payments p
     join bookings b on b.id = p.booking_id
     join properties pr on pr.id = b.property_id
     left join property_units pu on pu.id = b.unit_id
     join users u on u.id = p.user_id
     where p.id = $1`,
    [paymentId]
  );

  const payment = rows[0];
  if (!payment) {
    throw createHttpError(404, 'not_found', 'Payment not found.');
  }

  assertPaymentAccess(payment, actor);
  return mapPayment(payment);
}

export async function getPaymentDashboard() {
  const { rows } = await pool.query<{
    total_revenue: string;
    daily_revenue: string;
    monthly_revenue: string;
    pending_payments: string;
    refunded_payments: string;
    refunded_amount: string;
  }>(
    `select
       coalesce(sum(amount) filter (where payment_status = 'paid'), 0)::numeric(12,2) as total_revenue,
       coalesce(sum(amount) filter (where payment_status = 'paid' and created_at::date = current_date), 0)::numeric(12,2) as daily_revenue,
       coalesce(sum(amount) filter (where payment_status = 'paid' and date_trunc('month', created_at) = date_trunc('month', now())), 0)::numeric(12,2) as monthly_revenue,
       count(*) filter (where payment_status = 'pending')::int as pending_payments,
       count(*) filter (where payment_status in ('refunded', 'partially_refunded'))::int as refunded_payments,
       coalesce(sum(amount) filter (where payment_status in ('refunded', 'partially_refunded')), 0)::numeric(12,2) as refunded_amount
     from payments`
  );

  const row = rows[0];
  return {
    totalRevenue: Number(row?.total_revenue ?? 0),
    dailyRevenue: Number(row?.daily_revenue ?? 0),
    monthlyRevenue: Number(row?.monthly_revenue ?? 0),
    pendingPayments: Number(row?.pending_payments ?? 0),
    refundedPayments: Number(row?.refunded_payments ?? 0),
    refundedAmount: Number(row?.refunded_amount ?? 0)
  };
}

export async function refundPayment(
  paymentId: string,
  input: z.infer<typeof refundPaymentSchema>,
  actor: { id: string; role: UserRole }
) {
  const client = await pool.connect();

  try {
    await client.query('begin');
    const payment = await getPaymentForUpdate(client, paymentId);
    assertPaymentAccess(payment, actor);

    if (!['paid', 'partially_refunded'].includes(payment.payment_status)) {
      throw createHttpError(400, 'validation_error', 'Only paid payments can be refunded.');
    }

    const refundAmount = input.amount ?? Number(payment.amount);
    const isFullRefund = refundAmount >= Number(payment.amount);
    const nextStatus: PaymentStatus = isFullRefund ? 'refunded' : 'partially_refunded';

    await client.query(
      `update payments
       set payment_status = $1,
           status = 'refunded',
           gateway_response = gateway_response || $2::jsonb,
           updated_at = now()
       where id = $3`,
      [nextStatus, JSON.stringify({ refund: { amount: refundAmount, reason: input.reason ?? null } }), paymentId]
    );

    await client.query(
      `update bookings
       set payment_status = $1,
           booking_status = case when $2 then 'cancelled' else booking_status end,
           status = case when $2 then 'cancelled' else status end,
           updated_at = now()
       where id = $3`,
      [nextStatus, isFullRefund, payment.booking_id]
    );

    if (isFullRefund) {
      await client.query(
        `delete from property_availability
         where property_id = $1
           and date >= $2::date
           and date < $3::date
           and note = $4`,
        [payment.property_id, payment.check_in, payment.check_out, `Confirmed booking payment ${payment.id}`]
      );
    }

    await client.query(
      `insert into notifications (user_id, message, type)
       values ($1, $2, 'warning')`,
      [payment.user_id, `Refund processed for booking ${payment.booking_number}. Amount: ${payment.currency} ${refundAmount.toLocaleString()}.`]
    );
    await client.query(
      `insert into activity_logs (actor_user_id, action, details)
       values ($1, 'Refund Payment', $2::jsonb)`,
      [actor.id, JSON.stringify({ paymentId, bookingId: payment.booking_id, amount: refundAmount, fullRefund: isFullRefund })]
    );

    await client.query('commit');
    return getPaymentById(paymentId, actor);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function createSimplePdf(lines: string[]) {
  const content = lines
    .slice(0, 36)
    .map((line, index) => `BT /F1 11 Tf 50 ${760 - index * 18} Td (${escapePdfText(line)}) Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

export async function getReceiptPdf(paymentId: string, actor: { id: string; role: UserRole }) {
  const payment = await getPaymentById(paymentId, actor);
  const { rows } = await pool.query<{ receipt_number: string }>(
    `select receipt_number from payment_receipts where payment_id = $1`,
    [paymentId]
  );
  const receiptNumber = rows[0]?.receipt_number ?? `RCPT-${new Date().getUTCFullYear()}-${payment.id.slice(0, 8).toUpperCase()}`;
  const lines = [
    'HavenShare Payment Receipt',
    `Receipt Number: ${receiptNumber}`,
    `Booking Number: ${payment.bookingNumber ?? payment.bookingId}`,
    `Property Name: ${payment.propertyTitle ?? 'Property'}`,
    `Unit Name: ${payment.unitName ?? 'Entire Stay'}`,
    `Check-In Date: ${payment.checkIn ?? ''}`,
    `Check-Out Date: ${payment.checkOut ?? ''}`,
    `Payment Method: ${payment.paymentMethod}`,
    `Amount Paid: ${payment.currency} ${payment.amount.toLocaleString()}`,
    `Payment Status: ${payment.paymentStatus}`,
    `Transaction Number: ${payment.transactionId}`,
    `Paid At: ${payment.paidAt ?? ''}`
  ];

  return {
    filename: `${receiptNumber}.pdf`,
    buffer: createSimplePdf(lines)
  };
}

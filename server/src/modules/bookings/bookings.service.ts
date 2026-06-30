import { z } from 'zod';
import { pool } from '../../config/db';
import { getPropertyForBooking, getPropertyOwner } from '../properties/properties.service';
import { createHttpError, type UserRole } from '../../utils/http-error';

export const createBookingSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestsCount: z.coerce.number().int().positive()
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending_payment', 'confirmed', 'rejected', 'cancelled', 'checked_in', 'checked_out', 'completed'])
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

type BookingRow = {
  id: string;
  property_id: string;
  unit_id: string | null;
  user_id: string;
  check_in: string;
  check_out: string;
  total_price: string;
  total_amount: string | null;
  status: string;
  booking_status: string | null;
  payment_id: string | null;
  payment_status: string | null;
  guests_count: number;
  created_at: string;
  updated_at: string;
  property_title: string;
  unit_name: string | null;
  user_email: string;
};

export interface Booking {
  id: string;
  propertyId: string;
  unitId?: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  totalAmount: number;
  status: string;
  bookingStatus: string;
  paymentId?: string;
  paymentStatus: string;
  guestsCount: number;
  createdAt: string;
  updatedAt: string;
  propertyTitle?: string;
  unitName?: string;
  userEmail?: string;
}

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    propertyId: row.property_id,
    unitId: row.unit_id ?? undefined,
    userId: row.user_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    totalPrice: Number(row.total_price),
    totalAmount: Number(row.total_amount ?? row.total_price),
    status: row.status,
    bookingStatus: row.booking_status ?? row.status,
    paymentId: row.payment_id ?? undefined,
    paymentStatus: row.payment_status ?? 'pending',
    guestsCount: row.guests_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    propertyTitle: row.property_title,
    unitName: row.unit_name ?? undefined,
    userEmail: row.user_email
  };
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

function calculateTotalPrice(property: {
  price_per_night: string;
  seasonal_pricing: Array<{ month: number; priceMultiplier: number }>;
  discounts: Array<{ minDays: number; percentage: number }>;
}, checkIn: string, checkOut: string) {
  const nights = nightsBetween(checkIn, checkOut);
  const month = new Date(`${checkIn}T00:00:00.000Z`).getUTCMonth() + 1;
  const seasonal = property.seasonal_pricing.find((rule) => rule.month === month);
  const multiplier = seasonal?.priceMultiplier ?? 1;
  const applicableDiscount = property.discounts
    .filter((rule) => nights >= rule.minDays)
    .sort((a, b) => b.percentage - a.percentage)[0];
  const discountRate = applicableDiscount ? applicableDiscount.percentage / 100 : 0;
  const subtotal = Number(property.price_per_night) * nights * multiplier;

  return Number((subtotal * (1 - discountRate)).toFixed(2));
}

export async function listBookings(filters: {
  status?: string;
  userId?: string;
  propertyId?: string;
  page?: number;
  limit?: number;
}) {
  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`b.status = $${values.length}`);
  }

  if (filters.userId) {
    values.push(filters.userId);
    conditions.push(`b.user_id = $${values.length}`);
  }

  if (filters.propertyId) {
    values.push(filters.propertyId);
    conditions.push(`b.property_id = $${values.length}`);
  }

  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
  const page = Math.max(filters.page ?? 1, 1);
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
  const offset = (page - 1) * limit;
  const countValues = [...values];
  const dataValues = [...values, limit, offset];

  const countResult = await pool.query<{ count: string }>(
    `select count(*)::int as count from bookings b ${where}`,
    countValues
  );

  const dataResult = await pool.query<BookingRow>(
    `select b.*, p.title as property_title, pu.unit_name, u.email as user_email
     from bookings b
     join properties p on p.id = b.property_id
     left join property_units pu on pu.id = b.unit_id
     join users u on u.id = b.user_id
     ${where}
     order by b.created_at desc
     limit $${dataValues.length - 1} offset $${dataValues.length}`,
    dataValues
  );

  return {
    data: dataResult.rows.map(mapBooking),
    pagination: {
      page,
      limit,
      total: Number(countResult.rows[0]?.count ?? 0)
    }
  };
}

export async function getBookingById(id: string) {
  const { rows } = await pool.query<BookingRow>(
    `select b.*, p.title as property_title, pu.unit_name, u.email as user_email
     from bookings b
     join properties p on p.id = b.property_id
     left join property_units pu on pu.id = b.unit_id
     join users u on u.id = b.user_id
     where b.id = $1`,
    [id]
  );

  const row = rows[0];

  if (!row) {
    throw createHttpError(404, 'not_found', 'Booking not found.');
  }

  return mapBooking(row);
}

export async function createBooking(userId: string, input: CreateBookingInput) {
  await getPropertyForBooking(input.propertyId);
  const totalPrice = await calculateBookingTotal(input.propertyId, input.checkIn, input.checkOut);

  const client = await pool.connect();

  try {
    await client.query('begin');

    const overlapping = await client.query(
      `select exists (
         select 1 from bookings
         where property_id = $1
           and check_in < $2
           and check_out > $3
           and status not in ('cancelled', 'rejected')
         for update
       ) as exists`,
      [input.propertyId, input.checkIn, input.checkOut]
    );

    if (overlapping.rows[0]?.exists) {
      throw createHttpError(409, 'conflict', 'Property is already booked for the selected dates.');
    }

    const { rows } = await client.query<BookingRow>(
      `insert into bookings (
         property_id, unit_id, user_id, check_in, check_out, total_price, total_amount,
         guests_count, status, booking_status, payment_status
       )
       values ($1, $2, $3, $4, $5, $6, $6, $7, 'pending_payment', 'pending_payment', 'pending')
       returning *`,
      [input.propertyId, input.unitId ?? null, userId, input.checkIn, input.checkOut, totalPrice, input.guestsCount]
    );

    await client.query('commit');
    const booking = rows[0];
    if (!booking) {
      throw createHttpError(500, 'internal_error', 'Booking could not be created.');
    }
    return mapBooking(booking);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function calculateBookingTotal(propertyId: string, checkIn: string, checkOut: string) {
  const property = await getPropertyForBooking(propertyId);
  return calculateTotalPrice(property, checkIn, checkOut);
}

export async function updateBookingStatus(id: string, status: string, actor: { id: string; role: UserRole }) {
  const booking = await getBookingById(id);
  const owner = await getPropertyOwner(booking.propertyId);

  if (actor.role !== 'admin' && owner?.owner_id !== actor.id) {
    throw createHttpError(403, 'forbidden', 'Only the property owner or an admin can update booking status.');
  }

  const { rowCount } = await pool.query(
    `update bookings
     set status = $1,
         booking_status = $1,
         payment_status = case when $1 = 'confirmed' then 'paid' else payment_status end,
         updated_at = now()
     where id = $2`,
    [status, id]
  );

  if (rowCount !== 1) {
    throw createHttpError(404, 'not_found', 'Booking not found.');
  }

  return getBookingById(id);
}

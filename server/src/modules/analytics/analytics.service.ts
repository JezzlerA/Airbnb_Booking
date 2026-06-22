import { pool } from '../../config/db';

export interface AnalyticsSummary {
  totalProperties: number;
  availableProperties: number;
  activeBookings: number;
  totalRevenue: number;
  averageRating: number;
  pendingBookings: number;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [propertiesResult, bookingsResult, revenueResult, ratingResult] = await Promise.all([
    pool.query<{ total: string; available: string }>(
      `select
         count(*)::int as total,
         count(*) filter (where status = 'available')::int as available
       from properties`
    ),
    pool.query<{ active: string; pending: string }>(
      `select
         count(*) filter (where status in ('pending', 'approved', 'checked_in'))::int as active,
         count(*) filter (where status = 'pending')::int as pending
       from bookings`
    ),
    pool.query<{ total: string }>(
      `select coalesce(sum(amount), 0)::numeric(12,2) as total
       from payments
       where status = 'verified'`
    ),
    pool.query<{ average: string }>(
      `select coalesce(avg(rating), 0)::numeric(3,2) as average
       from reviews`
    )
  ]);

  return {
    totalProperties: Number(propertiesResult.rows[0]?.total ?? 0),
    availableProperties: Number(propertiesResult.rows[0]?.available ?? 0),
    activeBookings: Number(bookingsResult.rows[0]?.active ?? 0),
    totalRevenue: Number(revenueResult.rows[0]?.total ?? 0),
    averageRating: Number(ratingResult.rows[0]?.average ?? 0),
    pendingBookings: Number(bookingsResult.rows[0]?.pending ?? 0)
  };
}

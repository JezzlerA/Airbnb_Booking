import { z } from 'zod';
import { pool } from '../../config/db';
import { createHttpError } from '../../utils/http-error';

export const createReviewSchema = z.object({
  propertyId: z.string().uuid(),
  bookingId: z.string().uuid(),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().min(10).max(2000)
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

type ReviewRow = {
  id: string;
  property_id: string;
  user_id: string;
  booking_id: string | null;
  rating: string;
  comment: string;
  response: string | null;
  created_at: string;
  updated_at: string;
  property_title: string;
  user_name: string;
};

export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  bookingId: string | null;
  rating: number;
  comment: string;
  response: string | null;
  createdAt: string;
  updatedAt: string;
  propertyTitle?: string;
  userName?: string;
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    propertyId: row.property_id,
    userId: row.user_id,
    bookingId: row.booking_id,
    rating: Number(row.rating),
    comment: row.comment,
    response: row.response,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    propertyTitle: row.property_title,
    userName: row.user_name
  };
}

export async function listReviews(propertyId: string, page = 1, limit = 20) {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const countResult = await pool.query<{ count: string }>(
    `select count(*)::int as count from reviews where property_id = $1`,
    [propertyId]
  );

  const dataResult = await pool.query<ReviewRow>(
    `select r.*, p.title as property_title, u.name as user_name
     from reviews r
     join properties p on p.id = r.property_id
     join users u on u.id = r.user_id
     where r.property_id = $1
     order by r.created_at desc
     limit $2 offset $3`,
    [propertyId, safeLimit, offset]
  );

  return {
    data: dataResult.rows.map(mapReview),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: Number(countResult.rows[0]?.count ?? 0)
    }
  };
}

export async function createReview(userId: string, input: CreateReviewInput) {
  const { rowCount: bookingCount } = await pool.query(
    `select 1 from bookings
     where id = $1 and user_id = $2 and property_id = $3 and status = 'completed'`,
    [input.bookingId, userId, input.propertyId]
  );

  if (bookingCount !== 1) {
    throw createHttpError(400, 'validation_error', 'Review can only be created for a completed booking.');
  }

  const { rows } = await pool.query<ReviewRow>(
    `insert into reviews (property_id, user_id, booking_id, rating, comment)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [input.propertyId, userId, input.bookingId, input.rating, input.comment]
  );

  return mapReview(rows[0]);
}

export async function updateReviewResponse(id: string, response: string, actorId: string) {
  const { rowCount } = await pool.query(
    `update reviews
     set response = $1, updated_at = now()
     where id = $2 and property_id in (select id from properties where owner_id = $3)`,
    [response, id, actorId]
  );

  if (rowCount !== 1) {
    throw createHttpError(404, 'not_found', 'Review response could not be updated.');
  }

  return true;
}

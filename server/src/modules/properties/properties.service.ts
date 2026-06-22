import { z } from 'zod';
import { pool } from '../../config/db';
import type { UserRole } from '../../utils/http-error';
import { createHttpError } from '../../utils/http-error';

export const createPropertySchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20).max(5000),
  category: z.string().trim().min(2).max(80),
  pricePerNight: z.coerce.number().positive(),
  beds: z.coerce.number().int().positive(),
  baths: z.coerce.number().positive(),
  guests: z.coerce.number().int().positive(),
  location: z.object({
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    country: z.string().trim().optional(),
    lat: z.number().optional(),
    lng: z.number().optional()
  }).default({}),
  amenities: z.array(z.string().trim().min(1)).default([]),
  seasonalPricing: z.array(z.object({
    month: z.number().int().min(1).max(12),
    priceMultiplier: z.number().positive()
  })).default([]),
  discounts: z.array(z.object({
    minDays: z.number().int().positive(),
    percentage: z.number().min(0).max(100)
  })).default([]),
  status: z.enum(['available', 'blocked', 'archived']).default('available'),
  images: z.array(z.object({
    url: z.string().url(),
    altText: z.string().trim().max(200).optional(),
    isCover: z.boolean().default(false),
    sortOrder: z.number().int().nonnegative().default(0)
  })).default([])
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

type PropertyRow = {
  id: string;
  owner_id: string | null;
  title: string;
  description: string;
  category: string;
  price_per_night: string;
  beds: number;
  baths: string;
  guests: number;
  location: Record<string, unknown>;
  amenities: string[];
  seasonal_pricing: Array<Record<string, unknown>>;
  discounts: Array<Record<string, unknown>>;
  status: string;
  created_at: string;
  updated_at: string;
  images: Array<{
    id: string;
    url: string;
    alt_text: string | null;
    is_cover: boolean;
    sort_order: number;
  }>;
};

export interface Property {
  id: string;
  ownerId: string | null;
  title: string;
  description: string;
  category: string;
  pricePerNight: number;
  beds: number;
  baths: number;
  guests: number;
  location: Record<string, unknown>;
  amenities: string[];
  seasonalPricing: Array<Record<string, unknown>>;
  discounts: Array<Record<string, unknown>>;
  status: string;
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    isCover: boolean;
    sortOrder: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

function mapProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    category: row.category,
    pricePerNight: Number(row.price_per_night),
    beds: row.beds,
    baths: Number(row.baths),
    guests: row.guests,
    location: row.location,
    amenities: row.amenities,
    seasonalPricing: row.seasonal_pricing,
    discounts: row.discounts,
    status: row.status,
    images: row.images.map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.alt_text,
      isCover: image.is_cover,
      sortOrder: image.sort_order
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function buildPropertyWhere(filters: {
  category?: string;
  status?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}) {
  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (filters.category) {
    values.push(filters.category);
    conditions.push(`p.category = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`p.status = $${values.length}`);
  }

  if (filters.city) {
    values.push(filters.city);
    conditions.push(`p.location ->> 'city' ILIKE $${values.length}`);
  }

  if (filters.minPrice !== undefined) {
    values.push(filters.minPrice);
    conditions.push(`p.price_per_night >= $${values.length}`);
  }

  if (filters.maxPrice !== undefined) {
    values.push(filters.maxPrice);
    conditions.push(`p.price_per_night <= $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`(p.title ILIKE $${values.length} or p.description ILIKE $${values.length})`);
  }

  return {
    where: conditions.length > 0 ? `where ${conditions.join(' and ')}` : '',
    values
  };
}

export async function listProperties(filters: {
  category?: string;
  status?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(filters.page ?? 1, 1);
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 50);
  const offset = (page - 1) * limit;
  const { where, values } = buildPropertyWhere(filters);
  const baseValues = [...values];

  const countResult = await pool.query<{ count: string }>(
    `select count(*)::int as count from properties p ${where}`,
    baseValues
  );

  const paginationValues = [...values, limit, offset];
  const dataResult = await pool.query<PropertyRow>(
    `select
       p.*,
       coalesce(
         jsonb_agg(
           jsonb_build_object(
             'id', pi.id,
             'url', pi.url,
             'alt_text', pi.alt_text,
             'is_cover', pi.is_cover,
             'sort_order', pi.sort_order
           ) order by pi.is_cover desc, pi.sort_order asc, pi.created_at asc
         ) filter (where pi.id is not null),
         '[]'::jsonb
       ) as images
     from properties p
     left join property_images pi on pi.property_id = p.id
     ${where}
     group by p.id
     order by p.created_at desc
     limit $${paginationValues.length - 1} offset $${paginationValues.length}`,
    paginationValues
  );

  return {
    data: dataResult.rows.map(mapProperty),
    pagination: {
      page,
      limit,
      total: Number(countResult.rows[0]?.count ?? 0)
    }
  };
}

export async function getPropertyById(id: string) {
  const { rows } = await pool.query<PropertyRow>(
    `select
       p.*,
       coalesce(
         jsonb_agg(
           jsonb_build_object(
             'id', pi.id,
             'url', pi.url,
             'alt_text', pi.alt_text,
             'is_cover', pi.is_cover,
             'sort_order', pi.sort_order
           ) order by pi.is_cover desc, pi.sort_order asc, pi.created_at asc
         ) filter (where pi.id is not null),
         '[]'::jsonb
       ) as images
     from properties p
     left join property_images pi on pi.property_id = p.id
     where p.id = $1
     group by p.id`,
    [id]
  );

  const row = rows[0];

  if (!row) {
    throw createHttpError(404, 'not_found', 'Property not found.');
  }

  return mapProperty(row);
}

export async function createProperty(ownerId: string, input: CreatePropertyInput) {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const propertyResult = await client.query<PropertyRow>(
      `insert into properties (
         owner_id, title, description, category, price_per_night, beds, baths, guests,
         location, amenities, seasonal_pricing, discounts, status
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       returning *`,
      [
        ownerId,
        input.title,
        input.description,
        input.category,
        input.pricePerNight,
        input.beds,
        input.baths,
        input.guests,
        input.location,
        input.amenities,
        input.seasonalPricing,
        input.discounts,
        input.status
      ]
    );

    const property = propertyResult.rows[0];
    const images = input.images.length > 0 ? input.images : [{ url: '', altText: '', isCover: true, sortOrder: 0 }];

    const imageResult = await client.query(
      `insert into property_images (property_id, url, alt_text, is_cover, sort_order)
       select $1, unnest($2::text[]), unnest($3::text[]), unnest($4::boolean[]), unnest($5::integer[])
       returning id, url, alt_text, is_cover, sort_order`,
      [
        property.id,
        images.map((image) => image.url),
        images.map((image) => image.altText ?? ''),
        images.map((image) => image.isCover),
        images.map((image) => image.sortOrder)
      ]
    );

    await client.query('commit');

    return mapProperty({ ...property, images: imageResult.rows });
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateProperty(id: string, input: UpdatePropertyInput, images?: CreatePropertyInput['images']) {
  const fields: string[] = [];
  const values: Array<unknown> = [];

  const fieldMap: Record<string, keyof CreatePropertyInput> = {
    title: 'title',
    description: 'description',
    category: 'category',
    pricePerNight: 'pricePerNight',
    beds: 'beds',
    baths: 'baths',
    guests: 'guests',
    location: 'location',
    amenities: 'amenities',
    seasonalPricing: 'seasonalPricing',
    discounts: 'discounts',
    status: 'status'
  };

  for (const [column, key] of Object.entries(fieldMap)) {
    if (input[key as keyof UpdatePropertyInput] !== undefined) {
      values.push(input[key as keyof UpdatePropertyInput]);
      fields.push(`${column} = $${values.length}`);
    }
  }

  if (fields.length === 0 && !images) {
    return getPropertyById(id);
  }

  const client = await pool.connect();

  try {
    await client.query('begin');

    if (fields.length > 0) {
      values.push(id);
      await client.query(
        `update properties
         set ${fields.join(', ')}, updated_at = now()
         where id = $${values.length}
         returning *`,
        values
      );
    }

    if (images) {
      await client.query(`delete from property_images where property_id = $1`, [id]);
      await client.query(
        `insert into property_images (property_id, url, alt_text, is_cover, sort_order)
         select $1, unnest($2::text[]), unnest($3::text[]), unnest($4::boolean[]), unnest($5::integer[])
         returning id, url, alt_text, is_cover, sort_order`,
        [
          id,
          images.map((image) => image.url),
          images.map((image) => image.altText ?? ''),
          images.map((image) => image.isCover),
          images.map((image) => image.sortOrder)
        ]
      );
    }

    await client.query('commit');
    return getPropertyById(id);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function archiveProperty(id: string) {
  const { rowCount } = await pool.query(
    `update properties set status = 'archived', updated_at = now() where id = $1`,
    [id]
  );

  if (rowCount !== 1) {
    throw createHttpError(404, 'not_found', 'Property not found.');
  }

  return { id, status: 'archived' };
}

export async function getPropertyForBooking(id: string) {
  const { rows } = await pool.query(
    `select id, owner_id, price_per_night, seasonal_pricing, discounts
     from properties
     where id = $1 and status = 'available'`,
    [id]
  );

  const property = rows[0];

  if (!property) {
    throw createHttpError(404, 'not_found', 'Property is not available for booking.');
  }

  return property;
}

export async function getPropertyOwner(id: string) {
  const { rows } = await pool.query<{ owner_id: string | null; role: UserRole }>(
    `select p.owner_id, u.role
     from properties p
     left join users u on u.id = p.owner_id
     where p.id = $1`,
    [id]
  );

  return rows[0] ?? null;
}

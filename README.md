# HavenShare API

Production backend for the HavenShare Airbnb-style property and booking management platform.

## Technology stack

- **Language:** TypeScript on Node.js 20+
- **Web framework:** Express 5 with REST routing
- **Database:** PostgreSQL, compatible with Supabase Postgres
- **Data access:** `pg` connection pool with parameterized SQL
- **Authentication:** JWT access tokens + rotating refresh tokens stored as bcrypt hashes
- **Validation:** Zod request schemas
- **Security:** Helmet, CORS allow-list, rate limiting, bearer-token auth, centralized error handling

## Run the API

1. Copy `.env.example` to `.env`.
2. Generate strong values for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`.
3. Apply the schema:

```bash
npm run db:migrate
```

4. Seed the initial admin and properties:

```bash
npm run db:seed
```

5. Start the backend:

```bash
npm run dev:api
```

Default API base URL: `http://localhost:3000`.

## Modular structure

```text
server/src
  app.ts
  server.ts
  migrate.ts
  seed.ts
  config
    cors.ts
    db.ts
    env.ts
  middleware
    auth.ts
    error.ts
    rate-limit.ts
    request-id.ts
    validation.ts
  modules
    analytics
    auth
    bookings
    properties
    reviews
  services
    auth.service.ts
    password.ts
    token.ts
  migrations
    001_init.sql
  types
    express.d.ts
  utils
    async-handler.ts
    http-error.ts
    jwt.ts
```

## Database schema summary

Core tables are defined in `server/src/migrations/001_init.sql`.

- `users`: account identity, hashed password, role (`guest`, `host`, `admin`), profile fields.
- `refresh_tokens`: rotating refresh tokens with hashed token values, expiry, revocation, reuse detection.
- `properties`: listings, pricing, location JSONB, amenities array, seasonal pricing JSONB, discounts JSONB, status.
- `property_images`: listing image URLs with cover flag and sort order.
- `bookings`: booking dates, guest count, total price, lifecycle status. Includes a PostgreSQL exclusion constraint to prevent overlapping active bookings per property.
- `payments`: payment records linked to bookings.
- `reviews`: guest reviews with one review per property/user.
- `notifications`: user-facing notifications.
- `activity_logs`: audit trail for administrative actions.
- `settings`: JSONB key/value application settings.

Important production safeguards in the migration:

- `CITEXT` email uniqueness.
- Parameterized SQL everywhere.
- Password and refresh-token hashes with bcrypt.
- PostgreSQL exclusion constraint for booking date conflicts.
- `updated_at` triggers on mutable tables.
- Indexes on foreign keys, filters, and common query paths.

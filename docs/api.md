# REST API Documentation

Base URL: `http://localhost:3000`

All JSON responses use this envelope:

```json
{
  "data": {}
}
```

Errors use this envelope:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Human-readable message",
    "details": {}
  }
}
```

Authenticated endpoints require:

```http
Authorization: Bearer <accessToken>
```

## Auth

### `POST /api/auth/register`

Creates a guest or host account and returns access/refresh tokens.

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPassword123!",
  "phone": "+1 555 0100",
  "role": "guest"
}
```

Response:

```json
{
  "data": {
    "user": { "id": "uuid", "email": "jane@example.com", "role": "guest" },
    "accessToken": "jwt",
    "refreshToken": "jwt",
    "expiresIn": 900
  }
}
```

### `POST /api/auth/login`

```json
{
  "email": "jane@example.com",
  "password": "StrongPassword123!"
}
```

### `POST /api/auth/refresh`

Rotates refresh tokens.

```json
{
  "refreshToken": "jwt"
}
```

### `GET /api/auth/me`

Returns the current user.

### `POST /api/auth/logout`

Revokes the supplied refresh token.

```json
{
  "refreshToken": "jwt"
}
```

## Properties

### `GET /api/properties`

Lists properties with optional query filters:

- `category`
- `status`
- `city`
- `minPrice`
- `maxPrice`
- `search`
- `page`
- `limit`

Response includes `data` and `pagination`.

### `GET /api/properties/:id`

Returns one property with images.

### `POST /api/properties`

Requires `host` or `admin`.

```json
{
  "title": "Villa Azure",
  "description": "Luxury beachfront villa with infinity pool.",
  "category": "Beachfront",
  "pricePerNight": 380,
  "beds": 3,
  "baths": 2.5,
  "guests": 6,
  "location": { "city": "Malibu", "country": "United States", "address": "24800 Pacific Coast Hwy" },
  "amenities": ["wifi", "pool", "kitchen"],
  "seasonalPricing": [{ "month": 7, "priceMultiplier": 1.4 }],
  "discounts": [{ "minDays": 3, "percentage": 5 }],
  "status": "available",
  "images": [
    { "url": "https://example.com/image.jpg", "altText": "Exterior", "isCover": true, "sortOrder": 0 }
  ]
}
```

### `PATCH /api/properties/:id`

Requires `host` or `admin`. Accepts partial property fields and optional `images`.

### `DELETE /api/properties/:id`

Requires `host` or `admin`. Archives the property instead of hard deleting.

## Bookings

### `GET /api/bookings`

Requires auth. Optional filters: `status`, `userId`, `propertyId`, `page`, `limit`.

### `POST /api/bookings`

Requires auth. Checks property availability and overlapping active bookings.

```json
{
  "propertyId": "uuid",
  "checkIn": "2026-07-01",
  "checkOut": "2026-07-05",
  "guestsCount": 2
}
```

### `GET /api/bookings/:id`

Requires auth.

### `PATCH /api/bookings/:id/status`

Requires auth. Property owners and admins can update status.

```json
{
  "status": "approved"
}
```

Allowed statuses: `pending`, `approved`, `rejected`, `cancelled`, `checked_in`, `checked_out`, `completed`.

## Reviews

### `GET /api/reviews/property/:propertyId`

Lists reviews for a property. Optional `page` and `limit`.

### `POST /api/reviews`

Requires auth. Review can only be created for a completed booking.

```json
{
  "propertyId": "uuid",
  "bookingId": "uuid",
  "rating": 5,
  "comment": "Excellent stay with accurate listing details."
}
```

### `PATCH /api/reviews/:id/response`

Requires `host` or `admin`.

```json
{
  "response": "Thank you for staying with us."
}
```

## Analytics

### `GET /api/analytics/summary`

Requires auth.

Returns:

```json
{
  "data": {
    "totalProperties": 10,
    "availableProperties": 7,
    "activeBookings": 4,
    "totalRevenue": 12500,
    "averageRating": 4.8,
    "pendingBookings": 2
  }
}
```

## Security notes

- Passwords and refresh tokens are hashed with bcrypt.
- Access tokens are short-lived JWTs.
- Refresh tokens are rotated on every refresh.
- Refresh-token reuse revokes the user's active refresh-token chain.
- CORS is restricted through `CORS_ORIGIN`.
- API routes are rate-limited.
- Express error middleware normalizes errors and hides sensitive details in production.

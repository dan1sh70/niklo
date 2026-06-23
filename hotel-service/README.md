# Hotel Service

This microservice handles all backend operations for the Niklo Travel Hotel Booking module.

## Features

- Hotel Search & Discovery (Trending, Destinations, Stay Types)
- Comprehensive Hotel details including Room Types, Reviews, and Rules
- Hourly Stays support
- Hotel Bookings initiation

## Tech Stack

- [NestJS](https://nestjs.com/)
- TypeORM
- PostgreSQL

## Configuration

Set up the environment variables in a `.env` file or environment variables in your deployment. Check the `.env` file for default values.

## Running the Service

```bash
# Install dependencies
$ npm install

# Run locally in dev mode
$ npm run start:dev

# Build for production
$ npm run build
$ npm run start:prod
```

## Running with Docker Compose

This service is part of the broader Niklo `docker-compose.yaml`. You can start the full stack from the root directory:

```bash
docker-compose up --build -d
```

## API Documentation

A Postman collection `Niklo_Hotel_Service.postman_collection.json` is provided in the repository to test all available endpoints.

### Endpoints Collection

#### Location API
- `GET /api/v1/location/autocomplete` - Location autocomplete
  - **Query Parameters:** `q` (string, required), `type` (string, optional)

#### Hotels API
- `GET /api/v1/hotels/popular-destinations` - Get popular destinations
- `GET /api/v1/hotels/stay-types` - Get stay types
- `GET /api/v1/hotels/trending` - Get trending hotels
  - **Query Parameters:** `limit` (number, optional, default: 10)
- `GET /api/v1/hotels/promotions/active` - Get active promotions
- `GET /api/v1/hotels/popular-cities` - Get popular cities
- `POST /api/v1/hotels/search` - Search hotels
  - **Body (JSON):**
    ```json
    {
      "location": "string (optional)",
      "limit": "number (optional, default: 20)",
      "page": "number (optional, default: 1)"
    }
    ```
- `GET /api/v1/hotels/:hotelId` - Get hotel details by ID
  - **Path Parameters:** `hotelId` (string, required)
- `GET /api/v1/hotels/:hotelId/reviews` - Get hotel reviews
  - **Path Parameters:** `hotelId` (string, required)
  - **Query Parameters:** `sort` (string, optional), `page` (number, optional, default: 1), `limit` (number, optional, default: 20)
- `GET /api/v1/hotels/:hotelId/photos` - Get hotel photos
  - **Path Parameters:** `hotelId` (string, required)
  - **Query Parameters:** `page` (number, optional, default: 1), `limit` (number, optional, default: 30)

#### Bookings API
- `POST /api/v1/bookings/hotel` - Create a hotel booking
  - **Body (JSON):**
    ```json
    {
      "hotelId": "string (required)",
      "roomTypeId": "string (required)",
      "checkInDate": "string (YYYY-MM-DD, required)",
      "checkOutDate": "string (YYYY-MM-DD, required)",
      "rooms": "number (required)",
      "adults": "number (required)",
      "children": "number (required)",
      "childAges": "array of numbers (optional)",
      "isHourly": "boolean (optional, default: false)",
      "hourlyCheckInTime": "string (optional)",
      "hourlyDurationHours": "number (optional)",
      "totalAmount": "number (required)",
      "userId": "string (required)"
    }
    ```

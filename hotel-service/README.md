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

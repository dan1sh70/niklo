-- Create database users
CREATE USER niklo_auth WITH PASSWORD 'niklo_auth_password';
CREATE USER niklo_bus WITH PASSWORD 'niklo_bus_password';
CREATE USER niklo_payment WITH PASSWORD 'niklo_payment_password';
CREATE USER niklo_hotel WITH PASSWORD 'niklo_hotel_password';
CREATE USER niklo_user WITH PASSWORD 'niklo_user_password';
CREATE USER niklo_ride WITH PASSWORD 'niklo_ride_password';
CREATE USER niklo_driver WITH PASSWORD 'niklo_driver_password';
CREATE USER niklo_package WITH PASSWORD 'niklo_package_password';
CREATE USER niklo_adventure WITH PASSWORD 'niklo_adventure_password';

-- Create databases with owner privileges
CREATE DATABASE niklo_auth OWNER niklo_auth;
CREATE DATABASE niklo_bus OWNER niklo_bus;
CREATE DATABASE niklo_payment OWNER niklo_payment;
CREATE DATABASE niklo_hotel OWNER niklo_hotel;
CREATE DATABASE niklo_user OWNER niklo_user;
CREATE DATABASE niklo_ride OWNER niklo_ride;
CREATE DATABASE niklo_driver OWNER niklo_driver;
CREATE DATABASE niklo_package OWNER niklo_package;
CREATE DATABASE niklo_adventure OWNER niklo_adventure;

-- Enable core extensions on databases
\c niklo_auth;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c niklo_bus;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c niklo_payment;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c niklo_hotel;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c niklo_user;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c niklo_ride;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS postgis;

\c niklo_driver;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c niklo_package;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c niklo_adventure;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

#!/usr/bin/env node
/**
 * Seeds demo bus routes and schedules so QA can exercise the search → seat →
 * booking flow.
 *
 * Why this exists: the deployed database has four routes, and every schedule on
 * them departs in the past (2024-05-22, 2026-07-15, 2026-07-31) except a single
 * SmokeCityA → SmokeCityB row. Since search filters on an exact
 * `departure_date`, essentially every realistic search returns an empty list —
 * which reads in the app as "no buses anywhere" rather than "no data yet".
 *
 * This is demo data, not operator inventory. Real routes and timetables belong
 * to the operators and should arrive through the partner app; run this only
 * against a test environment, and prefer deleting what it creates afterwards.
 *
 *   node scripts/seed-demo-schedules.js \
 *     --base http://<bus-service-host> \
 *     --auth http://<auth-service-host> \
 *     --phone +919999999999 --otp 123456 \
 *     [--days 14] [--dry-run]
 *
 * A bus and an operator must already exist — the script reuses the first active
 * bus it finds rather than inventing an operator, because operators are real
 * business entities and this script has no business creating them.
 */

const args = parseArgs(process.argv.slice(2));

const BASE = args.base || process.env.BUS_BASE_URL;
const AUTH = args.auth || process.env.AUTH_BASE_URL;
const PHONE = args.phone || '+919999999999';
const OTP = args.otp || '123456';
const DAYS = Number(args.days || 14);
const DRY_RUN = Boolean(args['dry-run']);

if (!BASE || !AUTH) {
  console.error(
    'Usage: node scripts/seed-demo-schedules.js --base <bus-service-url> --auth <auth-service-url> [--days 14] [--dry-run]',
  );
  process.exit(1);
}

/** Routes to make searchable. Cities match the app's popular-city list. */
const ROUTES = [
  {
    source_city: 'Kolkata',
    destination_city: 'Siliguri',
    distance_km: 570,
    estimated_duration_minutes: 630,
    departures: [
      { departure_time: '20:00', arrival_time: '06:30', base_fare: 1200 },
      { departure_time: '22:15', arrival_time: '08:45', base_fare: 1450 },
    ],
  },
  {
    source_city: 'Bangalore',
    destination_city: 'Chennai',
    distance_km: 350,
    estimated_duration_minutes: 360,
    departures: [
      { departure_time: '07:30', arrival_time: '13:30', base_fare: 750 },
      { departure_time: '23:00', arrival_time: '05:00', base_fare: 900 },
    ],
  },
  {
    source_city: 'Mumbai',
    destination_city: 'Pune',
    distance_km: 150,
    estimated_duration_minutes: 210,
    departures: [
      { departure_time: '06:00', arrival_time: '09:30', base_fare: 450 },
      { departure_time: '18:30', arrival_time: '22:00', base_fare: 550 },
    ],
  },
  {
    source_city: 'Delhi',
    destination_city: 'Manali',
    distance_km: 530,
    estimated_duration_minutes: 720,
    departures: [{ departure_time: '19:00', arrival_time: '07:00', base_fare: 1600 }],
  },
];

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

async function main() {
  const token = await login();
  const bus = await pickBus(token);

  console.log(
    `Using bus ${bus.registration_number} (${bus.bus_type}, ${bus.total_seats} seats) from operator ${bus.operator_id}`,
  );

  const existingRoutes = await get(`${BASE}/api/v1/bus/routes`, token);
  const dates = upcomingDates(DAYS);
  let createdRoutes = 0;
  let createdSchedules = 0;

  for (const route of ROUTES) {
    let existing = existingRoutes.find(
      (r) =>
        eq(r.source_city, route.source_city) &&
        eq(r.destination_city, route.destination_city),
    );

    if (!existing) {
      if (DRY_RUN) {
        console.log(`[dry-run] would create route ${label(route)}`);
        continue;
      }
      existing = await post(
        `${BASE}/api/v1/bus/routes`,
        token,
        withPoints(route),
      );
      createdRoutes++;
      console.log(`Created route ${label(route)} (${existing.id})`);
    } else {
      console.log(`Route ${label(route)} already exists (${existing.id})`);
    }

    for (const date of dates) {
      for (const departure of route.departures) {
        const payload = {
          route_id: existing.id,
          bus_id: bus.id,
          operator_id: bus.operator_id,
          departure_time: departure.departure_time,
          arrival_time: departure.arrival_time,
          departure_date: date,
          base_fare: departure.base_fare,
          available_seats: bus.total_seats,
        };

        if (DRY_RUN) {
          console.log(
            `[dry-run] would create schedule ${label(route)} ${date} ${departure.departure_time}`,
          );
          continue;
        }

        await post(`${BASE}/api/v1/bus/schedules`, token, payload);
        createdSchedules++;
      }
    }
  }

  console.log(
    DRY_RUN
      ? 'Dry run complete — nothing was written.'
      : `Done. Created ${createdRoutes} route(s) and ${createdSchedules} schedule(s) across ${dates.length} day(s).`,
  );
}

/** Every date from tomorrow through [days] ahead, as YYYY-MM-DD. */
function upcomingDates(days) {
  const out = [];
  const start = new Date();
  for (let i = 1; i <= days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function withPoints(route) {
  return {
    source_city: route.source_city,
    destination_city: route.destination_city,
    distance_km: route.distance_km,
    estimated_duration_minutes: route.estimated_duration_minutes,
    boarding_points: [
      {
        name: `${route.source_city} Central Bus Stand`,
        address: 'Main Bus Stand',
        order_index: 1,
      },
    ],
    dropping_points: [
      {
        name: `${route.destination_city} Bus Terminus`,
        address: 'City Terminus',
        order_index: 1,
      },
    ],
  };
}

async function pickBus(token) {
  const buses = await get(`${BASE}/api/v1/bus/buses`, token);
  const bus = buses.find((b) => b.is_active && b.operator_id);
  if (!bus) {
    throw new Error(
      'No active bus with an operator was found. Onboard an operator and a bus first — this script will not invent them.',
    );
  }
  return bus;
}

async function login() {
  await post(`${AUTH}/api/v1/auth/otp/send`, null, { phone: PHONE });
  const res = await post(`${AUTH}/api/v1/auth/otp/verify`, null, {
    phone: PHONE,
    otp: OTP,
  });
  const token = res?.data?.accessToken || res?.accessToken;
  if (!token) throw new Error('Login did not return an access token.');
  return token;
}

async function get(url, token) {
  return request('GET', url, token, null);
}

async function post(url, token, body) {
  return request('POST', url, token, body);
}

async function request(method, url, token, body) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${url} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

function eq(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function label(route) {
  return `${route.source_city} → ${route.destination_city}`;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

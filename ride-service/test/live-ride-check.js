/**
 * Drives one complete ride against a running ride-service over real HTTP and
 * a real socket — the same calls the two Flutter apps make.
 *
 *   node test/live-ride-check.js [baseUrl]
 */
const { io } = require('socket.io-client');

const BASE = process.argv[2] || 'http://localhost:3005';
const DRIVER_ID = 'smoke-driver-1';
const PICKUP = { lat: 12.9716, lng: 77.5946 };
const DROP = { lat: 12.9352, lng: 77.6245 };

const log = (step, msg) => console.log(`[${step}] ${msg}`);
const fail = (msg) => {
  console.error(`\n❌ FAILED: ${msg}`);
  process.exit(1);
};

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, body: await res.json().catch(() => null) };
}

const timeout = (ms, what) =>
  new Promise((_, rej) => setTimeout(() => rej(new Error(`timed out waiting for ${what}`)), ms));

(async () => {
  console.log(`\nTarget: ${BASE}\n${'─'.repeat(60)}`);

  // 1 — driver comes online over the socket, exactly as the partner app does
  const driver = io(`${BASE}/driver`, { transports: ['websocket'] });
  await Promise.race([
    new Promise((r) => driver.on('connect', r)),
    timeout(8000, 'driver socket connect'),
  ]);
  log('1/6', 'driver socket connected');

  const offered = new Promise((resolve) =>
    driver.once('ride:new_request', resolve),
  );

  driver.emit('driver:go_online', { driverId: DRIVER_ID, ...PICKUP });
  await new Promise((r) => setTimeout(r, 400));
  log('2/6', `driver ${DRIVER_ID} online at pickup`);

  // 2 — passenger asks for a fare, then books
  const est = await post('/api/v1/ride/estimate', {
    pickup: PICKUP,
    drop: DROP,
    rideType: 'SEDAN',
  });
  if (est.status !== 200 && est.status !== 201) fail(`estimate returned ${est.status}`);
  if (est.body.fareEstimate === 250 && est.body.distanceKm === 12.5) {
    fail('estimate is still the hardcoded 250 / 12.5km — old code is running');
  }
  log('3/6', `estimate: ₹${est.body.fareEstimate} for ${est.body.distanceKm}km`);

  const req = await post('/api/v1/ride/request', {
    pickup: PICKUP,
    dropoff: DROP,
    vehicleType: 'SEDAN',
    pickupAddress: 'MG Road, Bengaluru',
    dropAddress: 'Koramangala, Bengaluru',
  });
  if (!req.body?.rideId) fail(`request failed: ${JSON.stringify(req)}`);
  const rideId = req.body.rideId;
  log('4/6', `ride requested → ${rideId} (${req.body.status})`);

  // 3 — the offer must actually reach the driver
  const payload = await Promise.race([offered, timeout(25000, 'ride:new_request')]);
  if (payload.rideId !== rideId) fail(`driver got a different ride: ${payload.rideId}`);
  log('5/6', `driver received ride:new_request for ${rideId} ✓`);

  // 4 — driver accepts; passenger should see it on the next poll
  driver.emit('ride:accepted', { rideId, driverId: DRIVER_ID });

  let status = null;
  for (let i = 0; i < 40; i++) {
    const res = await get(`/api/v1/ride/${rideId}/status`);
    if (res.body?.status === 'ACCEPTED') {
      status = res.body;
      break;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!status) fail('ride never reached ACCEPTED');

  log('6/6', `status = ACCEPTED, driver = ${status.driverDetails?.id}`);

  console.log(`${'─'.repeat(60)}`);
  console.log('driverDetails:', JSON.stringify(status.driverDetails, null, 2));
  if (status.driverDetails?.name === 'Driver Info') {
    fail('driver name is still the "Driver Info" placeholder');
  }

  console.log('\n✅ RIDE REACHED THE DRIVER AND WAS ACCEPTED\n');
  driver.disconnect();
  process.exit(0);
})().catch((err) => fail(err.message));

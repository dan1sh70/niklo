/**
 * The bug this guards against: a driver who went online once stayed in the
 * matching pool forever, so a later ride was "matched" to a socket room nobody
 * was in and hung in REQUESTED with no timeout and no cancel.
 *
 *   node test/live-ghost-check.js [baseUrl]
 */
const { io } = require('socket.io-client');

const BASE = process.argv[2] || 'http://127.0.0.1:3005';
const PICKUP = { lat: 12.9716, lng: 77.5946 };
const DROP = { lat: 12.9352, lng: 77.6245 };

const log = (s, m) => console.log(`[${s}] ${m}`);
const fail = (m) => {
  console.error(`\n❌ FAILED: ${m}`);
  process.exit(1);
};

const post = async (p, b) =>
  (
    await fetch(`${BASE}${p}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b),
    })
  ).json();

const get = async (p) => (await fetch(`${BASE}${p}`)).json();

(async () => {
  console.log(`\nTarget: ${BASE}\n${'─'.repeat(60)}`);

  // A driver connects, goes online, then vanishes.
  const ghost = io(`${BASE}/driver`, { transports: ['websocket'] });
  await new Promise((r) => ghost.on('connect', r));
  ghost.emit('driver:go_online', { driverId: 'ghost-driver', ...PICKUP });
  await new Promise((r) => setTimeout(r, 400));
  log('1/3', 'ghost driver went online');

  ghost.disconnect();
  await new Promise((r) => setTimeout(r, 800));
  log('2/3', 'ghost driver disconnected without going offline');

  // With nobody left online this must terminate, not hang.
  const started = Date.now();
  const req = await post('/api/v1/ride/request', {
    pickup: PICKUP,
    dropoff: DROP,
    vehicleType: 'SEDAN',
    pickupAddress: 'MG Road',
    dropAddress: 'Koramangala',
  });
  const rideId = req.rideId;
  if (!rideId) fail(`request failed: ${JSON.stringify(req)}`);

  let final = null;
  for (let i = 0; i < 300; i++) {
    const s = await get(`/api/v1/ride/${rideId}/status`);
    if (s.status === 'CANCELLED' || s.status === 'ACCEPTED') {
      final = s.status;
      break;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  if (!final) {
    fail(`ride ${rideId} still stuck in REQUESTED after 75s — the old behaviour`);
  }
  if (final !== 'CANCELLED') {
    fail(`expected CANCELLED, got ${final}`);
  }

  log('3/3', `ride resolved to ${final} in ${elapsed}s`);
  console.log(`${'─'.repeat(60)}`);
  console.log('\n✅ NO GHOST MATCH — ride terminated instead of hanging\n');
  process.exit(0);
})().catch((e) => fail(e.message));

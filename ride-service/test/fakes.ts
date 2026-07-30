/**
 * In-memory stand-ins used by the ride smoke test.
 *
 * These are deliberately faithful rather than convenient: the geo commands do
 * real haversine filtering and the TTL actually expires, because the bugs the
 * test is guarding against (stale drivers staying matchable) only show up if
 * those semantics are honest.
 */

type GeoMember = { lng: number; lat: number };

const EARTH_RADIUS_KM = 6371;
const toRad = (d: number) => (d * Math.PI) / 180;

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Implements exactly the subset of ioredis that RedisService touches. */
export class FakeRedisClient {
  private strings = new Map<string, { value: string; expiresAt: number }>();
  private geo = new Map<string, Map<string, GeoMember>>();
  private subscribers: ((channel: string, message: string) => void)[] = [];

  // Lets a test fast-forward past a TTL without sleeping.
  clockSkewMs = 0;

  private now() {
    return Date.now() + this.clockSkewMs;
  }

  private live(key: string) {
    const entry = this.strings.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= this.now()) {
      this.strings.delete(key);
      return null;
    }
    return entry.value;
  }

  async setex(key: string, seconds: number, value: string) {
    this.strings.set(key, {
      value,
      expiresAt: this.now() + seconds * 1000,
    });
    return 'OK';
  }

  async get(key: string) {
    return this.live(key);
  }

  async mget(...keys: string[]) {
    return keys.map((k) => this.live(k));
  }

  async del(...keys: string[]) {
    let n = 0;
    for (const k of keys) if (this.strings.delete(k)) n++;
    return n;
  }

  async geoadd(key: string, lng: number, lat: number, member: string) {
    const set = this.geo.get(key) ?? new Map<string, GeoMember>();
    const isNew = !set.has(member);
    set.set(member, { lng, lat });
    this.geo.set(key, set);
    return isNew ? 1 : 0;
  }

  async zrem(key: string, ...members: string[]) {
    const set = this.geo.get(key);
    if (!set) return 0;
    let n = 0;
    for (const m of members) if (set.delete(m)) n++;
    return n;
  }

  /** geosearch KEY FROMLONLAT lng lat BYRADIUS r km ASC */
  async geosearch(key: string, ...args: any[]) {
    const lng = Number(args[1]);
    const lat = Number(args[2]);
    const radiusKm = Number(args[4]);

    const set = this.geo.get(key);
    if (!set) return [];

    return [...set.entries()]
      .map(([member, pos]) => ({
        member,
        distance: haversineKm({ lat, lng }, { lat: pos.lat, lng: pos.lng }),
      }))
      .filter((e) => e.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .map((e) => e.member);
  }

  async publish(channel: string, message: string) {
    // Deliver asynchronously, like a real broker would.
    for (const fn of this.subscribers) {
      setImmediate(() => fn(channel, message));
    }
    return this.subscribers.length;
  }

  async subscribe(_channel: string) {
    return 1;
  }

  on(event: string, cb: any) {
    if (event === 'message') this.subscribers.push(cb);
  }

  disconnect() {}

  // Test helpers
  geoMembers(key: string) {
    return [...(this.geo.get(key)?.keys() ?? [])];
  }
}

/** Minimal Repository<Ride> covering what RidesService calls. */
export class FakeRideRepository {
  rows = new Map<string, any>();
  private seq = 0;

  create(data: any) {
    return { ...data };
  }

  async save(entity: any) {
    const isInsert = !entity.id;
    if (isInsert) entity.id = `ride-${++this.seq}`;

    // Stand in for @CreateDateColumn / @UpdateDateColumn, which Postgres fills
    // on insert. History orders on created_at, so a fake that left it undefined
    // would let a broken sort pass.
    const existing = this.rows.get(entity.id);
    entity.created_at = existing?.created_at ?? entity.created_at ?? new Date();
    entity.updated_at = new Date();

    this.rows.set(entity.id, { ...entity });
    return { ...entity };
  }

  async findOne({ where }: any) {
    const row = this.rows.get(where.id);
    return row ? { ...row } : null;
  }

  async find({ where, order, take }: any) {
    const clauses = Array.isArray(where) ? where : [where];
    let rows = [...this.rows.values()]
      .filter((row) =>
        clauses.some((c) =>
          Object.entries(c).every(([k, v]) => row[k] === v),
        ),
      )
      .map((r) => ({ ...r }));

    for (const [field, direction] of Object.entries(order ?? {})) {
      const sign = String(direction).toUpperCase() === 'DESC' ? -1 : 1;
      rows.sort((a, b) => {
        const av = a[field] ?? 0;
        const bv = b[field] ?? 0;
        if (av === bv) return 0;
        return av < bv ? -sign : sign;
      });
    }

    if (typeof take === 'number') rows = rows.slice(0, take);
    return rows;
  }
}

import { Pool, PoolConfig } from 'pg';
import { discoverProject } from './discovery';

interface MockColumn {
  name: string;
  type: string;
  isNullable: boolean;
  defaultValue: any;
  isPrimaryKey: boolean;
}

interface MockTable {
  columns: MockColumn[];
  primaryKeys: string[];
  rows: any[];
}

interface MockServiceDb {
  [tableName: string]: MockTable;
}

class DatabaseManager {
  private pools: { [serviceName: string]: Pool } = {};
  public mockModes: { [serviceName: string]: boolean } = {};

  // Comprehensive Mock Database fallbacks
  public mockDb: { [serviceName: string]: MockServiceDb } = {
    'user-service': {
      'users': {
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, defaultValue: 'uuid_generate_v4()', isPrimaryKey: true },
          { name: 'name', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'email', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'role', type: 'character varying', isNullable: false, defaultValue: 'user', isPrimaryKey: false },
          { name: 'active', type: 'boolean', isNullable: false, defaultValue: true, isPrimaryKey: false },
          { name: 'created_at', type: 'timestamp with time zone', isNullable: false, defaultValue: 'NOW()', isPrimaryKey: false },
        ],
        primaryKeys: ['id'],
        rows: [
          { id: '11111111-1111-1111-1111-111111111111', name: 'John Doe', email: 'john@niklo.com', role: 'admin', active: true, created_at: new Date().toISOString() },
          { id: '22222222-2222-2222-2222-222222222222', name: 'Jane Smith', email: 'jane@niklo.com', role: 'user', active: true, created_at: new Date().toISOString() },
          { id: '33333333-3333-3333-3333-333333333333', name: 'Bob Driver', email: 'bob@driver.niklo.com', role: 'driver', active: true, created_at: new Date().toISOString() },
          { id: '44444444-4444-4444-4444-444444444444', name: 'Alice Passenger', email: 'alice@gmail.com', role: 'user', active: false, created_at: new Date().toISOString() },
        ]
      },
      'roles': {
        columns: [
          { name: 'id', type: 'integer', isNullable: false, defaultValue: null, isPrimaryKey: true },
          { name: 'name', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'permissions', type: 'text', isNullable: true, defaultValue: null, isPrimaryKey: false },
        ],
        primaryKeys: ['id'],
        rows: [
          { id: 1, name: 'admin', permissions: '*:*:*' },
          { id: 2, name: 'user', permissions: 'ride:read,ride:create,hotel:read' },
          { id: 3, name: 'driver', permissions: 'ride:read,ride:update,location:update' }
        ]
      }
    },
    'driver-service': {
      'drivers': {
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, defaultValue: 'uuid_generate_v4()', isPrimaryKey: true },
          { name: 'user_id', type: 'uuid', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'vehicle_type', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'license_plate', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'rating', type: 'numeric', isNullable: true, defaultValue: 5.0, isPrimaryKey: false },
          { name: 'active', type: 'boolean', isNullable: false, defaultValue: true, isPrimaryKey: false },
        ],
        primaryKeys: ['id'],
        rows: [
          { id: 'd1111111-1111-1111-1111-111111111111', user_id: '33333333-3333-3333-3333-333333333333', vehicle_type: 'Sedan', license_plate: 'KA-01-MJ-1234', rating: 4.8, active: true },
          { id: 'd2222222-2222-2222-2222-222222222222', user_id: '11111111-1111-1111-1111-111111111111', vehicle_type: 'SUV', license_plate: 'KA-03-TR-9876', rating: 4.9, active: false }
        ]
      }
    },
    'ride-service': {
      'rides': {
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, defaultValue: 'uuid_generate_v4()', isPrimaryKey: true },
          { name: 'passenger_id', type: 'uuid', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'driver_id', type: 'uuid', isNullable: true, defaultValue: null, isPrimaryKey: false },
          { name: 'pickup_location', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'drop_location', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'status', type: 'character varying', isNullable: false, defaultValue: 'PENDING', isPrimaryKey: false },
          { name: 'fare', type: 'numeric', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'created_at', type: 'timestamp with time zone', isNullable: false, defaultValue: 'NOW()', isPrimaryKey: false }
        ],
        primaryKeys: ['id'],
        rows: [
          { id: 'r1111111-1111-1111-1111-111111111111', passenger_id: '22222222-2222-2222-2222-222222222222', driver_id: 'd1111111-1111-1111-1111-111111111111', pickup_location: 'Koramangala', drop_location: 'Indiranagar', status: 'COMPLETED', fare: 250.00, created_at: new Date().toISOString() },
          { id: 'r2222222-2222-2222-2222-222222222222', passenger_id: '44444444-4444-4444-4444-444444444444', driver_id: null, pickup_location: 'HSR Layout', drop_location: 'Whitefield', status: 'PENDING', fare: 420.50, created_at: new Date().toISOString() }
        ]
      }
    },
    'hotel-service': {
      'bookings': {
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, defaultValue: 'uuid_generate_v4()', isPrimaryKey: true },
          { name: 'passenger_id', type: 'uuid', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'hotel_name', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'room_number', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'check_in', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'check_out', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'status', type: 'character varying', isNullable: false, defaultValue: 'CONFIRMED', isPrimaryKey: false },
          { name: 'amount', type: 'numeric', isNullable: false, defaultValue: null, isPrimaryKey: false }
        ],
        primaryKeys: ['id'],
        rows: [
          { id: 'b1111111-1111-1111-1111-111111111111', passenger_id: '22222222-2222-2222-2222-222222222222', hotel_name: 'The Oberoi Bangalore', room_number: '302', check_in: '2026-07-10', check_out: '2026-07-15', status: 'CONFIRMED', amount: 45000.00 }
        ]
      }
    },
    'payment-service': {
      'payments': {
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, defaultValue: 'uuid_generate_v4()', isPrimaryKey: true },
          { name: 'booking_id', type: 'uuid', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'passenger_id', type: 'uuid', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'amount', type: 'numeric', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'payment_method', type: 'character varying', isNullable: false, defaultValue: 'Card', isPrimaryKey: false },
          { name: 'status', type: 'character varying', isNullable: false, defaultValue: 'SUCCESS', isPrimaryKey: false },
          { name: 'created_at', type: 'timestamp with time zone', isNullable: false, defaultValue: 'NOW()', isPrimaryKey: false }
        ],
        primaryKeys: ['id'],
        rows: [
          { id: 'p1111111-1111-1111-1111-111111111111', booking_id: 'b1111111-1111-1111-1111-111111111111', passenger_id: '22222222-2222-2222-2222-222222222222', amount: 45000.00, payment_method: 'Card', status: 'SUCCESS', created_at: new Date().toISOString() }
        ]
      }
    },
    'adventure-service': {
      'adventures': {
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, defaultValue: 'uuid_generate_v4()', isPrimaryKey: true },
          { name: 'name', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'location', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'price', type: 'numeric', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'duration', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'difficulty', type: 'character varying', isNullable: false, defaultValue: 'Medium', isPrimaryKey: false },
          { name: 'active', type: 'boolean', isNullable: false, defaultValue: true, isPrimaryKey: false }
        ],
        primaryKeys: ['id'],
        rows: [
          { id: 'a1111111-1111-1111-1111-111111111111', name: 'Nandi Hills Trekking', location: 'Nandi Hills', price: 1500.00, duration: '4 Hours', difficulty: 'Easy', active: true },
          { id: 'a2222222-2222-2222-2222-222222222222', name: 'Dandeli White Water Rafting', location: 'Dandeli', price: 3500.00, duration: '2 Hours', difficulty: 'Hard', active: true }
        ]
      }
    },
    'notification-service': {
      'notifications': {
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, defaultValue: 'uuid_generate_v4()', isPrimaryKey: true },
          { name: 'recipient_id', type: 'uuid', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'title', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'message', type: 'text', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'type', type: 'character varying', isNullable: false, defaultValue: 'PUSH', isPrimaryKey: false },
          { name: 'sent', type: 'boolean', isNullable: false, defaultValue: true, isPrimaryKey: false },
          { name: 'created_at', type: 'timestamp with time zone', isNullable: false, defaultValue: 'NOW()', isPrimaryKey: false }
        ],
        primaryKeys: ['id'],
        rows: [
          { id: 'n1111111-1111-1111-1111-111111111111', recipient_id: '22222222-2222-2222-2222-222222222222', title: 'Ride Confirmed', message: 'Your ride is confirmed. Driver Bob is on the way.', type: 'PUSH', sent: true, created_at: new Date().toISOString() }
        ]
      }
    },
    'package-service': {
      'packages': {
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, defaultValue: 'uuid_generate_v4()', isPrimaryKey: true },
          { name: 'sender_id', type: 'uuid', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'recipient_name', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'recipient_phone', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'weight', type: 'numeric', isNullable: false, defaultValue: 1.0, isPrimaryKey: false },
          { name: 'delivery_address', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'status', type: 'character varying', isNullable: false, defaultValue: 'DISPATCHED', isPrimaryKey: false },
          { name: 'created_at', type: 'timestamp with time zone', isNullable: false, defaultValue: 'NOW()', isPrimaryKey: false }
        ],
        primaryKeys: ['id'],
        rows: [
          { id: 'pk111111-1111-1111-1111-111111111111', sender_id: '22222222-2222-2222-2222-222222222222', recipient_name: 'Charlie Smith', recipient_phone: '+919876543210', weight: 2.5, delivery_address: 'JP Nagar 5th Phase', status: 'DISPATCHED', created_at: new Date().toISOString() }
        ]
      }
    },
    'bus-service': {
      'schedules': {
        columns: [
          { name: 'id', type: 'uuid', isNullable: false, defaultValue: 'uuid_generate_v4()', isPrimaryKey: true },
          { name: 'bus_number', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'route_from', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'route_to', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'departure_time', type: 'character varying', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'fare', type: 'numeric', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'active', type: 'boolean', isNullable: false, defaultValue: true, isPrimaryKey: false }
        ],
        primaryKeys: ['id'],
        rows: [
          { id: 's1111111-1111-1111-1111-111111111111', bus_number: 'KA-01-F-999', route_from: 'Majestic', route_to: 'Electronic City', departure_time: '08:30 AM', fare: 80.00, active: true }
        ]
      }
    }
  };

  private async getPool(serviceName: string): Promise<Pool> {
    if (this.pools[serviceName]) {
      return this.pools[serviceName];
    }

    const project = discoverProject();
    const config = project.services[serviceName]?.dbConfig;

    if (!config) {
      throw new Error(`No database configuration discovered for service: ${serviceName}`);
    }

    const isDocker = fsExists('/.dockerenv') || process.env.WORKSPACE_PATH === '/workspace';
    const host = isDocker ? config.host : 'localhost';

    const poolConfig: PoolConfig = {
      host,
      port: config.port,
      user: config.user,
      password: config.pass,
      database: config.name,
      connectionTimeoutMillis: 5000,
    };

    console.log(`Connecting to Postgres DB for ${serviceName} at ${host}:${config.port}/${config.name}...`);
    const pool = new Pool(poolConfig);

    try {
      const client = await pool.connect();
      client.release();
      this.pools[serviceName] = pool;
      return pool;
    } catch (err: any) {
      console.warn(`Failed to connect to ${host}:${config.port} for ${serviceName}. Trying localhost fallback...`);
      if (host !== 'localhost') {
        try {
          const fallbackPool = new Pool({ ...poolConfig, host: 'localhost' });
          const client = await fallbackPool.connect();
          client.release();
          this.pools[serviceName] = fallbackPool;
          return fallbackPool;
        } catch (fbErr: any) {
          pool.end();
          throw new Error(`Failed to connect to database for ${serviceName} on both ${host} and localhost: ${fbErr.message}`);
        }
      }
      pool.end();
      throw err;
    }
  }

  // Get list of tables (with fallback to Mock DB)
  async getTables(serviceName: string): Promise<string[]> {
    if (this.mockModes[serviceName]) {
      return Object.keys(this.mockDb[serviceName] || {});
    }
    try {
      const pool = await this.getPool(serviceName);
      const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;
      const res = await pool.query(query);
      return res.rows.map((r: any) => r.table_name);
    } catch (err: any) {
      console.warn(`[Fallback Switch] Connection failed to ${serviceName} DB. Activating Mock Mode Fallback.`);
      this.mockModes[serviceName] = true;
      return Object.keys(this.mockDb[serviceName] || {});
    }
  }

  // Get table column schema and primary keys (with fallback to Mock DB)
  async getTableSchema(serviceName: string, tableName: string) {
    if (this.mockModes[serviceName]) {
      const table = this.mockDb[serviceName]?.[tableName];
      if (!table) throw new Error(`Table ${tableName} not found in mock DB.`);
      return {
        tableName,
        columns: table.columns,
        primaryKeys: table.primaryKeys,
        foreignKeys: [],
      };
    }

    try {
      const pool = await this.getPool(serviceName);
      const columnsQuery = `
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      const colsRes = await pool.query(columnsQuery, [tableName]);

      const pkQuery = `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1
          AND tc.table_schema = 'public';
      `;
      const pkRes = await pool.query(pkQuery, [tableName]);
      const primaryKeys = pkRes.rows.map((r: any) => r.column_name);

      const fkQuery = `
        SELECT
          kcu.column_name AS column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1;
      `;
      const fkRes = await pool.query(fkQuery, [tableName]);
      const foreignKeys = fkRes.rows.map((r: any) => ({
        column: r.column_name,
        foreignTable: r.foreign_table_name,
        foreignColumn: r.foreign_column_name,
      }));

      return {
        tableName,
        columns: colsRes.rows.map((r: any) => ({
          name: r.column_name,
          type: r.data_type,
          isNullable: r.is_nullable === 'YES',
          defaultValue: r.column_default,
          isPrimaryKey: primaryKeys.includes(r.column_name),
        })),
        primaryKeys,
        foreignKeys,
      };
    } catch (err) {
      this.mockModes[serviceName] = true;
      const table = this.mockDb[serviceName]?.[tableName];
      if (!table) throw new Error(`Table ${tableName} not found in mock DB.`);
      return {
        tableName,
        columns: table.columns,
        primaryKeys: table.primaryKeys,
        foreignKeys: [],
      };
    }
  }

  // Get table rows (with fallback to Mock DB)
  async getRows(
    serviceName: string,
    tableName: string,
    page: number = 1,
    limit: number = 20,
    sortCol?: string,
    sortDir: 'ASC' | 'DESC' = 'ASC',
    filters: { [col: string]: string } = {}
  ): Promise<{ rows: any[]; total: number; page: number; limit: number; totalPages: number }> {
    if (this.mockModes[serviceName]) {
      const table = this.mockDb[serviceName]?.[tableName];
      if (!table) throw new Error(`Table ${tableName} not found in mock DB.`);
      
      let rows = [...table.rows];

      // Apply search/filters
      for (const [col, val] of Object.entries(filters)) {
        if (val !== undefined && val !== null && val !== '') {
          rows = rows.filter(r => String(r[col] ?? '').toLowerCase().includes(String(val).toLowerCase()));
        }
      }

      // Apply sorting
      if (sortCol) {
        rows.sort((a, b) => {
          const valA = a[sortCol];
          const valB = b[sortCol];
          if (valA === valB) return 0;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;
          
          const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
          return sortDir === 'DESC' ? -comparison : comparison;
        });
      }

      const total = rows.length;
      const offset = (page - 1) * limit;
      const paginatedRows = rows.slice(offset, offset + limit);

      return {
        rows: paginatedRows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    try {
      const pool = await this.getPool(serviceName);
      const offset = (page - 1) * limit;

      const filterClauses: string[] = [];
      const values: any[] = [];
      let valIndex = 1;

      for (const [col, val] of Object.entries(filters)) {
        if (val !== undefined && val !== null && val !== '') {
          const cleanCol = col.replace(/[^a-zA-Z0-9_]/g, '');
          if (cleanCol) {
            filterClauses.push(`"${cleanCol}"::text ILIKE $${valIndex}`);
            values.push(`%${val}%`);
            valIndex++;
          }
        }
      }

      const whereClause = filterClauses.length > 0 ? `WHERE ${filterClauses.join(' AND ')}` : '';

      let orderClause = '';
      if (sortCol) {
        const cleanSortCol = sortCol.replace(/[^a-zA-Z0-9_]/g, '');
        if (cleanSortCol) {
          orderClause = `ORDER BY "${cleanSortCol}" ${sortDir === 'DESC' ? 'DESC' : 'ASC'}`;
        }
      }

      const query = `
        SELECT * 
        FROM "${tableName}"
        ${whereClause}
        ${orderClause}
        LIMIT $${valIndex} OFFSET $${valIndex + 1};
      `;
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM "${tableName}"
        ${whereClause};
      `;

      const queryParams = [...values, limit, offset];
      const countParams = [...values];

      const [rowsRes, countRes] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, countParams),
      ]);

      const total = parseInt(countRes.rows[0].total, 10);

      return {
        rows: rowsRes.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (err) {
      this.mockModes[serviceName] = true;
      return this.getRows(serviceName, tableName, page, limit, sortCol, sortDir, filters);
    }
  }

  // Create a new row (with fallback to Mock DB)
  async createRow(serviceName: string, tableName: string, data: any): Promise<any> {
    if (this.mockModes[serviceName]) {
      const table = this.mockDb[serviceName]?.[tableName];
      if (!table) throw new Error(`Table ${tableName} not found in mock DB.`);
      
      const row = { ...data };
      table.columns.forEach(col => {
        if (col.isPrimaryKey && (!row[col.name])) {
          if (col.type === 'uuid') {
            row[col.name] = 'mock-' + Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 10);
          } else if (col.type.includes('int')) {
            row[col.name] = table.rows.reduce((max, r) => Math.max(max, Number(r[col.name] || 0)), 0) + 1;
          }
        }
        if (row[col.name] === undefined) {
          row[col.name] = col.defaultValue !== null ? col.defaultValue : null;
        }
      });

      table.rows.push(row);
      return row;
    }

    try {
      const pool = await this.getPool(serviceName);
      const cols: string[] = [];
      const vals: any[] = [];
      const placeholders: string[] = [];

      let i = 1;
      for (const [col, val] of Object.entries(data)) {
        const cleanCol = col.replace(/[^a-zA-Z0-9_]/g, '');
        if (cleanCol) {
          cols.push(`"${cleanCol}"`);
          vals.push(val);
          placeholders.push(`$${i}`);
          i++;
        }
      }

      const query = `
        INSERT INTO "${tableName}" (${cols.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *;
      `;

      const res = await pool.query(query, vals);
      return res.rows[0];
    } catch (err) {
      this.mockModes[serviceName] = true;
      return this.createRow(serviceName, tableName, data);
    }
  }

  // Update a row (with fallback to Mock DB)
  async updateRow(serviceName: string, tableName: string, pkData: { [key: string]: any }, data: any): Promise<any> {
    if (this.mockModes[serviceName]) {
      const table = this.mockDb[serviceName]?.[tableName];
      if (!table) throw new Error(`Table ${tableName} not found in mock DB.`);

      const rowIndex = table.rows.findIndex(r => 
        Object.keys(pkData).every(pk => String(r[pk]) === String(pkData[pk]))
      );
      if (rowIndex === -1) throw new Error(`Record matching key specification not found.`);

      table.rows[rowIndex] = { ...table.rows[rowIndex], ...data };
      return table.rows[rowIndex];
    }

    try {
      const pool = await this.getPool(serviceName);
      const updateClauses: string[] = [];
      const vals: any[] = [];
      let i = 1;

      for (const [col, val] of Object.entries(data)) {
        const cleanCol = col.replace(/[^a-zA-Z0-9_]/g, '');
        if (cleanCol) {
          updateClauses.push(`"${cleanCol}" = $${i}`);
          vals.push(val);
          i++;
        }
      }

      const pkClauses: string[] = [];
      for (const [col, val] of Object.entries(pkData)) {
        const cleanCol = col.replace(/[^a-zA-Z0-9_]/g, '');
        if (cleanCol) {
          pkClauses.push(`"${cleanCol}" = $${i}`);
          vals.push(val);
          i++;
        }
      }

      if (updateClauses.length === 0 || pkClauses.length === 0) {
        throw new Error('Update requires at least one data field and primary key specifier.');
      }

      const query = `
        UPDATE "${tableName}"
        SET ${updateClauses.join(', ')}
        WHERE ${pkClauses.join(' AND ')}
        RETURNING *;
      `;

      const res = await pool.query(query, vals);
      return res.rows[0];
    } catch (err) {
      this.mockModes[serviceName] = true;
      return this.updateRow(serviceName, tableName, pkData, data);
    }
  }

  // Delete a row (with fallback to Mock DB)
  async deleteRow(serviceName: string, tableName: string, pkData: { [key: string]: any }): Promise<number> {
    if (this.mockModes[serviceName]) {
      const table = this.mockDb[serviceName]?.[tableName];
      if (!table) throw new Error(`Table ${tableName} not found in mock DB.`);

      const initialLen = table.rows.length;
      table.rows = table.rows.filter(r => 
        !Object.keys(pkData).every(pk => String(r[pk]) === String(pkData[pk]))
      );
      return initialLen - table.rows.length;
    }

    try {
      const pool = await this.getPool(serviceName);
      const pkClauses: string[] = [];
      const vals: any[] = [];
      let i = 1;

      for (const [col, val] of Object.entries(pkData)) {
        const cleanCol = col.replace(/[^a-zA-Z0-9_]/g, '');
        if (cleanCol) {
          pkClauses.push(`"${cleanCol}" = $${i}`);
          vals.push(val);
          i++;
        }
      }

      if (pkClauses.length === 0) {
        throw new Error('Delete requires a primary key specifier.');
      }

      const query = `
        DELETE FROM "${tableName}"
        WHERE ${pkClauses.join(' AND ')}
        RETURNING *;
      `;

      const res = await pool.query(query, vals);
      return res.rowCount ?? 0;
    } catch (err) {
      this.mockModes[serviceName] = true;
      return this.deleteRow(serviceName, tableName, pkData);
    }
  }

  // Execute raw query (with fallback to Mock DB)
  async runQuery(serviceName: string, sql: string) {
    if (this.mockModes[serviceName]) {
      return {
        command: 'SELECT',
        rowCount: 1,
        rows: [{ message: 'Running query in mock database fallback mode.' }],
        fields: [{ name: 'message', type: 25 }],
      };
    }

    try {
      const pool = await this.getPool(serviceName);
      const res = await pool.query(sql);
      return {
        command: res.command,
        rowCount: res.rowCount,
        rows: res.rows,
        fields: res.fields?.map(f => ({ name: f.name, type: f.dataTypeID })),
      };
    } catch (err) {
      this.mockModes[serviceName] = true;
      return {
        command: 'SELECT',
        rowCount: 1,
        rows: [{ message: 'Running query in mock database fallback mode.' }],
        fields: [{ name: 'message', type: 25 }],
      };
    }
  }

  // Close all pools
  async closeAll() {
    for (const [name, pool] of Object.entries(this.pools)) {
      await pool.end();
      delete this.pools[name];
    }
  }
}

function fsExists(pathStr: string): boolean {
  try {
    return require('fs').existsSync(pathStr);
  } catch {
    return false;
  }
}

export const dbManager = new DatabaseManager();

import express, { Request, Response } from 'express';
import cors from 'cors';
import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import Redis from 'ioredis';
import * as path from 'path';
import * as fs from 'fs';
import { discoverProject, watchProjectChanges } from './discovery';
import { dbManager } from './db';
import { listContainers, containerAction, streamLogs, getContainerStats } from './docker';
import { generateUnifiedOpenApiSpec } from './swagger';

const app = express();
const port = process.env.PORT || 3020;

app.use(cors());
app.use(express.json());

const workspacePath = process.env.WORKSPACE_PATH || path.resolve(__dirname, '../../');

app.get('/api/v1/admin/swagger-spec', (req: Request, res: Response) => {
  try {
    const spec = generateUnifiedOpenApiSpec(workspacePath);
    res.json(spec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get(['/swagger', '/swagger/'], (req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'swagger.html'));
});

// Serve static frontend files from 'public' directory
const publicDir = path.join(__dirname, 'public');
const srcPublicDir = path.join(__dirname, '../src/public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Auto-copy assets if source exists (e.g. during local build)
if (fs.existsSync(srcPublicDir)) {
  try {
    const srcFiles = fs.readdirSync(srcPublicDir);
    for (const file of srcFiles) {
      const srcFilePath = path.join(srcPublicDir, file);
      const destFilePath = path.join(publicDir, file);
      if (fs.statSync(srcFilePath).isFile()) {
        fs.copyFileSync(srcFilePath, destFilePath);
      }
    }
    console.log('Successfully self-healed static public files into dist/public.');
  } catch (err: any) {
    console.warn('Assets copy warning:', err.message);
  }
}

app.use('/admin', express.static(publicDir));
app.use(express.static(publicDir)); // fallback root

// API 1: Discovery Endpoint
app.get('/api/v1/admin/discovery', (req: Request, res: Response) => {
  try {
    const data = discoverProject();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 2: Docker Containers list
app.get('/api/v1/admin/docker/containers', async (req: Request, res: Response) => {
  try {
    const list = await listContainers();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 3: Docker Container Actions (Start, Stop, Restart)
app.post('/api/v1/admin/docker/:service/action', async (req: Request, res: Response) => {
  const { service } = req.params;
  const { action } = req.body; // 'start', 'stop', 'restart'
  if (!['start', 'stop', 'restart'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Must be start, stop or restart.' });
  }

  try {
    const success = await containerAction(service, action);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 4: List Database Tables for a service
app.get('/api/v1/admin/db/tables/:service', async (req: Request, res: Response) => {
  const { service } = req.params;
  try {
    const tables = await dbManager.getTables(service);
    res.json({ tables });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 5: Get Database Table Schema
app.get('/api/v1/admin/db/schema/:service/:table', async (req: Request, res: Response) => {
  const { service, table } = req.params;
  try {
    const schema = await dbManager.getTableSchema(service, table);
    res.json(schema);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 6: Paginated, Sorted and Filtered Table Rows
app.post('/api/v1/admin/db/rows/:service/:table', async (req: Request, res: Response) => {
  const { service, table } = req.params;
  const { page, limit, sortCol, sortDir, filters } = req.body;
  try {
    const data = await dbManager.getRows(service, table, page, limit, sortCol, sortDir, filters);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 7: Create Row in table
app.post('/api/v1/admin/db/create/:service/:table', async (req: Request, res: Response) => {
  const { service, table } = req.params;
  const data = req.body;
  try {
    const row = await dbManager.createRow(service, table, data);
    res.json({ success: true, row });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 8: Update Row in table
app.post('/api/v1/admin/db/update/:service/:table', async (req: Request, res: Response) => {
  const { service, table } = req.params;
  const { pkData, data } = req.body;
  try {
    const row = await dbManager.updateRow(service, table, pkData, data);
    res.json({ success: true, row });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 9: Delete Row from table
app.post('/api/v1/admin/db/delete/:service/:table', async (req: Request, res: Response) => {
  const { service, table } = req.params;
  const { pkData } = req.body;
  try {
    const count = await dbManager.deleteRow(service, table, pkData);
    res.json({ success: true, deletedCount: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 10: Run Raw SQL query
app.post('/api/v1/admin/db/query/:service', async (req: Request, res: Response) => {
  const { service } = req.params;
  const { sql } = req.body;
  if (!sql) {
    return res.status(400).json({ error: 'SQL query parameter is required.' });
  }
  try {
    const result = await dbManager.runQuery(service, sql);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Redis Client Cache
let redisClient: Redis | null = null;
function getRedisClient(): Redis {
  if (redisClient) return redisClient;
  const project = discoverProject();
  const isDocker = fs.existsSync('/.dockerenv') || process.env.WORKSPACE_PATH === '/workspace';
  const host = isDocker ? 'redis' : 'localhost';
  redisClient = new Redis({ host, port: 6379, connectTimeout: 3000, maxRetriesPerRequest: null });
  redisClient.on('error', (err) => console.error('Admin Panel Redis Error:', err));
  return redisClient;
}

// API 11: List/Search Redis Keys
app.get('/api/v1/admin/redis/keys', async (req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    const query = (req.query.pattern as string) || '*';
    const keys = await redis.keys(query);
    
    const details = [];
    for (const key of keys.slice(0, 100)) { // Limit to 100 keys for performance
      const type = await redis.type(key);
      const ttl = await redis.ttl(key);
      details.push({ key, type, ttl });
    }
    res.json({ keys: details });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 12: Get Redis Key Value
app.get('/api/v1/admin/redis/key/:key', async (req: Request, res: Response) => {
  const { key } = req.params;
  try {
    const redis = getRedisClient();
    const type = await redis.type(key);
    let value: any = null;

    if (type === 'string') {
      value = await redis.get(key);
    } else if (type === 'hash') {
      value = await redis.hgetall(key);
    } else if (type === 'list') {
      value = await redis.lrange(key, 0, -1);
    } else if (type === 'set') {
      value = await redis.smembers(key);
    } else if (type === 'zset') {
      value = await redis.zrange(key, 0, -1, 'WITHSCORES');
    }

    const ttl = await redis.ttl(key);
    res.json({ key, type, value, ttl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 13: Delete Redis Key
app.delete('/api/v1/admin/redis/key/:key', async (req: Request, res: Response) => {
  const { key } = req.params;
  try {
    const redis = getRedisClient();
    const deletedCount = await redis.del(key);
    res.json({ success: true, deletedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 14: Dynamic API Proxy to Microservices
app.all('/api/v1/admin/proxy/*', async (req: Request, res: Response) => {
  const targetPath = req.params[0] || '';
  const project = discoverProject();
  
  // Find which Nginx route matches this URL prefix
  // e.g. path matches "/api/v1/auth/" for targetPath = "api/v1/auth/otp/send"
  const matchedRoute = project.nginxRoutes.find(r => 
    ('/' + targetPath).startsWith(r.path)
  );

  if (!matchedRoute) {
    return res.status(404).json({ error: `Auto-discovery could not match endpoint /${targetPath} to any microservice.` });
  }

  const isDocker = fs.existsSync('/.dockerenv') || process.env.WORKSPACE_PATH === '/workspace';
  const host = isDocker ? matchedRoute.targetService : 'localhost';
  const url = `http://${host}:${matchedRoute.targetPort}/${targetPath}${req.url.substring(req.url.indexOf('?') >= 0 ? req.url.indexOf('?') : req.url.length)}`;

  console.log(`Proxying ${req.method} request to ${url}...`);

  try {
    // Construct headers, forwarding authentication details
    const headers: { [key: string]: string } = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (k && v && !['host', 'connection', 'content-length'].includes(k.toLowerCase())) {
        headers[k] = Array.isArray(v) ? v.join(', ') : String(v);
      }
    }

    const response = await fetch(url, {
      method: req.method,
      headers: headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const status = response.status;
    const resHeaders: { [key: string]: string } = {};
    response.headers.forEach((value, key) => {
      resHeaders[key] = value;
    });

    let resBody: any;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      resBody = await response.json();
    } else {
      resBody = await response.text();
    }

    res.status(status).set(resHeaders).send(resBody);
  } catch (err: any) {
    console.error(`Proxy failure for ${url}:`, err.message);
    res.status(502).json({ error: `Bad Gateway proxying to ${url}: ${err.message}` });
  }
});

// API 15: Edit config file (.env of service)
app.post('/api/v1/admin/config/edit/:service', (req: Request, res: Response) => {
  const { service } = req.params;
  const { envKey, envValue } = req.body;
  if (!envKey) {
    return res.status(400).json({ error: 'Environment Key is required' });
  }

  const project = discoverProject();
  const serviceConfig = project.services[service];
  if (!serviceConfig) {
    return res.status(404).json({ error: `Service ${service} not found.` });
  }

  const envPath = path.join(serviceConfig.path, '.env');
  try {
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }
    
    const lines = content.split('\n');
    let found = false;
    const newLines = lines.map(line => {
      if (line.trim().startsWith(`${envKey}=`)) {
        found = true;
        return `${envKey}=${envValue}`;
      }
      return line;
    });

    if (!found) {
      newLines.push(`${envKey}=${envValue}`);
    }

    fs.writeFileSync(envPath, newLines.join('\n'));
    res.json({ success: true, message: `Updated configuration ${envKey} in ${service}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setup HTTP Server & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// WebSockets implementation
wss.on('connection', (ws: WebSocket) => {
  console.log('WS Connection established');
  
  let activeLogStream: { close: () => void } | null = null;
  let statsIntervalId: NodeJS.Timeout | null = null;
  let redisSub: Redis | null = null;

  ws.on('message', async (message: string) => {
    try {
      const payload = JSON.parse(message);
      
      // 1. Subscribe container logs
      if (payload.type === 'subscribe-logs') {
        if (activeLogStream) activeLogStream.close();
        
        const service = payload.service;
        console.log(`WS subscribing logs for: ${service}`);
        activeLogStream = streamLogs(
          service,
          (logChunk) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'log-data', service, data: logChunk }));
            }
          },
          (err) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'log-error', service, data: err.message }));
            }
          }
        );
      }
      
      // 2. Unsubscribe logs
      else if (payload.type === 'unsubscribe-logs') {
        if (activeLogStream) {
          activeLogStream.close();
          activeLogStream = null;
        }
      }

      // 3. Subscribe Redis Pub/Sub events
      else if (payload.type === 'subscribe-redis') {
        if (redisSub) redisSub.disconnect();
        
        console.log('WS subscribing Redis Pub/Sub...');
        const project = discoverProject();
        const isDocker = fs.existsSync('/.dockerenv') || process.env.WORKSPACE_PATH === '/workspace';
        const host = isDocker ? 'redis' : 'localhost';
        redisSub = new Redis({ host, port: 6379, connectTimeout: 3000, maxRetriesPerRequest: null });
        redisSub.psubscribe('*');
        redisSub.on('pmessage', (pattern, channel, msg) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'redis-event',
              channel,
              message: msg,
              timestamp: new Date().toISOString()
            }));
          }
        });
        redisSub.on('error', (err) => {
          console.error('WS Redis subscriber error:', err.message);
        });
      }

      // 4. Unsubscribe Redis
      else if (payload.type === 'unsubscribe-redis') {
        if (redisSub) {
          redisSub.disconnect();
          redisSub = null;
        }
      }

      // 5. Subscribe Container Resource Stats
      else if (payload.type === 'subscribe-stats') {
        if (statsIntervalId) clearInterval(statsIntervalId);
        
        console.log('WS subscribing resource stats...');
        statsIntervalId = setInterval(async () => {
          try {
            const containers = await listContainers();
            const statsList = [];
            for (const c of containers) {
              const stat = await getContainerStats(c.id);
              statsList.push({
                service: c.service,
                cpu: stat.cpu,
                memory: stat.memory,
              });
            }
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'stats-data', stats: statsList }));
            }
          } catch (err: any) {
            console.error('Error fetching stats for WS:', err.message);
          }
        }, 3000);
      }

      // 6. Unsubscribe stats
      else if (payload.type === 'unsubscribe-stats') {
        if (statsIntervalId) {
          clearInterval(statsIntervalId);
          statsIntervalId = null;
        }
      }
    } catch (err) {
      console.error('Error parsing WS message:', err);
    }
  });

  ws.on('close', () => {
    console.log('WS connection closed, cleaning up logs/stats listeners...');
    if (activeLogStream) activeLogStream.close();
    if (statsIntervalId) clearInterval(statsIntervalId);
    if (redisSub) redisSub.disconnect();
  });
});

// Setup File Watcher to broadcast discovery changes
const unwatch = watchProjectChanges(() => {
  console.log('Filsystem changed, broadcasting updated discovery topology...');
  try {
    const updatedData = discoverProject();
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'discovery-updated', data: updatedData }));
      }
    });
  } catch (err) {
    console.error('Error broadcasting update:', err);
  }
});

// Clean shutdowns
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  unwatch();
  if (redisClient) redisClient.disconnect();
  await dbManager.closeAll();
  server.close(() => {
    process.exit(0);
  });
});

server.listen(port, () => {
  console.log(`Enterprise Admin service running on port ${port}`);
});

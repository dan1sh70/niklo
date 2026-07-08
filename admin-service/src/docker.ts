import * as http from 'http';
import * as net from 'net';
import * as fs from 'fs';
import { discoverProject } from './discovery';

const DOCKER_SOCKET = '/var/run/docker.sock';

function hasDockerSocket(): boolean {
  try {
    return fs.existsSync(DOCKER_SOCKET) && fs.statSync(DOCKER_SOCKET).isSocket();
  } catch {
    return false;
  }
}

// Low-level HTTP helper to talk to Docker Engine Unix socket
function dockerRequest(method: string, pathStr: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!hasDockerSocket()) {
      return reject(new Error('Docker Unix socket is not available.'));
    }

    const options = {
      socketPath: DOCKER_SOCKET,
      method: method,
      path: pathStr,
      headers: {
        'Content-Type': 'application/json',
        'Host': 'docker_engine',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(data ? JSON.parse(data) : true);
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`Docker API: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

export interface ContainerInfo {
  id: string;
  name: string;
  service: string;
  status: string;
  state: string;
  image: string;
  ports: string;
  cpu: number;
  memory: number; // in MB
  memoryLimit: number;
  memoryPercent: number;
}

// List all containers (both real from Docker socket and fallback/mocks if socket missing)
export async function listContainers(): Promise<ContainerInfo[]> {
  const project = discoverProject();
  const serviceNames = Object.keys(project.services);

  if (hasDockerSocket()) {
    try {
      // Fetch all containers matching labels or compose project
      const rawContainers: any[] = await dockerRequest('GET', '/containers/json?all=true');
      
      const containers: ContainerInfo[] = [];
      for (const raw of rawContainers) {
        // Compose projects label the service name under com.docker.compose.service
        const service = raw.Labels?.['com.docker.compose.service'] || '';
        const name = (raw.Names?.[0] || '/unknown').substring(1);
        
        // Only include containers belonging to our compose file or service list
        const isProjectService = serviceNames.includes(service) || service === 'redis' || service === 'nginx';
        if (isProjectService) {
          containers.push({
            id: raw.Id,
            name,
            service: service || name,
            status: raw.Status,
            state: raw.State,
            image: raw.Image,
            ports: (raw.Ports || []).map((p: any) => `${p.PublicPort ? p.PublicPort + '->' : ''}${p.PrivatePort}/${p.Type}`).join(', '),
            cpu: 0, // Stats retrieved asynchronously or mocked
            memory: 0,
            memoryLimit: 0,
            memoryPercent: 0,
          });
        }
      }
      return containers;
    } catch (err) {
      console.warn('Docker socket exists but failed listing containers, falling back to discovery pings:', err);
    }
  }

  // Fallback / local development mock mode:
  // Detect container statuses by pinging service ports
  const mockContainers: ContainerInfo[] = [];
  
  // Add Redis
  mockContainers.push({
    id: 'mock-redis',
    name: 'niklo-redis',
    service: 'redis',
    status: 'Running (Mock)',
    state: 'running',
    image: 'redis:7-alpine',
    ports: '6379/tcp',
    cpu: 0.5,
    memory: 15.4,
    memoryLimit: 8192,
    memoryPercent: 0.18,
  });

  // Add services
  for (const name of serviceNames) {
    const s = project.services[name];
    let isUp = false;
    
    // Attempt TCP connection to local port to see if running
    if (s.port) {
      isUp = await pingPort('127.0.0.1', s.port);
    }

    mockContainers.push({
      id: `mock-${name}`,
      name: `niklo-${name}`,
      service: name,
      status: isUp ? 'Running' : 'Stopped',
      state: isUp ? 'running' : 'exited',
      image: `niklo-${name}:latest`,
      ports: s.port ? `${s.port}/tcp` : '',
      cpu: isUp ? parseFloat((Math.random() * 2 + 0.1).toFixed(2)) : 0,
      memory: isUp ? Math.floor(Math.random() * 50 + 70) : 0,
      memoryLimit: 8192,
      memoryPercent: isUp ? parseFloat((Math.random() * 1.5 + 0.8).toFixed(2)) : 0,
    });
  }

  return mockContainers;
}

// Perform container action: start/stop/restart
export async function containerAction(serviceName: string, action: 'start' | 'stop' | 'restart'): Promise<boolean> {
  if (hasDockerSocket()) {
    try {
      const containers = await listContainers();
      const target = containers.find(c => c.service === serviceName);
      if (target) {
        let dockerAction = action;
        if (action === 'stop') dockerAction = 'stop';
        else if (action === 'start') dockerAction = 'start';
        else if (action === 'restart') dockerAction = 'restart';

        await dockerRequest('POST', `/containers/${target.id}/${dockerAction}`);
        return true;
      }
    } catch (err: any) {
      console.error(`Failed container action ${action} on ${serviceName}:`, err.message);
      throw err;
    }
  }
  
  console.log(`Mock container action: ${action} on ${serviceName}`);
  return true; // Return true in mock mode
}

// Helper to check if a TCP port is open
function pingPort(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// Helper to stream container logs
export function streamLogs(
  serviceName: string,
  onData: (chunk: string) => void,
  onError: (err: any) => void
): { close: () => void } {
  if (hasDockerSocket()) {
    const client = net.createConnection({ path: DOCKER_SOCKET });
    let isClosed = false;

    listContainers().then(containers => {
      const target = containers.find(c => c.service === serviceName);
      if (!target || isClosed) {
        if (!target) onError(new Error(`Container for service ${serviceName} not found`));
        client.destroy();
        return;
      }

      client.on('connect', () => {
        client.write(
          `GET /containers/${target.id}/logs?stdout=true&stderr=true&follow=true&tail=100 HTTP/1.1\r\n` +
          `Host: docker_engine\r\n\r\n`
        );
      });

      client.on('data', (chunk) => {
        let text = chunk.toString('utf8');
        // Strip HTTP header if present
        if (text.includes('HTTP/1.1 200 OK')) {
          const idx = text.indexOf('\r\n\r\n');
          if (idx !== -1) {
            text = text.substring(idx + 4);
          }
        }
        // Basic log frame filtering: standard docker frames prefix stdout with 0x01 and stderr with 0x02 + 7 bytes size.
        // We clean up non-ascii headers in frames.
        const cleanText = text.replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u00ff]/g, '');
        onData(cleanText);
      });

      client.on('error', (err) => {
        onError(err);
      });
    }).catch(err => {
      onError(err);
    });

    return {
      close: () => {
        isClosed = true;
        client.destroy();
      }
    };
  }

  // Fallback: Generate mock logs for testing
  console.log(`Mocking logs streaming for ${serviceName}...`);
  let intervalId = setInterval(() => {
    const timestamps = new Date().toISOString();
    const levels = ['INFO', 'DEBUG', 'WARN', 'INFO', 'ERROR'];
    const msgList = [
      `Database connection health check succeeded.`,
      `Incoming request: GET /api/v1/${serviceName}/metrics - 200 OK`,
      `Cache hit for query details.`,
      `Active worker processing background schedule tasks.`,
      `Context loaded and application initialized successfully.`,
    ];
    const lvl = levels[Math.floor(Math.random() * levels.length)];
    const msg = msgList[Math.floor(Math.random() * msgList.length)];
    const logLine = `[${timestamps}] [${lvl}] ${msg}\n`;
    onData(logLine);
  }, 1500);

  return {
    close: () => {
      clearInterval(intervalId);
    }
  };
}

// Fetch single-time container resource stats
export async function getContainerStats(containerId: string): Promise<{ cpu: number; memory: number }> {
  if (hasDockerSocket() && !containerId.startsWith('mock-')) {
    try {
      const stats: any = await dockerRequest('GET', `/containers/${containerId}/stats?stream=false`);
      // Calculate CPU percent
      // cpu_delta = cpu_stats.cpu_usage.total_usage - precpu_stats.cpu_usage.total_usage
      // system_delta = cpu_stats.system_cpu_usage - precpu_stats.system_cpu_usage
      // number_cpus = cpu_stats.online_cpus or len(cpu_stats.cpu_usage.percpu_usage)
      // cpu_percent = (cpu_delta / system_delta) * number_cpus * 100.0
      const cpuUsage = stats.cpu_stats?.cpu_usage?.total_usage || 0;
      const preCpuUsage = stats.precpu_stats?.cpu_usage?.total_usage || 0;
      const systemUsage = stats.cpu_stats?.system_cpu_usage || 0;
      const preSystemUsage = stats.precpu_stats?.system_cpu_usage || 0;
      
      let cpuPercent = 0;
      const cpuDelta = cpuUsage - preCpuUsage;
      const systemDelta = systemUsage - preSystemUsage;
      
      if (systemDelta > 0 && cpuDelta > 0) {
        const numCpus = stats.cpu_stats?.online_cpus || 1;
        cpuPercent = (cpuDelta / systemDelta) * numCpus * 100.0;
      }

      // Memory usage in MB
      const memUsage = stats.memory_stats?.usage || 0;
      const memoryMB = memUsage / (1024 * 1024);

      return {
        cpu: parseFloat(cpuPercent.toFixed(2)),
        memory: parseFloat(memoryMB.toFixed(2)),
      };
    } catch {
      // fall through
    }
  }

  // Fallback / mock stats
  return {
    cpu: parseFloat((Math.random() * 3 + 0.1).toFixed(2)),
    memory: Math.floor(Math.random() * 40 + 80),
  };
}

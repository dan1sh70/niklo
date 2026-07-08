import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface DiscoveredApi {
  name: string;
  method: string;
  url: string;
  headers: { key: string; value: string }[];
  body?: string;
  folder?: string;
}

export interface DiscoveredProject {
  services: {
    [name: string]: {
      name: string;
      path: string;
      port: number;
      dependencies: string[];
      isAiService: boolean;
      dbConfig?: {
        host: string;
        port: number;
        user: string;
        pass: string;
        name: string;
      };
      redisConfig?: {
        host: string;
        port: number;
      };
      env: { [key: string]: string };
      apis: DiscoveredApi[];
    };
  };
  databases: {
    [name: string]: {
      type: string;
      host: string;
      port: number;
      name: string;
      user: string;
      pass: string;
    };
  };
  nginxRoutes: {
    path: string;
    targetService: string;
    targetPort: number;
  }[];
  topology: {
    nodes: { id: string; label: string; type: 'gateway' | 'service' | 'database' | 'redis' }[];
    edges: { source: string; target: string; label?: string }[];
  };
}

// Get workspace path (can be overridden by environment)
const workspacePath = process.env.WORKSPACE_PATH || path.resolve(__dirname, '../../');

export function discoverProject(): DiscoveredProject {
  const project: DiscoveredProject = {
    services: {},
    databases: {},
    nginxRoutes: [],
    topology: { nodes: [], edges: [] },
  };

  // 1. Read docker-compose.yaml
  const dockerComposePath = path.join(workspacePath, 'docker-compose.yaml');
  let composeData: any = {};
  if (fs.existsSync(dockerComposePath)) {
    try {
      const content = fs.readFileSync(dockerComposePath, 'utf8');
      composeData = yaml.load(content) as any;
    } catch (err) {
      console.error('Error parsing docker-compose.yaml:', err);
    }
  }

  // 2. Read nginx.conf
  const nginxConfPath = path.join(workspacePath, 'nginx.conf');
  if (fs.existsSync(nginxConfPath)) {
    try {
      const content = fs.readFileSync(nginxConfPath, 'utf8');
      // Simple regex parser for location /api/v1/auth/ { proxy_pass http://auth-service:3001; }
      const locationRegex = /location\s+([^{]+)\{\s*proxy_pass\s+http:\/\/([^:]+):(\d+);/g;
      let match;
      while ((match = locationRegex.exec(content)) !== null) {
        const routePath = match[1].trim();
        const targetService = match[2].trim();
        const targetPort = parseInt(match[3].trim(), 10);
        project.nginxRoutes.push({
          path: routePath,
          targetService,
          targetPort,
        });
      }
    } catch (err) {
      console.error('Error parsing nginx.conf:', err);
    }
  }

  // Add Nginx gateway to nodes
  project.topology.nodes.push({ id: 'nginx-gateway', label: 'NGINX Gateway (Port 80)', type: 'gateway' });

  // 3. Scan workspace directories for microservices
  if (fs.existsSync(workspacePath)) {
    const items = fs.readdirSync(workspacePath);
    for (const item of items) {
      const itemPath = path.join(workspacePath, item);
      if (!fs.statSync(itemPath).isDirectory()) continue;
      if (item === 'node_modules' || item === '.git' || item === 'admin-service') continue;

      const packageJsonPath = path.join(itemPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const dependencies = Object.keys(packageJson.dependencies || {});
          const devDependencies = Object.keys(packageJson.devDependencies || {});
          const allDeps = [...dependencies, ...devDependencies];

          // Check if it is an AI service
          const isAiService = allDeps.some(dep => 
            dep.includes('openai') || 
            dep.includes('langchain') || 
            dep.includes('huggingface') || 
            dep.includes('gemini') || 
            dep.includes('vector') || 
            dep.includes('tensorflow') || 
            dep.includes('ollama')
          );

          // Get env vars & port from docker-compose if exists, else fallback to .env files
          let port = 0;
          let envVars: { [key: string]: string } = {};
          let dbConfig: any = undefined;
          let redisConfig: any = undefined;

          // Find service in docker-compose
          const composeService = composeData?.services?.[item];
          if (composeService) {
            envVars = composeService.environment || {};
            // If environment is array [ "PORT=3001" ], parse it
            if (Array.isArray(envVars)) {
              const parsedEnv: { [key: string]: string } = {};
              for (const e of envVars) {
                const parts = e.split('=');
                if (parts.length >= 2) {
                  parsedEnv[parts[0]] = parts.slice(1).join('=');
                }
              }
              envVars = parsedEnv;
            }

            port = parseInt(envVars.PORT || '0', 10);
            if (envVars.DB_HOST) {
              dbConfig = {
                host: envVars.DB_HOST,
                port: parseInt(envVars.DB_PORT || '5432', 10),
                user: envVars.DB_USERNAME || '',
                pass: envVars.DB_PASSWORD || '',
                name: envVars.DB_NAME || '',
              };
            }
            if (envVars.REDIS_HOST) {
              redisConfig = {
                host: envVars.REDIS_HOST,
                port: parseInt(envVars.REDIS_PORT || '6379', 10),
              };
            }
          }

          // Fallback to local .env if port or dbConfig are not found
          const envPath = path.join(itemPath, '.env');
          if (fs.existsSync(envPath)) {
            try {
              const envContent = fs.readFileSync(envPath, 'utf8');
              const lines = envContent.split('\n');
              const localEnv: { [key: string]: string } = {};
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const index = trimmed.indexOf('=');
                if (index > 0) {
                  const key = trimmed.substring(0, index).trim();
                  const val = trimmed.substring(index + 1).replace(/^['"]|['"]$/g, '').trim();
                  localEnv[key] = val;
                }
              }
              envVars = { ...localEnv, ...envVars };
              if (!port && localEnv.PORT) port = parseInt(localEnv.PORT, 10);
              if (!dbConfig && localEnv.DB_HOST) {
                dbConfig = {
                  host: localEnv.DB_HOST,
                  port: parseInt(localEnv.DB_PORT || '5432', 10),
                  user: localEnv.DB_USERNAME || '',
                  pass: localEnv.DB_PASSWORD || '',
                  name: localEnv.DB_NAME || '',
                };
              }
              if (!redisConfig && localEnv.REDIS_HOST) {
                redisConfig = {
                  host: localEnv.REDIS_HOST,
                  port: parseInt(localEnv.REDIS_PORT || '6379', 10),
                };
              }
            } catch (envErr) {
              console.error(`Error reading local .env for ${item}:`, envErr);
            }
          }

          // 4. API discovery from Postman collections
          const apis: DiscoveredApi[] = [];
          const filesInService = fs.readdirSync(itemPath);
          for (const file of filesInService) {
            if (file.endsWith('.postman_collection.json')) {
              try {
                const collection = JSON.parse(fs.readFileSync(path.join(itemPath, file), 'utf8'));
                
                // Helper to extract items recursively
                const parseItems = (items: any[], folderName?: string) => {
                  for (const reqItem of items) {
                    if (reqItem.request) {
                      const request = reqItem.request;
                      let rawUrl = '';
                      if (typeof request.url === 'string') {
                        rawUrl = request.url;
                      } else if (request.url && request.url.raw) {
                        rawUrl = request.url.raw;
                      }
                      
                      // Convert {{baseUrl}}/api/v1/... to actual path
                      const urlPath = rawUrl.replace(/\{\{baseUrl\}\}/g, '');
                      
                      apis.push({
                        name: reqItem.name,
                        method: request.method || 'GET',
                        url: urlPath,
                        headers: (request.header || []).map((h: any) => ({
                          key: h.key,
                          value: h.value,
                        })),
                        body: request.body && request.body.raw ? request.body.raw : undefined,
                        folder: folderName,
                      });
                    } else if (reqItem.item && Array.isArray(reqItem.item)) {
                      parseItems(reqItem.item, reqItem.name);
                    }
                  }
                };

                if (collection.item && Array.isArray(collection.item)) {
                  parseItems(collection.item);
                }
              } catch (colErr) {
                console.error(`Error parsing postman collection ${file}:`, colErr);
              }
            }
          }

          // Add to services list
          project.services[item] = {
            name: item,
            path: itemPath,
            port,
            dependencies: allDeps,
            isAiService,
            dbConfig,
            redisConfig,
            env: envVars,
            apis,
          };

          // Register databases in project
          if (dbConfig) {
            project.databases[item] = {
              type: item === 'ride-service' ? 'PostGIS' : 'PostgreSQL',
              host: dbConfig.host,
              port: dbConfig.port,
              name: dbConfig.name,
              user: dbConfig.user,
              pass: dbConfig.pass,
            };
          }

          // Add topology nodes & edges
          const serviceId = `service-${item}`;
          project.topology.nodes.push({ id: serviceId, label: `${item} (Port ${port})`, type: 'service' });

          // Gateway to service edges
          const routedPaths = project.nginxRoutes.filter(r => r.targetService === item);
          for (const route of routedPaths) {
            project.topology.edges.push({
              source: 'nginx-gateway',
              target: serviceId,
              label: route.path,
            });
          }

          // DB dependency edges
          if (dbConfig) {
            const dbNodeId = `db-${item}`;
            if (!project.topology.nodes.some(n => n.id === dbNodeId)) {
              project.topology.nodes.push({
                id: dbNodeId,
                label: `${dbConfig.name} (${dbConfig.host})`,
                type: 'database',
              });
            }
            project.topology.edges.push({
              source: serviceId,
              target: dbNodeId,
              label: 'SQL DB Connection',
            });
          }

          // Redis dependency edges
          if (redisConfig) {
            const redisNodeId = 'redis';
            if (!project.topology.nodes.some(n => n.id === redisNodeId)) {
              project.topology.nodes.push({ id: redisNodeId, label: 'Redis (Port 6379)', type: 'redis' });
            }
            project.topology.edges.push({
              source: serviceId,
              target: redisNodeId,
              label: 'PubSub / Cache',
            });
          }

        } catch (pkgErr) {
          console.error(`Error loading package.json for ${item}:`, pkgErr);
        }
      }
    }
  }

  // Ensure default Redis is in nodes if used and not yet added
  if (composeData?.services?.redis && !project.topology.nodes.some(n => n.id === 'redis')) {
    project.topology.nodes.push({ id: 'redis', label: 'Redis (Port 6379)', type: 'redis' });
  }

  return project;
}

// Watch function using standard fs methods
export function watchProjectChanges(callback: () => void): () => void {
  let watchers: fs.FSWatcher[] = [];

  const setupWatchers = () => {
    try {
      // Watch root
      const rootWatcher = fs.watch(workspacePath, (event, filename) => {
        if (filename && (filename.endsWith('.json') || filename === 'docker-compose.yaml' || filename === 'nginx.conf')) {
          callback();
        }
      });
      watchers.push(rootWatcher);

      // Watch subdirs for collections and package.json changes
      const items = fs.readdirSync(workspacePath);
      for (const item of items) {
        const itemPath = path.join(workspacePath, item);
        if (!fs.statSync(itemPath).isDirectory()) continue;
        if (item === 'node_modules' || item === '.git' || item === 'admin-service') continue;

        try {
          const watcher = fs.watch(itemPath, (event, filename) => {
            if (filename && (filename.endsWith('.json') || filename.endsWith('.env') || filename.endsWith('.ts'))) {
              callback();
            }
          });
          watchers.push(watcher);
        } catch (err) {
          // ignore directory watch failures (e.g. permission issues on some OS folders)
        }
      }
    } catch (e) {
      console.error('Error starting file watchers:', e);
    }
  };

  setupWatchers();

  // Return unsubscribe/close function
  return () => {
    for (const w of watchers) {
      w.close();
    }
  };
}

import * as fs from 'fs';
import * as path from 'path';

export function generateUnifiedOpenApiSpec(workspacePath: string): any {
  const spec: any = {
    openapi: '3.0.0',
    info: {
      title: 'Niklo Unified API Stack',
      description: 'Unified Swagger API Explorer for all Niklo microservices.',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://lc7g5kixd0vu31p5jtsfjil6.187.127.157.13.sslip.io',
        description: 'NGINX API Gateway (Production)',
      },
      {
        url: 'http://localhost',
        description: 'Local Gateway',
      },
    ],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  };

  if (fs.existsSync(workspacePath)) {
    const items = fs.readdirSync(workspacePath);
    for (const item of items) {
      const itemPath = path.join(workspacePath, item);
      if (!fs.statSync(itemPath).isDirectory()) continue;
      if (
        item === 'node_modules' ||
        item === '.git' ||
        item === 'admin-service'
      )
        continue;

      // Look for *.postman_collection.json
      try {
        const files = fs.readdirSync(itemPath);
        for (const file of files) {
          if (file.endsWith('.postman_collection.json')) {
            try {
              const collection = JSON.parse(
                fs.readFileSync(path.join(itemPath, file), 'utf8'),
              );
              parseCollection(collection, item, spec.paths);
            } catch (err) {
              console.error(`Error parsing postman collection ${file}:`, err);
            }
          }
        }
      } catch (err) {
        // Directory read errors
      }
    }
  }

  return spec;
}

function parseCollection(collection: any, serviceName: string, paths: any) {
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

        // Clean url: replace {{baseUrl}} and resolve variables
        let urlPath = rawUrl.replace(/\{\{baseUrl\}\}/g, '');
        if (urlPath.includes('?')) {
          urlPath = urlPath.split('?')[0];
        }

        if (!urlPath.startsWith('/')) {
          urlPath = '/' + urlPath;
        }

        const method = (request.method || 'GET').toLowerCase();

        if (!paths[urlPath]) {
          paths[urlPath] = {};
        }

        const openapiReq: any = {
          tags: [serviceName],
          summary: reqItem.name || `${method.toUpperCase()} ${urlPath}`,
          responses: {
            200: {
              description: 'Successful Response',
            },
          },
        };

        // Auth
        if (request.auth && request.auth.type === 'bearer') {
          openapiReq.security = [{ bearerAuth: [] }];
        }

        // Headers
        if (request.header && request.header.length > 0) {
          const parameters = openapiReq.parameters || [];
          for (const h of request.header) {
            if (h.key.toLowerCase() === 'authorization') continue;
            parameters.push({
              name: h.key,
              in: 'header',
              required: true,
              schema: {
                type: 'string',
                default: h.value,
              },
            });
          }
          if (parameters.length > 0) openapiReq.parameters = parameters;
        }

        // Query parameters
        if (
          request.url &&
          request.url.query &&
          Array.isArray(request.url.query)
        ) {
          const parameters = openapiReq.parameters || [];
          for (const q of request.url.query) {
            parameters.push({
              name: q.key,
              in: 'query',
              description: q.description || '',
              required: false,
              schema: {
                type: 'string',
                default: q.value,
              },
            });
          }
          if (parameters.length > 0) openapiReq.parameters = parameters;
        }

        // Request Body
        if (request.body && request.body.mode === 'raw' && request.body.raw) {
          try {
            const bodyJson = JSON.parse(request.body.raw);
            openapiReq.requestBody = {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    example: bodyJson,
                  },
                },
              },
            };
          } catch (e) {
            openapiReq.requestBody = {
              content: {
                'text/plain': {
                  schema: {
                    type: 'string',
                    example: request.body.raw,
                  },
                },
              },
            };
          }
        }

        paths[urlPath][method] = openapiReq;
      } else if (reqItem.item && Array.isArray(reqItem.item)) {
        parseItems(reqItem.item, reqItem.name);
      }
    }
  };

  if (collection.item && Array.isArray(collection.item)) {
    parseItems(collection.item);
  }
}

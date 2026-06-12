# Niklo Monorepo Deployment

This repository contains three NestJS services:

- `auth-service` on port `3001`
- `bus-service` on port `3003`
- `payment-service` on port `3007`

## Coolify Setup

Use the root `docker-compose.yml` as a single Coolify Docker Compose resource.

1. Create a new Docker Compose resource in Coolify.
2. Point it at this repository and use the root `docker-compose.yml`.
3. Set the secret env vars in Coolify before deploying:
   - `JWT_SECRET`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
4. Deploy the stack.

The public entrypoint is the `nginx` service. It proxies:

- `/api/v1/auth/*` -> auth service
- `/api/v1/bus/*` -> bus service
- `/api/v1/payment/*` -> payment service

## Local Run

```bash
docker compose up --build
```

## Git Push

The repo is currently configured with a different `origin` remote. To push this code to `https://github.com/dan1sh70/niklo.git`, run:

```bash
git remote add niklo https://github.com/dan1sh70/niklo.git
git push niklo <your-branch-name>
```

If you want to replace the existing `origin`, remove it first and add the new one.
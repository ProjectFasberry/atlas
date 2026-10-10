This project uses Sentry as the primary observability and telemetry solution.

Sentry is initialized on both the client and server sides:

- **client** — initialized in `/renderer/+client.ts`
- **server** — initialized in `/renderer/+server.ts`

The shared Sentry model is located at `/shared/sentry.ts`.

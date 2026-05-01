import * as Sentry from "@sentry/react";

if (import.meta.env.PROD || import.meta.env.VITE_SENTRY_DEBUG === 'true') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
  console.log("🚀 [SENTRY] Monitoreo de Frontend inicializado");
}
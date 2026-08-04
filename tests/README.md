# Automated tests

The test suite never calls the real Google OAuth flow or production API. Unit
tests mock `fetch`, and Playwright intercepts backend requests with deterministic
responses.

## Commands

- `npm test` — run the Vitest unit and component suite once.
- `npm run test:watch` — run Vitest in watch mode.
- `npm run test:coverage` — generate text and HTML coverage reports.
- `npm run test:e2e` — run Playwright against Chromium.
- `npm run test:e2e:ui` — open the Playwright UI runner.
- `npm run check` — run lint, unit tests, and the production build.

Install the browser once on a new development or CI machine:

```sh
npx playwright install chromium
```

Playwright reuses a local server on port 3000 when one exists. Otherwise it
starts `next dev` automatically. Backend mocks include credentialed CORS and
preflight responses because the application calls the configured API origin
directly.

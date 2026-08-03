# Folder structure

This project uses a feature-first Next.js App Router structure.

```txt
app/
  api/
    health/route.ts
    meals/route.ts
  layout.tsx
  page.tsx
features/
  nutrition/
    components/
    data/
    services/
    types.ts
    index.ts
lib/
  api-client.ts
public/
```

## Rules

- `app/` is for routing only: pages, layouts, loading states, errors, and API route handlers.
- `app/api/**/route.ts` validates HTTP concerns and delegates business logic to feature services.
- `features/<feature>/components` contains UI used by that feature.
- `features/<feature>/services` contains business logic and data orchestration.
- `features/<feature>/data` is for mock data, adapters, or local repositories before a real database exists.
- `features/<feature>/types.ts` keeps shared TypeScript contracts close to the feature.
- `lib/` is for cross-feature utilities such as API clients, formatters, auth helpers, and config.

When a real Nest.js backend is added later, keep this frontend structure and replace the `app/api` route handlers with proxy calls or direct client calls to the Nest API.

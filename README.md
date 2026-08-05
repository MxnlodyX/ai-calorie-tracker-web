# AI Calorie Tracker

AI Calorie Tracker is a personal nutrition diary that helps users record meals,
understand daily calorie intake, and follow macronutrient goals without manually
estimating everything from scratch.

Users can photograph a meal and receive an AI-generated calorie and macro
estimate, review the result, correct it when needed, and save it directly to
their daily log. Meals can also be entered manually or saved for quick reuse.

**Live application:** [ai-calorie-tracker-web-rho.vercel.app](https://ai-calorie-tracker-web-rho.vercel.app)

## Project information

| Item | Details |
| --- | --- |
| Project type | Personal health and nutrition web application |
| Primary purpose | Make daily calorie and macro tracking faster and easier |
| Intended users | Individuals who want a simple personal meal diary |
| Authentication | Google sign-in |
| Meal input | AI photo analysis, manual entry, or saved meals |
| Nutrition tracked | Calories, protein, carbohydrates, and fat |
| History | Calendar-based daily meal records |
| Current status | Deployed and available for personal production use |

## Why this project exists

Traditional calorie tracking often requires users to search for every food,
estimate portions, and enter several nutrition values manually. This creates too
much friction for consistent daily use.

This project shortens that process. A user can take a photo, receive a starting
estimate, make any necessary corrections, and continue with their day. The goal
is not to replace professional dietary advice, but to provide a practical and
consistent personal tracking tool.

## How it works

1. Sign in with a Google account.
2. Set personal measurements, diet mode, and daily nutrition goals.
3. Add a meal by taking a photo, uploading an image, entering it manually, or
   selecting a previously saved meal.
4. Review calories and macronutrients before saving.
5. Monitor the remaining daily calorie allowance on the dashboard.
6. Use the calendar history to review, edit, or remove previous meal entries.

## Main capabilities

### Personal dashboard

The dashboard summarizes the current day, including consumed calories,
remaining calories, macro totals, personal goals, and recently logged meals.

### AI meal analysis

Users can capture or upload a JPEG, PNG, or WebP meal image. The analysis result
includes a suggested meal name, calories, protein, carbohydrates, fat, and an AI
confidence score. Every value remains editable before acceptance.

AI results are estimates and can vary based on image quality, portion visibility,
and meal complexity.

### Manual and reusable meals

Meals can be logged without a photo. Frequently eaten meals can be saved to a
personal list and added again without entering all nutrition values repeatedly.

### Meal history

The history page organizes meals by month and day. Users can inspect daily
totals, update meal details or time, and delete incorrect entries.

### Profile and nutrition goals

Users can maintain height, weight, diet mode, and daily goals for calories,
protein, carbohydrates, and fat. These values drive the progress shown on the
dashboard and history pages.

## Current scope

- Designed primarily for individual use.
- Nutrition analysis provides estimates, not medical advice.
- Google OAuth is the supported sign-in method.
- The application currently uses English interface text.
- A network connection is required for authentication, synchronization, and AI
  analysis.

## Technical overview

The frontend uses Next.js, React, TypeScript, Redux Toolkit, and Tailwind CSS.
The API is hosted separately on Render, while the web application is deployed
on Vercel. Vitest, React Testing Library, and Playwright cover unit, component,
and end-to-end behavior.

## Requirements

- Node.js 22 or newer
- npm
- A running API instance with Google OAuth configured

## Local setup

Install dependencies:

```bash
npm ci
```

Create `.env` in the project root:

```env
NEXT_PUBLIC_API_URL=https://your-api.example.com
GOOGLE_AUTH_URL=https://your-api.example.com/authentications/google
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The backend must allow credentialed CORS requests from
`http://localhost:3000`. Its Google OAuth flow must also redirect back to the
same frontend origin after authentication.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Public base URL used by browser API requests. |
| `GOOGLE_AUTH_URL` | Yes | Backend endpoint that starts Google OAuth. |
| `API_BASE_URL` | No | Server-only backend override used by Next.js proxy routes. Falls back to `NEXT_PUBLIC_API_URL`. |

Do not commit `.env` files. Vercel environment values should be configured in
the project dashboard for both Preview and Production.

The Render backend uses these corresponding values in production:

```env
FRONTEND_URL=https://ai-calorie-tracker-web-rho.vercel.app
FRONTEND_ORIGIN=https://ai-calorie-tracker-web-rho.vercel.app
```

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create a production build. |
| `npm start` | Start the production server locally. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run unit and component tests once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run test:coverage` | Generate unit-test coverage. |
| `npm run test:e2e` | Run Playwright E2E tests in Chromium. |
| `npm run test:e2e:ui` | Open the Playwright UI runner. |
| `npm run check` | Run lint, unit tests, and the production build. |

Install the Playwright browser once on a new machine:

```bash
npx playwright install chromium
```

The automated tests mock authentication and backend responses. They never call
the real Google OAuth flow or mutate production data. See
[`tests/README.md`](tests/README.md) for details.

## Project structure

```text
app/                    Next.js pages, layouts, and API route handlers
components/             Shared layout and UI components
features/               Authentication, dashboard, analysis, and history
lib/                    Shared API and URL helpers
store/                  Redux store and RTK Query endpoints
tests/unit/             Vitest unit and component tests
tests/e2e/              Playwright user-flow tests
```

Additional conventions are documented in
[`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md).

## CI and deployment

GitHub Actions runs on every push and pull request:

1. Install dependencies with `npm ci`.
2. Run lint, unit tests, and the production build.
3. Install Chromium and run the Playwright E2E suite.
4. Upload Playwright reports when E2E tests fail.

Vercel creates Preview deployments for feature branches and deploys Production
when changes reach `main`. Local environment files, build output, coverage, and
test reports are excluded through `.vercelignore`.

## OAuth production checklist

The Google OAuth client must include this authorized redirect URI:

```text
https://ai-calorie-tracker-api-efpd.onrender.com/authentications/google/callback
```

After changing the frontend URL or domain, update both the Vercel environment
variables and the backend CORS/redirect configuration before redeploying.

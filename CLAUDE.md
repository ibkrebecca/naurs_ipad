# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server with Turbopack
npm run build      # Production build
npm run start      # Run production build
npm run lint       # ESLint (next.js core-web-vitals)
```

No test framework is configured.

## Architecture

**Stack:** Next.js 15 (App Router) + React 19 + Firebase + Bootstrap 5

**Auth:** `AuthContext` wraps the full app via `app/layout.js`. `useBackendAuth()` in `app/_components/backend/` manages Firebase Auth and checks the `admins` Firestore collection to gate admin access. Session state is persisted via a `AdminNaursSignedIn` cookie.

**Data:** Firestore with `onSnapshot()` real-time listeners — no polling, no Redux/Zustand. Three collections: `classes`, `categories`, `admins`.

**File uploads:** `app/_utils/upload_to_cloudinary.js` uploads media **directly from the browser** to Cloudinary via an unsigned upload preset (`POST https://api.cloudinary.com/v1_1/<cloud>/<image|video>/upload`). This bypasses Vercel's 4.5 MB serverless body limit — there is no server route. Images are first compressed/resized via the Canvas API; videos are capped at 100 MB (Cloudinary free-plan limit). The returned `secure_url` is saved to Firestore. Next.js image config allows `res.cloudinary.com` for new uploads and `raw.githubusercontent.com` for legacy media uploaded before the migration (those old URLs remain valid).

`scripts/migrate_to_cloudinary.mjs` is a one-time, idempotent migration that re-uploads any `classes` doc still pointing at `raw.githubusercontent.com` to Cloudinary (via remote-fetch) and rewrites the Firestore URL. Run: `node --env-file=.env scripts/migrate_to_cloudinary.mjs` (prompts for admin email/password).

**Route structure:**
- `/(main)/` — public home (Hero carousel)
- `/(main)/menu` — public class catalog with category filters
- `/admin` — protected CRUD dashboard (Firestore real-time table)
- `/admin/signin` — Firebase email/password login

**Admin protection:** Admin pages read `authUser` from context and redirect unauthenticated users. The admin check is a Firestore lookup against the `admins` collection, not just Firebase Auth.

## Environment Variables

Required (not committed):
- `NEXT_PUBLIC_FIREBASE_*` — Firebase project config
- `NEXT_PUBLIC_FIREBASE_APP_CHECK` — reCAPTCHA v3 site key
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name (for browser uploads)
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — Cloudinary unsigned upload preset name
- `DOMAIN` — Base URL used in SEO/structured data metadata

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

**File uploads:** `app/_utils/upload_to_imagekit.js` uploads media **directly from the browser** to ImageKit. Unlike Cloudinary, ImageKit has no unsigned upload, so the browser first calls the admin-gated route `app/api/upload-auth/route.js` to get short-lived `signature`/`token`/`expire` params, then POSTs the file **browser → ImageKit directly** (via `@imagekit/next`'s `upload()`). Only the tiny auth request hits the server, so Vercel's 4.5 MB serverless body limit is still bypassed. The auth route verifies the caller's Firebase ID token and confirms the email exists in the `admins` collection before issuing params. Images are first compressed/resized via the Canvas API; videos are capped at 100 MB (ImageKit free-plan limit). The returned `url` is saved to Firestore. Next.js image config allows `ik.imagekit.io` for new uploads, plus `res.cloudinary.com` and `raw.githubusercontent.com` for legacy media (Cloudinary URLs are valid only until that account deactivates).

`scripts/migrate_to_imagekit.mjs` is a one-time, idempotent migration that re-uploads any `classes` doc still pointing at `res.cloudinary.com` to ImageKit (ImageKit's server SDK fetches the remote URL itself) and rewrites the Firestore URL. Run **before** the Cloudinary account deactivates: `node --env-file=.env scripts/migrate_to_imagekit.mjs` (prompts for admin email/password). The older `scripts/migrate_to_cloudinary.mjs` (GitHub → Cloudinary) is kept for reference.

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
- `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` — ImageKit public key (browser-safe)
- `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` — ImageKit URL endpoint, e.g. `https://ik.imagekit.io/<id>` (browser-safe)
- `IMAGEKIT_PRIVATE_KEY` — ImageKit private key (**server-only**, used by `/api/upload-auth` and the migration script — never expose client-side)
- `DOMAIN` — Base URL used in SEO/structured data metadata

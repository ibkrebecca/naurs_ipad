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

**File uploads:** `app/_utils/upload_to_firebase.js` uploads media **directly from the browser** to Firebase Storage via `uploadBytesResumable()`, then saves the `getDownloadURL()` result to Firestore. Uploads are authorized by the caller's Firebase Auth session against `storage.rules` (public reads; writes only if the signed-in user's email has a doc in the `admins` collection) — there is no server signing route. Because the bytes go browser → Storage directly, there is no serverless body-size limit to worry about. Images are first compressed/resized via the Canvas API (to PNG); videos are compressed in-browser with ffmpeg.wasm (`app/_utils/compress_video.js`) and capped at 100 MB. Next.js image config (`next.config.mjs`) allows `firebasestorage.googleapis.com` for the admin `next/image` previews. Storage security rules live in `storage.rules` and are deployed via the Firebase Console (Storage → Rules).

`scripts/migrate_to_firebase_storage.mjs` is a one-time, idempotent migration that downloads any `classes` media still pointing at ImageKit/Cloudinary/GitHub, re-uploads the bytes to Firebase Storage (all via Firebase REST APIs — the JS SDK fails under Node), and rewrites the Firestore URL. Docs already on `firebasestorage.googleapis.com` are skipped, so it is safe to re-run: `node --env-file=.env scripts/migrate_to_firebase_storage.mjs` (prompts for admin email/password). Run it with Storage App Check enforcement OFF (Node has no App Check token).

`scripts/recover_media_to_firebase.mjs` was the actual migration used, because by then the ImageKit account was over its 20 GB monthly bandwidth (every `ik.imagekit.io` URL returns 429) and the older Cloudinary account was deactivated (401) — so the live media could not be fetched from either remote. Instead it recovers the **originals preserved in git history** under `livefiles/images` and `livefiles/videos` (each ImageKit filename is `<livefiles-basename>_<cloudinary-suffix>_<imagekit-suffix>.<ext>`, matched by longest prefix), plus any base64 `data:` URLs inlined in Firestore, uploading those to Firebase Storage. Anything with no recoverable original (browser `blob_*` images, June-2026 direct-upload videos) is left untouched and listed in the generated `MEDIA_RECOVERY.md` for manual re-upload through the admin dashboard. Both scripts accept `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars as a non-interactive alternative to the prompts.

**Route structure:**
- `/(main)/` — public home (Hero carousel)
- `/(main)/menu` — public class catalog with category filters
- `/admin` — protected CRUD dashboard (Firestore real-time table)
- `/admin/signin` — Firebase email/password login

**Admin protection:** Admin pages read `authUser` from context and redirect unauthenticated users. The admin check is a Firestore lookup against the `admins` collection, not just Firebase Auth.

## Environment Variables

Required (not committed):
- `NEXT_PUBLIC_FIREBASE_*` — Firebase project config (incl. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, used for uploads)
- `NEXT_PUBLIC_FIREBASE_APP_CHECK` — reCAPTCHA v3 site key
- `DOMAIN` — Base URL used in SEO/structured data metadata

/**
 * One-time migration: move existing class media from ImageKit
 * (ik.imagekit.io), Cloudinary (res.cloudinary.com) and GitHub
 * (raw.githubusercontent.com) into Firebase Storage, and update each Firestore
 * `classes` doc to the new download url.
 *
 * - Driven by Firestore so orphaned files are ignored.
 * - Downloads each source asset here (Node global fetch) and re-uploads the
 *   bytes to Firebase Storage via its REST upload endpoint.
 * - Idempotent: docs already pointing at firebasestorage.googleapis.com are
 *   skipped, so it is safe to re-run.
 *
 * Uses the Firebase REST APIs (Auth + Firestore + Storage) directly rather than
 * the Firebase JS SDK, which throws `auth/network-request-failed` under Node.
 *
 * IMPORTANT: run this BEFORE the ImageKit/Cloudinary sources deactivate — once
 * those source URLs are dead, the fetch will fail and originals must be
 * re-uploaded by hand.
 *
 * Run (Node 20+, loads .env automatically):
 *   node --env-file=.env scripts/migrate_to_firebase_storage.mjs
 *
 * You will be prompted for an admin email + password (the user must exist in
 * Firebase Auth and the `admins` collection; writes go through the Storage and
 * Firestore security rules under that user's token). Leave Storage App Check
 * enforcement OFF while running this — Node has no App Check token.
 */

import readline from "node:readline";

const FIREBASE_STORAGE_HOST = "firebasestorage.googleapis.com";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// --- prompt helpers --------------------------------------------------------

const ask = (question, { hidden = false } = {}) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    if (hidden) {
      const onData = () => rl.output.write(`\r${question}`);
      rl.input.on("data", onData);
      rl.question(question, (answer) => {
        rl.input.off("data", onData);
        rl.output.write("\n");
        rl.close();
        resolve(answer.trim());
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });

// --- firebase auth (REST) --------------------------------------------------

async function signIn(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Sign-in failed: ${data.error?.message || res.statusText}`);
  }
  return data.idToken;
}

// --- firestore (REST) ------------------------------------------------------

async function listClasses(idToken) {
  const docs = [];
  let pageToken = "";
  do {
    const url = new URL(`${FIRESTORE_BASE}/classes`);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        `List classes failed: ${data.error?.message || res.statusText}`,
      );
    }
    for (const doc of data.documents || []) docs.push(doc);
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return docs;
}

// read a stringValue field (or null)
const strField = (doc, key) => doc.fields?.[key]?.stringValue ?? null;

// id is the last path segment of doc.name
const docId = (doc) => doc.name.split("/").pop();

// PATCH only the given string fields, leaving everything else untouched
async function patchFields(idToken, id, fields) {
  const url = new URL(`${FIRESTORE_BASE}/classes/${id}`);
  for (const key of Object.keys(fields)) {
    url.searchParams.append("updateMask.fieldPaths", key);
  }
  const body = {
    fields: Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [k, { stringValue: v }]),
    ),
  };
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Update failed: ${data.error?.message || res.statusText}`);
  }
}

// --- fetch helpers ---------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A browser-like UA — some CDNs (incl. ImageKit) 429 the default Node fetch UA.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Referer used for source fetches — ImageKit/CDN accounts often restrict
// delivery to the site's own domain, so a matching Referer avoids a block.
const REFERER = process.env.DOMAIN || "https://ipad.naurs.me";

const sourceHeaders = {
  "User-Agent": UA,
  Accept: "image/*,video/*,*/*;q=0.8",
  Referer: REFERER,
  Origin: REFERER,
};

// Fetch with exponential backoff on 429/5xx, honoring Retry-After when present.
// On final failure includes the response body, which usually explains the block.
async function fetchWithRetry(url, { retries = 5, baseDelay = 1500 } = {}) {
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return "?";
    }
  })();
  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: sourceHeaders });
    if (res.ok) return res;
    lastStatus = res.status;
    lastBody = (await res.text().catch(() => "")).slice(0, 300);
    if (res.status !== 429 && res.status < 500) {
      throw new Error(
        `fetch ${host} failed: ${res.status} ${res.statusText}${lastBody ? ` — ${lastBody}` : ""}`,
      );
    }
    if (attempt === retries) break;
    const retryAfter = Number(res.headers.get("retry-after"));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : baseDelay * 2 ** attempt;
    console.log(`   … ${res.status}, retrying in ${Math.round(wait / 1000)}s`);
    await sleep(wait);
  }
  throw new Error(
    `fetch ${host} failed after retries: ${lastStatus}${lastBody ? ` — ${lastBody}` : ""}`,
  );
}

// --- firebase storage (REST) ----------------------------------------------

const isFirebaseUrl = (value) =>
  typeof value === "string" && value.includes(FIREBASE_STORAGE_HOST);

const needsMigration = (value) =>
  typeof value === "string" && value.length > 0 && !isFirebaseUrl(value);

// Download the source asset and re-upload the bytes to Firebase Storage,
// returning a public download url (tokenized).
async function uploadRemoteToStorage(idToken, sourceUrl, resourceType) {
  const src = await fetchWithRetry(sourceUrl);
  const contentType =
    src.headers.get("content-type") ||
    (resourceType === "video" ? "video/mp4" : "image/png");
  const bytes = Buffer.from(await src.arrayBuffer());

  const fileName = sourceUrl.split("/").pop()?.split("?")[0] || "upload";
  const objectPath = `classes/${resourceType}s/${Date.now()}-${fileName}`;

  const uploadUrl = `https://${FIREBASE_STORAGE_HOST}/v0/b/${BUCKET}/o?uploadType=media&name=${encodeURIComponent(
    objectPath,
  )}`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": contentType,
    },
    body: bytes,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`upload failed: ${data.error?.message || res.statusText}`);
  }

  const token = data.downloadTokens?.split(",")[0];
  return `https://${FIREBASE_STORAGE_HOST}/v0/b/${BUCKET}/o/${encodeURIComponent(
    objectPath,
  )}?alt=media${token ? `&token=${token}` : ""}`;
}

// --- main ------------------------------------------------------------------

async function main() {
  if (!API_KEY || !PROJECT_ID || !BUCKET) {
    throw new Error(
      "Missing env vars (NEXT_PUBLIC_FIREBASE_API_KEY / _PROJECT_ID / _STORAGE_BUCKET). " +
        "Run with: node --env-file=.env scripts/migrate_to_firebase_storage.mjs",
    );
  }

  console.log(`\nMigrating class media → Firebase Storage (${BUCKET})\n`);

  const email = process.env.ADMIN_EMAIL || (await ask("Admin email: "));
  const password =
    process.env.ADMIN_PASSWORD || (await ask("Admin password: ", { hidden: true }));

  console.log("\nSigning in…");
  const idToken = await signIn(email, password);
  console.log("Signed in.\n");

  const docs = await listClasses(idToken);
  console.log(`Found ${docs.length} class docs.\n`);

  let migrated = 0;
  let skipped = 0;
  const failures = [];

  for (const doc of docs) {
    const id = docId(doc);
    const image = strField(doc, "image");
    const video = strField(doc, "video");
    const update = {};

    try {
      if (needsMigration(image)) {
        update.image = await uploadRemoteToStorage(idToken, image, "image");
      }
      if (needsMigration(video)) {
        update.video = await uploadRemoteToStorage(idToken, video, "video");
      }

      const changed = Object.keys(update);
      if (changed.length > 0) {
        await patchFields(idToken, id, update);
        migrated++;
        console.log(`✓ ${id} → migrated ${changed.join(", ")}`);
      } else {
        skipped++;
        console.log(`· ${id} → skipped (already on Storage / no media)`);
      }
    } catch (err) {
      failures.push({ id, message: err.message || String(err) });
      console.error(`✗ ${id} → FAILED: ${err.message || err}`);
    }

    // Gentle pacing so the source host doesn't rate-limit us.
    await sleep(500);
  }

  console.log(
    `\nDone. migrated=${migrated} skipped=${skipped} failed=${failures.length}`,
  );
  if (failures.length > 0) {
    console.log("\nFailures (re-run to retry):");
    for (const f of failures) console.log(`  ${f.id}: ${f.message}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`\nMigration aborted: ${err.message || err}`);
  process.exit(1);
});

/**
 * One-time migration: move existing class media from GitHub (raw.githubusercontent.com)
 * to Cloudinary, and update each Firestore `classes` doc to the new secure_url.
 *
 * - Driven by Firestore (not the livefiles/ folder) so orphaned files are ignored.
 * - Uses Cloudinary remote-fetch: the existing GitHub URL is passed as the `file`
 *   param, so Cloudinary downloads it directly (no local bytes needed).
 * - Idempotent: docs already pointing at Cloudinary are skipped, so it is safe to re-run.
 *
 * Uses the Firebase REST APIs (Auth + Firestore) directly rather than the Firebase JS
 * SDK, which throws `auth/network-request-failed` under Node. All calls use Node's
 * global fetch.
 *
 * Run (Node 20+, loads .env automatically):
 *   node --env-file=.env scripts/migrate_to_cloudinary.mjs
 *
 * You will be prompted for an admin email + password (the user must exist in Firebase
 * Auth; writes still go through Firestore security rules under that user's token).
 */

import readline from "node:readline";

const GITHUB_HOST = "raw.githubusercontent.com";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

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
    }
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
        `List classes failed: ${data.error?.message || res.statusText}`
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
      Object.entries(fields).map(([k, v]) => [k, { stringValue: v }])
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

// --- cloudinary ------------------------------------------------------------

const isGithubUrl = (value) =>
  typeof value === "string" && value.includes(GITHUB_HOST);

async function uploadRemoteToCloudinary(url, resourceType) {
  // Unsigned presets reject remote-URL fetch ("Unknown API key"), so download the
  // bytes from GitHub and upload the actual file — exactly what the browser does.
  const fileRes = await fetch(url);
  if (!fileRes.ok) {
    throw new Error(`Could not fetch source (${fileRes.status}) ${url}`);
  }
  const blob = await fileRes.blob();
  const fileName = url.split("/").pop() || "upload";

  const formData = new FormData();
  formData.append("file", blob, fileName);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) {
    let message = res.statusText;
    try {
      const err = await res.json();
      message = err?.error?.message || message;
    } catch {
      /* no JSON body */
    }
    throw new Error(`Cloudinary upload failed: ${message}`);
  }
  const data = await res.json();
  return data.secure_url;
}

// --- main ------------------------------------------------------------------

async function main() {
  if (!CLOUD_NAME || !UPLOAD_PRESET || !API_KEY || !PROJECT_ID) {
    throw new Error(
      "Missing env vars. Run with: node --env-file=.env scripts/migrate_to_cloudinary.mjs"
    );
  }

  console.log(`\nMigrating GitHub media → Cloudinary (cloud: ${CLOUD_NAME})\n`);

  const email = await ask("Admin email: ");
  const password = await ask("Admin password: ", { hidden: true });

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
      if (isGithubUrl(image)) {
        update.image = await uploadRemoteToCloudinary(image, "image");
      }
      if (isGithubUrl(video)) {
        update.video = await uploadRemoteToCloudinary(video, "video");
      }

      const changed = Object.keys(update);
      if (changed.length > 0) {
        await patchFields(idToken, id, update);
        migrated++;
        console.log(`✓ ${id} → migrated ${changed.join(", ")}`);
      } else {
        skipped++;
        console.log(`· ${id} → skipped (already on Cloudinary / no media)`);
      }
    } catch (err) {
      failures.push({ id, message: err.message || String(err) });
      console.error(`✗ ${id} → FAILED: ${err.message || err}`);
    }
  }

  console.log(
    `\nDone. migrated=${migrated} skipped=${skipped} failed=${failures.length}`
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

/**
 * One-time migration: move existing class media from Cloudinary (res.cloudinary.com)
 * to ImageKit, and update each Firestore `classes` doc to the new url.
 *
 * - Driven by Firestore so orphaned files are ignored.
 * - Uses ImageKit's server SDK, which accepts a remote URL directly as the `file`
 *   param, so ImageKit downloads the Cloudinary asset itself (no local bytes needed).
 * - Idempotent: docs already pointing at ImageKit are skipped, so it is safe to re-run.
 *
 * Uses the Firebase REST APIs (Auth + Firestore) directly rather than the Firebase JS
 * SDK, which throws `auth/network-request-failed` under Node. All calls use Node's
 * global fetch.
 *
 * IMPORTANT: run this BEFORE the Cloudinary account deactivates — once those source
 * URLs are dead, the remote fetch will fail and originals must be re-uploaded by hand.
 *
 * Run (Node 20+, loads .env automatically):
 *   node --env-file=.env scripts/migrate_to_imagekit.mjs
 *
 * You will be prompted for an admin email + password (the user must exist in Firebase
 * Auth; writes still go through Firestore security rules under that user's token).
 */

import readline from "node:readline";
import ImageKit from "imagekit";

const CLOUDINARY_HOST = "res.cloudinary.com";

const IK_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const IK_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
const IK_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
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

// --- imagekit --------------------------------------------------------------

const imagekit = new ImageKit({
  publicKey: IK_PUBLIC_KEY,
  privateKey: IK_PRIVATE_KEY,
  urlEndpoint: IK_URL_ENDPOINT,
});

const isCloudinaryUrl = (value) =>
  typeof value === "string" && value.includes(CLOUDINARY_HOST);

async function uploadRemoteToImageKit(url) {
  // ImageKit's server SDK accepts a remote URL as `file` and fetches it itself.
  const fileName = url.split("/").pop()?.split("?")[0] || "upload";
  const res = await imagekit.upload({
    file: url,
    fileName,
    useUniqueFileName: true,
  });
  return res.url;
}

// --- main ------------------------------------------------------------------

async function main() {
  if (
    !IK_PUBLIC_KEY ||
    !IK_PRIVATE_KEY ||
    !IK_URL_ENDPOINT ||
    !API_KEY ||
    !PROJECT_ID
  ) {
    throw new Error(
      "Missing env vars. Run with: node --env-file=.env scripts/migrate_to_imagekit.mjs"
    );
  }

  console.log(`\nMigrating Cloudinary media → ImageKit (${IK_URL_ENDPOINT})\n`);

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
      if (isCloudinaryUrl(image)) {
        update.image = await uploadRemoteToImageKit(image);
      }
      if (isCloudinaryUrl(video)) {
        update.video = await uploadRemoteToImageKit(video);
      }

      const changed = Object.keys(update);
      if (changed.length > 0) {
        await patchFields(idToken, id, update);
        migrated++;
        console.log(`✓ ${id} → migrated ${changed.join(", ")}`);
      } else {
        skipped++;
        console.log(`· ${id} → skipped (already on ImageKit / no media)`);
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

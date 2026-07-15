/**
 * Recover class media into Firebase Storage from the original files preserved in
 * git history (the `livefiles/` folder), for docs still pointing at ImageKit.
 *
 * Why this exists: the ImageKit account is over its monthly bandwidth cap (every
 * ik.imagekit.io URL returns 429) and the older Cloudinary account is deactivated
 * (401), so the live media can't be fetched from either remote. However, the
 * original uploads were committed to `livefiles/images` and `livefiles/videos`
 * before the GitHub → Cloudinary → ImageKit migrations. Each ImageKit filename is
 * `<livefiles-basename>_<cloudinary-suffix>_<imagekit-suffix>.<ext>`, so we can
 * match a class's ImageKit URL back to its original by longest-prefix and re-upload
 * those bytes to Firebase Storage.
 *
 * What it does, driven by Firestore `classes`:
 *   - image/video fields already on firebasestorage.googleapis.com → skipped.
 *   - fields matchable to a `livefiles/` original → uploaded to Firebase Storage
 *     (REST) and the Firestore URL is rewritten. Idempotent, safe to re-run.
 *   - fields with NO livefiles match (blob_* images, the June-2026 videos) → left
 *     untouched and written to MEDIA_RECOVERY.md so they can be re-uploaded by hand
 *     through the admin dashboard (which now uploads to Firebase Storage).
 *
 * Uses Firebase REST (Auth + Firestore + Storage) — the JS SDK fails under Node.
 * Reads the originals directly from git history, so no working-tree checkout of
 * `livefiles/` is needed. Run Storage App Check enforcement OFF while running.
 *
 * Run (Node 20+ with git available, from repo root):
 *   node --env-file=.env scripts/recover_media_to_firebase.mjs
 */

import readline from "node:readline";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const IMAGEKIT_HOST = "ik.imagekit.io";
const FIREBASE_STORAGE_HOST = "firebasestorage.googleapis.com";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const VIDEO_EXTS = new Set(["mov", "mp4", "webm", "m4v"]);
const CONTENT_TYPES = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mov: "video/quicktime",
  mp4: "video/mp4",
  webm: "video/webm",
  m4v: "video/x-m4v",
};

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

// --- git-backed livefiles index -------------------------------------------

const stripExt = (n) => n.replace(/\.[^.]+$/, "");
const extOf = (n) => (n.split(".").pop() || "").toLowerCase();

// Build { baseNoExt -> { blob, path, ext } } from the union of `livefiles/`
// across ALL commits (files were added one-by-one and later removed).
function buildLivefilesIndex() {
  const commits = execFileSync("git", ["rev-list", "--all"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean);

  const index = new Map(); // baseNoExt -> entry
  for (const commit of commits) {
    let out = "";
    try {
      out = execFileSync(
        "git",
        ["ls-tree", "-r", commit, "--", "livefiles"],
        { encoding: "utf8" },
      );
    } catch {
      continue;
    }
    for (const line of out.split("\n")) {
      if (!line) continue;
      // "<mode> blob <hash>\t<path>"
      const [meta, path] = line.split("\t");
      if (!path) continue;
      const parts = meta.split(/\s+/);
      if (parts[1] !== "blob") continue;
      const blob = parts[2];
      const file = path.split("/").pop();
      if (!file || file === "a.txt") continue;
      const baseNoExt = stripExt(file);
      if (!index.has(baseNoExt)) {
        index.set(baseNoExt, { blob, path, ext: extOf(file) });
      }
    }
  }
  return index;
}

// longest livefiles base that is a whole-segment prefix of the imagekit name
function matchLivefiles(imagekitNameNoExt, index) {
  let best = null;
  for (const [baseNoExt, entry] of index) {
    if (
      imagekitNameNoExt === baseNoExt ||
      imagekitNameNoExt.startsWith(baseNoExt + "_")
    ) {
      if (!best || baseNoExt.length > best.baseNoExt.length) {
        best = { baseNoExt, ...entry };
      }
    }
  }
  return best;
}

const readBlob = (blob) =>
  execFileSync("git", ["cat-file", "-p", blob], { maxBuffer: 512 * 1024 * 1024 });

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

const strField = (doc, key) => doc.fields?.[key]?.stringValue ?? null;
const docId = (doc) => doc.name.split("/").pop();

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

// --- firebase storage (REST) ----------------------------------------------

const isFirebaseUrl = (v) =>
  typeof v === "string" && v.includes(FIREBASE_STORAGE_HOST);
const isImageKitUrl = (v) =>
  typeof v === "string" && v.includes(IMAGEKIT_HOST);

// the imagekit object name, e.g. ".../usyjlejkf2/<name>?..." or for videos
// ".../usyjlejkf2/<name>/ik-video.mp4?..."
function imagekitName(url) {
  try {
    const path = new URL(url).pathname; // /<id>/<name>[/ik-video.mp4]
    const segs = path.split("/").filter(Boolean);
    // drop the imagekit id (first seg); drop trailing ik-video.mp4 if present
    let rest = segs.slice(1);
    if (rest[rest.length - 1] === "ik-video.mp4") rest = rest.slice(0, -1);
    return decodeURIComponent(rest.join("/"));
  } catch {
    return null;
  }
}

async function uploadBytesToStorage(idToken, bytes, objectPath, contentType) {
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
        "Run: node --env-file=.env scripts/recover_media_to_firebase.mjs",
    );
  }

  console.log(`\nRecovering class media → Firebase Storage (${BUCKET})`);
  console.log("Source: original files in git history (livefiles/)\n");

  const index = buildLivefilesIndex();
  console.log(`Indexed ${index.size} original files from git history.\n`);

  const email = process.env.ADMIN_EMAIL || (await ask("Admin email: "));
  const password =
    process.env.ADMIN_PASSWORD || (await ask("Admin password: ", { hidden: true }));

  console.log("\nSigning in…");
  const idToken = await signIn(email, password);
  console.log("Signed in.\n");

  const docs = await listClasses(idToken);
  console.log(`Found ${docs.length} class docs.\n`);

  let recovered = 0;
  let skipped = 0;
  const unmatched = []; // { id, name, field, imagekitFile }
  const failures = [];

  for (const doc of docs) {
    const id = docId(doc);
    const className = strField(doc, "name") || "(unnamed)";
    const update = {};

    for (const field of ["image", "video"]) {
      const url = strField(doc, field);
      if (!url) continue;
      if (isFirebaseUrl(url)) {
        skipped++;
        continue;
      }

      // Some docs inline the media as a base64 data: URL directly in Firestore.
      // The bytes are self-contained, so decode and move them to Storage (this
      // also shrinks the Firestore doc, which can be near the 1 MB limit).
      if (url.startsWith("data:")) {
        try {
          const m = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(url);
          const contentType = (m && m[1]) || "application/octet-stream";
          const isB64 = !!(m && m[2]);
          const bytes = Buffer.from(
            decodeURIComponent(m ? m[3] : ""),
            isB64 ? "base64" : "utf8",
          );
          const kind = contentType.startsWith("video/") ? "videos" : "images";
          const ext = contentType.split("/")[1]?.split("+")[0] || "bin";
          const objectPath = `classes/${kind}/${Date.now()}-${id}.${ext}`;
          update[field] = await uploadBytesToStorage(
            idToken,
            bytes,
            objectPath,
            contentType,
          );
          recovered++;
          console.log(`✓ ${id} [${field}] ← inline data: URL (${bytes.length} bytes)`);
        } catch (err) {
          failures.push({ id, field, message: err.message || String(err) });
          console.error(`✗ ${id} [${field}] → data: FAILED: ${err.message || err}`);
        }
        continue;
      }

      if (!isImageKitUrl(url)) {
        // some other/legacy host — record it for manual handling
        unmatched.push({ id, name: className, field, imagekitFile: url });
        continue;
      }

      const name = imagekitName(url);
      const nameNoExt = name ? stripExt(name) : "";
      const isVideo =
        VIDEO_EXTS.has(extOf(name || "")) || url.includes("/ik-video.mp4");
      const hit = nameNoExt ? matchLivefiles(nameNoExt, index) : null;

      if (!hit || (isVideo && !VIDEO_EXTS.has(hit.ext))) {
        unmatched.push({ id, name: className, field, imagekitFile: name || url });
        continue;
      }

      try {
        const bytes = readBlob(hit.blob);
        const kind = isVideo ? "videos" : "images";
        const objectPath = `classes/${kind}/${Date.now()}-${hit.baseNoExt}.${hit.ext}`;
        const contentType = CONTENT_TYPES[hit.ext] || "application/octet-stream";
        update[field] = await uploadBytesToStorage(
          idToken,
          bytes,
          objectPath,
          contentType,
        );
        recovered++;
        console.log(`✓ ${id} [${field}] ← livefiles/${hit.path.split("livefiles/").pop() || hit.path}`);
      } catch (err) {
        failures.push({ id, field, message: err.message || String(err) });
        console.error(`✗ ${id} [${field}] → FAILED: ${err.message || err}`);
      }
    }

    if (Object.keys(update).length > 0) {
      try {
        await patchFields(idToken, id, update);
      } catch (err) {
        failures.push({ id, field: "patch", message: err.message || String(err) });
        console.error(`✗ ${id} → PATCH FAILED: ${err.message || err}`);
      }
    }
  }

  // Write the manual re-upload list.
  const md = renderReport({ recovered, skipped, unmatched, failures });
  writeFileSync("MEDIA_RECOVERY.md", md);

  console.log(
    `\nDone. recovered=${recovered} skipped(already firebase)=${skipped} ` +
      `needs-manual=${unmatched.length} failed=${failures.length}`,
  );
  console.log("\nWrote MEDIA_RECOVERY.md with the classes to re-upload by hand.");
  if (failures.length > 0) process.exitCode = 1;
}

function renderReport({ recovered, skipped, unmatched, failures }) {
  const byClass = new Map();
  for (const u of unmatched) {
    if (!byClass.has(u.id)) byClass.set(u.id, { name: u.name, fields: [] });
    byClass.get(u.id).fields.push({ field: u.field, file: u.imagekitFile });
  }

  const lines = [];
  lines.push("# Media re-upload checklist");
  lines.push("");
  lines.push(
    "Generated by `scripts/recover_media_to_firebase.mjs`. The originals for these " +
      "were not in git history (`livefiles/`), and both remotes are unusable " +
      "(ImageKit is over its bandwidth cap → 429; Cloudinary is deactivated → 401), " +
      "so their bytes now live **only on ImageKit**.",
  );
  lines.push("");
  lines.push(
    `**Recovered from livefiles:** ${recovered} · **Already on Firebase:** ${skipped} · ` +
      `**Needs manual re-upload:** ${unmatched.length}`,
  );
  lines.push("");
  lines.push("## To fix each class below");
  lines.push("");
  lines.push(
    "Open **/admin**, edit the class, and re-select the image and/or video. " +
      "New uploads go straight to Firebase Storage. If you no longer have the " +
      "original file, the alternative is to wait for ImageKit's monthly bandwidth " +
      "to reset and then run `scripts/migrate_to_firebase_storage.mjs`, which will " +
      "pull whatever is still deliverable from ImageKit.",
  );
  lines.push("");

  if (byClass.size === 0) {
    lines.push("_Nothing needs manual re-upload. 🎉_");
  } else {
    lines.push("| Class ID | Class name | Field(s) missing | ImageKit file |");
    lines.push("| --- | --- | --- | --- |");
    const short = (s) =>
      typeof s === "string" && s.length > 80 ? s.slice(0, 77) + "…" : s;
    for (const [id, info] of byClass) {
      for (const f of info.fields) {
        lines.push(`| \`${id}\` | ${info.name} | ${f.field} | \`${short(f.file)}\` |`);
      }
    }
  }

  if (failures.length > 0) {
    lines.push("");
    lines.push("## Upload failures (re-run to retry)");
    lines.push("");
    for (const f of failures) {
      lines.push(`- \`${f.id}\` [${f.field}]: ${f.message}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

main().catch((err) => {
  console.error(`\nRecovery aborted: ${err.message || err}`);
  process.exit(1);
});

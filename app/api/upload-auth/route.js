import { getUploadAuthParams } from "@imagekit/next/server";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function emailFromIdToken(idToken) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.users?.[0]?.email ?? null;
}

async function isAdmin(email, idToken) {
  const res = await fetch(
    `${FIRESTORE_BASE}/admins/${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${idToken}` } },
  );
  return res.ok;
}

export async function POST(req) {
  if (!PRIVATE_KEY || !PUBLIC_KEY) {
    return Response.json(
      { error: "ImageKit is not configured." },
      { status: 500 },
    );
  }

  const auth = req.headers.get("authorization") || "";
  const idToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!idToken) {
    return Response.json({ error: "Missing auth token." }, { status: 401 });
  }

  const email = await emailFromIdToken(idToken);
  if (!email || !(await isAdmin(email, idToken))) {
    return Response.json({ error: "Not authorized." }, { status: 403 });
  }

  const { token, expire, signature } = getUploadAuthParams({
    privateKey: PRIVATE_KEY,
    publicKey: PUBLIC_KEY,
  });

  return Response.json({ token, expire, signature, publicKey: PUBLIC_KEY });
}

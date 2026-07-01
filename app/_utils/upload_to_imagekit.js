"use client";

import { upload } from "@imagekit/next";
import { auth } from "@/app/_components/backend/config";
import compressVideo from "@/app/_utils/compress_video";

// Free-plan cap for a single video upload.
const MAX_VIDEO_SIZE_MB = 100;

// compress/resize an image with the Canvas API before upload
const compressImage = (file, maxWidth) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) =>
            blob ? resolve(blob) : reject(new Error("Image compression failed")),
          "image/png",
          0.9
        );
      };
      img.onerror = () => reject(new Error("Could not read image file"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });

// Fetch short-lived signed upload params from our admin-gated API route.
// The file itself never passes through the server — only this small request.
const getUploadAuth = async () => {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error("You must be signed in to upload.");
  }

  const res = await fetch("/api/upload-auth", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not authorize upload.");
  }

  return res.json();
};

/**
 * Upload a file directly from the browser to ImageKit.
 * The signed params come from /api/upload-auth, but the file bytes go
 * browser → ImageKit directly, bypassing the Vercel serverless 4.5 MB body limit.
 *
 * @param {File} file
 * @param {{ resourceType?: "image" | "video", maxImageWidth?: number, onProgress?: (pct: number) => void, onCompressProgress?: (pct: number) => void }} opts
 * @returns {Promise<string>} the url of the uploaded asset
 */
const uploadToImageKit = async (
  file,
  {
    resourceType = "image",
    maxImageWidth = 800,
    onProgress,
    onCompressProgress,
  } = {}
) => {
  let upload_ = file;
  let fileName = file.name;

  if (resourceType === "video") {
    // Compress in the browser first so the stored file stays small. If
    // compression fails (e.g. wasm/CDN issue), fall back to the original so
    // the upload isn't fully blocked.
    try {
      upload_ = await compressVideo(file, { onProgress: onCompressProgress });
    } catch {
      upload_ = file;
    }
    fileName = upload_.name;

    const sizeMB = upload_.size / (1024 * 1024);
    if (sizeMB > MAX_VIDEO_SIZE_MB) {
      throw new Error(
        `Video is too large (${sizeMB.toFixed(
          1
        )} MB). Upload a video under ${MAX_VIDEO_SIZE_MB} MB.`
      );
    }
  } else {
    upload_ = await compressImage(file, maxImageWidth);
    fileName = `${(file.name || "image").replace(/\.[^.]+$/, "")}.png`;
  }

  const { token, expire, signature, publicKey } = await getUploadAuth();

  const res = await upload({
    file: upload_,
    fileName,
    token,
    expire,
    signature,
    publicKey,
    onProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });

  return res.url;
};

export default uploadToImageKit;

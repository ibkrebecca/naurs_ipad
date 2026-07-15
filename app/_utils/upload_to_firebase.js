"use client";

import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/app/_components/backend/config";
import compressVideo from "@/app/_utils/compress_video";

// Keep videos small enough to stay comfortably within the Storage bucket.
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

/**
 * Upload a file directly from the browser to Firebase Storage.
 * The upload is authorized by the caller's Firebase Auth session against the
 * Storage security rules (admins only), and the bytes go browser → Storage
 * directly, so there is no serverless body-size limit to worry about.
 *
 * @param {File} file
 * @param {{ resourceType?: "image" | "video", maxImageWidth?: number, onProgress?: (pct: number) => void, onCompressProgress?: (pct: number) => void }} opts
 * @returns {Promise<string>} the download url of the uploaded asset
 */
const uploadToFirebase = async (
  file,
  {
    resourceType = "image",
    maxImageWidth = 800,
    onProgress,
    onCompressProgress,
  } = {}
) => {
  if (!auth.currentUser) {
    throw new Error("You must be signed in to upload.");
  }

  let upload_ = file;
  let fileName = file.name;
  let contentType = file.type;

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
    contentType = upload_.type || "video/mp4";

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
    contentType = "image/png";
  }

  const path = `classes/${resourceType}s/${Date.now()}-${fileName}`;
  const task = uploadBytesResumable(ref(storage, path), upload_, {
    contentType,
  });

  await new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        if (onProgress && snapshot.totalBytes) {
          onProgress(
            Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            )
          );
        }
      },
      reject,
      resolve
    );
  });

  return getDownloadURL(task.snapshot.ref);
};

export default uploadToFirebase;

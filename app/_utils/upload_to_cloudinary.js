"use client";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

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

/**
 * Upload a file directly from the browser to Cloudinary (unsigned).
 * Bypasses the Vercel serverless 4.5 MB body limit entirely.
 *
 * @param {File} file
 * @param {{ resourceType?: "image" | "video", maxImageWidth?: number, onProgress?: (pct: number) => void }} opts
 * @returns {Promise<string>} the secure_url of the uploaded asset
 */
const uploadToCloudinary = async (
  file,
  { resourceType = "image", maxImageWidth = 800, onProgress } = {}
) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
    );
  }

  let upload = file;

  if (resourceType === "video") {
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_VIDEO_SIZE_MB) {
      throw new Error(
        `Video is too large (${sizeMB.toFixed(
          1
        )} MB). Upload a video under ${MAX_VIDEO_SIZE_MB} MB.`
      );
    }
  } else {
    upload = await compressImage(file, maxImageWidth);
  }

  const formData = new FormData();
  formData.append("file", upload);
  formData.append("upload_preset", UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url);
      } else {
        let message = xhr.statusText;
        try {
          const err = JSON.parse(xhr.responseText);
          message = err?.error?.message || message;
        } catch {
          // response had no JSON body; fall back to statusText
        }
        reject(new Error(`Upload failed: ${message}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed: network error"));
    xhr.onabort = () => reject(new Error("Upload aborted"));

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`
    );
    xhr.send(formData);
  });
};

export default uploadToCloudinary;

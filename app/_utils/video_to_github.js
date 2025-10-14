"use client";

import { toast } from "react-toastify";

const videoToGithub = async (file) => {
  const MAX_SIZE_MB = 2.5;

  // 1️⃣ Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_SIZE_MB) {
    toast.error(
      `Video is too large. Upload a video less than ${MAX_SIZE_MB} MB.`
    );
  }

  // 2️⃣ Convert file to Base64
  const base64File = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
  });

  // 3️⃣ Generate unique filename
  const uniqueFileName = `${Date.now()}_${file.name}`;

  // 4️⃣ Upload to GitHub
  const res = await fetch("/api/upload_to_github", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      base64File,
      folder: "videos",
      fileName: uniqueFileName,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub upload failed: ${text}`);
  }

  const data = await res.json();
  return data.rawUrl;
};

export default videoToGithub;

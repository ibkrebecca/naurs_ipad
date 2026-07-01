"use client";

// Client-side video compression with ffmpeg.wasm (single-thread).
//
// We transcode in the browser BEFORE uploading so the stored file stays
// small — ImageKit's free plan has limited storage and its own video
// transformations consume metered "video processing units", so shrinking
// here is what actually keeps us on the free tier.
//
// Single-thread ffmpeg.wasm does not use SharedArrayBuffer, so no COOP/COEP
// headers (and no Next.js server changes) are required. The ~30 MB core is
// lazy-loaded from a CDN only the first time an admin uploads a video.

// Pinned ffmpeg core version served from the CDN.
const CORE_VERSION = "0.12.10";
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`;

// Memoized, loaded FFmpeg instance shared across calls.
let ffmpegPromise = null;

const loadFFmpeg = async () => {
  if (ffmpegPromise) return ffmpegPromise;

  ffmpegPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");

    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: await toBlobURL(
        `${CORE_BASE}/ffmpeg-core.js`,
        "text/javascript"
      ),
      wasmURL: await toBlobURL(
        `${CORE_BASE}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    return ffmpeg;
  })();

  // If loading fails, don't cache the rejected promise.
  try {
    return await ffmpegPromise;
  } catch (err) {
    ffmpegPromise = null;
    throw err;
  }
};

/**
 * Compress a video to H.264 MP4 (max 720p, CRF 28, AAC audio) in the browser.
 *
 * @param {File} file the source video
 * @param {{ onProgress?: (pct: number) => void }} [opts]
 * @returns {Promise<File>} the compressed .mp4 file, or the original file if
 *   compression did not make it smaller.
 */
const compressVideo = async (file, { onProgress } = {}) => {
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await loadFFmpeg();

  const onProgressHandler = ({ progress }) => {
    if (onProgress) {
      // ffmpeg reports 0..1; clamp because it can briefly exceed 1.
      onProgress(Math.min(100, Math.max(0, Math.round(progress * 100))));
    }
  };
  ffmpeg.on("progress", onProgressHandler);

  const inputName = "input";
  const outputName = "output.mp4";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
      "-i",
      inputName,
      // Cap the long edge at 1280px (≈720p) while keeping aspect ratio.
      // "-2" keeps the other dimension even, which H.264 requires.
      "-vf",
      "scale='min(1280,iw)':'-2'",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      // Move the moov atom to the front for faster web playback.
      "-movflags",
      "+faststart",
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: "video/mp4" });

    // Never upload something bigger than the original.
    if (blob.size >= file.size) {
      return file;
    }

    const baseName = (file.name || "video").replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.mp4`, { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", onProgressHandler);
    // Best-effort cleanup of the in-memory FS.
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
};

export default compressVideo;

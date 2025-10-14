const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (err) => reject(err);
  });

const imageToGithub = async (file, maxWidth = 800) => {
  // compress/resize using canvas
  const compressedBlob = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, "image/png", 0.9);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  // convert blob to base64
  const base64File = await blobToBase64(compressedBlob);

  // generate unique filename
  const fileName = `${Date.now()}_${file.name}`;

  // send to API route
  const res = await fetch("/api/upload_to_github", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64File, folder: "images", fileName }),
  });

  const data = await res.json();
  return data.rawUrl;
};

export default imageToGithub;

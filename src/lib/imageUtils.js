// src/lib/imageUtils.js

/**
 * Compresses an image file (e.g. from camera or file upload) using browser canvas.
 * Produces a lightweight JPEG data URL (~30-60 KB) ideal for instant cross-device sync.
 *
 * @param {File} file - The file object from <input type="file" />
 * @param {number} [maxWidth=450] - Maximum width or height
 * @param {number} [quality=0.82] - JPEG quality between 0 and 1
 * @returns {Promise<string>} Base64 data URL string
 */
export const compressImageFile = (file, maxWidth = 450, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please select a valid image file."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Unable to read image."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("File read error."));
    reader.readAsDataURL(file);
  });
};

/**
 * Curated preset avatars for quick one-click selection.
 */
export const SAMPLE_AVATARS = [
  {
    gender: "Female",
    label: "Professional",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=500&h=500",
  },
  {
    gender: "Female",
    label: "Traditional",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&w=500&h=500",
  },
  {
    gender: "Female",
    label: "Modern",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?fit=crop&w=500&h=500",
  },
  {
    gender: "Male",
    label: "Executive",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fit=crop&w=500&h=500",
  },
  {
    gender: "Male",
    label: "Smart Casual",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=500&h=500",
  },
  {
    gender: "Male",
    label: "Classic",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=crop&w=500&h=500",
  },
];


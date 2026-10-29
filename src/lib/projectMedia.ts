const imageMimeTypes = ["image/jpeg", "image/png", "image/webp"];

export const MAX_PROJECT_MEDIA_SIZE_BYTES = 49_000_000;
export const PROJECT_MEDIA_URL_REFRESH_MS = 50 * 60 * 1000;
export const PROJECT_MEDIA_SIGNED_URL_TTL_SECONDS = 60 * 60;

export type ProjectMediaType = "image" | "video";

export function getProjectMediaType(path: string): ProjectMediaType {
  return /\.mp4(?:$|[?#])/i.test(path) ? "video" : "image";
}

function validateFileSize(file: File) {
  if (file.size > MAX_PROJECT_MEDIA_SIZE_BYTES) {
    return `Le fichier ${file.name} dépasse la limite de 49 MB.`;
  }
  return "";
}

export function validateCoverMediaFile(file: File) {
  const mimeType = file.type.toLowerCase();
  const isImage = imageMimeTypes.includes(mimeType);
  const isMp4 = mimeType === "video/mp4";

  if (!isImage && !isMp4) {
    return "La couverture doit être une image JPEG, PNG ou WebP, ou une vidéo MP4.";
  }
  if (isMp4 && !/\.mp4$/i.test(file.name)) {
    return "Une vidéo MP4 doit avoir l’extension .mp4.";
  }
  return validateFileSize(file);
}

export function validateScreenshotFile(file: File) {
  if (!imageMimeTypes.includes(file.type.toLowerCase())) {
    return `La capture ${file.name} doit être au format JPEG, PNG ou WebP.`;
  }
  return validateFileSize(file);
}

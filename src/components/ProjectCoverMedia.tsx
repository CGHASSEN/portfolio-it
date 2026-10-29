import { getProjectMediaType } from "../lib/projectMedia";

export function ProjectCoverMedia({
  src,
  mediaPath = src,
  alt,
  className,
}: {
  src: string;
  mediaPath?: string;
  alt: string;
  className?: string;
}) {
  if (getProjectMediaType(mediaPath) === "video") {
    return (
      <video
        aria-label={alt}
        className={className}
        controls
        playsInline
        preload="metadata"
        src={src}
      >
        Votre navigateur ne peut pas lire cette vidéo.
      </video>
    );
  }

  return <img alt={alt} className={className} loading="lazy" src={src} />;
}

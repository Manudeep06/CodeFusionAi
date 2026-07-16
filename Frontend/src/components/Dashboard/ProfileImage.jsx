import { useState } from "react";

function ProfileImage({ src, fallback, alt, className }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={alt || ""}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={className}
      />
    );
  }

  return (
    <div className={`bg-[var(--color-ink)] flex items-center justify-center font-black text-[var(--color-paper-raised)] select-none ${className}`}>
      {fallback}
    </div>
  );
}

export default ProfileImage;

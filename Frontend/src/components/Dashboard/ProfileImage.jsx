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
    <div style={{ background: "var(--gradient-brand)" }} className={`flex items-center justify-center font-bold text-white select-none ${className}`}>
      {fallback}
    </div>
  );
}

export default ProfileImage;

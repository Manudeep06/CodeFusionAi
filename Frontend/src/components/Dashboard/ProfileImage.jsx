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
    <div className={`bg-gradient-to-tr from-purple-600 via-violet-600 to-blue-500 flex items-center justify-center font-black text-white select-none ${className}`}>
      {fallback}
    </div>
  );
}

export default ProfileImage;

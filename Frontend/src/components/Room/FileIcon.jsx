import { getFileColor } from "./constants";

function FileIcon({ filename, size = 14 }) {
  const color = getFileColor(filename);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M4 2h5.5L13 5.5V14H4V2z" fill={color + "20"} stroke={color} strokeWidth="1" />
      <path d="M9 2v3.5h4" stroke={color} strokeWidth="1" fill="none" />
      <path d="M6 8h4M6 10h3" stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export default FileIcon;

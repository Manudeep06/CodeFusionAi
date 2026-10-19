import { Link } from "react-router-dom";

export function BrandMark({ size = 17 }) {
  return (
    <span className="cf-brand-mark" aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8 9 3 3-3 3m5 0h3M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
      </svg>
    </span>
  );
}

export default function Brand({ to = "/" }) {
  return (
    <Link to={to} className="cf-brand">
      <BrandMark /> CodeFusionAI
    </Link>
  );
}

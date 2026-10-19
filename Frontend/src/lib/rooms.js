import { Atom, Triangle, Server, FileCode2 } from "lucide-react";

/** Room templates offered in the create dialog (ids match services/templates.js). */
export const TEMPLATES = [
  { id: "react", name: "React", description: "Vite + JSX", color: "#0ea5e9", tint: "#e0f2fe", icon: Atom },
  { id: "vue", name: "Vue", description: "Vite + SFC", color: "#16a34a", tint: "#dcfce7", icon: Triangle },
  { id: "node", name: "Node", description: "Express API", color: "#65a30d", tint: "#ecfccb", icon: Server },
  { id: "vanilla", name: "Vanilla", description: "HTML + JS", color: "#ca8a04", tint: "#fef9c3", icon: FileCode2 },
];

export const templateColor = (id) => TEMPLATES.find((t) => t.id === id)?.color;

/** "just now", "5m ago", "3h ago", "2d ago", "4w ago", "13mo ago". */
export const timeAgo = (date) => {
  if (!date) return "—";
  const s = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  // Each step: how many of the current unit make one of the next.
  const steps = [[60, "h"], [24, "d"], [7, "w"], [4.35, "mo"], [12, "y"]];
  let v = s / 60;
  let label = "m";
  for (const [size, next] of steps) {
    if (v < size) break;
    v /= size;
    label = next;
  }
  return `${Math.floor(v)}${label} ago`;
};

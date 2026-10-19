import { auth } from "../firebase/firebase";

export const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

/** Current user's Firebase ID token (refreshed automatically by the SDK). */
export const getIdToken = async () => (auth?.currentUser ? auth.currentUser.getIdToken() : null);

/**
 * fetch() for the CodeFusionAI API. Accepts a full URL or a path ("/api/…"),
 * attaches `Authorization: Bearer <Firebase ID token>`, and defaults to JSON.
 */
export async function apiFetch(url, options = {}) {
  const token = await getIdToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(url.startsWith("http") ? url : `${API_BASE}${url}`, { ...options, headers });
}

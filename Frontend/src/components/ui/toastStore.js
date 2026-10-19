/**
 * Toast event bus. Call `toast.success("…")` / `toast.error("…")` from
 * anywhere (components, socket handlers, services) — <Toaster /> renders them.
 */
export const toastListeners = new Set();
let nextId = 1;

function push(type, message, options = {}) {
  const item = { id: nextId++, type, message, duration: options.duration ?? (type === "error" ? 6000 : 3500) };
  toastListeners.forEach((fn) => fn(item));
  return item.id;
}

export const toast = {
  success: (message, options) => push("success", message, options),
  error: (message, options) => push("error", message, options),
  info: (message, options) => push("info", message, options),
};

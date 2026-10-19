/**
 * Promise-based replacement for window.confirm, rendered by <ConfirmHost />.
 *   if (await confirmDialog({ title, body, confirmLabel, danger: true })) …
 */
let opener = null;

export const setConfirmOpener = (fn) => { opener = fn; };

export function confirmDialog(options) {
  return new Promise((resolve) => {
    if (!opener) return resolve(window.confirm(options.body || options.title));
    opener({ ...options, resolve });
  });
}

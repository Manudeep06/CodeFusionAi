/** Opens the mounted <CommandPalette /> (e.g. from a header search button). */
export const openCommandPalette = () => window.dispatchEvent(new Event("cf:open-palette"));

import { WebContainer } from '@webcontainer/api';

/** @type {Promise<WebContainer> | null} */
let bootPromise = null;

export const getWebContainer = async () => {
  if (!bootPromise) {
    bootPromise = WebContainer.boot();
  }
  return bootPromise;
};

/**
 * Converts a flat array of files into the WebContainer FileSystemTree format
 * and mounts it to the WebContainer instance.
 * @param {Array<{path: string, content: string, isFolder: boolean}>} files 
 */
export const syncFilesToWebContainer = async (files) => {
  const instance = await getWebContainer();
  const fileSystemTree = {};

  for (const file of files) {
    const parts = file.path.split('/');
    let currentLevel = fileSystemTree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        if (file.isFolder) {
          if (!currentLevel[part]) {
            currentLevel[part] = { directory: {} };
          }
        } else {
          currentLevel[part] = {
            file: {
              contents: file.content || '',
            },
          };
        }
      } else {
        if (!currentLevel[part]) {
          currentLevel[part] = { directory: {} };
        }
        currentLevel = currentLevel[part].directory;
      }
    }
  }

  await instance.mount(fileSystemTree);
};

/**
 * Starts a jsh shell process
 * @returns {Promise<import('@webcontainer/api').WebContainerProcess>}
 */
export const startShell = async (terminal) => {
  const instance = await getWebContainer();
  const process = await instance.spawn('jsh', {
    terminal: {
      cols: terminal.cols || 80,
      rows: terminal.rows || 24,
    },
  });
  
  return process;
};

/**
 * Listen for the server-ready event (e.g. when npm run dev starts a server)
 */
export const onServerReady = async (callback) => {
  const instance = await getWebContainer();
  instance.on('server-ready', (port, url) => {
    callback(port, url);
  });
};

import { WebContainer } from '@webcontainer/api';

/** @type {Promise<WebContainer> | null} */
let bootPromise = null;

// Track the state of previously synced files (path -> { content, isFolder })
const lastSyncedFilesMap = new Map();

// Map of dirPath -> package.json content string
const lastInstalledPackageJsonMap = new Map();

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

  // Determine if this is a drastic change or if it's the first time syncing
  const pathSet = new Set(files.map(f => f.path));
  let modifiedOrNewCount = 0;
  let deletedCount = 0;

  for (const file of files) {
    const last = lastSyncedFilesMap.get(file.path);
    if (!last || last.content !== file.content || last.isFolder !== file.isFolder) {
      modifiedOrNewCount++;
    }
  }

  for (const path of lastSyncedFilesMap.keys()) {
    if (!pathSet.has(path)) {
      deletedCount++;
    }
  }

  const isDrasticChange = (lastSyncedFilesMap.size === 0) || (modifiedOrNewCount + deletedCount > 10);

  if (isDrasticChange) {
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

    // Rebuild lastSyncedFilesMap
    lastSyncedFilesMap.clear();
    for (const file of files) {
      lastSyncedFilesMap.set(file.path, { content: file.content, isFolder: file.isFolder });
    }
  } else {
    // Perform incremental updates
    // 1. Delete removed files/folders
    for (const path of lastSyncedFilesMap.keys()) {
      if (!pathSet.has(path)) {
        try {
          await instance.fs.rm(path, { recursive: true, force: true });
        } catch (err) {
          console.warn(`Error deleting path ${path} from WebContainer:`, err);
        }
        lastSyncedFilesMap.delete(path);
      }
    }

    // 2. Create/update files/folders
    for (const file of files) {
      const last = lastSyncedFilesMap.get(file.path);
      if (!last || last.content !== file.content || last.isFolder !== file.isFolder) {
        try {
          if (file.isFolder) {
            await instance.fs.mkdir(file.path, { recursive: true });
          } else {
            // Ensure parent directory exists
            const parts = file.path.split('/');
            if (parts.length > 1) {
              const parentDir = parts.slice(0, -1).join('/');
              await instance.fs.mkdir(parentDir, { recursive: true });
            }
            await instance.fs.writeFile(file.path, file.content || '');
          }
          lastSyncedFilesMap.set(file.path, { content: file.content, isFolder: file.isFolder });
        } catch (err) {
          console.warn(`Error writing path ${file.path} to WebContainer:`, err);
        }
      }
    }
  }
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

/**
 * Checks if node_modules exists in the given directory path.
 * @param {string} dirPath
 * @returns {Promise<boolean>}
 */
export const checkNodeModulesExist = async (dirPath) => {
  try {
    const instance = await getWebContainer();
    const resolvedPath = dirPath || '.';
    const files = await instance.fs.readdir(resolvedPath);
    return files.includes('node_modules');
  } catch (err) {
    return false;
  }
};

/**
 * Determines whether npm install is needed for a given package.json.
 * @param {string} dirPath
 * @param {string} currentPackageJsonContent
 * @returns {Promise<boolean>}
 */
export const shouldRunNpmInstall = async (dirPath, currentPackageJsonContent) => {
  const dirKey = dirPath || '.';
  try {
    const hasNodeModules = await checkNodeModulesExist(dirPath);
    if (!hasNodeModules) {
      return true;
    }
    const lastContent = lastInstalledPackageJsonMap.get(dirKey);
    if (lastContent !== currentPackageJsonContent) {
      return true;
    }
    return false;
  } catch (err) {
    return true;
  }
};

/**
 * Mark that npm install has run and save the package.json content.
 * @param {string} dirPath
 * @param {string} content
 */
export const recordNpmInstall = (dirPath, content) => {
  const dirKey = dirPath || '.';
  lastInstalledPackageJsonMap.set(dirKey, content);
};

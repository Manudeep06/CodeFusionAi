export const getTemplateFiles = (template) => {
  switch (template) {
    case "react":
      return [
        { path: "package.json", content: `{\n  "name": "react-app",\n  "type": "module",\n  "scripts": {\n    "dev": "vite"\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  },\n  "devDependencies": {\n    "@vitejs/plugin-react": "^4.0.0",\n    "vite": "^4.4.0"\n  }\n}`, isFolder: false },
        { path: "index.html", content: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>Vite + React</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>`, isFolder: false },
        { path: "vite.config.js", content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    headers: {\n      "Cross-Origin-Embedder-Policy": "require-corp",\n      "Cross-Origin-Opener-Policy": "same-origin"\n    }\n  }\n});`, isFolder: false },
        { path: "src", content: "", isFolder: true },
        { path: "src/main.jsx", content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App.jsx';\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n);`, isFolder: false },
        { path: "src/App.jsx", content: `import React from 'react';\n\nfunction App() {\n  return (\n    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>\n      <h1>Welcome to React running in WebContainers!</h1>\n      <p>Edit <code>src/App.jsx</code> and save to see changes.</p>\n    </div>\n  );\n}\n\nexport default App;`, isFolder: false }
      ];
    case "vanilla":
      return [
        { path: "package.json", content: `{\n  "name": "vanilla-app",\n  "type": "module",\n  "scripts": {\n    "dev": "vite"\n  },\n  "devDependencies": {\n    "vite": "^4.4.0"\n  }\n}`, isFolder: false },
        { path: "index.html", content: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>Vite App</title>\n  </head>\n  <body>\n    <div id="app">\n      <h1>Hello Vanilla WebContainer!</h1>\n      <p>Edit <code>index.html</code> to test HMR.</p>\n    </div>\n  </body>\n</html>`, isFolder: false }
      ];
    case "node":
      return [
        { path: "package.json", content: `{\n  "name": "node-app",\n  "type": "module",\n  "scripts": {\n    "dev": "node --watch index.js"\n  },\n  "dependencies": {\n    "express": "^4.18.2"\n  }\n}`, isFolder: false },
        { path: "index.js", content: `import express from 'express';\n\nconst app = express();\nconst port = 3000;\n\napp.get('/', (req, res) => {\n  res.send('Hello from Express in WebContainer!');\n});\n\napp.listen(port, () => {\n  console.log(\`App listening on port \${port}\`);\n});`, isFolder: false }
      ];
    default:
      return [];
  }
};

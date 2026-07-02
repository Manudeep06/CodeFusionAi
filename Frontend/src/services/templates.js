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
    case "vue":
      return [
        { path: "package.json", content: `{\n  "name": "vue-app",\n  "type": "module",\n  "scripts": {\n    "dev": "vite"\n  },\n  "dependencies": {\n    "vue": "^3.3.4"\n  },\n  "devDependencies": {\n    "@vitejs/plugin-vue": "^4.2.3",\n    "vite": "^4.4.0"\n  }\n}`, isFolder: false },
        { path: "index.html", content: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>Vite + Vue</title>\n  </head>\n  <body>\n    <div id="app"></div>\n    <script type="module" src="/src/main.js"></script>\n  </body>\n</html>`, isFolder: false },
        { path: "vite.config.js", content: `import { defineConfig } from 'vite';\nimport vue from '@vitejs/plugin-vue';\n\nexport default defineConfig({\n  plugins: [vue()],\n});`, isFolder: false },
        { path: "src", content: "", isFolder: true },
        { path: "src/main.js", content: `import { createApp } from 'vue';\nimport App from './App.vue';\n\ncreateApp(App).mount('#app');`, isFolder: false },
        { path: "src/App.vue", content: `<script setup>\nimport { ref } from 'vue';\nconst msg = ref('Hello Vue in WebContainer!');\n</script>\n\n<template>\n  <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">\n    <h1>{{ msg }}</h1>\n    <p>Edit <code>src/App.vue</code> to see changes.</p>\n  </div>\n</template>`, isFolder: false }
      ];
    case "svelte":
      return [
        { path: "package.json", content: `{\n  "name": "svelte-app",\n  "type": "module",\n  "scripts": {\n    "dev": "vite"\n  },\n  "devDependencies": {\n    "@sveltejs/vite-plugin-svelte": "^2.4.2",\n    "svelte": "^4.0.5",\n    "vite": "^4.4.0"\n  }\n}`, isFolder: false },
        { path: "index.html", content: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>Vite + Svelte</title>\n  </head>\n  <body>\n    <div id="app"></div>\n    <script type="module" src="/src/main.js"></script>\n  </body>\n</html>`, isFolder: false },
        { path: "vite.config.js", content: `import { defineConfig } from 'vite';\nimport { svelte } from '@sveltejs/vite-plugin-svelte';\n\nexport default defineConfig({\n  plugins: [svelte()],\n});`, isFolder: false },
        { path: "src", content: "", isFolder: true },
        { path: "src/main.js", content: `import App from './App.svelte';\n\nconst app = new App({\n  target: document.getElementById('app'),\n});\n\nexport default app;`, isFolder: false },
        { path: "src/App.svelte", content: `<script>\n  let name = 'Svelte in WebContainer';\n</script>\n\n<main style="text-align: center; margin-top: 50px; font-family: sans-serif;">\n  <h1>Hello {name}!</h1>\n  <p>Edit <code>src/App.svelte</code> to see changes.</p>\n</main>`, isFolder: false }
      ];
    default:
      return [];
  }
};

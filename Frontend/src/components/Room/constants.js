export const LANGUAGES = [
  { id: "javascript", label: "JavaScript",  ext: ["js", "jsx"],  color: "#c8a64b" },
  { id: "python",     label: "Python",       ext: ["py"],         color: "#4c8eda" },
  { id: "cpp",        label: "C++",          ext: ["cpp","h","c"],color: "#6c8fca" },
  { id: "java",       label: "Java",         ext: ["java"],       color: "#d68a3a" },
  { id: "css",        label: "CSS",          ext: ["css"],        color: "#9b8cd4" },
  { id: "html",       label: "HTML",         ext: ["html","htm"], color: "#e37933" },
  { id: "json",       label: "JSON",         ext: ["json"],       color: "#cbcb41" },
];

export const BOILERPLATES = {
  javascript: '// Welcome to CodeFusionAI 🚀\n\nconsole.log("Hello World!");\n',
  python: '# Welcome to CodeFusionAI 🚀\n\nprint("Hello World!")\n',
  cpp: '// Welcome to CodeFusionAI 🚀\n\n#include <iostream>\n\nint main() {\n    std::cout << "Hello World!" << std::endl;\n    return 0;\n}\n',
  java: '// Welcome to CodeFusionAI 🚀\n\npublic class temp_run {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}\n',
  css: '/* Welcome to CodeFusionAI 🚀 */\n\nbody {\n    margin: 0;\n    padding: 0;\n}\n',
  html: '<!-- Welcome to CodeFusionAI 🚀 -->\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>\n',
  json: '{\n  "message": "Hello World!"\n}\n'
};

export function getLangByExt(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  return LANGUAGES.find((l) => l.ext.includes(ext)) || null;
}

export function getFileColor(filename) {
  const lang = getLangByExt(filename);
  return lang ? lang.color : "#858585";
}

export const VS = {
  bg:           "var(--vs-bg)",
  sidebarBg:    "var(--vs-sidebarBg)",
  activityBg:   "var(--vs-activityBg)",
  tabBarBg:     "var(--vs-tabBarBg)",
  tabActive:    "var(--vs-tabActive)",
  tabInactive:  "var(--vs-tabInactive)",
  tabBorder:    "var(--vs-tabBorder)",
  statusBg:     "var(--vs-statusBg)",
  input:        "var(--vs-input)",
  border:       "var(--vs-border)",
  highlight:    "var(--vs-highlight)",
  hover:        "var(--vs-hover)",
  text:         "var(--vs-text)",
  textMuted:    "var(--vs-textMuted)",
  textDim:      "var(--vs-textDim)",
  accent:       "var(--vs-accent)",
  accentPurple: "var(--vs-accentPurple)",
  green:        "var(--vs-green)",
  teal:         "var(--vs-teal)",
  yellow:       "var(--vs-yellow)",
  red:          "var(--vs-red)",
  orange:       "var(--vs-orange)",
  gradientA:    "var(--vs-gradientA)",
  gradientB:    "var(--vs-gradientB)",
};

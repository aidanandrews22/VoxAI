import { 
  SandpackProvider, 
  SandpackCodeEditor, 
  SandpackPreview,
  SandpackLayout,
  FileTabs,
  SandpackConsole
} from "@codesandbox/sandpack-react";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { php } from "@codemirror/lang-php";
import { cpp } from "@codemirror/lang-cpp";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { markdown } from "@codemirror/lang-markdown";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { xml } from "@codemirror/lang-xml";
import { json } from "@codemirror/lang-json";
import { useState } from "react";

export default function CustomSandbox() {
  const [showConsole, setShowConsole] = useState(false);

  const additionalLanguages = [
    {
      name: "python",
      extensions: ["py"],
      language: python(),
    },
    {
      name: "java",
      extensions: ["java"],
      language: java(),
    },
    {
      name: "php",
      extensions: ["php"],
      language: php(),
    },
    {
      name: "cpp",
      extensions: ["cpp", "c", "h", "hpp"],
      language: cpp(),
    },
    {
      name: "rust",
      extensions: ["rs"],
      language: rust(),
    },
    {
      name: "sql",
      extensions: ["sql"],
      language: sql(),
    },
    {
      name: "markdown",
      extensions: ["md", "markdown"],
      language: markdown(),
    },
    {
      name: "javascript",
      extensions: ["js", "mjs", "cjs"],
      language: javascript(),
    },
    {
      name: "css",
      extensions: ["css"],
      language: css(),
    },
    {
      name: "html",
      extensions: ["html", "htm"],
      language: html(),
    },
    {
      name: "xml",
      extensions: ["xml", "svg"],
      language: xml(),
    },
    {
      name: "json",
      extensions: ["json"],
      language: json(),
    },
  ];

  const files = {
    "/App.js": {
      code: `import React from "react";
import "./styles.css";

export default function App() {
  return (
    <div className="App">
      <h1>Custom Sandbox Layout</h1>
      <p>This demonstrates a custom Sandpack layout with multiple language support.</p>
      <p>Open the console to see output from your code!</p>
      <button 
        onClick={() => {
          console.log("Hello from the sandbox!");
          const languages = ["JavaScript", "Python", "Java", "C++", "Rust", "PHP"];
          console.log("Supported languages:", languages);
          console.log("Try editing the files to see how syntax highlighting works!");
        }}
      >
        Log to Console
      </button>
    </div>
  );
}`,
      active: true,
    },
    "/styles.css": {
      code: `.App {
  font-family: sans-serif;
  text-align: center;
  padding: 20px;
}

button {
  background-color: #4f46e5;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
}

button:hover {
  background-color: #4338ca;
}`,
    },
    "/sample.py": {
      code: `# Python sample
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

# Calculate first 10 Fibonacci numbers
for i in range(10):
    print(f"Fibonacci {i}: {fibonacci(i)}")`,
    },
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button 
          onClick={() => setShowConsole(!showConsole)}
          className="px-3 py-1 text-sm font-medium rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
        >
          {showConsole ? "Hide Console" : "Show Console"}
        </button>
      </div>
      
      <SandpackProvider
        template="react"
        files={files}
        theme="auto"
      >
        <SandpackLayout>
          <FileTabs />
          <SandpackCodeEditor 
            showTabs={false} 
            additionalLanguages={additionalLanguages}
            showLineNumbers={true}
            showInlineErrors={true}
            wrapContent={true}
            closableTabs={true}
          />
          <SandpackPreview showNavigator={true} />
          {showConsole && <SandpackConsole />}
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
} 
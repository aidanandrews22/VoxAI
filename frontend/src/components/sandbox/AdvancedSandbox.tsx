import { Sandpack } from "@codesandbox/sandpack-react";
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

export default function AdvancedSandbox() {
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

  // Sample files for different languages
  const files = {
    "/App.js": {
      code: `import React from "react";
import "./styles.css";

export default function App() {
  return (
    <div className="App">
      <h1>Multi-Language Code Sandbox</h1>
      <p>Check out different language samples in the file explorer!</p>
    </div>
  );
}`,
      active: true,
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
    "/sample.java": {
      code: `// Java sample
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
        
        // Print first 10 Fibonacci numbers
        for (int i = 0; i < 10; i++) {
            System.out.println("Fibonacci " + i + ": " + fibonacci(i));
        }
    }
    
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n-1) + fibonacci(n-2);
    }
}`,
    },
    "/sample.cpp": {
      code: `// C++ sample
#include <iostream>

int fibonacci(int n) {
    if (n <= 1) return n;
    
    int a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        int temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}

int main() {
    std::cout << "Hello, C++!" << std::endl;
    
    // Print first 10 Fibonacci numbers
    for (int i = 0; i < 10; i++) {
        std::cout << "Fibonacci " << i << ": " << fibonacci(i) << std::endl;
    }
    
    return 0;
}`,
    },
    "/sample.rs": {
      code: `// Rust sample
fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut a = 0;
            let mut b = 1;
            for _ in 2..=n {
                let temp = a + b;
                a = b;
                b = temp;
            }
            b
        }
    }
}

fn main() {
    println!("Hello, Rust!");
    
    // Print first 10 Fibonacci numbers
    for i in 0..10 {
        println!("Fibonacci {}: {}", i, fibonacci(i));
    }
}`,
    },
    "/sample.sql": {
      code: `-- SQL sample
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    department VARCHAR(100),
    salary DECIMAL(10, 2)
);

INSERT INTO employees (id, name, department, salary)
VALUES 
    (1, 'John Doe', 'Engineering', 85000.00),
    (2, 'Jane Smith', 'Marketing', 72000.00),
    (3, 'Bob Johnson', 'Engineering', 92000.00);

-- Query to find average salary by department
SELECT 
    department,
    AVG(salary) as avg_salary
FROM employees
GROUP BY department
ORDER BY avg_salary DESC;`,
    },
    "/sample.php": {
      code: `<?php
// PHP sample
function fibonacci($n) {
    if ($n <= 1) return $n;
    
    $a = 0;
    $b = 1;
    for ($i = 2; $i <= $n; $i++) {
        $temp = $a + $b;
        $a = $b;
        $b = $temp;
    }
    return $b;
}

echo "Hello, PHP!\\n";

// Print first 10 Fibonacci numbers
for ($i = 0; $i < 10; $i++) {
    echo "Fibonacci $i: " . fibonacci($i) . "\\n";
}
?>`,
    },
    "/sample.json": {
      code: `{
  "name": "Multi-Language Sandbox",
  "version": "1.0.0",
  "description": "A demonstration of multiple language support in Sandpack",
  "languages": [
    "JavaScript",
    "Python",
    "Java",
    "C++",
    "Rust",
    "PHP",
    "SQL",
    "JSON"
  ],
  "features": {
    "syntax_highlighting": true,
    "code_completion": true,
    "error_checking": true
  },
  "author": "VoxAI Team"
}`,
    },
    "/README.md": {
      code: `# Multi-Language Code Sandbox

This sandbox demonstrates support for multiple programming languages including:

- JavaScript/React
- Python
- Java
- C++
- Rust
- PHP
- SQL
- JSON
- Markdown (this file!)

## Usage

Select different files from the file explorer to see syntax highlighting for each language.

## Features

- Proper syntax highlighting for each language
- Code formatting
- Basic editor features

Explore and enjoy!`,
    },
  };

  return (
    <Sandpack
      options={{
        codeEditor: {
          additionalLanguages: additionalLanguages,
        },
        classes: {
          "sp-wrapper": "rounded-lg border border-gray-200 dark:border-gray-800",
        },
      }}
      files={files}
      template="react"
      theme="auto"
    />
  );
} 
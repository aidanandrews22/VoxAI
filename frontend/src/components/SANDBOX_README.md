# Sandpack Multi-Language Code Sandbox

This implementation provides a powerful code sandbox with support for multiple programming languages using Sandpack from CodeSandbox.

## Components

### 1. Basic Sandbox (`Sandbox.tsx`)
A simple implementation of Sandpack with support for multiple languages:
- JavaScript, TypeScript, JSX, TSX (built-in)
- Python
- Java
- PHP
- C/C++
- Rust
- SQL
- Markdown
- HTML, CSS
- XML, JSON

### 2. Advanced Sandbox (`AdvancedSandbox.tsx`)
Extends the basic sandbox with:
- Multiple files in different languages
- Sample code for each language
- A complete file explorer showcasing syntax highlighting for each language

### 3. Custom Sandbox (`CustomSandbox.tsx`)
Demonstrates a more flexible approach using `SandpackProvider` and individual components:
- Custom layout
- Toggleable console
- More control over editor features
- Tailwind-styled UI components

## Usage

### Basic Usage
```tsx
import { Sandbox } from '../components';

export default function MyPage() {
  return (
    <div>
      <h1>My Code Sandbox</h1>
      <Sandbox />
    </div>
  );
}
```

### With Custom Files
```tsx
import { Sandbox } from '../components';

export default function MyPage() {
  const files = {
    "/App.js": {
      code: `// Your code here`,
      active: true,
    },
    "/sample.py": {
      code: `# Your Python code here`,
    },
  };

  return (
    <div>
      <h1>My Code Sandbox</h1>
      <Sandbox files={files} />
    </div>
  );
}
```

### Demo Page
Check out the complete demo at `/sandbox` in the application, which showcases all three implementations with different features.

## Dependencies

This implementation uses the following packages:
- `@codesandbox/sandpack-react`: The main Sandpack library
- Various language packages from CodeMirror:
  - `@codemirror/lang-python`
  - `@codemirror/lang-java`
  - `@codemirror/lang-php`
  - `@codemirror/lang-cpp`
  - `@codemirror/lang-rust`
  - `@codemirror/lang-sql`
  - `@codemirror/lang-markdown`
  - And more...

## Resources

- [Sandpack Documentation](https://sandpack.codesandbox.io/docs)
- [CodeMirror Language Packages](https://codemirror.net/) 
import { useState } from 'react';
import { Sandbox, AdvancedSandbox, CustomSandbox } from '../components';

type TabType = 'basic' | 'advanced' | 'custom';

export default function SandboxDemo() {
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Sandpack Code Sandbox Demo</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Explore different examples of code sandboxes with multi-language support
      </p>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`py-2 px-4 font-medium focus:outline-none ${
            activeTab === 'basic'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('basic')}
        >
          Basic Sandbox
        </button>
        <button
          className={`py-2 px-4 font-medium focus:outline-none ${
            activeTab === 'advanced'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('advanced')}
        >
          Multi-Language Files
        </button>
        <button
          className={`py-2 px-4 font-medium focus:outline-none ${
            activeTab === 'custom'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('custom')}
        >
          Custom Layout
        </button>
      </div>

      {/* Description */}
      <div className="mb-6">
        {activeTab === 'basic' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Basic Sandbox</h2>
            <p className="text-gray-600 dark:text-gray-300">
              A simple sandbox that supports multiple programming languages with the default React template.
            </p>
          </div>
        )}
        {activeTab === 'advanced' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Multi-Language Files</h2>
            <p className="text-gray-600 dark:text-gray-300">
              This example includes multiple files in different programming languages with sample code.
              Try switching between files to see syntax highlighting for each language.
            </p>
          </div>
        )}
        {activeTab === 'custom' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Custom Layout</h2>
            <p className="text-gray-600 dark:text-gray-300">
              This example demonstrates a custom Sandpack layout using SandpackProvider and individual components.
              It includes a toggleable console and custom styling.
            </p>
          </div>
        )}
      </div>

      {/* Sandbox Components */}
      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {activeTab === 'basic' && <Sandbox />}
        {activeTab === 'advanced' && <AdvancedSandbox />}
        {activeTab === 'custom' && <CustomSandbox />}
      </div>

      {/* Additional Info */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Supported Languages</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2">JavaScript/React</div>
          <div className="p-2">TypeScript</div>
          <div className="p-2">Python</div>
          <div className="p-2">Java</div>
          <div className="p-2">C/C++</div>
          <div className="p-2">Rust</div>
          <div className="p-2">PHP</div>
          <div className="p-2">SQL</div>
          <div className="p-2">HTML</div>
          <div className="p-2">CSS/SCSS</div>
          <div className="p-2">Markdown</div>
          <div className="p-2">JSON/XML</div>
        </div>
      </div>
    </div>
  );
} 
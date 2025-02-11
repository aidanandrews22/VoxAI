import { UserButton } from "@clerk/clerk-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <header className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-900">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Vox<span className="font-black text-gray-400 dark:text-gray-500">AI</span>
        </h1>
        <UserButton />
      </header>
      
      <main className="max-w-4xl mx-auto p-6">
        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">
            Welcome to VoxAI
          </h2>
          <p className="text-gray-800 dark:text-gray-200">
            Your personal voice assistant is ready to help. Start exploring the features below.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 shadow-sm transition-all duration-300 hover:shadow-md">
            <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">Voice Commands</h3>
            <p className="text-gray-800 dark:text-gray-200">Start interacting with your voice assistant using natural language commands.</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 shadow-sm transition-all duration-300 hover:shadow-md">
            <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">Settings</h3>
            <p className="text-gray-800 dark:text-gray-200">Customize your VoxAI experience and manage your preferences.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

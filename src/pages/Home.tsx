import { useState } from "react";
import { UserButton } from "@clerk/clerk-react";
import { type Notebook } from "../types/notebook";
import CreateNotebookModal from "../components/CreateNotebookModal";

export default function HomePage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateNotebook = (title: string, description: string) => {
    const newNotebook: Notebook = {
      id: crypto.randomUUID(),
      title,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotebooks([...notebooks, newNotebook]);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <header className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-900">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Vox
          <span className="font-black text-gray-400 dark:text-gray-500">
            AI
          </span>
        </h1>
        <UserButton />
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-black dark:text-white">
            My Notebooks
          </h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black
                     hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors duration-200"
          >
            New Notebook
          </button>
        </div>

        {notebooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No notebooks yet
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-black dark:text-white underline hover:no-underline"
            >
              Create your first notebook
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {notebooks.map((notebook) => (
              <div
                key={notebook.id}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 shadow-sm 
                         transition-all duration-300 hover:shadow-md"
              >
                <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">
                  {notebook.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {notebook.description}
                </p>
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-500">
                  Last updated: {notebook.updatedAt.toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateNotebookModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateNotebook={handleCreateNotebook}
      />
    </div>
  );
}

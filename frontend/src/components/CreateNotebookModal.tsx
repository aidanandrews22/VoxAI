import { useState } from "react";

interface CreateNotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNotebook: (title: string, description: string) => void;
}

export default function CreateNotebookModal({
  isOpen,
  onClose,
  onCreateNotebook,
}: CreateNotebookModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateNotebook(title, description);
    setTitle("");
    setDescription("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-adaptive">
          Create New Notebook
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-muted mb-1"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-adaptive rounded-lg 
                       bg-input text-adaptive
                       focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-muted mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-adaptive rounded-lg 
                       bg-input text-adaptive
                       focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-adaptive
                       text-muted hover:bg-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black
                       hover:bg-gray-900 dark:hover:bg-gray-100"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

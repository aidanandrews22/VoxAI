import { useState, useEffect } from "react";
import type { Folder } from "../services/supabase";

interface NotebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notebookData: {
    title: string;
    description: string;
    folderId: string | "unorganized";
  }) => Promise<void>;
  folders: Folder[];
  initialData?: {
    title: string;
    description: string;
    folderId: string | "unorganized";
  };
  isEditing: boolean;
  selectedFolderId?: string | null;
}

export default function NotebookModal({
  isOpen,
  onClose,
  onSubmit,
  folders,
  initialData,
  isEditing,
  selectedFolderId,
}: NotebookModalProps) {
  const MAX_TITLE_LENGTH = 30;
  const MAX_DESCRIPTION_LENGTH = 300;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState<string | "unorganized">(
    "unorganized",
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setFolderId(initialData.folderId);
    } else if (selectedFolderId && selectedFolderId !== "unorganized") {
      setFolderId(selectedFolderId);
    }
  }, [initialData, selectedFolderId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Notebook title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        folderId,
      });

      // Reset form
      if (!isEditing) {
        setTitle("");
        setDescription("");
        setFolderId("unorganized");
      }
      setError(null);
    } catch (err) {
      console.error("Error submitting notebook:", err);
      setError("An error occurred while saving the notebook");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recursive function to build folder options
  const renderFolderOptions = (folders: Folder[], depth = 0) => {
    const options: JSX.Element[] = [];

    folders.forEach((folder) => {
      // Add the current folder with proper indentation
      options.push(
        <option key={folder.id} value={folder.id}>
          {"\u00A0".repeat(depth * 4)}
          {depth > 0 ? "↳ " : ""}
          {folder.title}
        </option>,
      );

      // Add children if any
      if (folder.children && folder.children.length > 0) {
        options.push(...renderFolderOptions(folder.children, depth + 1));
      }
    });

    return options;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bg-overlay inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-adaptive mb-6">
            {isEditing ? "Edit Notebook" : "Create New Notebook"}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="title" className="text-muted">
                  Notebook name
                </label>
                <span className="text-sm text-muted">
                  {title.length}/{MAX_TITLE_LENGTH}
                </span>
              </div>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))
                }
                className="w-full px-4 py-3 border border-adaptive rounded-lg bg-input text-adaptive focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter notebook name"
                required
                autoFocus
              />
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="description" className="text-muted">
                  Notebook description
                </label>
                <span className="text-sm text-muted">
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value.slice(0, MAX_DESCRIPTION_LENGTH),
                  )
                }
                className="w-full px-4 py-3 border border-adaptive rounded-lg bg-input text-adaptive focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter notebook description"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="folder" className="block text-muted mb-2">
                Folder
              </label>
              <select
                id="folder"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full px-4 py-3 border border-adaptive rounded-lg bg-input text-adaptive focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="unorganized">Unorganized</option>
                {renderFolderOptions(folders)}
              </select>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-muted hover:text-adaptive transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                disabled={!title.trim() || isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

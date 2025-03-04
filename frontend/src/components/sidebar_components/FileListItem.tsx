import React, { useCallback, useState } from "react";
import { FileListItemProps } from "./SidebarTypes";
import FilePreview from "../FilePreview";
import type { FileData } from "../FilePreview";

const FileListItem: React.FC<FileListItemProps> = ({
  file,
  isMobile,
  isChecked,
  toggleFileChecked,
  handleDeleteFile,
  getFileSize,
}) => {
  // Memoized delete handler to prevent multiple clicks
  const onDeleteClick = useCallback(() => {
    if (!file.isProcessing && handleDeleteFile) {
      handleDeleteFile(file.id);
    }
  }, [file.id, file.isProcessing, handleDeleteFile]);

  // Safe rendering for processing states
  const isDeleting = Boolean(file.isDeletingFile);
  const isProcessing = Boolean(file.isProcessing);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);

  return (
    <li
      className={`p-2 hover:bg-hover rounded transition-all duration-200 ${
        isMobile ? "p-3" : "p-2"
      } ${isProcessing && !isDeleting ? "bg-blue-50 dark:bg-blue-900/10" : ""} 
         ${isDeleting ? "bg-red-50 dark:bg-red-900/10" : ""}`}
    >
      <div className="flex justify-between items-start">
        <div
          className={`flex-1 truncate ${isProcessing ? "" : "cursor-pointer"}`}
          onClick={(e) => !isProcessing && toggleFileChecked(file.id, e)}
        >
          <div className="flex items-center">
            {isProcessing && (
              <span className="mr-2 flex-shrink-0">
                <svg
                  className={`animate-spin h-3 w-3 ${
                    isDeleting
                      ? "text-red-500 dark:text-red-400"
                      : "text-blue-500 dark:text-blue-400"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </span>
            )}
            <p
              className={`text-sm font-medium truncate ${
                isProcessing
                  ? isDeleting
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                  : isChecked
                    ? "text-adaptive"
                    : "text-gray-500 dark:text-gray-400 line-through"
              }`}
            >
              {file.file_name}
            </p>
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span>{getFileSize(file.file_size)}</span>
            <span className="mx-2">|</span>
            <div onClick={(e) => e.stopPropagation()}><span className="cursor-pointer text-primary" onClick={() => setPreviewFile(file)}>preview file</span></div>
            {isProcessing && (
              <span
                className={`ml-2 text-xs ${
                  isDeleting
                    ? "text-red-500 dark:text-red-400"
                    : "text-blue-500 dark:text-blue-400"
                }`}
              >
                {isDeleting ? "Deleting..." : "AI Processing..."}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onDeleteClick}
          className={`text-red-500 hover:text-red-700 transition-colors duration-200 p-1 ${
            isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
          aria-label="Delete file"
          disabled={isProcessing}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`${isMobile ? "h-5 w-5" : "h-4 w-4"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
        <FilePreview
          isOpen={previewFile !== null}
          onClose={() => setPreviewFile(null)}
          file={previewFile ? {
            id: previewFile.id,
            file_name: previewFile.file_name,
            file_type: previewFile.file_type,
            file_path: previewFile.file_path,
          } : undefined}
        />
      </div>
    </li>
  );
};

export default React.memo(FileListItem);

import React, { useRef } from "react";
import { ExtendedNotebookFile } from "./SidebarTypes";
import FileListItem from "./FileListItem";
import { getFileSize } from "./SidebarUtils";
import { Tooltip } from "../Tooltip";

interface FilesTabContentProps {
  files: ExtendedNotebookFile[];
  isLoadingFiles: boolean;
  isMobile: boolean;
  checkedFiles: Set<string>;
  toggleFileChecked: (fileId: string, e: React.MouseEvent) => void;
  handleDeleteFile?: (fileId: string) => void;
  handleFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingFiles: Set<string>;
}

const FilesTabContent: React.FC<FilesTabContentProps> = ({
  files,
  isLoadingFiles,
  isMobile,
  checkedFiles,
  toggleFileChecked,
  handleDeleteFile,
  handleFileUpload,
  uploadingFiles,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-none">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
          disabled={uploadingFiles.size > 0}
        />
        <label
          htmlFor="file-upload"
          className={`cursor-pointer flex flex-col items-center justify-center w-full ${
            isMobile ? "h-28" : "h-24"
          } border-2 border-dashed ${
            uploadingFiles.size > 0
              ? "border-blue-300 dark:border-blue-700 cursor-wait"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer active:scale-[0.98]"
          } rounded-lg transition-all duration-200`}
        >
          {uploadingFiles.size > 0 ? (
            <>
              <svg
                className="animate-spin h-8 w-8 text-blue-500 dark:text-blue-400 mb-2"
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
              <span
                className={`${isMobile ? "text-base" : "text-sm"} text-blue-500 dark:text-blue-400`}
              >
                Uploading to Supabase...
              </span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`${isMobile ? "h-10 w-10" : "h-8 w-8"} text-gray-500 dark:text-gray-400 mb-2 transition-transform duration-200 group-hover:scale-110`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span
                className={`${isMobile ? "text-base" : "text-sm"} text-gray-500 dark:text-gray-400`}
              >
                Upload File
              </span>
            </>
          )}
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingFiles ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : files.length === 0 ? (
          <p className="text-muted text-sm text-center py-4">
            No files uploaded yet
          </p>
        ) : (
          <ul className="space-y-2">
            <div className="flex items-center justify-center mb-2">
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                Click to toggle files
              </p>
              <div className="relative ml-1">
                <Tooltip
                  content="Toggled files will be included in the model context when responding to your queries."
                  title="File Toggle Information"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-500 dark:text-gray-400 cursor-help"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </Tooltip>
              </div>
            </div>
            {files.map((file) => (
              <FileListItem
                key={file.id}
                file={file}
                isMobile={isMobile}
                isChecked={checkedFiles.has(file.id)}
                toggleFileChecked={toggleFileChecked}
                handleDeleteFile={handleDeleteFile}
                getFileSize={getFileSize}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FilesTabContent;

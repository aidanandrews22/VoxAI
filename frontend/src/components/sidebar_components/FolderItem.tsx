import React from "react";
import { FolderItemProps } from "./SidebarTypes";

const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  depth = 0,
  isCollapsed,
  isMobile,
  isSelected,
  expandedFolders,
  handleToggleFolder,
  handleSelectFolder,
  handleAddSubfolder,
  handleDeleteClick,
}) => {
  const isExpanded = expandedFolders.has(folder.id);
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div key={folder.id} className="select-none">
      <div
        className={`flex items-center py-2 px-2 my-1 rounded-md cursor-pointer group transition-all duration-200 ${
          isSelected
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "hover:bg-hover text-adaptive"
        } ${isMobile ? "py-2.5" : "py-1.5"}`}
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
        onClick={() => handleSelectFolder(folder.id)}
      >
        {/* Delete folder icon (visible on hover) */}
        {!isCollapsed && (
          <button
            onClick={(e) => handleDeleteClick(folder.id, e)}
            className={`w-5 h-5 mr-1 ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200 cursor-pointer text-red-500 hover:text-red-700`}
            title="Delete folder"
            aria-label="Delete folder"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
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
        )}

        {/* Expand/collapse icon */}
        {hasChildren && !isCollapsed ? (
          <button
            onClick={(e) => handleToggleFolder(folder.id, e)}
            className="w-5 h-5 mr-1 flex items-center justify-center cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease-in-out",
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : !isCollapsed ? (
          <div className="w-5 h-5 mr-1"></div>
        ) : null}

        {/* Folder icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 ${!isCollapsed ? "mr-2" : "mx-auto"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>

        {/* Folder name */}
        {!isCollapsed && (
          <span className="flex-1 truncate">{folder.title}</span>
        )}

        {/* Add subfolder button (only visible on hover) */}
        {!isCollapsed && (
          <button
            onClick={(e) => handleAddSubfolder(folder.id, e)}
            className={`w-5 h-5 ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200 cursor-pointer`}
            title="Add subfolder"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Render children if expanded */}
      {!isCollapsed && isExpanded && hasChildren && (
        <div className="ml-2 overflow-hidden transition-all duration-300 ease-in-out">
          {folder.children?.map((childFolder) => (
            <FolderItem
              key={childFolder.id}
              folder={childFolder}
              depth={depth + 1}
              isCollapsed={isCollapsed}
              isMobile={isMobile}
              isSelected={isSelected === childFolder.id}
              expandedFolders={expandedFolders}
              handleToggleFolder={handleToggleFolder}
              handleSelectFolder={handleSelectFolder}
              handleAddSubfolder={handleAddSubfolder}
              handleDeleteClick={handleDeleteClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderItem;

import { useState, useEffect } from "react";

// Custom hook to detect if screen is mobile
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
};

// Create a more persistent storage mechanism for checked files
// This variable will be replaced by userService functions
let currentCheckedFiles: Set<string> = new Set();

export const getCheckedFiles = (): string[] => {
  return Array.from(currentCheckedFiles);
};

// Helper function for file size formatting
export const getFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} bytes`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
};

// Add helper function to update global currentCheckedFiles
export const updateCheckedFiles = (newCheckedFiles: Set<string>) => {
  currentCheckedFiles = newCheckedFiles;
};

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  ErrorInfo,
  Component,
} from "react";
import { Block, BlockNoteEditor, PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useSupabaseUser } from "../../contexts/UserContext";
import { uploadFile, getNotebookFiles } from "../../services/fileUpload";
import { debounce } from "../../utils/helpers";
import type { NotebookFile } from "../../types/notebook";

interface NotesPanelProps {
  notebookId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// Error boundary component to catch errors in BlockNoteView
class EditorErrorBoundary extends Component<
  {
    children: React.ReactNode;
    onError: (error: Error, info: ErrorInfo) => void;
  },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    onError: (error: Error, info: ErrorInfo) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-800 rounded-md">
          <h3 className="text-lg font-medium mb-2">
            Something went wrong with the note editor
          </h3>
          <p className="mb-4">
            We've encountered an error displaying the editor. Please try the
            following:
          </p>
          <ul className="list-disc ml-5 mb-4">
            <li>Refresh the page</li>
            <li>Try creating a new note</li>
            <li>Check your internet connection</li>
          </ul>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-hover transition-all duration-200"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function NotesPanel({
  notebookId,
  isExpanded,
  onToggleExpand,
}: NotesPanelProps) {
  const [initialContent, setInitialContent] = useState<
    PartialBlock[] | "loading"
  >("loading");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { supabaseUserId, getSupabaseClient, refreshSupabaseToken } =
    useSupabaseUser();
  const [notesFiles, setNotesFiles] = useState<NotebookFile[]>([]);
  const [currentNoteFile, setCurrentNoteFile] = useState<NotebookFile | null>(
    null,
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentNoteName, setCurrentNoteName] = useState("Notes");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const editorRef = useRef<BlockNoteEditor | null>(null);
  const [editorError, setEditorError] = useState<Error | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Save editor content to storage (Supabase)
  const saveToStorage = useCallback(
    debounce(async (content: Block[], noteFile: NotebookFile) => {
      if (!notebookId || !supabaseUserId) return;

      setIsSaving(true);
      setSaveError(null);

      try {
        let supabase = await getSupabaseClient();

        // Convert content to string
        const contentString = JSON.stringify(content);
        const contentBlob = new Blob([contentString], {
          type: "application/json",
        });

        // Create file with same name to maintain reference
        const file = new File([contentBlob], noteFile.file_name, {
          type: "application/json",
        });

        // First attempt to delete the existing file
        let deleteResult = await supabase.storage
          .from("Vox")
          .remove([noteFile.file_path]);

        // Check if we need to refresh token due to auth error
        if (
          deleteResult.error &&
          deleteResult.error.message &&
          (deleteResult.error.message.includes("jwt expired") ||
            deleteResult.error.message.includes("Unauthorized"))
        ) {
          console.log("Token expired during delete operation, refreshing...");
          // Refresh token and get a new client
          supabase = await refreshSupabaseToken();

          if (!supabase) {
            throw new Error("Failed to refresh authentication token");
          }

          // Retry delete with new token
          deleteResult = await supabase.storage
            .from("Vox")
            .remove([noteFile.file_path]);
        }

        // Upload to the same path to maintain consistency
        let uploadResult = await supabase.storage
          .from("Vox")
          .upload(noteFile.file_path, file, {
            cacheControl: "3600",
            upsert: true, // Use upsert to ensure we're updating
          });

        // Check if we need to refresh token due to auth error
        if (
          uploadResult.error &&
          uploadResult.error.message &&
          (uploadResult.error.message.includes("jwt expired") ||
            uploadResult.error.message.includes("Unauthorized"))
        ) {
          console.log("Token expired during upload operation, refreshing...");
          // Refresh token and get a new client
          supabase = await refreshSupabaseToken();

          if (!supabase) {
            throw new Error("Failed to refresh authentication token");
          }

          // Retry upload with new token
          uploadResult = await supabase.storage
            .from("Vox")
            .upload(noteFile.file_path, file, {
              cacheControl: "3600",
              upsert: true,
            });
        }

        if (uploadResult.error) throw uploadResult.error;

        // Update the file size in database
        await supabase
          .from("notebook_files")
          .update({ file_size: contentBlob.size })
          .eq("id", noteFile.id);

        // Ensure is_note is true
        await supabase
          .from("notebook_files")
          .update({ is_note: true })
          .eq("id", noteFile.id);

        console.log("Note saved successfully");
      } catch (error) {
        console.error("Error saving note:", error);
        setSaveError(
          error instanceof Error ? error.message : JSON.stringify(error),
        );
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [notebookId, supabaseUserId, getSupabaseClient, refreshSupabaseToken],
  );

  // Load content from storage (Supabase)
  const loadFromStorage = useCallback(
    async (noteFile: NotebookFile) => {
      if (!noteFile || !notebookId || !supabaseUserId) return undefined;

      try {
        let supabase = await getSupabaseClient();

        // Download the file content
        let downloadResult = await supabase.storage
          .from("Vox")
          .download(noteFile.file_path);

        // Check if we need to refresh token due to auth error
        if (
          downloadResult.error &&
          downloadResult.error.message &&
          (downloadResult.error.message.includes("jwt expired") ||
            downloadResult.error.message.includes("Unauthorized"))
        ) {
          console.log("Token expired during download operation, refreshing...");
          // Refresh token and get a new client
          supabase = await refreshSupabaseToken();

          if (!supabase) {
            throw new Error("Failed to refresh authentication token");
          }

          // Retry download with new token
          downloadResult = await supabase.storage
            .from("Vox")
            .download(noteFile.file_path);
        }

        if (downloadResult.error) throw downloadResult.error;

        if (downloadResult.data) {
          // Parse the JSON content
          const content = await downloadResult.data.text();
          try {
            const parsedContent = JSON.parse(content);

            // Validate content is a valid BlockNote document
            if (Array.isArray(parsedContent) && parsedContent.length > 0) {
              return parsedContent;
            }
          } catch (parseError) {
            console.error("Error parsing note content:", parseError);
          }
        }
      } catch (error) {
        console.error("Error loading note:", error);
      }

      // Return undefined if loading fails, which will create a new empty document
      return undefined;
    },
    [notebookId, supabaseUserId, getSupabaseClient, refreshSupabaseToken],
  );

  // Create a default note if none exist
  const createDefaultNote = useCallback(async () => {
    if (!notebookId || !supabaseUserId) return null;

    try {
      // Create a unique default note name
      const defaultNoteName = `Default_Note_${new Date().toISOString().slice(0, 19).replace(/[T:.]/g, "-")}`;
      setCurrentNoteName(defaultNoteName);

      // Create a blank editor to get a valid initial block
      const tempEditor = BlockNoteEditor.create();
      const validInitialContent = tempEditor.document;

      // Create file
      const contentString = JSON.stringify(validInitialContent);
      const contentBlob = new Blob([contentString], {
        type: "application/json",
      });
      const file = new File([contentBlob], `${defaultNoteName}.json`, {
        type: "application/json",
      });

      const supabase = await getSupabaseClient();
      const result = await uploadFile(
        file,
        true,
        notebookId,
        supabaseUserId,
        supabase,
      );

      if (result.success && result.data) {
        const newNoteFile = result.data;
        setNotesFiles((prev) => [newNoteFile, ...prev]);
        setCurrentNoteFile(newNoteFile);
        return validInitialContent;
      }
    } catch (error) {
      console.error("Error creating default note:", error);
    }

    return null;
  }, [notebookId, supabaseUserId, getSupabaseClient]);

  // Load notes files when component mounts
  useEffect(() => {
    const fetchNotesFiles = async () => {
      if (!notebookId || !supabaseUserId) return;

      setIsLoading(true);
      try {
        const supabase = await getSupabaseClient();
        const { data: files, error } = await supabase
          .from("notebook_files")
          .select("*")
          .eq("notebook_id", notebookId)
          .eq("user_id", supabaseUserId)
          .eq("file_type", "application/json")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (files && files.length > 0) {
          // Filter out any potentially corrupt entries
          const validFiles = files.filter(
            (file: NotebookFile) =>
              file.file_name &&
              file.file_name.endsWith(".json") &&
              file.file_path &&
              file.file_path.includes(notebookId),
          );

          setNotesFiles(validFiles);

          if (validFiles.length > 0) {
            // Set most recent note as current one
            const mostRecentFile = validFiles[0];
            setCurrentNoteFile(mostRecentFile);
            setCurrentNoteName(mostRecentFile.file_name.replace(".json", ""));

            // Load content for the selected note
            const content = await loadFromStorage(mostRecentFile);
            setInitialContent(content || []);
          } else {
            // Create default note if no valid files
            const defaultContent = await createDefaultNote();
            setInitialContent(defaultContent || []);
          }
        } else {
          // Create default note if no files exist
          const defaultContent = await createDefaultNote();
          setInitialContent(defaultContent || []);
        }
      } catch (error) {
        console.error("Error fetching notes files:", error);
        // Try to create a default note if fetching fails
        const defaultContent = await createDefaultNote();
        setInitialContent(defaultContent || []);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotesFiles();
  }, [
    notebookId,
    supabaseUserId,
    getSupabaseClient,
    createDefaultNote,
    loadFromStorage,
  ]);

  // Create a new note
  const createNewNote = useCallback(async () => {
    if (!notebookId || !supabaseUserId) return;

    try {
      // Create a unique note name
      const newNoteName = `Note_${new Date().toISOString().slice(0, 19).replace(/[T:.]/g, "-")}`;

      // Create a blank editor to get a valid initial content
      const tempEditor = BlockNoteEditor.create();
      const validInitialContent = tempEditor.document;

      // Create file
      const contentString = JSON.stringify(validInitialContent);
      const contentBlob = new Blob([contentString], {
        type: "application/json",
      });
      const file = new File([contentBlob], `${newNoteName}.json`, {
        type: "application/json",
      });

      const supabase = await getSupabaseClient();
      const result = await uploadFile(
        file,
        true,
        notebookId,
        supabaseUserId,
        supabase,
      );

      if (result.success && result.data) {
        const newNoteFile = result.data;
        setNotesFiles((prev) => [newNoteFile, ...prev]);
        setCurrentNoteFile(newNoteFile);
        setCurrentNoteName(newNoteName);
        setInitialContent(validInitialContent);
        setIsDropdownOpen(false);
      }
    } catch (error) {
      console.error("Error creating new note:", error);
    }
  }, [notebookId, supabaseUserId, getSupabaseClient]);

  // Handle note selection from dropdown
  const selectNote = useCallback(
    async (file: NotebookFile) => {
      setCurrentNoteFile(file);
      setCurrentNoteName(file.file_name.replace(".json", ""));
      setIsDropdownOpen(false);

      // Reset editor content to loading state
      setInitialContent("loading");

      // Load the selected note content
      const content = await loadFromStorage(file);
      setInitialContent(content || []);
    },
    [loadFromStorage],
  );

  // Create a memoized BlockNoteEditor once initialContent is loaded
  const editor = useMemo(() => {
    if (initialContent === "loading") {
      return undefined;
    }

    try {
      // Create editor with system theme compatible settings
      const newEditor = BlockNoteEditor.create({
        initialContent,
      });
      editorRef.current = newEditor;
      return newEditor;
    } catch (error) {
      console.error("Error creating BlockNoteEditor:", error);
      // Create empty editor as fallback
      const fallbackEditor = BlockNoteEditor.create();
      editorRef.current = fallbackEditor;
      return fallbackEditor;
    }
  }, [initialContent]);

  // Safe function to get editor document
  const getEditorDocument = useCallback(() => {
    try {
      if (editorRef.current) {
        return editorRef.current.document;
      }
      return null;
    } catch (error) {
      console.error("Error accessing editor document:", error);
      return null;
    }
  }, []);

  // Safe onChange handler
  const handleEditorChange = useCallback(() => {
    if (currentNoteFile) {
      try {
        const document = getEditorDocument();
        if (document) {
          saveToStorage(document, currentNoteFile);
        }
      } catch (error) {
        console.error("Error in editor onChange handler:", error);
      }
    }
  }, [currentNoteFile, saveToStorage, getEditorDocument]);

  // Handle editor errors
  const handleEditorError = useCallback(
    (error: Error, info: ErrorInfo) => {
      console.error("Editor error:", error, info);
      setEditorError(error);
      // Attempt to recreate the editor
      if (initialContent !== "loading") {
        try {
          const tempEditor = BlockNoteEditor.create();
          editorRef.current = tempEditor;
          // Don't update the editor state directly as it might cause render issues
          // Just mark that we've handled the error
        } catch (e) {
          console.error("Failed to recreate editor:", e);
        }
      }
    },
    [initialContent],
  );

  if (isLoading || initialContent === "loading" || !editor) {
    return (
      <div className={`notes-panel ${isExpanded ? "expanded" : "collapsed"}`}>
        <div className="flex items-center justify-center h-full">
          <span>Loading notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={`notes-panel ${isExpanded ? "expanded" : "collapsed"} relative pt-12 pl-10 flex flex-col h-full`}
    >
      {/* Notes title and dropdown */}
      <div
        className="absolute top-0 left-0 right-0 p-2 flex items-center justify-between z-10 max-w-3/4"
        ref={dropdownRef}
      >
        <div className="relative w-full">
          <button
            className="cursor-pointer focus:bg-card flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-left text-adaptive rounded-md transition-all duration-200"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
          >
            <span className="truncate flex items-center">
              {currentNoteName}
              <span
                className={`ml-2 text-xs transition-opacity duration-300 ${isSaving ? "text-yellow-500" : saveError ? "text-red-500" : "text-green-500"}`}
              >
                {isSaving ? "saving..." : saveError ? "error saving" : "saved"}
              </span>
            </span>
            <svg
              className={`ml-2 h-4 w-4 transition-transform duration-300 ease-snappy ${isDropdownOpen ? "rotate-180" : ""}`}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.5 6L8 10.5L3.5 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="bg-card absolute mt-1 w-full shadow-lg rounded-md max-h-60 overflow-auto z-20 border border-adaptive">
              <button
                className="cursor-pointer block w-full text-left px-4 py-2 text-sm text-primary border-b border-adaptive transition-all duration-200 hover:bg-hover"
                onClick={createNewNote}
              >
                <span className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 3.5V12.5M3.5 8H12.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Create New Note
                </span>
              </button>
              {notesFiles.map((file) => (
                <button
                  key={file.id}
                  className={`cursor-pointer hover:bg-hover block w-full text-left px-4 py-2 text-sm transition-all duration-200 ${
                    currentNoteFile?.id === file.id
                      ? "text-adaptive"
                      : "text-adaptive"
                  }`}
                  onClick={() => selectNote(file)}
                >
                  <span className="flex items-center">
                    <svg
                      className="mr-2 h-4 w-4"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3334 6.66667V12C13.3334 12.7364 12.7365 13.3333 12.0001 13.3333H4.00008C3.26389 13.3333 2.66675 12.7364 2.66675 12V4C2.66675 3.26362 3.26389 2.66667 4.00008 2.66667H9.33341"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5.33325 8H10.6666M5.33325 10.6667H8.66659"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {file.file_name.replace(".json", "")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggleExpand}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-6 p-1 rounded-l-md shadow-md z-10 transition-all duration-200"
        aria-label={isExpanded ? "Collapse notes" : "Expand notes"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
        >
          <polyline
            points={isExpanded ? "15 18 9 12 15 6" : "9 18 15 12 9 6"}
          />
        </svg>
      </button>

      {/* Notes content */}
      <div className="flex-1 overflow-auto w-full">
        {saveError && (
          <div className="p-2 mb-2 text-sm bg-red-100 text-red-800 rounded">
            Error saving: {saveError}
            <button
              className="ml-2 underline px-1 py-0.5 rounded transition-all duration-200"
              onClick={() => {
                setSaveError(null);
                if (currentNoteFile && editorRef.current) {
                  saveToStorage(editorRef.current.document, currentNoteFile);
                }
              }}
            >
              Retry
            </button>
          </div>
        )}
        {editorError && (
          <div className="p-2 mb-2 text-sm bg-orange-100 text-orange-800 rounded">
            Editor warning: {editorError.message}
            <button
              className="ml-2 underline px-1 py-0.5 rounded transition-all duration-200"
              onClick={() => {
                setEditorError(null);
                // Reload the note by setting initialContent to loading
                setInitialContent("loading");
                setTimeout(() => {
                  if (currentNoteFile) {
                    loadFromStorage(currentNoteFile).then((content) => {
                      if (content) {
                        setInitialContent(content);
                      } else {
                        // Create a new default document if loading fails
                        const tempEditor = BlockNoteEditor.create();
                        setInitialContent(tempEditor.document);
                      }
                    });
                  }
                }, 100);
              }}
            >
              Reset Editor
            </button>
          </div>
        )}
        <EditorErrorBoundary onError={handleEditorError}>
          {editor && (
            <BlockNoteView
              editor={editor}
              onChange={handleEditorChange}
              data-voxai-theme
            />
          )}
        </EditorErrorBoundary>
      </div>
    </div>
  );
}

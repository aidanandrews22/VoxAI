import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useSupabaseUser } from "../../contexts/UserContext";
import { getNotebook } from "../../services/notebookService";
import {
  getNotebookFiles,
  uploadFile,
  deleteFile,
  processFile,
} from "../../services/fileUpload";
import {
  createChatSession,
  getNotebookChatSessions,
  sendChatMessage,
  getChatMessages,
  deleteChatSession,
} from "../../services/notebookService";
import { streamChatWithGemini } from "../../services/geminiService";
import type { Notebook, NotebookFile } from "../../types/notebook";
import type { ChatSession, ChatMessage } from "../../types/chat";
// import Header from '../../components/Header';
import Sidebar from "../../components/Sidebar";
import ChatInterface from "../../components/ChatInterface";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getCheckedFiles } from "../../components/Sidebar";
import toast from "react-hot-toast";
import ResizablePanel from "../../components/note/ResizablePanel";
import NotesPanel from "../../components/note/NotesPanel";
import Sandbox from "../../components/Sandbox";

// Extended NotebookFile type to include processing status
interface ExtendedNotebookFile extends NotebookFile {
  isProcessing?: boolean;
  isDeletingFile?: boolean;
}

export default function NotebookDetailPage() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const {
    supabaseUserId,
    isLoading: isUserLoading,
    getSupabaseClient,
    refreshSupabaseToken,
  } = useSupabaseUser();
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [files, setFiles] = useState<ExtendedNotebookFile[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatSession, setCurrentChatSession] =
    useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"files" | "chats">("files");
  const [isEditingChatTitle, setIsEditingChatTitle] = useState(false);
  const [editedChatTitle, setEditedChatTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  // Notes panel state
  const [isNotesPanelExpanded, setIsNotesPanelExpanded] = useState(false);
  // Sandbox panel state
  const [isSandboxExpanded, setIsSandboxExpanded] = useState(false);

  error;
  editedChatTitle;

  // Fetch notebook data
  useEffect(() => {
    async function fetchNotebookData() {
      if (!notebookId) return;

      setIsLoading(true);
      try {
        const result = await getNotebook(notebookId);
        if (result.success && result.data) {
          setNotebook(result.data);
        } else {
          setError("Failed to load notebook");
        }
      } catch (err) {
        console.error("Error fetching notebook:", err);
        setError("An error occurred while loading the notebook");
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotebookData();
  }, [notebookId]);

  // Fetch notebook files
  useEffect(() => {
    if (!notebookId) return;

    async function fetchFiles() {
      // Only set loading state if we don't already have files (initial load)
      const isInitialLoad = files.length === 0;
      if (isInitialLoad) {
        setIsLoadingFiles(true);
      }

      try {
        // Make sure notebookId is not undefined
        if (notebookId) {
          // Get authenticated Supabase client
          const authClient = await getSupabaseClient();

          // If we couldn't get an authenticated client, show an error
          if (!authClient) {
            console.error("Authentication error when fetching files");
            return;
          }

          const result = await getNotebookFiles(notebookId, authClient);
          if (result.success && result.data) {
            setFiles(result.data);
          } else {
            console.error("Failed to load files");
          }
        }
      } catch (err) {
        console.error("Error fetching files:", err);
      } finally {
        // Only toggle loading state off if we set it on
        if (isInitialLoad) {
          setIsLoadingFiles(false);
        }
      }
    }

    fetchFiles();
  }, [notebookId, getSupabaseClient]);

  // Fetch chat sessions
  useEffect(() => {
    if (!notebookId) return;

    async function fetchChatSessions() {
      try {
        // Make sure notebookId is not undefined
        if (notebookId) {
          const result = await getNotebookChatSessions(notebookId);
          if (result.success && result.data) {
            setChatSessions(result.data);

            // If there are sessions, set the most recent one as current
            if (result.data.length > 0) {
              setCurrentChatSession(result.data[0]);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching chat sessions:", err);
      }
    }

    fetchChatSessions();
  }, [notebookId]);

  // Fetch messages when current chat session changes
  useEffect(() => {
    if (!currentChatSession) return;

    async function fetchMessages() {
      setIsLoadingMessages(true);
      try {
        // TypeScript check to ensure currentChatSession is not null
        if (currentChatSession) {
          const sessionId = currentChatSession.id;
          const result = await getChatMessages(sessionId);
          if (result.success && result.data) {
            setMessages(result.data);
          }
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    fetchMessages();
  }, [currentChatSession]);

  // Main effect to handle scrolling in all scenarios
  useEffect(() => {
    // This will run both on initial render and whenever dependencies change
    if (messagesEndRef.current) {
      // Use 'auto' behavior for immediate scroll without animation
      // This makes the initial load snap to bottom immediately
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]); // Only depend on messages to avoid unnecessary scrolls

  // For smoother experience during active conversations
  useEffect(() => {
    // Only scroll smoothly when streaming content changes (during active typing)
    if (messagesEndRef.current && streamingContent) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingContent]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (
      !notebookId ||
      !supabaseUserId ||
      !e.target.files ||
      e.target.files.length === 0
    )
      return;

    const file = e.target.files[0];
    console.log(
      "File selected:",
      file.name,
      "Size:",
      file.size,
      "Type:",
      file.type,
    );
    if (file.size > 50 * 1024 * 1024) {
      // 50MB
      toast?.error("File size is too large to process");
      return;
    } else if (file.size > 10 * 1024 * 1024) {
      // 10MB
      toast("File size is large, it may take a while to process", {
        icon: "⚠️",
        style: {
          background: "#fffbeb",
          color: "#92400e",
          border: "1px solid #f59e0b",
        },
        duration: 3500,
      });
    }

    // Create a temporary ID to track the uploading state
    const tempId = `temp-${Date.now()}`;

    // Add to uploading files state - this will show the upload button as loading
    setUploadingFiles((prev) => {
      const newSet = new Set(prev);
      newSet.add(tempId);
      return newSet;
    });

    // Switch to files tab to show upload progress
    setActiveTab("files");

    // Function to handle file upload with retry logic
    const uploadWithRetry = async (retryCount = 0): Promise<any> => {
      try {
        // Get authenticated Supabase client - force refresh if retry
        const authClient = await (retryCount > 0 
          ? refreshSupabaseToken().then(() => getSupabaseClient()) 
          : getSupabaseClient());

        if (!authClient) {
          console.error("Failed to get authenticated Supabase client");
          throw new Error("Authentication error. Please try again or refresh the page.");
        }

        // Upload to Supabase
        const result = await uploadFile(
          file,
          false,
          notebookId,
          supabaseUserId,
          authClient,
          retryCount
        );

        // If token expired and we should retry with a new token
        if (!result.success && result.shouldRetryWithNewToken && retryCount < 2) {
          console.log(`Retrying upload with refreshed token, attempt ${retryCount + 1}/3`);
          // Force refresh the token and retry
          await refreshSupabaseToken();
          return uploadWithRetry(retryCount + 1);
        }

        return result;
      } catch (err) {
        console.error(`Error uploading file (attempt ${retryCount + 1}/3):`, err);
        
        // If we haven't retried too many times and this looks like an auth error, retry
        const errorMsg = String(err).toLowerCase();
        if (retryCount < 2 && 
            (errorMsg.includes('jwt') || 
             errorMsg.includes('unauthorized') || 
             errorMsg.includes('403') || 
             errorMsg.includes('401'))) {
          console.log("Auth error detected, refreshing token and retrying...");
          await refreshSupabaseToken();
          return uploadWithRetry(retryCount + 1);
        }
        
        throw err;
      }
    };

    try {
      // Start upload with retry logic
      const result = await uploadWithRetry();

      // Remove from uploading files state as soon as the Supabase upload is complete
      setUploadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });

      if (result.success && result.data) {
        // Add the file to the files list with processing status
        const newFile: ExtendedNotebookFile = {
          ...result.data,
          isProcessing: result.isProcessing || false,
        };

        // Update files array with the new file at the beginning
        setFiles((prevFiles) => [newFile, ...prevFiles]);

        // Show success notification for the upload
        toast?.success(
          result.message || "File uploaded, AI is now processing...",
        );

        // Initiate file processing in the background
        processFile(result.data.id).then((processResult) => {
          if (processResult.success) {
            console.log("Processing success:", processResult.message);

            // Update the file's processing status
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === result.data?.id ? { ...f, isProcessing: false } : f,
              ),
            );

            // Show success notification for completed processing
            toast?.success("File processing complete!");
          } else {
            console.error("Processing error:", processResult.error);

            // Update the file's processing status
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === result.data?.id ? { ...f, isProcessing: false } : f,
              ),
            );

            // Show error notification
            toast?.error(`Processing failed: ${processResult.error}`);
          }
        });
      } else {
        console.error("File upload failed:", result.error);
        setError("Failed to upload file");

        // Show detailed error message based on the error type
        if (result.fileType) {
          toast?.error(
            `Unsupported file type: ${result.fileType}. Please try a different file.`,
          );
        } else {
          toast?.error(result.error || "Failed to upload file");
        }
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("An error occurred while uploading the file");
      toast?.error("Error uploading file");
    } finally {
      // Always clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Remove from uploading state if still there
      setUploadingFiles((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(tempId)) {
          newSet.delete(tempId);
        }
        return newSet;
      });
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    console.log("Starting file deletion process for:", fileId);

    try {
      // Find the file by ID to log its current state
      const fileToDelete = files.find((file) => file.id === fileId);
      console.log("Current file state before deletion:", fileToDelete);

      // If the file is already being processed, don't allow another delete operation
      if (fileToDelete?.isProcessing) {
        console.log(
          "File is already being processed, ignoring delete request",
        );
        return;
      }

      // Mark the file as processing during deletion
      setFiles((prevFiles) => {
        const updatedFiles = prevFiles.map((file) =>
          file.id === fileId
            ? { ...file, isProcessing: true, isDeletingFile: true }
            : file,
        );
        console.log(
          "File state after marking as deleting:",
          updatedFiles.find((f) => f.id === fileId),
        );
        return updatedFiles;
      });

      // Function to handle file deletion with retry logic
      const deleteWithRetry = async (retryCount = 0): Promise<any> => {
        try {
          // Get authenticated Supabase client - force refresh if retry
          const authClient = await (retryCount > 0 
            ? refreshSupabaseToken().then(() => getSupabaseClient()) 
            : getSupabaseClient());

          // If we couldn't get an authenticated client, show an error
          if (!authClient) {
            console.error("Authentication failed when trying to delete file");
            throw new Error("Authentication error. Please try again or refresh the page.");
          }

          console.log("Calling deleteFile service function");
          const result = await deleteFile(fileId, authClient, retryCount);
          console.log("deleteFile result:", result);

          // If token expired and we should retry with a new token
          if (!result.success && result.shouldRetryWithNewToken && retryCount < 2) {
            console.log(`Retrying deletion with refreshed token, attempt ${retryCount + 1}/3`);
            // Force refresh the token and retry
            await refreshSupabaseToken();
            return deleteWithRetry(retryCount + 1);
          }

          return result;
        } catch (err) {
          console.error(`Error deleting file (attempt ${retryCount + 1}/3):`, err);
          
          // If we haven't retried too many times and this looks like an auth error, retry
          const errorMsg = String(err).toLowerCase();
          if (retryCount < 2 && 
              (errorMsg.includes('jwt') || 
               errorMsg.includes('unauthorized') || 
               errorMsg.includes('403') || 
               errorMsg.includes('401'))) {
            console.log("Auth error detected, refreshing token and retrying...");
            await refreshSupabaseToken();
            return deleteWithRetry(retryCount + 1);
          }
          
          throw err;
        }
      };

      // Start deletion with retry logic
      const result = await deleteWithRetry();

      if (result.success) {
        // Only remove the file from the array after successful deletion
        // Use a key-based removal approach to prevent race conditions
        setFiles((prevFiles) => {
          console.log("Removing file with ID:", fileId);
          console.log("Current file count:", prevFiles.length);

          const filteredFiles = prevFiles.filter((file) => file.id !== fileId);
          console.log(
            "Files array after removing deleted file, new count:",
            filteredFiles.length,
          );
          return filteredFiles;
        });

        toast?.success("File deleted successfully");
      } else {
        console.error("File deletion failed with result:", result);

        // Restore the file to its previous state
        setFiles((prevFiles) => {
          const restoredFiles = prevFiles.map((file) =>
            file.id === fileId
              ? { ...file, isProcessing: false, isDeletingFile: false }
              : file,
          );
          console.log(
            "File state after restoring due to deletion failure:",
            restoredFiles.find((f) => f.id === fileId),
          );
          return restoredFiles;
        });

        setError("Failed to delete file");
        toast?.error(result.error || "Failed to delete file");
      }
    } catch (err) {
      console.error("Error in handleDeleteFile:", err);
      
      // Restore the file's state if there was an error
      setFiles((prevFiles) => {
        const restoredFiles = prevFiles.map((file) =>
          file.id === fileId
            ? { ...file, isProcessing: false, isDeletingFile: false }
            : file,
        );
        return restoredFiles;
      });
      
      setError("An error occurred while deleting the file");
      toast?.error("Error deleting file");
    }
  };

  const handleCreateSession = async () => {
    if (!notebookId || !supabaseUserId) return;

    try {
      const result = await createChatSession(
        notebookId,
        supabaseUserId,
        "New Chat",
      );
      if (result.success && result.data) {
        setChatSessions([result.data, ...chatSessions]);
        setCurrentChatSession(result.data);
        setMessages([]);
        setActiveTab("chats");
      } else {
        setError("Failed to create new chat");
      }
    } catch (err) {
      console.error("Error creating chat session:", err);
      setError("An error occurred while creating a new chat");
    }
  };

  // Function to refresh messages from the database
  const refreshMessages = async (sessionId: string) => {
    try {
      const result = await getChatMessages(sessionId);
      if (result.success && result.data) {
        setMessages(result.data);
      }
    } catch (err) {
      console.error("Error refreshing messages:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !notebookId ||
      !supabaseUserId ||
      !currentChatSession ||
      !inputMessage.trim()
    )
      return;

    const checkedFiles = getCheckedFiles();

    const messageText = inputMessage.trim();
    setInputMessage("");

    try {
      // Create a temporary user message to display immediately
      const tempUserMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        chat_session_id: currentChatSession.id,
        notebook_id: notebookId,
        user_id: supabaseUserId,
        content: messageText,
        is_user: true,
        created_at: new Date().toISOString(),
      };

      // Update messages locally first for immediate display
      setMessages((prevMessages) => [...prevMessages, tempUserMessage]);

      // Scroll to the new message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);

      // Send user message to backend
      const userMessageResult = await sendChatMessage(
        currentChatSession.id,
        notebookId,
        supabaseUserId,
        messageText,
        true,
      );

      if (!userMessageResult.success) {
        setError("Failed to send message");
        return;
      }

      // Start streaming immediately
      setIsStreaming(true);
      setStreamingContent("");

      // Create a simple message array with just the current message
      // This ensures only the exact query text is sent
      const userOnlyMessage = [
        {
          role: "user" as "user",
          content: messageText,
        },
      ];

      console.log("Sending single user message:", messageText);

      // Stream the response
      try {
        let finalResponse = "";

        await streamChatWithGemini(
          userOnlyMessage,
          (content) => {
            setStreamingContent(content);
            finalResponse = content;
          },
          supabaseUserId,
        );

        console.log("Streaming complete. Saving AI message to Supabase");

        // Ensure the final response doesn't contain SSE format before saving
        if (finalResponse.includes('data: {"type":')) {
          console.warn(
            "Final response contains SSE format. This is unexpected.",
          );

          // Attempt to clean it up
          try {
            // Call our parser to extract just the text
            const cleanResponse = parseStreamingResponseLocally(finalResponse);
            finalResponse = cleanResponse || "Error processing response";
          } catch (parseError) {
            console.error("Failed to parse streaming response:", parseError);
            finalResponse = "Error processing response";
          }
        }

        // After streaming is complete, save the AI message to the database
        const aiMessageResult = await sendChatMessage(
          currentChatSession.id,
          notebookId,
          supabaseUserId,
          finalResponse,
          false,
        );

        if (aiMessageResult.success) {
          console.log("AI message saved to Supabase successfully");

          // Refresh messages to get both user message and AI response from the database
          await refreshMessages(currentChatSession.id);
        } else {
          console.error(
            "Failed to save AI message to Supabase:",
            aiMessageResult.error,
          );
          setError("Failed to save AI response");
        }
      } catch (error) {
        console.error("Error streaming response:", error);
        setError("Failed to get AI response");
      } finally {
        setIsStreaming(false);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
      setIsStreaming(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!sessionId) return;

    setIsDeleting(true);
    try {
      const result = await deleteChatSession(sessionId);
      if (result.success) {
        // Remove the deleted session from the list
        setChatSessions(
          chatSessions.filter((session) => session.id !== sessionId),
        );

        // If the deleted session was the current one, set the first available session as current
        // or set to null if no sessions remain
        if (currentChatSession?.id === sessionId) {
          const remainingSessions = chatSessions.filter(
            (session) => session.id !== sessionId,
          );
          if (remainingSessions.length > 0) {
            setCurrentChatSession(remainingSessions[0]);
          } else {
            setCurrentChatSession(null);
            setMessages([]);
          }
        }
      } else {
        setError("Failed to delete chat session");
      }
    } catch (err) {
      console.error("Error deleting chat session:", err);
      setError("An error occurred while deleting the chat session");
    } finally {
      setIsDeleting(false);
      setChatToDelete(null);
      setShowDeleteConfirmation(false);
    }
  };

  const confirmDeleteSession = (sessionId: string) => {
    setChatToDelete(sessionId);
    setShowDeleteConfirmation(true);
  };

  const cancelDeleteSession = () => {
    setChatToDelete(null);
    setShowDeleteConfirmation(false);
  };

  const handleEditChatTitle = (session: ChatSession) => {
    setEditedChatTitle(session.title);
    setIsEditingChatTitle(true);
  };

  /**
   * Local version of parseStreamingResponse to handle any remaining SSE formatting
   * This is a fallback in case the service doesn't properly parse the response
   */
  function parseStreamingResponseLocally(streamData: string): string {
    // Helper function to remove common AI response prefixes
    function removeCommonPrefixes(text: string): string {
      // List of prefixes to check and remove
      const prefixesToRemove = [
        "Answer:",
        "Answer :",
        "AI:",
        "AI :",
        "Assistant:",
        "Assistant :",
      ];

      // Check for each prefix and remove if found
      for (const prefix of prefixesToRemove) {
        if (text.startsWith(prefix)) {
          return text.substring(prefix.length).trim();
        }
      }

      return text;
    }

    let extractedText = "";

    try {
      // Split the stream data into lines
      const lines = streamData.split("\n");

      for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) continue;

        // Check if line is a data line
        if (line.startsWith("data:")) {
          try {
            // Extract the JSON part
            const jsonStr = line.substring(5).trim();
            const data = JSON.parse(jsonStr);

            // If it's a token, add it to the extracted text
            if (data.type === "token" && data.data) {
              extractedText += data.data;
            }
          } catch (e) {
            // If JSON parsing fails, just ignore this line
            console.warn("Failed to parse JSON in stream data line:", line);
          }
        } else {
          // If it's not in SSE format, it's likely already parsed content
          extractedText = streamData;
          break;
        }
      }

      // Determine which text to process (either parsed or original)
      let textToProcess = extractedText.trim() || streamData.trim();

      // Remove common prefixes
      return removeCommonPrefixes(textToProcess);
    } catch (error) {
      console.error("Error parsing streaming response locally:", error);

      // Even if parsing fails, try to remove common prefixes
      return removeCommonPrefixes(streamData.trim());
    }
  }

  // Toggle function for notes panel
  const toggleNotesPanel = () => {
    setIsNotesPanelExpanded(!isNotesPanelExpanded);
  };

  // Toggle function for sandbox panel
  const toggleSandbox = () => {
    setIsSandboxExpanded(!isSandboxExpanded);
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="flex flex-col min-h-screen">
        {/* <Header /> */}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Notebook not found or you don't have access to it.
          </div>
          <Link
            to="/notebooks"
            className="text-black dark:text-white hover:underline"
          >
            &larr; Back to Notebooks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userId={supabaseUserId || ""}
        isCollapsed={!sidebarExpanded}
        onToggleCollapse={toggleSidebar}
        selectedFolderId={null}
        onSelectFolder={() => {}}
        mode="notebook"
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        files={files}
        chatSessions={chatSessions}
        isLoadingFiles={isLoadingFiles}
        currentChatSession={currentChatSession}
        handleCreateSession={handleCreateSession}
        handleDeleteFile={handleDeleteFile}
        handleEditChatTitle={handleEditChatTitle}
        confirmDeleteSession={confirmDeleteSession}
        setCurrentChatSession={setCurrentChatSession}
        handleFileUpload={handleFileUpload}
        notebookName={notebook?.title || ""}
        uploadingFiles={uploadingFiles}
        toggleNotesPanel={toggleNotesPanel}
        isNotesPanelExpanded={isNotesPanelExpanded}
        toggleSandbox={toggleSandbox}
        isSandboxExpanded={isSandboxExpanded}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <main className="flex-1 overflow-hidden">
          <ResizablePanel
            leftPanel={
              <ChatInterface
                currentChatSession={currentChatSession}
                messages={messages}
                isLoadingMessages={isLoadingMessages}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                handleSendMessage={handleSendMessage}
                handleCreateSession={handleCreateSession}
                messagesEndRef={messagesEndRef}
              />
            }
            rightPanel={
              isNotesPanelExpanded ? (
                <NotesPanel
                  notebookId={notebookId || ""}
                  isExpanded={isNotesPanelExpanded}
                  onToggleExpand={toggleNotesPanel}
                />
              ) : isSandboxExpanded ? (
                <Sandbox />
              ) : null
            }
            isRightPanelExpanded={isNotesPanelExpanded || isSandboxExpanded}
            defaultRightPanelWidth={50}
            minRightPanelWidth={20}
            maxRightPanelWidth={70}
          />
        </main>
      </div>

      {/* File input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.txt,.md,.csv,.pptx,.docx,.xlsx,.mp3,.wav,.mp4,.webm,image/*"
      />

      {/* Confirmation dialog */}
      {showDeleteConfirmation && (
        <DeleteConfirmationModal
          isOpen={showDeleteConfirmation}
          isDeleting={isDeleting}
          onCancel={cancelDeleteSession}
          onConfirm={() => chatToDelete && handleDeleteSession(chatToDelete)}
        />
      )}
    </div>
  );
}

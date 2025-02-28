import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSupabaseUser } from '../../contexts/UserContext';
import { getNotebook } from '../../services/notebookService';
import { getNotebookFiles, uploadFile, deleteFile } from '../../services/fileUpload';
import { 
  createChatSession, 
  getNotebookChatSessions,
  sendChatMessage,
  getChatMessages,
  deleteChatSession,
} from '../../services/notebookService';
import { streamChatWithGemini, formatMessagesForGemini } from '../../services/geminiService';
import type { Notebook, NotebookFile, ChatSession, ChatMessage } from '../../services/supabase';
// import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import ChatInterface from '../../components/ChatInterface';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function NotebookDetailPage() {
  const { notebookId } = useParams<{ notebookId: string }>();
  const { supabaseUserId, isLoading: isUserLoading, getSupabaseClient } = useSupabaseUser();
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [files, setFiles] = useState<NotebookFile[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatSession, setCurrentChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'files' | 'chats'>('files');
  const [isEditingChatTitle, setIsEditingChatTitle] = useState(false);
  const [editedChatTitle, setEditedChatTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

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
          setError('Failed to load notebook');
        }
      } catch (err) {
        console.error('Error fetching notebook:', err);
        setError('An error occurred while loading the notebook');
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
      setIsLoadingFiles(true);
      try {
        // Make sure notebookId is not undefined
        if (notebookId) {
          // Get authenticated Supabase client
          const authClient = await getSupabaseClient();
          
          // If we couldn't get an authenticated client, show an error
          if (!authClient) {
            console.error('Authentication error when fetching files');
            return;
          }
          
          const result = await getNotebookFiles(notebookId, authClient);
          if (result.success && result.data) {
            setFiles(result.data);
          } else {
            console.error('Failed to load files');
          }
        }
      } catch (err) {
        console.error('Error fetching files:', err);
      } finally {
        setIsLoadingFiles(false);
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
        console.error('Error fetching chat sessions:', err);
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
        console.error('Error fetching messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    fetchMessages();
  }, [currentChatSession]);

  // Scroll to bottom of messages
  useEffect(() => {
    // Only scroll when messages or streaming content changes, not when editing title
    if (!isEditingChatTitle) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, isEditingChatTitle]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!notebookId || !supabaseUserId || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('User ID:', supabaseUserId, 'Notebook ID:', notebookId);
    
    try {
      // Get authenticated Supabase client
      console.log('Getting authenticated Supabase client...');
      const authClient = await getSupabaseClient();
      
      // If we couldn't get an authenticated client, show an error
      if (!authClient) {
        console.error('Failed to get authenticated Supabase client');
        setError('Authentication error. Please try again or refresh the page.');
        return;
      }
      
      console.log('Authenticated client obtained, uploading file...');
      const result = await uploadFile(file, notebookId, supabaseUserId, authClient);
      
      if (result.success && result.data) {
        console.log('File upload successful:', result.data);
        setFiles([result.data, ...files]);
      } else {
        console.error('File upload failed:', result.error);
        setError('Failed to upload file');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('An error occurred while uploading the file');
    } finally {
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Get authenticated Supabase client
      const authClient = await getSupabaseClient();
      
      // If we couldn't get an authenticated client, show an error
      if (!authClient) {
        setError('Authentication error. Please try again or refresh the page.');
        return;
      }
      
      const result = await deleteFile(fileId, authClient);
      if (result.success) {
        setFiles(files.filter(file => file.id !== fileId));
      } else {
        setError('Failed to delete file');
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('An error occurred while deleting the file');
    }
  };

  const handleCreateSession = async () => {
    if (!notebookId || !supabaseUserId) return;
    
    try {
      const result = await createChatSession(notebookId, supabaseUserId, 'New Chat');
      if (result.success && result.data) {
        setChatSessions([result.data, ...chatSessions]);
        setCurrentChatSession(result.data);
        setMessages([]);
        setActiveTab('chats');
      } else {
        setError('Failed to create new chat');
      }
    } catch (err) {
      console.error('Error creating chat session:', err);
      setError('An error occurred while creating a new chat');
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
      console.error('Error refreshing messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notebookId || !supabaseUserId || !currentChatSession || !inputMessage.trim()) return;
    
    const messageText = inputMessage.trim();
    setInputMessage('');
    
    try {
      // Send user message to backend
      const userMessageResult = await sendChatMessage(
        currentChatSession.id,
        notebookId,
        supabaseUserId,
        messageText,
        true
      );
      
      if (!userMessageResult.success) {
        setError('Failed to send message');
        return;
      }
      
      // Refresh messages to get the user message from the database
      await refreshMessages(currentChatSession.id);
      
      // Start streaming
      setIsStreaming(true);
      setStreamingContent('');
      
      // Format messages for Gemini (get fresh messages from state)
      const formattedMessages = formatMessagesForGemini(messages);
      
      console.log('Messages from database:', messages.length);
      console.log('Formatted messages for Gemini:', formattedMessages.length);
      
      // Make sure we have the user's message in the formatted messages
      // If the user message isn't in the database yet, add it manually
      const userMessageInFormatted = formattedMessages.some(
        msg => msg.role === 'user' && msg.content === messageText
      );
      
      if (!userMessageInFormatted) {
        console.log('Adding user message to formatted messages:', messageText);
        formattedMessages.push({
          role: 'user',
          content: messageText
        });
      }
      
      console.log('Final formatted messages for Gemini:', formattedMessages.length);
      
      // Stream the response
      try {
        let finalResponse = '';
        
        await streamChatWithGemini(
          formattedMessages,
          (content) => {
            setStreamingContent(content);
            finalResponse = content;
          }
        );
        
        console.log('Streaming complete. Saving AI message to Supabase');
        
        // After streaming is complete, save the AI message to the database
        const aiMessageResult = await sendChatMessage(
          currentChatSession.id,
          notebookId,
          supabaseUserId,
          finalResponse,
          false
        );
        
        if (aiMessageResult.success) {
          console.log('AI message saved to Supabase successfully');
          
          // Refresh messages to get both user message and AI response from the database
          await refreshMessages(currentChatSession.id);
        } else {
          console.error('Failed to save AI message to Supabase:', aiMessageResult.error);
          setError('Failed to save AI response');
        }
      } catch (error) {
        console.error('Error streaming response:', error);
        setError('Failed to get AI response');
        
        // Save a fallback message to the database
        const fallbackMessage = "I'm sorry, I encountered an error while processing your request. Please try again later.";
        
        await sendChatMessage(
          currentChatSession.id,
          notebookId,
          supabaseUserId,
          fallbackMessage,
          false
        ).catch(err => console.error('Error saving fallback message:', err));
        
        // Refresh messages to get both user message and fallback AI response
        await refreshMessages(currentChatSession.id);
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An error occurred while sending your message');
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
        setChatSessions(chatSessions.filter(session => session.id !== sessionId));
        
        // If the deleted session was the current one, set the first available session as current
        // or set to null if no sessions remain
        if (currentChatSession?.id === sessionId) {
          const remainingSessions = chatSessions.filter(session => session.id !== sessionId);
          if (remainingSessions.length > 0) {
            setCurrentChatSession(remainingSessions[0]);
          } else {
            setCurrentChatSession(null);
            setMessages([]);
          }
        }
      } else {
        setError('Failed to delete chat session');
      }
    } catch (err) {
      console.error('Error deleting chat session:', err);
      setError('An error occurred while deleting the chat session');
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
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* <Header /> */}
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={showDeleteConfirmation}
        isDeleting={isDeleting}
        onCancel={cancelDeleteSession}
        onConfirm={() => chatToDelete && handleDeleteSession(chatToDelete)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Component */}
        <Sidebar 
          userId={supabaseUserId || ''}
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
          notebookName={notebook.title}
        />
        
        {/* Main Content - Chat */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Chat Interface Component */}
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
        </div>
      </div>
    </div>
  );
} 
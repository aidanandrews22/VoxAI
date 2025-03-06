import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useSupabaseUser } from '../contexts/UserContext';
import { SupabaseClient } from '@supabase/supabase-js';

export interface FileData {
  id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number;
  isProcessing?: boolean;
  isDeletingFile?: boolean;
}

export interface FilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  file?: {
    id: string;
    file_name: string;
    file_type: string;
    file_path: string;
  };
} 

export async function getFileFromStorage(filePath: string, supabase: SupabaseClient): Promise<string | null> {
  const storageKey = `vox_file_${filePath}`;
  const storedData = localStorage.getItem(storageKey);

  // Check if file is already in localStorage and not expired
  if (storedData) {
    const { fileData, expiresAt } = JSON.parse(storedData);
    if (Date.now() < expiresAt) {
      return fileData; // Return cached file path (Base64 or Blob URL)
    }
  }

  try {
    // Download file from Supabase storage
    const { data, error } = await supabase.storage.from("Vox").download(filePath);
    if (error || !data) throw error;

    // Convert file to Base64
    const base64String = await fileToBase64(data);

    // Store in localStorage with expiration (1 day = 24 hours * 60 min * 60 sec * 1000 ms)
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(storageKey, JSON.stringify({ fileData: base64String, expiresAt }));

    return base64String; // Return Base64 encoded file data
  } catch (error) {
    console.error("Error downloading file", error);
    return null;
  }
}

// Helper function to convert File to Base64
async function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}


// Helper function to get appropriate file icon based on type
const FileIcon = ({ type }: { type: string }) => {
  if (type.startsWith('image/')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    );
  } else if (type.startsWith('video/')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"></polygon>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
      </svg>
    );
  } else if (type.startsWith('audio/')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"></path>
        <circle cx="6" cy="18" r="3"></circle>
        <circle cx="18" cy="16" r="3"></circle>
      </svg>
    );
  } else if (type === 'application/pdf') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    );
  } else if (type === 'text/plain' || type === 'text/markdown' || type === 'application/json') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    );
  } else if (
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    type === 'application/vnd.ms-excel' ||
    type === 'text/csv'
  ) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <rect x="8" y="12" width="8" height="8" rx="1"></rect>
      </svg>
    );
  } else if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    );
  } else if (
    type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <rect x="5" y="15" width="14" height="4" rx="1"></rect>
      </svg>
    );
  } else {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
    );
  }
};

const FilePreview: React.FC<FilePreviewProps> = ({ isOpen, onClose, file }) => {
  const { supabaseUserId, getSupabaseClient, refreshSupabaseToken } = useSupabaseUser();
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<React.ReactNode | null>(null);

  // Close modal with escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  // For text files, fetch content
  useEffect(() => {
    const fetchTextContent = async () => {
      if (!file || !isOpen) return;
      
      const isTextFile = 
        file.file_type === 'text/plain' || 
        file.file_type === 'text/markdown' || 
        file.file_type === 'application/json' ||
        file.file_type === 'text/csv';
        
      if (isTextFile) {
        try {
          setIsLoading(true);
          setError(null);
          const response = await fetch(file.file_path);
          if (!response.ok) {
            throw new Error(`Failed to load file: ${response.statusText}`);
          }
          const text = await response.text();
          setContent(text);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load file');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTextContent();
  }, [file, isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setContent(null);
      setError(null);
      setIsLoading(false);
      setPreviewContent(null);
    }
  }, [isOpen]);

  // Call renderPreview when dependencies change
  useEffect(() => {
    const loadPreview = async () => {
      if (!file) return;
      const preview = await renderPreview();
      setPreviewContent(preview);
    };
    
    loadPreview();
  }, [file, content, isLoading, error]);

  // Render appropriate preview based on file type
  const renderPreview = useCallback(async () => {
    if (!file) return null;
    if (isLoading) return <div className="flex justify-center items-center p-4">Loading...</div>;
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

    const { file_type, file_path, file_name } = file;
    let supabase = await getSupabaseClient();
    const signedUrl = await getFileFromStorage(file_path, supabase);

    // Handle image files
    if (file_type.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full">
          <img 
            src={signedUrl!} 
            alt={file_name} 
            className="max-w-full max-h-[70vh] object-contain" 
            onError={() => setError('Failed to load image')}
          />
        </div>
      );
    } 
    
    // Handle video files
    else if (file_type.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center h-full">
          <video 
            controls 
            className="max-w-full max-h-[70vh]"
            onError={() => setError('Failed to load video')}
          >
            <source src={signedUrl!} type={file_type} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } 
    
    // Handle audio files
    else if (file_type.startsWith('audio/')) {
      return (
        <div className="w-full p-4 flex flex-col items-center">
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-8 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <audio 
            controls 
            className="w-full max-w-md"
            onError={() => setError('Failed to load audio')}
          >
            <source src={signedUrl!} type={file_type} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    } 
    
    // Handle PDF files
    else if (file_type === 'application/pdf') {
      return (
        <iframe
          src={signedUrl!}
          className="w-full h-[70vh]"
          title={file_name}
          onError={() => setError('Failed to load PDF')}
        ></iframe>
      );
    } 
    
    // Handle text files
    else if (file_type === 'text/plain') {
      return (
        <div className="w-full h-[70vh] overflow-auto bg-gray-50 dark:bg-gray-900 p-4 font-mono text-sm">
          <pre>{content}</pre>
        </div>
      );
    } 
    
    // Handle markdown files
    else if (file_type === 'text/markdown') {
      return (
        <div className="w-full h-[70vh] overflow-auto bg-white dark:bg-gray-900 p-4 prose dark:prose-invert max-w-none">
          {content && <ReactMarkdown>{content}</ReactMarkdown>}
        </div>
      );
    } 
    
    // Handle JSON files
    else if (file_type === 'application/json') {
      return (
        <div className="w-full h-[70vh] overflow-auto bg-gray-50 dark:bg-gray-900 p-4 font-mono text-sm">
          <pre>{content ? JSON.stringify(JSON.parse(content), null, 2) : null}</pre>
        </div>
      );
    } 
    
    // Handle CSV files
    else if (file_type === 'text/csv') {
      return (
        <div className="w-full h-[70vh] overflow-auto">
          <div className="border border-gray-200 dark:border-gray-700 rounded">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {content && content.split('\n').map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.split(',').map((cell, cellIndex) => (
                      <td 
                        key={cellIndex} 
                        className="px-3 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } 
    
    // Handle Office documents - convert to PDF or display message
    else if (
      file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file_type === 'application/vnd.ms-excel' ||
      file_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      // Assuming conversion to PDF happens on backend
      if (signedUrl!.endsWith('.pdf')) {
        return (
          <iframe
            src={signedUrl!}
            className="w-full h-[70vh]"
            title={file_name}
          ></iframe>
        );
      } else {
        return (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
              <FileIcon type={file_type} />
            </div>
            <h3 className="text-lg font-medium mb-2">{file_name}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              This file type requires conversion for preview.
            </p>
            <a 
              href={signedUrl!} 
              download={file_name}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Download File
            </a>
          </div>
        );
      }
    } 
    
    // Default for unsupported types
    else {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
            <FileIcon type={file_type} />
          </div>
          <h3 className="text-lg font-medium mb-2">{file_name}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Preview not available for this file type.
          </p>
          <a 
            href={signedUrl!} 
            download={file_name}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Download File
          </a>
        </div>
      );
    }
  }, [file, content, isLoading, error]);

  if (!isOpen || !file) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl transition-all duration-300 ease-out"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-3">
              <FileIcon type={file.file_type} />
            </div>
            <h3 className="text-lg font-medium truncate">{file.file_name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close preview"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-grow overflow-auto">
          {previewContent}
        </div>
      </div>
    </div>
  );
};

export default FilePreview; 
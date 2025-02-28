import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

// Initialize the Google Generative AI with API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Check if API key is available
if (!API_KEY) {
  console.error('Missing Gemini API key. Please add VITE_GEMINI_API_KEY to your environment variables.');
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY || '');

// Model configuration
const MODEL_NAME = 'gemini-1.5-flash-8b';

// Default generation config
const defaultGenerationConfig: GenerationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

/**
 * Creates a chat with streaming capability using Gemini
 * @param history Array of previous messages in the conversation
 * @param onStreamUpdate Callback function that receives streamed content
 * @returns A promise that resolves when streaming is complete
 */
export async function streamChatWithGemini(
  history: { role: 'user' | 'model', content: string }[],
  onStreamUpdate: (content: string) => void,
  generationConfig: GenerationConfig = defaultGenerationConfig
): Promise<void> {
  try {
    console.log('Starting Gemini chat with history length:', history.length);
    
    // Validate history array
    if (!history || history.length === 0) {
      throw new Error('Chat history is empty. Cannot send message to Gemini.');
    }
    
    // Get the last user message
    const lastMessage = history[history.length - 1];
    if (!lastMessage || !lastMessage.content) {
      throw new Error('Last message is missing or has no content.');
    }
    
    // Create the model
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig,
    });

    // Start a chat session
    const chat = model.startChat({
      history: history.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content || '' }],
      })),
    });

    // Get the response with streaming
    console.log('Sending message to Gemini:', lastMessage.content.substring(0, Math.min(100, lastMessage.content.length)) + (lastMessage.content.length > 100 ? '...' : ''));
    const result = await chat.sendMessageStream(lastMessage.content);
    
    // Process the stream
    let fullResponse = '';
    try {
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        onStreamUpdate(fullResponse);
      }
      console.log('Gemini stream completed successfully');
    } catch (streamError) {
      console.error('Error during stream processing:', streamError);
      // If we have a partial response, still return it
      if (fullResponse) {
        onStreamUpdate(fullResponse);
      } else {
        throw streamError;
      }
    }
  } catch (error) {
    console.error('Error streaming chat with Gemini:', error);
    throw error;
  }
}

/**
 * Formats chat messages for Gemini API
 * @param messages Array of chat messages from the database
 * @returns Formatted history for Gemini API
 */
export function formatMessagesForGemini(messages: any[]): { role: 'user' | 'model', content: string }[] {
  if (!messages || messages.length === 0) {
    return [];
  }
  
  return messages.map(message => ({
    role: message.is_user ? 'user' : 'model',
    content: message.content || '',
  }));
} 
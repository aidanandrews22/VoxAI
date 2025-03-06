// Model configuration - this is now used as model_name for the API
const MODEL_NAME = "gemini-1.5-flash-8b";

// API endpoint
const API_URL = "http://localhost:8000/api/v1/query";

// Import types from types directory
import { type Message, type MessageRole } from "../types/gemini";

/**
 * Streams a chat response from the Gemini model
 * @param history Array of previous messages
 * @param onStreamUpdate Callback for streaming updates
 * @param userId User ID for tracking
 */
export async function streamChatWithGemini(
  history: Message[],
  onStreamUpdate: (content: string) => void,
  userId: string | null,
): Promise<void> {
  try {
    console.log("Starting chat with history length:", history.length);

    // Validate history array
    if (!history || history.length === 0) {
      throw new Error("Chat history is empty. Cannot send message.");
    }

    // Get the last user message
    const lastMessage = history[history.length - 1];
    if (!lastMessage || !lastMessage.content) {
      throw new Error("Last message is missing or has no content.");
    }

    // Check if the message content is already in SSE format
    // This would indicate we're trying to send a previously streamed response as a message
    if (lastMessage.content.includes('data: {"type":')) {
      console.error(
        "Message appears to be in SSE format. This is likely an error.",
      );
      throw new Error(
        "Invalid message format. Cannot send an SSE response as a message.",
      );
    }

    // Extract the exact user query text
    const exactUserQuery = lastMessage.content;
    console.log("Exact user query:", exactUserQuery);

    // Prepare the query request with the exact user query
    const queryRequest = {
      query: exactUserQuery,
      top_k: 5,
      model_name: MODEL_NAME,
      use_rag: true,
      stream: true,
      user_id: userId,
      is_coding_question: true,
    };

    console.log("Sending query request:", queryRequest);

    // Make the API request with fetch to support streaming
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    // Check if the response is a stream
    if (!response.body) {
      throw new Error("Response body is not available");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let actualResponse = "";
    let streamedContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        streamedContent += chunk;

        // Parse SSE format to extract actual response content
        const updatedContent = parseStreamingResponse(streamedContent);

        // Send the parsed content to the UI
        actualResponse = updatedContent;
        onStreamUpdate(actualResponse);
      }

      // Final decode to catch any remaining bytes
      const finalChunk = decoder.decode();
      if (finalChunk) {
        streamedContent += finalChunk;
        const finalContent = parseStreamingResponse(streamedContent);
        actualResponse = finalContent;
        onStreamUpdate(actualResponse);
      }

      console.log("Stream completed successfully");
    } catch (streamError) {
      console.error("Error during stream processing:", streamError);
      // If we have a partial response, still return it
      if (actualResponse) {
        onStreamUpdate(actualResponse);
      } else {
        throw streamError;
      }
    }
  } catch (error) {
    console.error("Error streaming chat:", error);
    throw error;
  }
}

/**
 * Parses the streaming response to extract actual text content
 * @param streamData Raw streaming data in SSE format
 * @returns Extracted text content
 */
function parseStreamingResponse(streamData: string): string {
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
        } catch {
          // If JSON parsing fails, just ignore this line
          console.warn("Failed to parse JSON in stream data line:", line);
        }
      }
    }

    // Trim the text first
    extractedText = extractedText.trim();

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
      if (extractedText.startsWith(prefix)) {
        extractedText = extractedText.substring(prefix.length).trim();
        break; // Exit after removing the first matching prefix
      }
    }

    return extractedText;
  } catch (error) {
    console.error("Error parsing streaming response:", error);
    return extractedText || streamData; // Return what we have if parsing fails
  }
}

/**
 * Formats chat messages for API
 * @param messages Array of chat messages from the database
 * @returns Formatted history for API
 */
export function formatMessagesForGemini(
  messages: { is_user: boolean; content: string }[],
): Message[] {
  if (!messages || messages.length === 0) {
    return [];
  }

  return messages.map((message) => ({
    role: message.is_user ? ("user" as MessageRole) : ("model" as MessageRole),
    content: message.content || "",
  }));
}

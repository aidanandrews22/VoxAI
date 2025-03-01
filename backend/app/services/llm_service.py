"""
LLM service module for handling interactions with language models.
"""
import asyncio
import json
import time
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple, Union

import anthropic
import google.generativeai as genai
import httpx
import openai
from fastapi import HTTPException
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.logging import logger


class LLMService:
    """
    Service for handling interactions with language models.
    """

    def __init__(self):
        """
        Initializes the LLM service with API clients.
        """
        # Initialize OpenAI client
        self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Initialize Anthropic client
        self.anthropic_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        
        # Initialize Gemini client
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.gemini_model = genai.GenerativeModel('gemini-1.5-flash-8b')
        
        # Keep httpx clients for any custom requests
        self.http_client = httpx.AsyncClient(timeout=60.0)
        
        logger.info("LLM service initialized with official API clients")

    async def close(self):
        """
        Closes all API clients.
        """
        await self.http_client.aclose()
        logger.info("LLM service clients closed")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def generate_file_description(self, file_content: str, file_name: str, file_type: str) -> Dict[str, Any]:
        """
        Generates a description and metadata for a file using Gemini.
        
        Args:
            file_content: The content of the file.
            file_name: The name of the file.
            file_type: The MIME type of the file.
            
        Returns:
            Dict[str, Any]: A dictionary containing the description and metadata.
        """
        try:
            # Truncate file content if it's too long
            max_content_length = 10000
            truncated_content = file_content[:max_content_length]
            if len(file_content) > max_content_length:
                truncated_content += "\n... [content truncated]"
            
            prompt = f"""
            You are analyzing a file to extract useful information. Here are the file details:
            
            File Name: {file_name}
            File Type: {file_type}
            
            File Content:
            {truncated_content}
            
            Please provide:
            1. A concise description of the file (1-2 sentences)
            2. Key metadata about the file content (e.g., topics, entities, dates, etc.)
            
            Format your response as a JSON object with the following structure:
            {{
                "description": "Your concise description here",
                "metadata": {{
                    "topics": ["topic1", "topic2", ...],
                    "entities": ["entity1", "entity2", ...],
                    "key_points": ["point1", "point2", ...],
                    "additional_info": {{ ... any other relevant metadata ... }}
                }}
            }}
            """
            
            # Use the official Gemini API client
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                prompt
            )
            
            # Extract JSON from the response
            response_text = response.text
            json_str = self._extract_json_from_text(response_text)
            result = json.loads(json_str)
            
            return result
        except Exception as e:
            logger.error(f"Error generating file description: {e}")
            # Return a basic description if generation fails
            return {
                "description": f"File: {file_name}",
                "metadata": {
                    "topics": [],
                    "entities": [],
                    "key_points": [],
                    "additional_info": {}
                }
            }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def optimize_query(self, query: str) -> str:
        """
        Optimizes a user query for better retrieval results using Gemini.
        
        Args:
            query: The original user query.
            
        Returns:
            str: The optimized query.
        """
        try:
            prompt = f"""
            You are helping to optimize a search query for a retrieval system. Your task is to rewrite the query to make it more effective for semantic search.
            
            Original Query: {query}
            
            Please:
            1. Expand any abbreviations or acronyms
            2. Add relevant synonyms or related terms
            3. Make the query more specific and detailed
            4. Remove any unnecessary words or phrases
            
            Return ONLY the optimized query text, with no additional explanation or formatting.
            """
            
            # Use the official Gemini API client
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                prompt
            )
            
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error optimizing query: {e}")
            # Return the original query if optimization fails
            return query

    async def generate_answer(
        self, 
        query: str, 
        context: List[Dict[str, Any]], 
        model_name: str = "gemini",
        stream: bool = False
    ) -> Union[str, AsyncGenerator[str, None]]:
        """
        Generates an answer to a query using the specified LLM model.
        
        Args:
            query: The user query.
            context: The retrieved context documents.
            model_name: The name of the LLM model to use.
            stream: Whether to stream the response.
            
        Returns:
            Union[str, AsyncGenerator[str, None]]: The generated answer or a stream of tokens.
        """
        # Format context for the prompt
        formatted_context = "\n\n".join([
            f"Source {i+1}: {doc.get('source', 'Unknown')}\n{doc.get('text', '')}"
            for i, doc in enumerate(context)
        ])
        
        prompt = f"""
        You are an AI assistant helping to answer questions based on the provided context.
        
        Question: {query}
        
        Context:
        {formatted_context}
        
        Please provide a comprehensive answer based on the context provided. If the context doesn't contain enough information to answer the question fully, acknowledge the limitations of the available information.
        
        Answer:
        """
        
        if model_name.lower() == "gemini":
            if stream:
                return self._stream_gemini(prompt)
            else:
                return await self._call_gemini(prompt)
        elif model_name.lower() == "anthropic":
            if stream:
                return self._stream_anthropic(prompt)
            else:
                return await self._call_anthropic(prompt)
        elif model_name.lower() == "openai":
            if stream:
                return self._stream_openai(prompt)
            else:
                return await self._call_openai(prompt)
        else:
            raise ValueError(f"Unsupported model: {model_name}")

    async def _call_gemini(self, prompt: str) -> str:
        """
        Calls the Gemini API to generate a response.
        
        Args:
            prompt: The prompt to send to the model.
            
        Returns:
            str: The generated response.
        """
        try:
            # Use the official Gemini API client
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.4,
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=2048,
                )
            )
            
            return response.text
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            raise

    async def _stream_gemini(self, prompt: str) -> AsyncGenerator[str, None]:
        """
        Streams responses from the Gemini API.
        
        Args:
            prompt: The prompt to send to the model.
            
        Yields:
            str: Chunks of the generated response.
        """
        try:
            # Use the official Gemini API client with streaming
            response = await asyncio.to_thread(
                self.gemini_model.generate_content,
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.4,
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=2048,
                ),
                stream=True
            )
            
            # Process the streaming response
            async for chunk in self._process_gemini_stream(response):
                yield chunk
        except Exception as e:
            logger.error(f"Error streaming from Gemini API: {e}")
            yield f"\nError: {str(e)}"
    
    async def _process_gemini_stream(self, stream) -> AsyncGenerator[str, None]:
        """
        Process a Gemini streaming response.
        
        Args:
            stream: The streaming response from Gemini.
            
        Yields:
            str: Text chunks from the stream.
        """
        for chunk in stream:
            if hasattr(chunk, 'text'):
                yield chunk.text
            await asyncio.sleep(0)  # Allow other tasks to run

    async def _call_anthropic(self, prompt: str) -> str:
        """
        Calls the Anthropic API to generate a response.
        
        Args:
            prompt: The prompt to send to the model.
            
        Returns:
            str: The generated response.
        """
        try:
            # Use the official Anthropic API client
            response = await asyncio.to_thread(
                self.anthropic_client.messages.create,
                model="claude-3-opus-20240229",
                max_tokens=2048,
                temperature=0.4,
                messages=[{"role": "user", "content": prompt}]
            )
            
            return response.content[0].text
        except Exception as e:
            logger.error(f"Error calling Anthropic API: {e}")
            raise

    async def _stream_anthropic(self, prompt: str) -> AsyncGenerator[str, None]:
        """
        Streams responses from the Anthropic API.
        
        Args:
            prompt: The prompt to send to the model.
            
        Yields:
            str: Chunks of the generated response.
        """
        try:
            # Use the official Anthropic API client with streaming
            with self.anthropic_client.messages.stream(
                model="claude-3-opus-20240229",
                max_tokens=2048,
                temperature=0.4,
                messages=[{"role": "user", "content": prompt}]
            ) as stream:
                # Process the streaming response
                async for chunk in self._process_anthropic_stream(stream):
                    yield chunk
        except Exception as e:
            logger.error(f"Error streaming from Anthropic API: {e}")
            yield f"\nError: {str(e)}"
    
    async def _process_anthropic_stream(self, stream) -> AsyncGenerator[str, None]:
        """
        Process an Anthropic streaming response.
        
        Args:
            stream: The streaming response from Anthropic.
            
        Yields:
            str: Text chunks from the stream.
        """
        for chunk in stream:
            if chunk.type == "content_block_delta" and hasattr(chunk.delta, "text"):
                yield chunk.delta.text
            await asyncio.sleep(0)  # Allow other tasks to run

    async def _call_openai(self, prompt: str) -> str:
        """
        Calls the OpenAI API to generate a response.
        
        Args:
            prompt: The prompt to send to the model.
            
        Returns:
            str: The generated response.
        """
        try:
            # Use the official OpenAI API client
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=2048
            )
            
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}")
            raise

    async def _stream_openai(self, prompt: str) -> AsyncGenerator[str, None]:
        """
        Streams responses from the OpenAI API.
        
        Args:
            prompt: The prompt to send to the model.
            
        Yields:
            str: Chunks of the generated response.
        """
        try:
            # Use the official OpenAI API client with streaming
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-4-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=2048,
                stream=True
            )
            
            # Process the streaming response
            async for chunk in self._process_openai_stream(response):
                yield chunk
        except Exception as e:
            logger.error(f"Error streaming from OpenAI API: {e}")
            yield f"\nError: {str(e)}"
    
    async def _process_openai_stream(self, stream) -> AsyncGenerator[str, None]:
        """
        Process an OpenAI streaming response.
        
        Args:
            stream: The streaming response from OpenAI.
            
        Yields:
            str: Text chunks from the stream.
        """
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
            await asyncio.sleep(0)  # Allow other tasks to run

    def _extract_json_from_text(self, text: str) -> str:
        """
        Extracts a JSON object from text that might contain additional content.
        
        Args:
            text: The text containing a JSON object.
            
        Returns:
            str: The extracted JSON string.
        """
        # Find the first opening brace
        start_idx = text.find('{')
        if start_idx == -1:
            raise ValueError("No JSON object found in the text")
        
        # Find the matching closing brace
        brace_count = 0
        for i in range(start_idx, len(text)):
            if text[i] == '{':
                brace_count += 1
            elif text[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i + 1
                    return text[start_idx:end_idx]
        
        raise ValueError("Malformed JSON object in the text")


# Global instance of the LLM service
llm_service = LLMService() 
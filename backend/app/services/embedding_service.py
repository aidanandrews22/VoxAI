"""
Embedding service module for generating and managing vector embeddings.
"""
import asyncio
import hashlib
import json
import re
import uuid
from typing import Any, Dict, List, Optional, Tuple

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.logging import logger
from app.db.pinecone import pinecone_client
from app.db.supabase import supabase_client

class EmbeddingService:
    """
    Service for generating and managing vector embeddings.
    """

    def __init__(self):
        """
        Initializes the embedding service.
        """
        self.client = httpx.AsyncClient(timeout=60.0)
        logger.info("Embedding service initialized")

    async def close(self):
        """
        Closes the HTTP client.
        """
        await self.client.aclose()
        logger.info("Embedding service client closed")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generates an embedding for the given text using Pinecone's embedding model.
        
        Args:
            text: The text to embed.
            
        Returns:
            List[float]: The embedding vector.
        """
        try:
            # Using Pinecone's inference API for embeddings
            result = await asyncio.to_thread(
                pinecone_client.client.inference.embed,
                model="llama-text-embed-v2",
                inputs=[text],
                parameters={
                    "input_type": "query"
                }
            )
            
            # Return the embedding values
            if result and len(result) > 0:
                return result[0].values
            else:
                raise ValueError("No embedding values returned from Pinecone")
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise

    async def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """
        Chunks text into smaller pieces for embedding.
        
        Args:
            text: The text to chunk.
            chunk_size: The maximum size of each chunk.
            overlap: The overlap between chunks.
            
        Returns:
            List[str]: The chunked text.
        """
        if not text:
            return []
            
        # Split text into paragraphs
        paragraphs = re.split(r'\n\s*\n', text)
        
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            # If adding this paragraph would exceed chunk size, save current chunk and start a new one
            if len(current_chunk) + len(paragraph) > chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                # Keep some overlap from the end of the previous chunk
                overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                current_chunk = overlap_text + " " + paragraph
            else:
                if current_chunk:
                    current_chunk += " " + paragraph
                else:
                    current_chunk = paragraph
        
        # Add the last chunk if it's not empty
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        return chunks

    async def process_file_content(
        self, 
        file_id: str, 
        file_path: str, 
        content: str, 
        source: str,
        namespace: str = ""
    ) -> str:
        """
        Processes file content by chunking, embedding, and storing in Pinecone.
        
        Args:
            file_id: The ID of the file.
            file_path: The path of the file in storage.
            content: The text content of the file.
            source: The source name (e.g., file name).
            namespace: The namespace to store vectors in.
            
        Returns:
            str: The Pinecone ID for the file.
        """
        try:
            # Generate a unique ID for this file in Pinecone
            pinecone_id = f"file_{file_id}_{hashlib.md5(content.encode()).hexdigest()[:8]}"
            
            # Chunk the text
            chunks = await self.chunk_text(content)
            
            if not chunks:
                logger.warning(f"No chunks generated for file {file_id}")
                return pinecone_id
                
            # Generate embeddings and prepare vectors for Pinecone
            vectors = []
            
            # Pinecone metadata limit is 40KB (40960 bytes)
            MAX_METADATA_BYTES = 30000  # Leave some buffer for other metadata fields
            
            for i, chunk in enumerate(chunks):
                # Generate embedding for the chunk
                embedding = await self.generate_embedding(chunk)
                
                # Truncate the chunk if needed to fit within metadata limits
                chunk_for_metadata = chunk
                chunk_bytes = len(chunk.encode('utf-8'))
                
                if chunk_bytes > MAX_METADATA_BYTES:
                    # Truncate the chunk to fit within limits
                    # This is a simple truncation; in production you might want 
                    # to implement a smarter truncation that preserves meaning
                    truncate_ratio = MAX_METADATA_BYTES / chunk_bytes
                    truncate_length = int(len(chunk) * truncate_ratio)
                    chunk_for_metadata = chunk[:truncate_length] + "... [truncated]"
                    logger.warning(f"Truncated chunk {i} from {chunk_bytes} bytes to {len(chunk_for_metadata.encode('utf-8'))} bytes")
                
                # Create metadata for the vector
                metadata = {
                    "file_id": file_id,
                    "file_path": file_path,
                    "text_chunk": chunk_for_metadata,
                    "chunk_index": i,
                    "source": source,
                    "total_chunks": len(chunks)
                }
                
                # Create a unique ID for this chunk
                chunk_id = f"{pinecone_id}_chunk_{i}"
                
                vectors.append((chunk_id, embedding, metadata))
            
            # Upsert vectors to Pinecone
            await pinecone_client.upsert_vectors(vectors, namespace)
            
            logger.info(f"Processed {len(chunks)} chunks for file {file_id}")
            return pinecone_id
        except Exception as e:
            logger.error(f"Error processing file content: {e}")
            raise

    async def search_similar(
        self, 
        query: str, 
        top_k: int = 5, 
        namespace: str = "",
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Searches for similar vectors in Pinecone.
        
        Args:
            query: The query text.
            top_k: Number of results to return.
            namespace: The namespace to search in.
            filter: Metadata filters to apply.
            
        Returns:
            List[Dict[str, Any]]: The search results.
        """
        try:
            # Generate embedding for the query
            query_embedding = await self.generate_embedding(query)
            
            # Query Pinecone
            results = await pinecone_client.query_vectors(
                query_vector=query_embedding,
                top_k=top_k,
                namespace=namespace,
                filter=filter
            )
            
            # Format results
            formatted_results = []
            for result in results:
                formatted_results.append({
                    "text": result["metadata"]["text_chunk"],
                    "score": result["score"],
                    "file_id": result["metadata"]["file_id"],
                    "file_path": result["metadata"]["file_path"],
                    "source": result["metadata"]["source"],
                    "metadata": {k: v for k, v in result["metadata"].items() if k not in ["text_chunk", "file_id", "file_path", "source"]}
                })
            
            return formatted_results
        except Exception as e:
            logger.error(f"Error searching similar vectors: {e}")
            raise

    async def delete_file_vectors(self, file_id: str, namespace: str = "") -> Dict[str, Any]:
        """
        Deletes all vectors for a file from Pinecone.
        
        Args:
            file_id: The ID of the file.
            namespace: The namespace to delete from.
            
        Returns:
            Dict[str, Any]: The deletion response.
        """
        try:
            pinecone_id = supabase_client.table("files").select("pinecone_id").eq("id", file_id).execute().data[0]["pinecone_id"]
            
            return await self.delete_vectors_by_pinecone_id(pinecone_id, namespace)
        except Exception as e:
            logger.error(f"Error deleting file vectors: {e}")
            raise

    async def delete_vectors_by_pinecone_id(self, pinecone_id: str, namespace: str = "") -> Dict[str, Any]:
        """
        Deletes all vectors with the given Pinecone ID prefix.
        
        Args:
            pinecone_id: The Pinecone ID prefix to delete.
            namespace: The namespace to delete from.
            
        Returns:
            Dict[str, Any]: The deletion response.
        """
        try:
            # Get the list of vectors with the given prefix
            vector_list = await pinecone_client.list_vectors(prefix=pinecone_id, namespace=namespace)
            
            if not vector_list:
                logger.info(f"No vectors found with Pinecone ID prefix: {pinecone_id}")
                return {"deleted_count": 0, "message": f"No vectors found with Pinecone ID prefix: {pinecone_id}"}
            
            # Delete the vectors
            response = await pinecone_client.delete_vectors(ids=vector_list, namespace=namespace)
            
            logger.info(f"Deleted {len(vector_list)} vectors with Pinecone ID prefix: {pinecone_id}")
            return {"deleted_count": len(vector_list), "message": f"Deleted {len(vector_list)} vectors"}
        except Exception as e:
            logger.error(f"Error deleting vectors by Pinecone ID: {e}")
            raise


# Global instance of the embedding service
embedding_service = EmbeddingService() 
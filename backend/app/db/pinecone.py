"""
Pinecone client module for vector database operations.
"""
from typing import Any, Dict, List, Optional, Tuple

import pinecone
from pinecone import Index, Pinecone

from app.core.config import settings
from app.core.logging import logger


class PineconeClient:
    """
    Singleton client for Pinecone vector database.
    """

    _instance: Optional["PineconeClient"] = None
    _client: Optional[Pinecone] = None
    _index: Optional[Index] = None

    def __new__(cls) -> "PineconeClient":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if self._client is None:
            try:
                # Initialize Pinecone client
                self._client = Pinecone(api_key=settings.PINECONE_API_KEY)
                
                # Connect to the index
                self._index = self._client.Index(
                    host=settings.PINECONE_HOST_LLAMA,
                    name=settings.PINECONE_INDEX_LLAMA,
                )
                
                logger.info(f"Pinecone client initialized successfully with index {settings.PINECONE_INDEX_LLAMA}")
            except Exception as e:
                logger.error(f"Failed to initialize Pinecone client: {e}")
                raise

    @property
    def client(self) -> Pinecone:
        """
        Returns the Pinecone client.
        
        Returns:
            Pinecone: The Pinecone client.
        """
        if self._client is None:
            raise ValueError("Pinecone client not initialized")
        return self._client

    @property
    def index(self) -> Index:
        """
        Returns the Pinecone index.
        
        Returns:
            Index: The Pinecone index.
        """
        if self._index is None:
            raise ValueError("Pinecone index not initialized")
        return self._index

    async def upsert_vectors(
        self, vectors: List[Tuple[str, List[float], Dict[str, Any]]], namespace: str = ""
    ) -> Dict[str, Any]:
        """
        Upserts vectors into the Pinecone index.
        
        Args:
            vectors: List of tuples containing (id, vector, metadata)
            namespace: The namespace to upsert into
            
        Returns:
            Dict[str, Any]: The upsert response.
        """
        try:
            # Convert the list of tuples to the format expected by Pinecone
            vectors_to_upsert = [
                {"id": id, "values": vector, "metadata": metadata}
                for id, vector, metadata in vectors
            ]
            
            # Batch upsert in chunks of 100 (Pinecone's recommendation)
            chunk_size = 100
            results = []
            
            for i in range(0, len(vectors_to_upsert), chunk_size):
                chunk = vectors_to_upsert[i:i + chunk_size]
                response = self.index.upsert(vectors=chunk, namespace=namespace)
                results.append(response)
            
            logger.info(f"Upserted {len(vectors_to_upsert)} vectors to Pinecone")
            return {"upserted_count": len(vectors_to_upsert), "results": results}
        except Exception as e:
            logger.error(f"Error upserting vectors to Pinecone: {e}")
            raise

    async def delete_vectors(self, ids: List[str], namespace: str = "") -> Dict[str, Any]:
        """
        Deletes vectors from the Pinecone index.
        
        Args:
            ids: List of vector IDs to delete
            namespace: The namespace to delete from
            
        Returns:
            Dict[str, Any]: The deletion response.
        """
        try:
            response = self.index.delete(ids=ids, namespace=namespace)
            logger.info(f"Deleted {len(ids)} vectors from Pinecone")
            return response
        except Exception as e:
            logger.error(f"Error deleting vectors from Pinecone: {e}")
            raise

    async def query_vectors(
        self, 
        query_vector: List[float], 
        top_k: int = 5, 
        namespace: str = "",
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Queries vectors from the Pinecone index.
        
        Args:
            query_vector: The query vector
            top_k: Number of results to return
            namespace: The namespace to query in
            filter: Optional filter to apply
            
        Returns:
            List[Dict[str, Any]]: The query results.
        """
        try:
            response = self.index.query(
                vector=query_vector,
                top_k=top_k,
                namespace=namespace,
                filter=filter,
                include_metadata=True
            )
            return response.get("matches", [])
        except Exception as e:
            logger.error(f"Error querying vectors from Pinecone: {e}")
            raise

    async def list_vectors(self, prefix: str, namespace: str = "") -> List[str]:
        """
        Lists vector IDs with the given prefix from the Pinecone index.
        
        Args:
            prefix: The prefix to filter vector IDs by
            namespace: The namespace to list from
            
        Returns:
            List[str]: List of vector IDs.
        """
        try:
            # The list method returns a generator, not a dictionary
            vector_ids = []
            for vector_id in self.index.list(prefix=prefix, namespace=namespace):
                vector_ids.append(vector_id)
            
            logger.info(f"Listed {len(vector_ids)} vectors with prefix {prefix}")
            return vector_ids
        except Exception as e:
            logger.error(f"Error listing vectors from Pinecone: {e}")
            raise


# Global instance of the Pinecone client
pinecone_client = PineconeClient() 
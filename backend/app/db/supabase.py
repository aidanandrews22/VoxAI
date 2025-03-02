"""
Supabase client module for connecting to Supabase.
"""
from typing import Any, Dict, Optional, List

from supabase import Client, create_client

from app.core.config import settings
from app.core.logging import logger


class SupabaseClient:
    """
    Singleton client for Supabase.
    """

    _instance: Optional["SupabaseClient"] = None
    _client: Optional[Client] = None

    def __new__(cls) -> "SupabaseClient":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if self._client is None:
            try:
                self._client = create_client(
                    settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
                )
                logger.info("Supabase client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                raise

    @property
    def client(self) -> Client:
        """
        Returns the Supabase client.
        
        Returns:
            Client: The Supabase client.
        """
        if self._client is None:
            raise ValueError("Supabase client not initialized")
        return self._client

    async def get_file_metadata(self, file_id: str) -> Dict[str, Any]:
        """
        Fetches file metadata from the file_metadata table.
        
        Args:
            file_id: The ID of the file.
            
        Returns:
            Dict[str, Any]: The file metadata.
        """
        try:
            response = self.client.table("file_metadata").select("*").eq("file_id", file_id).execute()
            if response.data:
                return response.data[0]
            return {}
        except Exception as e:
            logger.error(f"Error fetching file metadata: {e}")
            raise

    async def get_notebook_file(self, file_id: str) -> Dict[str, Any]:
        """
        Fetches file information from the notebook_files table.
        
        Args:
            file_id: The ID of the file.
            
        Returns:
            Dict[str, Any]: The file information.
        """
        try:
            response = self.client.table("notebook_files").select("*").eq("id", file_id).execute()
            if response.data:
                return response.data[0]
            return {}
        except Exception as e:
            logger.error(f"Error fetching notebook file: {e}")
            raise

    async def create_file_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a new file metadata record.
        
        Args:
            metadata: The metadata to create.
            
        Returns:
            Dict[str, Any]: The created metadata.
        """
        try:
            response = self.client.table("file_metadata").insert(metadata).execute()
            if response.data:
                return response.data[0]
            return {}
        except Exception as e:
            logger.error(f"Error creating file metadata: {e}")
            raise

    async def update_file_metadata(self, id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates an existing file metadata record.
        
        Args:
            id: The ID of the metadata record.
            metadata: The metadata to update.
            
        Returns:
            Dict[str, Any]: The updated metadata.
        """
        try:
            response = self.client.table("file_metadata").update(metadata).eq("id", id).execute()
            if response.data:
                return response.data[0]
            return {}
        except Exception as e:
            logger.error(f"Error updating file metadata: {e}")
            raise

    async def fetch_file_from_storage(self, file_path: str) -> bytes:
        """
        Fetches a file from Supabase storage.
        
        Args:
            file_path: The path of the file in storage.
            
        Returns:
            bytes: The file contents.
        """
        try:
            response = self.client.storage.from_("Vox").download(file_path)
            return response
        except Exception as e:
            logger.error(f"Error fetching file from storage: {e}")
            raise

    async def get_user_toggled_files(self, user_id: str) -> List[str]:
        """
        Fetches the toggled files for a user from the users table.
        
        Args:
            user_id: The ID of the user.
            
        Returns:
            List[str]: List of pinecone_ids from toggled files. Empty list if none found.
        """
        try:
            toggled_files: List[str] = []
            response = self.client.table("users").select("toggled_files").eq("id", user_id).execute()
            
            if response.data and response.data[0].get("toggled_files"):
                # toggled_files is stored as JSONB in the database
                file_ids = response.data[0]["toggled_files"]
                
                for file_id in file_ids:
                    file_response = self.client.table("file_metadata").select("pinecone_id").eq("file_id", file_id).execute()
                    
                    if file_response.data and len(file_response.data) > 0 and file_response.data[0].get("pinecone_id"):
                        pinecone_id = file_response.data[0]["pinecone_id"]
                        if pinecone_id:  # Only add non-empty pinecone_ids
                            toggled_files.append(pinecone_id)

            return toggled_files
        except Exception as e:
            logger.error(f"Error fetching user toggled files: {e}")
            raise


# Global instance of the Supabase client
supabase_client = SupabaseClient() 
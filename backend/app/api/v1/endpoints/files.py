"""
API endpoints for file operations.
"""
import asyncio
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Path, Query
from fastapi.responses import JSONResponse

from app.core.logging import logger
from app.schemas.file import (
    DeleteByPineconeIdRequest,
    FileIngestRequest, 
    FileIngestResponse, 
    FileMetadataResponse
)
from app.services.embedding_service import embedding_service
from app.services.file_service import file_service
from app.services.llm_service import llm_service

router = APIRouter()


@router.post("/ingest", response_model=FileIngestResponse)
async def ingest_file(
    request: FileIngestRequest,
    background_tasks: BackgroundTasks,
) -> FileIngestResponse:
    """
    Ingests a file for processing and indexing.
    
    This endpoint:
    1. Fetches the file metadata and content
    2. Generates a description and metadata using LLM
    3. Processes the file content for vector storage
    4. Updates the file metadata with the results
    
    Args:
        request: The file ingestion request.
        background_tasks: FastAPI background tasks.
        
    Returns:
        FileIngestResponse: The ingestion response.
    """
    try:
        # Fetch the notebook file information
        file_id = str(request.file_id)
        notebook_file = await file_service.get_notebook_file(file_id)
        
        if not notebook_file:
            raise HTTPException(status_code=404, detail=f"File with ID {file_id} not found")
        
        # Check if file metadata already exists
        existing_metadata = await file_service.get_file_metadata(file_id)
        
        if existing_metadata and existing_metadata.pinecone_id:
            # File already processed
            return FileIngestResponse(
                success=True,
                metadata=FileMetadataResponse(**existing_metadata.to_dict()),
                message="File already processed"
            )
        
        # Extract file content
        try:
            # Extract text content based on file type
            file_content = await file_service.get_file_text_content(
                notebook_file.file_path, notebook_file.file_type
            )
            
            # Extract metadata
            file_metadata = await file_service.get_file_metadata_content(
                notebook_file.file_path, notebook_file.file_type
            )
        except Exception as e:
            logger.error(f"Error extracting content from file: {e}")
            raise HTTPException(
                status_code=500, 
                detail=f"Error extracting content from file: {str(e)}"
            )
        
        # Generate description using LLM if not already extracted
        llm_result = {}
        if not file_metadata.get("description"):
            llm_result = await llm_service.generate_file_description(
                file_content=file_content,
                file_name=notebook_file.file_name,
                file_type=notebook_file.file_type
            )
        else:
            llm_result = {
                "description": file_metadata.get("description", ""),
                "metadata": file_metadata
            }
        
        # Create or update file metadata
        if existing_metadata:
            metadata = await file_service.update_file_metadata(
                id=existing_metadata.id,
                description=llm_result.get("description"),
                metadata=llm_result.get("metadata", {})
            )
        else:
            metadata = await file_service.create_file_metadata(
                file_id=request.file_id,
                file_path=notebook_file.file_path,
                description=llm_result.get("description"),
                metadata=llm_result.get("metadata", {})
            )
        
        # Process file content in the background
        background_tasks.add_task(
            _process_file_content,
            file_id=file_id,
            file_path=notebook_file.file_path,
            content=file_content,
            source=notebook_file.file_name,
            metadata_id=metadata.id
        )
        
        return FileIngestResponse(
            success=True,
            metadata=FileMetadataResponse(**metadata.to_dict()),
            message="File ingestion started"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ingesting file: {e}")
        raise HTTPException(status_code=500, detail=f"Error ingesting file: {str(e)}")


@router.get("/{file_id}/metadata", response_model=FileMetadataResponse)
async def get_file_metadata(
    file_id: UUID = Path(..., description="The ID of the file"),
) -> FileMetadataResponse:
    """
    Gets the metadata for a file.
    
    Args:
        file_id: The ID of the file.
        
    Returns:
        FileMetadataResponse: The file metadata.
    """
    try:
        metadata = await file_service.get_file_metadata(str(file_id))
        
        if not metadata:
            raise HTTPException(status_code=404, detail=f"Metadata for file with ID {file_id} not found")
        
        return FileMetadataResponse(**metadata.to_dict())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file metadata: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting file metadata: {str(e)}")


@router.delete("/{file_id}", response_model=Dict[str, Any])
async def delete_file_vectors(
    file_id: UUID = Path(..., description="The ID of the file"),
    namespace: str = Query("", description="The namespace to delete from"),
) -> Dict[str, Any]:
    """
    Deletes all vectors for a file from Pinecone.
    
    Args:
        file_id: The ID of the file.
        namespace: The namespace to delete from.
        
    Returns:
        Dict[str, Any]: The deletion response.
    """
    try:
        # Delete vectors from Pinecone
        response = await embedding_service.delete_file_vectors(str(file_id), namespace)
        
        # Update file metadata to remove Pinecone ID
        metadata = await file_service.get_file_metadata(str(file_id))
        if metadata:
            await file_service.update_file_metadata(
                id=metadata.id,
                pinecone_id=None
            )
        
        return {
            "success": True,
            "message": f"Vectors for file {file_id} deleted",
            "details": response
        }
    except Exception as e:
        logger.error(f"Error deleting file vectors: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting file vectors: {str(e)}")


@router.post("/delete-by-pinecone-id", response_model=Dict[str, Any])
async def delete_by_pinecone_id(
    request: DeleteByPineconeIdRequest,
    namespace: str = Query("", description="The namespace to delete from"),
) -> Dict[str, Any]:
    """
    Deletes all vectors with the given Pinecone ID prefix.
    
    Args:
        request: The delete request containing the Pinecone ID.
        namespace: The namespace to delete from.
        
    Returns:
        Dict[str, Any]: The deletion response.
    """
    try:
        # Delete vectors from Pinecone
        response = await embedding_service.delete_vectors_by_pinecone_id(request.file_id, namespace)
        
        return {
            "success": True,
            "message": f"Vectors with Pinecone ID prefix {request.file_id} deleted",
            "details": response
        }
    except Exception as e:
        logger.error(f"Error deleting vectors by Pinecone ID: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting vectors by Pinecone ID: {str(e)}")


async def _process_file_content(
    file_id: str,
    file_path: str,
    content: str,
    source: str,
    metadata_id: UUID,
    namespace: str = ""
) -> None:
    """
    Background task to process file content.
    
    Args:
        file_id: The ID of the file.
        file_path: The path of the file in storage.
        content: The text content of the file.
        source: The source name (e.g., file name).
        metadata_id: The ID of the file metadata record.
        namespace: The namespace to store vectors in.
    """
    try:
        # Process file content
        pinecone_id = await embedding_service.process_file_content(
            file_id=file_id,
            file_path=file_path,
            content=content,
            source=source,
            namespace=namespace
        )
        
        # Update file metadata with Pinecone ID
        await file_service.update_file_metadata(
            id=metadata_id,
            pinecone_id=pinecone_id
        )
        
        logger.info(f"File {file_id} processed successfully")
    except Exception as e:
        logger.error(f"Error processing file content: {e}")
        # We could implement a retry mechanism here 
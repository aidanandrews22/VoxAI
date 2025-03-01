"""
API endpoints for query operations.
"""
import asyncio
import json
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query as QueryParam
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import ValidationError

from app.core.logging import logger
from app.schemas.file import QueryRequest, QueryResponse, QueryResult
from app.services.rag_service import rag_service

router = APIRouter()


@router.post("", response_model=QueryResponse)
async def query(
    request: QueryRequest,
) -> QueryResponse:
    """
    Queries the system using RAG.
    
    This endpoint:
    1. Retrieves relevant context from the vector database
    2. Generates an answer using the specified LLM model
    3. Returns the answer and sources
    
    Args:
        request: The query request.
        
    Returns:
        QueryResponse: The query response.
    """
    try:
        # Handle streaming separately
        if request.stream:
            return await _stream_query(request)
        
        # Perform RAG query
        answer, context, query_time = await rag_service.query(
            query=request.query,
            top_k=request.top_k,
            model_name=request.model_name,
            use_rag=request.use_rag,
            stream=False,
            namespace=request.namespace,
            filter=request.filter
        )
        
        # Format sources
        sources = [
            QueryResult(
                text=doc.get("text", ""),
                score=doc.get("score", 0.0),
                file_id=doc.get("file_id", ""),
                file_path=doc.get("file_path", ""),
                source=doc.get("source", ""),
                metadata=doc.get("metadata", {})
            )
            for doc in context
        ]
        
        return QueryResponse(
            answer=answer,
            sources=sources,
            query_time_ms=query_time
        )
    except ValidationError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying: {e}")
        raise HTTPException(status_code=500, detail=f"Error querying: {str(e)}")


async def _stream_query(request: QueryRequest) -> StreamingResponse:
    """
    Streams a query response.
    
    Args:
        request: The query request.
        
    Returns:
        StreamingResponse: The streaming response.
    """
    async def generate():
        start_time = time.time()
        
        try:
            # Retrieve context
            context = []
            if request.use_rag:
                context = await rag_service.retrieve_context(
                    query=request.query,
                    top_k=request.top_k,
                    namespace=request.namespace,
                    filter=request.filter
                )
            
            # Format sources for the response
            sources = [
                {
                    "text": doc.get("text", ""),
                    "score": doc.get("score", 0.0),
                    "file_id": doc.get("file_id", ""),
                    "file_path": doc.get("file_path", ""),
                    "source": doc.get("source", ""),
                    "metadata": doc.get("metadata", {})
                }
                for doc in context
            ]
            
            # Send sources as the first chunk
            sources_json = json.dumps({"type": "sources", "data": sources})
            yield f"data: {sources_json}\n\n"
            
            # Stream the answer
            answer_stream = await rag_service.generate_answer(
                query=request.query,
                context=context,
                model_name=request.model_name,
                stream=True
            )
            
            async for chunk in answer_stream:
                chunk_json = json.dumps({"type": "token", "data": chunk})
                yield f"data: {chunk_json}\n\n"
                await asyncio.sleep(0)  # Allow other tasks to run
            
            # Send query time as the final chunk
            query_time = (time.time() - start_time) * 1000
            done_json = json.dumps({"type": "done", "query_time_ms": query_time})
            yield f"data: {done_json}\n\n"
        except Exception as e:
            logger.error(f"Error in streaming query: {e}")
            error_json = json.dumps({"type": "error", "error": str(e)})
            yield f"data: {error_json}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    ) 
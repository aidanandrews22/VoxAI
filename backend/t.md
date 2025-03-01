# VoxAI Backend Development Plan

## Core Stack

> **"Backend: Python 3.11+, FastAPI; Database: Pinecone (vector DB), Supabase; Dependencies: pydantic for validation, httpx for async HTTP requests, asyncio for concurrent operations, uvicorn for ASGI server."**

## Phase 1: Project Setup

- [x] Create project structure
  - [x] Set up app directory with proper modules
  - [x] Create config module for environment variables
  - [x] Set up logging configuration
- [x] Initialize FastAPI application
  - [x] Configure CORS, middleware, and error handlers
  - [x] Set up dependency injection system
- [x] Create database connection modules
  - [x] Supabase client setup
  - [x] Pinecone client setup
- [x] Set up basic models and schemas
  - [x] Create Pydantic models for requests/responses
  - [x] Define database models
- [x] Update README with project setup instructions

## Phase 2: File Ingestion Endpoint

- [x] Create file service module
  - [x] Implement function to fetch file from Supabase bucket
  - [x] Implement function to get file metadata from notebook_files table
- [x] Create LLM service module
  - [x] Implement function to generate file description and metadata using Gemini
  - [x] Implement function to parse LLM response
- [x] Create vector embedding service
  - [x] Implement function to generate embeddings using Pinecone
  - [x] Implement function to store embeddings in Pinecone
- [x] Create ingestion endpoint
  - [x] Implement POST endpoint to receive file_path
  - [x] Implement concurrent processing of file data and metadata
  - [x] Implement database operations for storing metadata
  - [x] Implement response handling for successful ingestion
- [x] Update README with ingestion endpoint documentation

## Phase 3: Context Retrieval and LLM Streaming

- [x] Enhance LLM service module
  - [x] Implement query optimization using Gemini
  - [x] Implement multi-model support (Anthropic, Gemini, OpenAI)
  - [x] Implement streaming response handling
- [x] Create RAG service module
  - [x] Implement vector search using Pinecone
  - [x] Implement context retrieval and formatting
- [x] Create query endpoint
  - [x] Implement POST endpoint to receive query and model selection
  - [x] Implement background task for sending RAG results to frontend
  - [x] Implement streaming response for LLM output
  - [x] Implement error handling and fallback mechanisms
- [x] Update README with query endpoint documentation

## Phase 4: Testing and Optimization

- [x] Write unit tests
  - [x] Test file service functions
  - [x] Test LLM service functions
  - [x] Test vector embedding service functions
- [x] Write integration tests
  - [x] Test ingestion endpoint
  - [x] Test query endpoint
- [x] Optimize performance
  - [x] Implement caching strategies
  - [x] Optimize database queries
  - [x] Fine-tune vector search parameters
- [x] Update README with testing and performance information

## Phase 5: Deployment and Documentation

- [x] Prepare for deployment
  - [x] Create Dockerfile
  - [x] Set up CI/CD pipeline
- [x] Complete API documentation
  - [x] Ensure all endpoints are documented with OpenAPI/Swagger
  - [x] Add usage examples
- [x] Finalize README
  - [x] Add comprehensive setup instructions
  - [x] Add usage examples
  - [x] Add performance considerations


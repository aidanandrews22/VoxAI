"""
Test script for file processors.

This is not an automated test, but a manual test script to verify file processors work correctly.
"""
import asyncio
import os
import sys
import json
from pathlib import Path

# Add project root to Python path
proj_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(proj_root))

from app.services.file_processors import FileProcessorFactory


async def test_processor(file_path: str, file_type: str) -> None:
    """
    Test a file processor with a local file.
    
    Args:
        file_path: Path to the test file
        file_type: MIME type of the file
    """
    try:
        print(f"\n--- Testing {file_type} processor with {file_path} ---")
        
        # Read the file
        with open(file_path, "rb") as f:
            file_content = f.read()
        
        # Get the processor
        processor = FileProcessorFactory.get_processor(file_type)
        
        # Extract content
        print("Extracting content...")
        content = await processor.process(file_content, file_path)
        print(f"Content (first 500 chars): {content[:500]}...")
        
        # Extract metadata
        print("\nExtracting metadata...")
        metadata = await processor.get_metadata(file_content, file_path)
        print(f"Metadata: {json.dumps(metadata, indent=2, default=str)}")
        
        print(f"\n--- Test completed for {file_type} ---\n")
        
    except Exception as e:
        print(f"Error testing {file_type} processor: {e}")


async def main():
    """
    Main function to run the tests.
    """
    # Test files directory
    test_files_dir = os.path.join(proj_root, "test_files")
    
    # Ensure test directory exists
    os.makedirs(test_files_dir, exist_ok=True)
    
    # Check if any test files exist
    if not os.listdir(test_files_dir):
        print(f"No test files found in {test_files_dir}. Please add some files to test.")
        return
    
    # Test processors with example files
    for file_name in os.listdir(test_files_dir):
        file_path = os.path.join(test_files_dir, file_name)
        
        # Skip directories
        if os.path.isdir(file_path):
            continue
        
        # Determine file type based on extension
        ext = os.path.splitext(file_name)[1].lower()
        
        if ext in [".txt"]:
            await test_processor(file_path, "text/plain")
        elif ext in [".md", ".markdown"]:
            await test_processor(file_path, "text/markdown")
        elif ext in [".pdf"]:
            await test_processor(file_path, "application/pdf")
        elif ext in [".docx"]:
            await test_processor(file_path, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        elif ext in [".xlsx"]:
            await test_processor(file_path, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        elif ext in [".csv"]:
            await test_processor(file_path, "text/csv")
        elif ext in [".pptx"]:
            await test_processor(file_path, "application/vnd.openxmlformats-officedocument.presentationml.presentation")
        elif ext in [".jpg", ".jpeg"]:
            await test_processor(file_path, "image/jpeg")
        elif ext in [".png"]:
            await test_processor(file_path, "image/png")
        elif ext in [".mp3"]:
            await test_processor(file_path, "audio/mpeg")
        elif ext in [".wav"]:
            await test_processor(file_path, "audio/wav")
        elif ext in [".mp4"]:
            await test_processor(file_path, "video/mp4")
        else:
            print(f"Skipping file with unsupported extension: {file_name}")


if __name__ == "__main__":
    print("Starting file processor tests...")
    asyncio.run(main())
    print("File processor tests completed.")
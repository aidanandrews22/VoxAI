"""
Document processor module for extracting text from PDF and Word documents.
"""
import io
import os
import tempfile
from typing import Dict, Any, List, Tuple

import fitz  # PyMuPDF
import docx
from PIL import Image

from app.core.config import settings
from app.core.logging import logger
from app.services.file_processors import FileProcessor


class DocumentProcessor(FileProcessor):
    """
    Base processor for document files.
    """
    
    async def process(self, file_content: bytes, file_path: str) -> str:
        """
        Process document content and extract text.
        
        Args:
            file_content: Raw document file content bytes
            file_path: Path to the document file
            
        Returns:
            str: Extracted text content
        """
        raise NotImplementedError("Subclasses must implement this method")
    
    async def get_metadata(self, file_content: bytes, file_path: str) -> Dict[str, Any]:
        """
        Extract metadata from document file.
        
        Args:
            file_content: Raw document file content bytes
            file_path: Path to the document file
            
        Returns:
            Dict[str, Any]: Extracted metadata
        """
        return {
            'file_size': len(file_content),
            'file_extension': os.path.splitext(file_path)[1],
        }
    
    async def _extract_text_from_image(self, image: Image.Image) -> str:
        """
        Extract text from an image using Google Vision API.
        
        Args:
            image: PIL Image object
            
        Returns:
            str: Extracted text
        """
        try:
            from google import genai
            import os
            
            # Initialize the Gemini client
            client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            
            # Convert PIL Image to bytes for the API
            with io.BytesIO() as output:
                image.save(output, format="PNG")
                image_bytes = output.getvalue()
            
            # Create the request parts
            from google.genai import types
            image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/png")
            
            # Generate content using Gemini
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=["Extract all text visible in this image", image_part]
            )
            
            return response.text
        except Exception as e:
            logger.error(f"Error extracting text from image: {e}")
            return ""


class PDFProcessor(DocumentProcessor):
    """
    Processor for PDF files.
    Handles: application/pdf
    """
    
    async def process(self, file_content: bytes, file_path: str) -> str:
        """
        Process PDF content and extract text.
        
        Args:
            file_content: Raw PDF file content bytes
            file_path: Path to the PDF file
            
        Returns:
            str: Extracted text content
        """
        try:
            # Process PDF using PyMuPDF (fitz)
            pdf_document = fitz.open(stream=file_content, filetype="pdf")
            
            full_text = []
            
            # Process all pages
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                
                # Extract text from the page
                page_text = page.get_text()
                
                # If the page has no text (or very little), it might be scanned/image-based
                if len(page_text.strip()) < 50:  # Arbitrary threshold
                    # Extract images and process them
                    image_list = self._extract_images_from_page(page)
                    for img in image_list:
                        img_text = await self._extract_text_from_image(img)
                        if img_text:
                            full_text.append(img_text)
                else:
                    full_text.append(page_text)
            
            pdf_document.close()
            
            return "\n\n".join(full_text)
        except Exception as e:
            logger.error(f"Error processing PDF file: {e}")
            raise
    
    async def get_metadata(self, file_content: bytes, file_path: str) -> Dict[str, Any]:
        """
        Extract metadata from PDF file.
        
        Args:
            file_content: Raw PDF file content bytes
            file_path: Path to the PDF file
            
        Returns:
            Dict[str, Any]: Extracted metadata
        """
        base_metadata = await super().get_metadata(file_content, file_path)
        
        try:
            # Process PDF using PyMuPDF (fitz)
            pdf_document = fitz.open(stream=file_content, filetype="pdf")
            
            # Extract document metadata
            metadata = {
                'page_count': len(pdf_document),
                'title': pdf_document.metadata.get('title', ''),
                'author': pdf_document.metadata.get('author', ''),
                'subject': pdf_document.metadata.get('subject', ''),
                'keywords': pdf_document.metadata.get('keywords', ''),
                'creator': pdf_document.metadata.get('creator', ''),
                'producer': pdf_document.metadata.get('producer', ''),
                'creation_date': pdf_document.metadata.get('creationDate', ''),
                'modification_date': pdf_document.metadata.get('modDate', ''),
            }
            
            # Remove empty metadata fields
            metadata = {k: v for k, v in metadata.items() if v}
            
            # Add to base metadata
            base_metadata.update(metadata)
            
            pdf_document.close()
            
            return base_metadata
        except Exception as e:
            logger.error(f"Error extracting PDF metadata: {e}")
            return base_metadata
    
    def _extract_images_from_page(self, page: fitz.Page) -> List[Image.Image]:
        """
        Extract images from a PDF page.
        
        Args:
            page: PyMuPDF page object
            
        Returns:
            List[Image.Image]: List of extracted images as PIL Image objects
        """
        images = []
        
        # Get image list
        img_list = page.get_images(full=True)
        
        for img_index, img_info in enumerate(img_list):
            try:
                xref = img_info[0]
                base_image = page.parent.extract_image(xref)
                
                # Convert to PIL Image
                image_data = base_image["image"]
                img = Image.open(io.BytesIO(image_data))
                
                # Only process images that are big enough to contain meaningful text
                if img.width > 100 and img.height > 100:
                    images.append(img)
            except Exception as e:
                logger.error(f"Error extracting image {img_index} from PDF: {e}")
        
        return images


class WordProcessor(DocumentProcessor):
    """
    Processor for Word documents.
    Handles: application/vnd.openxmlformats-officedocument.wordprocessingml.document
    """
    
    async def process(self, file_content: bytes, file_path: str) -> str:
        """
        Process Word document content and extract text.
        
        Args:
            file_content: Raw Word document file content bytes
            file_path: Path to the Word document file
            
        Returns:
            str: Extracted text content
        """
        try:
            # Write content to a temporary file because python-docx requires a file path
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
                temp_file.write(file_content)
                temp_file.flush()
                temp_path = temp_file.name
            
            # Process the Word document
            doc = docx.Document(temp_path)
            
            # Extract text from paragraphs
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            
            # Extract text from tables
            for table in doc.tables:
                for row in table.rows:
                    row_text = []
                    for cell in row.cells:
                        row_text.append(cell.text)
                    full_text.append(" | ".join(row_text))
            
            # Clean up the temporary file
            os.unlink(temp_path)
            
            # Process images if there are any
            images = await self._extract_images_from_doc(file_content)
            for img in images:
                img_text = await self._extract_text_from_image(img)
                if img_text:
                    full_text.append(img_text)
            
            return "\n\n".join(full_text)
        except Exception as e:
            logger.error(f"Error processing Word document: {e}")
            raise
    
    async def get_metadata(self, file_content: bytes, file_path: str) -> Dict[str, Any]:
        """
        Extract metadata from Word document.
        
        Args:
            file_content: Raw Word document file content bytes
            file_path: Path to the Word document file
            
        Returns:
            Dict[str, Any]: Extracted metadata
        """
        base_metadata = await super().get_metadata(file_content, file_path)
        
        try:
            # Write content to a temporary file because python-docx requires a file path
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
                temp_file.write(file_content)
                temp_file.flush()
                temp_path = temp_file.name
            
            # Process the Word document
            doc = docx.Document(temp_path)
            
            # Extract document properties
            core_properties = doc.core_properties
            
            metadata = {
                'title': core_properties.title,
                'author': core_properties.author,
                'subject': core_properties.subject,
                'keywords': core_properties.keywords,
                'created': core_properties.created.isoformat() if core_properties.created else None,
                'modified': core_properties.modified.isoformat() if core_properties.modified else None,
                'last_modified_by': core_properties.last_modified_by,
                'paragraph_count': len(doc.paragraphs),
                'table_count': len(doc.tables),
            }
            
            # Remove empty metadata fields
            metadata = {k: v for k, v in metadata.items() if v}
            
            # Add to base metadata
            base_metadata.update(metadata)
            
            # Clean up the temporary file
            os.unlink(temp_path)
            
            return base_metadata
        except Exception as e:
            logger.error(f"Error extracting Word document metadata: {e}")
            return base_metadata
    
    async def _extract_images_from_doc(self, file_content: bytes) -> List[Image.Image]:
        """
        Extract images from a Word document.
        
        Args:
            file_content: Raw Word document file content bytes
            
        Returns:
            List[Image.Image]: List of extracted images as PIL Image objects
        """
        images = []
        
        try:
            # Write content to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
                temp_file.write(file_content)
                temp_file.flush()
                temp_path = temp_file.name
            
            # Use zipfile to extract media from docx (which is a zip file)
            import zipfile
            
            with zipfile.ZipFile(temp_path) as doc_zip:
                # Find all image files in the zip
                image_files = [f for f in doc_zip.namelist() if f.startswith('word/media/')]
                
                for image_path in image_files:
                    try:
                        image_data = doc_zip.read(image_path)
                        img = Image.open(io.BytesIO(image_data))
                        # Only process images that are big enough to contain meaningful text
                        if img.width > 100 and img.height > 100:
                            images.append(img)
                    except Exception as e:
                        logger.error(f"Error extracting image {image_path} from Word document: {e}")
            
            # Clean up
            os.unlink(temp_path)
            
            return images
        except Exception as e:
            logger.error(f"Error extracting images from Word document: {e}")
            return images 
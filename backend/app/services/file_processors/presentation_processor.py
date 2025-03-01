"""
Presentation processor module for extracting text from PowerPoint presentations.
"""
import io
import os
import tempfile
from typing import Dict, Any, List, Tuple

from PIL import Image
from pptx import Presentation

from app.core.logging import logger
from app.services.file_processors import FileProcessor


class PresentationProcessor(FileProcessor):
    """
    Base processor for presentation files.
    """
    
    async def process(self, file_content: bytes, file_path: str) -> str:
        """
        Process presentation content and extract text.
        
        Args:
            file_content: Raw presentation file content bytes
            file_path: Path to the presentation file
            
        Returns:
            str: Extracted text content
        """
        raise NotImplementedError("Subclasses must implement this method")
    
    async def get_metadata(self, file_content: bytes, file_path: str) -> Dict[str, Any]:
        """
        Extract metadata from presentation file.
        
        Args:
            file_content: Raw presentation file content bytes
            file_path: Path to the presentation file
            
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
            from app.core.config import settings
            
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


class PowerPointProcessor(PresentationProcessor):
    """
    Processor for PowerPoint files.
    Handles: application/vnd.openxmlformats-officedocument.presentationml.presentation
    """
    
    async def process(self, file_content: bytes, file_path: str) -> str:
        """
        Process PowerPoint content and extract text.
        
        Args:
            file_content: Raw PowerPoint file content bytes
            file_path: Path to the PowerPoint file
            
        Returns:
            str: Extracted text content
        """
        try:
            # Write content to a temporary file because python-pptx requires a file path
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pptx') as temp_file:
                temp_file.write(file_content)
                temp_file.flush()
                temp_path = temp_file.name
            
            # Load the presentation
            ppt = Presentation(temp_path)
            
            # Extract text from all slides
            full_text = []
            
            for slide_num, slide in enumerate(ppt.slides, start=1):
                slide_text = []
                slide_text.append(f"Slide {slide_num}")
                slide_text.append("=" * (len(f"Slide {slide_num}")))
                
                # Extract text from shapes
                for shape in slide.shapes:
                    if hasattr(shape, "text") and shape.text:
                        slide_text.append(shape.text)
                
                # Extract images for OCR
                image_list = await self._extract_images_from_slide(slide)
                for img in image_list:
                    img_text = await self._extract_text_from_image(img)
                    if img_text:
                        slide_text.append(f"Image text: {img_text}")
                
                # Create a text summary for this slide
                if len(slide_text) > 2:  # If we have more than just the header
                    full_text.append("\n".join(slide_text))
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            return "\n\n".join(full_text)
        except Exception as e:
            logger.error(f"Error processing PowerPoint file: {e}")
            raise
    
    async def get_metadata(self, file_content: bytes, file_path: str) -> Dict[str, Any]:
        """
        Extract metadata from PowerPoint file.
        
        Args:
            file_content: Raw PowerPoint file content bytes
            file_path: Path to the PowerPoint file
            
        Returns:
            Dict[str, Any]: Extracted metadata
        """
        base_metadata = await super().get_metadata(file_content, file_path)
        
        try:
            # Write content to a temporary file because python-pptx requires a file path
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pptx') as temp_file:
                temp_file.write(file_content)
                temp_file.flush()
                temp_path = temp_file.name
            
            # Load the presentation
            ppt = Presentation(temp_path)
            
            # Extract presentation metadata
            core_props = ppt.core_properties
            metadata = {
                'slide_count': len(ppt.slides),
                'title': core_props.title,
                'author': core_props.author,
                'subject': core_props.subject,
                'keywords': core_props.keywords,
                'created': core_props.created.isoformat() if core_props.created else None,
                'modified': core_props.modified.isoformat() if core_props.modified else None,
                'last_modified_by': core_props.last_modified_by,
            }
            
            # Count shapes by type
            shape_counts = {}
            for slide in ppt.slides:
                for shape in slide.shapes:
                    shape_type = shape.shape_type
                    shape_counts[shape_type] = shape_counts.get(shape_type, 0) + 1
            
            if shape_counts:
                metadata['shape_counts'] = shape_counts
            
            # Extract slide information
            slide_info = []
            for i, slide in enumerate(ppt.slides):
                text_length = 0
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        text_length += len(shape.text)
                
                slide_info.append({
                    'slide_number': i + 1,
                    'shape_count': len(slide.shapes),
                    'text_length': text_length,
                })
            
            if slide_info:
                metadata['slides'] = slide_info
            
            # Remove empty metadata fields
            metadata = {k: v for k, v in metadata.items() if v}
            
            # Add to base metadata
            base_metadata.update(metadata)
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            return base_metadata
        except Exception as e:
            logger.error(f"Error extracting PowerPoint metadata: {e}")
            return base_metadata
    
    async def _extract_images_from_slide(self, slide) -> List[Image.Image]:
        """
        Extract images from a PowerPoint slide.
        
        Args:
            slide: python-pptx slide object
            
        Returns:
            List[Image.Image]: List of extracted images as PIL Image objects
        """
        images = []
        
        for shape in slide.shapes:
            try:
                # Check if shape is a picture
                if hasattr(shape, 'image'):
                    try:
                        # Extract the image data
                        image_bytes = shape.image.blob
                        img = Image.open(io.BytesIO(image_bytes))
                        
                        # Only process images that are big enough to contain meaningful text
                        if img.width > 100 and img.height > 100:
                            images.append(img)
                    except Exception as e:
                        logger.error(f"Error extracting image from PowerPoint slide: {e}")
            except Exception as e:
                logger.error(f"Error processing shape in PowerPoint slide: {e}")
        
        return images 
"""
Text processor module for extracting text from plain text and markdown files.
"""
import os
from typing import Dict, Any

import markdown

from app.core.logging import logger
from app.services.file_processors import FileProcessor


class TextProcessor(FileProcessor):
    """
    Base processor for text files.
    """
    
    async def process(self, file_content: bytes, file_path: str) -> str:
        """
        Process text content.
        
        Args:
            file_content: Raw text file content bytes
            file_path: Path to the text file
            
        Returns:
            str: Extracted text content
        """
        try:
            # Decode bytes to string
            return file_content.decode('utf-8')
        except UnicodeDecodeError:
            # Try with a different encoding if utf-8 fails
            try:
                return file_content.decode('latin-1')
            except Exception as e:
                logger.error(f"Error decoding text file: {e}")
                raise
    
    async def get_metadata(self, file_content: bytes, file_path: str) -> Dict[str, Any]:
        """
        Extract metadata from text file.
        
        Args:
            file_content: Raw text file content bytes
            file_path: Path to the text file
            
        Returns:
            Dict[str, Any]: Extracted metadata
        """
        try:
            text = await self.process(file_content, file_path)
            
            # Basic text analysis for metadata
            line_count = len(text.splitlines())
            word_count = len(text.split())
            char_count = len(text)
            
            return {
                'line_count': line_count,
                'word_count': word_count,
                'char_count': char_count,
                'file_size': len(file_content),
                'file_extension': os.path.splitext(file_path)[1],
            }
        except Exception as e:
            logger.error(f"Error extracting text metadata: {e}")
            return {}


class PlainTextProcessor(TextProcessor):
    """
    Processor for plain text files.
    Handles: text/plain
    """
    pass


class MarkdownProcessor(TextProcessor):
    """
    Processor for Markdown files.
    Handles: text/markdown
    """
    
    async def process(self, file_content: bytes, file_path: str) -> str:
        """
        Process Markdown content and convert to plain text.
        
        Args:
            file_content: Raw Markdown file content bytes
            file_path: Path to the Markdown file
            
        Returns:
            str: Extracted text content
        """
        try:
            # Decode bytes to string
            md_text = file_content.decode('utf-8')
            
            # Convert markdown to HTML
            html = markdown.markdown(md_text)
            
            # Basic HTML to text conversion (could use BeautifulSoup for more complex docs)
            # Remove HTML tags
            import re
            text = re.sub(r'<[^>]+>', ' ', html)
            
            # Handle special HTML entities
            text = text.replace('&nbsp;', ' ')
            text = text.replace('&lt;', '<')
            text = text.replace('&gt;', '>')
            text = text.replace('&amp;', '&')
            text = text.replace('&quot;', '"')
            
            # Normalize whitespace
            text = ' '.join(text.split())
            
            return text
        except Exception as e:
            logger.error(f"Error processing markdown file: {e}")
            # Fallback to base text processor if markdown processing fails
            return await super().process(file_content, file_path)
    
    async def get_metadata(self, file_content: bytes, file_path: str) -> Dict[str, Any]:
        """
        Extract metadata from Markdown file.
        
        Args:
            file_content: Raw Markdown file content bytes
            file_path: Path to the Markdown file
            
        Returns:
            Dict[str, Any]: Extracted metadata
        """
        base_metadata = await super().get_metadata(file_content, file_path)
        
        try:
            # Decode bytes to string
            md_text = file_content.decode('utf-8')
            
            # Try to extract front matter if present (YAML between --- lines)
            import re
            front_matter_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', md_text, re.DOTALL)
            
            if front_matter_match:
                try:
                    import yaml
                    front_matter = yaml.safe_load(front_matter_match.group(1))
                    if isinstance(front_matter, dict):
                        base_metadata['front_matter'] = front_matter
                except Exception:
                    pass
            
            # Count headings by level
            heading_counts = {}
            for i in range(1, 7):
                pattern = r'^#{' + str(i) + r'}\s+.+$'
                headings = re.findall(pattern, md_text, re.MULTILINE)
                if headings:
                    heading_counts[f'h{i}_count'] = len(headings)
            
            if heading_counts:
                base_metadata['heading_counts'] = heading_counts
            
            return base_metadata
        except Exception as e:
            logger.error(f"Error extracting markdown metadata: {e}")
            return base_metadata 
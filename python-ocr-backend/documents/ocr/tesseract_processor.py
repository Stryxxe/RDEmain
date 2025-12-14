"""
Tesseract OCR Processor - Extract text from PDFs and images using Tesseract
"""

import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image, ImageEnhance, ImageFilter
from io import BytesIO
import logging
import os

logger = logging.getLogger(__name__)


class TesseractOCRProcessor:
    """OCR processor using Tesseract"""
    
    def __init__(self):
        # Set Tesseract path from environment variable
        tesseract_path = os.getenv('TESSERACT_PATH', '/usr/bin/tesseract')
        if os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
            logger.info(f"✓ Tesseract OCR initialized: {tesseract_path}")
        else:
            logger.warning(f"⚠ Tesseract path not found: {tesseract_path}")
    
    def process(self, file_bytes, content_type):
        """
        Extract text from PDF or image using Tesseract
        
        Args:
            file_bytes: File content as bytes
            content_type: MIME type (application/pdf, image/jpeg, etc.)
            
        Returns:
            str: Extracted text
        """
        try:
            if 'pdf' in content_type.lower():
                return self._process_pdf(file_bytes)
            else:
                return self._process_image(file_bytes)
                
        except Exception as e:
            logger.error(f"Tesseract OCR failed: {e}")
            raise
    
    def _process_pdf(self, pdf_bytes):
        """Convert PDF to images and extract text"""
        logger.info("Converting PDF to images...")
        
        try:
            # Convert PDF to images (300 DPI for better quality)
            images = convert_from_bytes(
                pdf_bytes,
                dpi=300,
                fmt='jpeg',
                thread_count=2  # Use 2 threads for faster processing
            )
            
            logger.info(f"PDF converted to {len(images)} pages")
            
            # Extract text from each page
            all_text = []
            for i, image in enumerate(images, 1):
                logger.info(f"Processing page {i}/{len(images)}")
                
                # Preprocess image for better OCR
                processed_image = self._preprocess_image(image)
                
                # Run Tesseract OCR
                # PSM 6: Assume a single uniform block of text
                # OEM 3: Default, based on what is available
                text = pytesseract.image_to_string(
                    processed_image,
                    lang='eng',
                    config='--psm 6 --oem 3'
                )
                
                all_text.append(text)
                logger.info(f"Page {i} extracted: {len(text)} characters")
            
            full_text = '\n\n'.join(all_text)
            logger.info(f"Total extracted: {len(full_text)} characters from {len(images)} pages")
            
            return full_text
            
        except Exception as e:
            logger.exception(f"PDF processing failed: {e}")
            raise Exception(f"Failed to process PDF: {str(e)}")
    
    def _process_image(self, image_bytes):
        """Process image file"""
        try:
            image = Image.open(BytesIO(image_bytes))
            logger.info(f"Processing image: {image.size} pixels, {image.mode} mode")
            
            processed_image = self._preprocess_image(image)
            
            text = pytesseract.image_to_string(
                processed_image,
                lang='eng',
                config='--psm 6 --oem 3'
            )
            
            logger.info(f"Image extracted: {len(text)} characters")
            return text
            
        except Exception as e:
            logger.exception(f"Image processing failed: {e}")
            raise Exception(f"Failed to process image: {str(e)}")
    
    def _preprocess_image(self, image):
        """
        Preprocess image for better OCR accuracy
        
        Applies:
        - Grayscale conversion
        - Contrast enhancement
        - Sharpening
        - Upscaling (if image is small)
        """
        try:
            original_size = image.size
            
            # Convert to grayscale
            if image.mode != 'L':
                image = image.convert('L')
                logger.debug("Converted to grayscale")
            
            # Increase contrast
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(2.0)
            logger.debug("Enhanced contrast")
            
            # Sharpen
            image = image.filter(ImageFilter.SHARPEN)
            logger.debug("Applied sharpening")
            
            # Upscale if image is too small
            width, height = image.size
            if width < 1000 or height < 1000:
                scale = 2.0
                new_size = (int(width * scale), int(height * scale))
                image = image.resize(new_size, Image.LANCZOS)
                logger.debug(f"Upscaled from {original_size} to {new_size}")
            
            return image
            
        except Exception as e:
            logger.warning(f"Image preprocessing failed: {e}, using original")
            return image
    
    def get_status(self):
        """Get processor status and version info"""
        try:
            version = pytesseract.get_tesseract_version()
            return {
                'engine': 'Tesseract',
                'version': str(version),
                'available': True,
                'path': pytesseract.pytesseract.tesseract_cmd
            }
        except Exception as e:
            return {
                'engine': 'Tesseract',
                'available': False,
                'error': str(e),
                'path': pytesseract.pytesseract.tesseract_cmd
            }

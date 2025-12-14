"""
Django REST API Views for OCR Document Processing
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import logging

from .services.proposal_extraction_service import ProposalExtractionService

logger = logging.getLogger(__name__)

# Initialize service (singleton)
proposal_service = ProposalExtractionService()


@api_view(['POST'])
def process_document(request):
    """
    API endpoint to process uploaded proposal with OCR
    
    POST /api/process
    
    Request:
        - file: PDF or image file
        - type: Document type (e.g., 'research_proposal')
    
    Response:
        - Extracted fields as JSON
    """
    logger.info("=== OCR Processing Request Received ===")
    
    # Validate file presence
    if 'file' not in request.FILES:
        logger.error("No file provided in request")
        return Response(
            {'error': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    process_type = request.data.get('type', 'research_proposal')
    
    # Validate file
    if not file.name:
        logger.error("Invalid file (no name)")
        return Response(
            {'error': 'Invalid file'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    logger.info(f"File: {file.name}, Type: {process_type}, Size: {file.size} bytes")
    
    try:
        # Process document with OCR
        result = proposal_service.process_and_save_document(file, process_type)
        
        # Check for errors
        if 'error' in result:
            logger.error(f"Processing error: {result['error']}")
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Extract data from result
        if 'processed_result' in result and 'data' in result['processed_result']:
            response_data = result['processed_result']['data']
            logger.info(f"✓ Processing successful, confidence: {response_data.get('confidence_score', 0)}%")
            return Response(response_data, status=status.HTTP_200_OK)
        
        # Unexpected format
        logger.error("Unexpected response format from processor")
        return Response(
            {'error': 'Unexpected response format'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    except Exception as e:
        logger.exception(f"Unexpected error processing document: {e}")
        return Response(
            {'error': f'Processing failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def ocr_status(request):
    """
    Check OCR service status and capabilities
    
    GET /api/ocr-status
    
    Response:
        - Tesseract version
        - Service availability
        - Configuration info
    """
    logger.info("OCR status check requested")
    
    try:
        from documents.ocr.tesseract_processor import TesseractOCRProcessor
        
        processor = TesseractOCRProcessor()
        status_info = processor.get_status()
        
        return Response({
            'status': 'success',
            'service': 'Python OCR Backend',
            'ocr_processor': status_info,
            'supported_formats': ['PDF', 'JPG', 'JPEG', 'PNG'],
            'max_file_size': '10MB'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.exception(f"Error getting OCR status: {e}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def health_check(request):
    """
    Simple health check endpoint
    
    GET /api/health
    """
    return Response({
        'status': 'healthy',
        'service': 'Python OCR Backend',
        'message': 'Service is running'
    }, status=status.HTTP_200_OK)

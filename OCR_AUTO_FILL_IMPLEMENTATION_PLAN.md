# Research Proposal Auto-Scanning & Auto-Fill Implementation Plan

## 📋 Project Overview

**Goal**: Implement automatic extraction and form-filling of research proposal information from uploaded PDF documents for **Proponent role only**.

**Architecture**: **Dual Backend System** (Following `.qodo/eams-*` Implementation)
- **Laravel Backend**: Main application (frontend + business logic)
- **Python Backend**: OCR microservice (Django REST API)
- **Communication**: Laravel calls Python via HTTP (GuzzleHTTP)

**Technology Stack**:

**Laravel Backend (Main App)**:
- **Framework**: Laravel 12 (PHP 8.2+)
- **Frontend**: React + Inertia.js
- **HTTP Client**: GuzzleHTTP (for Python API calls)
- **Pattern Enhancement**: PHP regex for name matching & data cleanup

**Python Backend (OCR Microservice)**:
- **Framework**: Django + Django REST Framework
- **OCR Engine**: Tesseract OCR 5.0+
- **PDF Processing**: pdf2image, Pillow
- **OCR Integration**: pytesseract
- **Field Extraction**: Python regex + custom parsers

**Target User**: **Proponent** (the only role that fills out the proposal form)

**Key Features**:
1. Upload PDF research proposal (Proponent only)
2. Laravel sends file to Python OCR API
3. Python extracts text using Tesseract OCR
4. Python parses and identifies key fields
5. Laravel receives structured data
6. Laravel enhances data (name matching, validation)
7. Auto-fill proposal submission form
8. Allow manual review/editing before submission

**Why Python Backend for OCR?**
- ✅ Better OCR libraries (pytesseract, pdf2image)
- ✅ Proven architecture (already working in `.qodo/eams-*`)
- ✅ Easier to add AI/ML features later (PaddleOCR, spaCy, etc.)
- ✅ Separation of concerns (Laravel = app logic, Python = OCR processing)
- ✅ Can scale OCR service independently
- ✅ Reference implementation available to copy from

**Note**: CM, RDD, and OP roles only review/endorse proposals - they don't need auto-fill functionality.

---

## 🎯 Implementation Phases

### **PHASE 1: Python OCR Backend Setup** 
**Duration**: 1-2 weeks  
**Priority**: Critical

#### 1.1 Create Python Django Project Structure

```bash
# Create Python backend directory
mkdir python-ocr-backend
cd python-ocr-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Django and dependencies
pip install django djangorestframework
pip install pytesseract pdf2image Pillow
pip install python-dotenv django-cors-headers

# Create Django project
django-admin startproject core .
python manage.py startapp documents
```

**Directory Structure**:
```
python-ocr-backend/
├── core/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── documents/
│   ├── views.py
│   ├── urls.py
│   ├── services/
│   │   └── proposal_extraction_service.py
│   └── ocr/
│       ├── ocr_factory.py
│       └── tesseract_processor.py
├── manage.py
├── requirements.txt
└── .env
```

#### 1.2 Install Tesseract OCR

```bash
# Windows
choco install tesseract

# Linux (Ubuntu/Debian)
sudo apt-get install tesseract-ocr

# Mac
brew install tesseract

# Verify installation
tesseract --version
```

#### 1.3 Install Python Dependencies

**File**: `requirements.txt`
```txt
Django==4.2
djangorestframework==3.14
python-dotenv==1.0.0
django-cors-headers==4.3.0
pytesseract==0.3.10
pdf2image==1.16.3
Pillow==10.1.0
```

```bash
pip install -r requirements.txt
```

#### 1.4 Create Tesseract OCR Processor (Python)

**File**: `documents/ocr/tesseract_processor.py`

```python
import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image, ImageEnhance, ImageFilter
import logging
import os

logger = logging.getLogger(__name__)

class TesseractOCRProcessor:
    """OCR processor using Tesseract"""
    
    def __init__(self):
        # Set Tesseract path (configure in settings)
        tesseract_path = os.getenv('TESSERACT_PATH', '/usr/bin/tesseract')
        if os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
        
        logger.info("✓ Tesseract OCR processor initialized")
    
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
        
        # Convert PDF to images (300 DPI for better quality)
        images = convert_from_bytes(
            pdf_bytes,
            dpi=300,
            fmt='jpeg'
        )
        
        logger.info(f"PDF converted to {len(images)} pages")
        
        # Extract text from each page
        all_text = []
        for i, image in enumerate(images, 1):
            logger.info(f"Processing page {i}/{len(images)}")
            
            # Preprocess image for better OCR
            processed_image = self._preprocess_image(image)
            
            # Run Tesseract OCR
            text = pytesseract.image_to_string(
                processed_image,
                lang='eng',
                config='--psm 6 --oem 3'  # PSM 6: uniform block, OEM 3: default
            )
            
            all_text.append(text)
        
        full_text = '\n\n'.join(all_text)
        logger.info(f"Extracted {len(full_text)} characters")
        
        return full_text
    
    def _process_image(self, image_bytes):
        """Process image file"""
        image = Image.open(BytesIO(image_bytes))
        processed_image = self._preprocess_image(image)
        
        text = pytesseract.image_to_string(
            processed_image,
            lang='eng',
            config='--psm 6 --oem 3'
        )
        
        return text
    
    def _preprocess_image(self, image):
        """
        Preprocess image for better OCR accuracy
        """
        try:
            # Convert to grayscale
            if image.mode != 'L':
                image = image.convert('L')
            
            # Increase contrast
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(2.0)
            
            # Sharpen
            image = image.filter(ImageFilter.SHARPEN)
            
            # Optional: Resize if too small
            width, height = image.size
            if width < 1000 or height < 1000:
                scale = 2.0
                new_size = (int(width * scale), int(height * scale))
                image = image.resize(new_size, Image.LANCZOS)
            
            return image
            
        except Exception as e:
            logger.warning(f"Image preprocessing failed: {e}, using original")
            return image
    
    def get_status(self):
        """Get processor status"""
        try:
            version = pytesseract.get_tesseract_version()
            return {
                'engine': 'Tesseract',
                'version': str(version),
                'available': True
            }
        except Exception as e:
            return {
                'engine': 'Tesseract',
                'available': False,
                'error': str(e)
            }
```

#### 1.5 Create Proposal Extraction Service (Python)

**File**: `documents/services/proposal_extraction_service.py`

```python
import logging
import re
from documents.ocr.tesseract_processor import TesseractOCRProcessor

logger = logging.getLogger(__name__)

class ProposalExtractionService:
    """Service to extract fields from research proposal PDFs"""
    
    def __init__(self):
        self.ocr_processor = TesseractOCRProcessor()
    
    def process_and_save_document(self, file, process_type):
        """
        Process uploaded proposal file and extract fields
        
        Args:
            file: Uploaded file object
            process_type: Document type (e.g., 'research_proposal')
            
        Returns:
            dict: Extracted data
        """
        try:
            logger.info(f"Processing {process_type}: {file.name}")
            
            # Read file bytes
            file_bytes = file.read()
            content_type = file.content_type
            
            # Extract text using OCR
            raw_text = self.ocr_processor.process(file_bytes, content_type)
            
            # Parse text to extract fields
            extracted_data = self.extract_fields(raw_text)
            
            return {
                'processed_result': {
                    'data': extracted_data,
                    'raw_text': raw_text
                }
            }
            
        except Exception as e:
            logger.exception(f"Extraction failed: {e}")
            return {
                'error': str(e)
            }
    
    def extract_fields(self, text):
        """
        Extract proposal fields from OCR text
        
        Returns:
            dict: Extracted fields
        """
        extracted = {}
        
        # Preprocess text
        text = self._preprocess_text(text)
        
        # Extract each field
        extracted['research_title'] = self._extract_research_title(text)
        extracted['description'] = self._extract_description(text)
        extracted['objectives'] = self._extract_objectives(text)
        extracted['research_center'] = self._extract_research_center(text)
        extracted['research_agenda'] = self._extract_research_agenda(text)
        extracted['sdgs'] = self._extract_sdgs(text)
        extracted['budget'] = self._extract_budget(text)
        extracted['proponents'] = self._extract_proponents(text)
        extracted['timeline'] = self._extract_timeline(text)
        extracted['confidence_score'] = self._calculate_confidence(extracted)
        
        logger.info(f"Extracted {len([v for v in extracted.values() if v])} fields")
        
        return extracted
    
    def _preprocess_text(self, text):
        """Clean and normalize OCR text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Normalize line breaks
        text = re.sub(r'\n\s*\n', '\n', text)
        # Fix common OCR errors
        text = text.replace(''', "'").replace(''', "'")
        text = text.replace('"', '"').replace('"', '"')
        return text.strip()
    
    def _extract_research_title(self, text):
        """Extract research title"""
        patterns = [
            r'(?:TITLE|RESEARCH\s+TITLE|PROJECT\s+TITLE)\s*[:]\s*(.+?)(?=\n[A-Z]|\n\s*$)',
            r'(?:TITLE|RESEARCH\s+TITLE)\s*\n\s*(.+?)(?=\n[A-Z]|\n\s*$)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                title = match.group(1).strip()
                if 10 < len(title) < 300:
                    return title
        return None
    
    def _extract_description(self, text):
        """Extract description/background"""
        patterns = [
            r'(?:BACKGROUND|DESCRIPTION|RATIONALE)\s*[:]\s*(.+?)(?=\n[A-Z]{3,}|OBJECTIVE)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                desc = match.group(1).strip()
                if len(desc) > 50:
                    return desc
        return None
    
    def _extract_objectives(self, text):
        """Extract objectives"""
        patterns = [
            r'(?:OBJECTIVE|OBJECTIVES|GOALS)\s*[:]\s*(.+?)(?=\n[A-Z]{3,}|METHODOLOGY)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                objectives = match.group(1).strip()
                if len(objectives) > 20:
                    return objectives
        return None
    
    def _extract_research_center(self, text):
        """Extract research center"""
        centers = [
            'Center for Information and Communications Technology',
            'Center for Environmental Studies',
            # Add all research centers
        ]
        
        for center in centers:
            if center.lower() in text.lower():
                return center
        return None
    
    def _extract_research_agenda(self, text):
        """Extract research agendas"""
        agendas = [
            'Food Security',
            'Health and Nutrition',
            'Climate Change',
            # Add all agendas
        ]
        
        found = [agenda for agenda in agendas if agenda.lower() in text.lower()]
        return found
    
    def _extract_sdgs(self, text):
        """Extract SDG numbers"""
        matches = re.findall(r'SDG[^\d]*(\d{1,2})', text)
        sdgs = [int(num) for num in matches if 1 <= int(num) <= 17]
        return list(set(sdgs))
    
    def _extract_budget(self, text):
        """Extract budget amount"""
        patterns = [
            r'(?:BUDGET|TOTAL\s+BUDGET)\s*[:]\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{2})?)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                budget_str = match.group(1).replace(',', '')
                return float(budget_str)
        return None
    
    def _extract_proponents(self, text):
        """Extract proponent names"""
        pattern = r'(?:Dr\.|Prof\.|Mr\.|Ms\.)\s+([A-Z][a-z]+(?:\s+[A-Z]\.)?\s+[A-Z][a-z]+)'
        matches = re.findall(pattern, text)
        return list(set(matches))
    
    def _extract_timeline(self, text):
        """Extract timeline/duration"""
        patterns = [
            r'(?:DURATION|TIMELINE)\s*[:]\s*(.+?)(?=\n[A-Z]|\n\s*$)',
            r'(\d+)\s+(?:months?|years?)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None
    
    def _calculate_confidence(self, extracted):
        """Calculate confidence score based on filled fields"""
        total_fields = 9
        filled = sum(1 for v in extracted.values() if v and v != [])
        return round((filled / total_fields) * 100, 2)
```

#### 1.6 Create Django API Views

**File**: `documents/views.py`

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import logging

from .services.proposal_extraction_service import ProposalExtractionService

logger = logging.getLogger(__name__)

# Initialize service
proposal_service = ProposalExtractionService()

@api_view(['POST'])
def process_document(request):
    """
    API endpoint to process uploaded proposal with OCR
    POST /api/process
    """
    logger.info("Received OCR processing request")
    
    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    process_type = request.data.get('type', 'research_proposal')
    
    if not file.name:
        return Response(
            {'error': 'Invalid file'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Process document
        result = proposal_service.process_and_save_document(file, process_type)
        
        if 'error' in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Extract data from result
        if 'processed_result' in result and 'data' in result['processed_result']:
            response_data = result['processed_result']['data']
            return Response(response_data, status=status.HTTP_200_OK)
        
        return Response(
            {'error': 'Unexpected response format'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    except Exception as e:
        logger.exception(f"Error processing document: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def ocr_status(request):
    """
    Check OCR service status
    GET /api/ocr-status
    """
    try:
        from documents.ocr.tesseract_processor import TesseractOCRProcessor
        processor = TesseractOCRProcessor()
        status_info = processor.get_status()
        
        return Response({
            'status': 'success',
            'ocr_processor': status_info
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

**File**: `documents/urls.py`

```python
from django.urls import path
from . import views

urlpatterns = [
    path('process/', views.process_document, name='process_document'),
    path('ocr-status/', views.ocr_status, name='ocr_status'),
]
```

**File**: `core/urls.py`

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('documents.urls')),
]
```

#### 1.7 Configure Django Settings

**File**: `core/settings.py` (add these)

```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'corsheaders',
    'documents',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Add at top
    # ... other middleware
]

# CORS Settings - allow Laravel to call Python API
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8000",  # Laravel dev server
    "http://127.0.0.1:8000",
]

CORS_ALLOW_CREDENTIALS = True

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.JSONParser',
    ],
}

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
```

**File**: `.env`

```env
TESSERACT_PATH=/usr/bin/tesseract
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
```

#### 1.8 Run Python Backend

```bash
# Run migrations
python manage.py migrate

# Run server on port 8001 (Laravel uses 8000)
python manage.py runserver 8001
```

#### 1.9 Deliverables
- ✅ Python Django project created
- ✅ Tesseract OCR installed and configured
- ✅ OCR processor implemented
- ✅ Proposal extraction service created
- ✅ Django REST API endpoints working
- ✅ Python backend running on port 8001

**Testing**:
```bash
# Test OCR status
curl http://localhost:8001/api/ocr-status

# Test document processing (with a PDF file)
curl -X POST http://localhost:8001/api/process \
  -F "file=@proposal.pdf" \
  -F "type=research_proposal"
```

---

### **PHASE 2: Laravel Integration with Python Backend**
**Duration**: 1 week  
**Priority**: Critical

#### 2.1 Install Laravel HTTP Client

```bash
# GuzzleHTTP is already included in Laravel
# Just need to configure the Python backend URL
```

#### 2.2 Create Laravel OCR Service (HTTP Client)

**File**: `app/Services/OCRService.php`

```php
<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Psr7\Utils;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class OCRService
{
    protected $client;
    protected $pythonBackendUrl;

    public function __construct()
    {
        $this->pythonBackendUrl = config('services.python_ocr.url', 'http://localhost:8001/api');
        
        $this->client = new Client([
            'base_uri' => $this->pythonBackendUrl,
            'timeout' => 60, // 60 seconds for OCR processing
        ]);
    }

    /**
     * Extract fields from proposal PDF by calling Python OCR backend
     * 
     * @param string $pdfPath Full path to PDF file
     * @param string $originalName Original filename
     * @return array Extracted fields
     */
    public function extractProposalFields(string $pdfPath, string $originalName): array
    {
        try {
            Log::info('Calling Python OCR backend', [
                'file' => $originalName,
                'backend_url' => $this->pythonBackendUrl
            ]);

            $response = $this->client->post('/process', [
                'multipart' => [
                    [
                        'name' => 'file',
                        'contents' => Utils::tryFopen($pdfPath, 'r'),
                        'filename' => $originalName,
                    ],
                    [
                        'name' => 'type',
                        'contents' => 'research_proposal',
                    ],
                ],
            ]);

            $responseData = json_decode($response->getBody()->getContents(), true);

            if (is_array($responseData) && !isset($responseData['error'])) {
                Log::info('OCR extraction successful', [
                    'fields_extracted' => count($responseData)
                ]);
                
                return [
                    'success' => true,
                    'data' => $responseData
                ];
            }

            throw new \Exception('Python backend returned error: ' . ($responseData['error'] ?? 'Unknown error'));

        } catch (ConnectException $e) {
            Log::error('Failed to connect to Python OCR backend', [
                'error' => $e->getMessage(),
                'url' => $this->pythonBackendUrl
            ]);
            
            return [
                'success' => false,
                'error' => 'Failed to connect to OCR service. Please ensure Python backend is running.'
            ];
            
        } catch (RequestException $e) {
            $statusCode = $e->getResponse() ? $e->getResponse()->getStatusCode() : 'N/A';
            $responseBody = $e->getResponse() ? $e->getResponse()->getBody()->getContents() : 'N/A';
            
            Log::error('Python OCR backend request failed', [
                'status_code' => $statusCode,
                'response' => $responseBody,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'error' => "OCR processing failed (HTTP {$statusCode}): " . $e->getMessage()
            ];
            
        } catch (\Exception $e) {
            Log::error('OCR extraction error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Check if Python OCR backend is available
     * 
     * @return bool
     */
    public function isBackendAvailable(): bool
    {
        try {
            $response = $this->client->get('/ocr-status', ['timeout' => 5]);
            return $response->getStatusCode() === 200;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get OCR backend status
     * 
     * @return array
     */
    public function getBackendStatus(): array
    {
        try {
            $response = $this->client->get('/ocr-status');
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
}
```

#### 2.3 Configure Laravel Services

**File**: `config/services.php` (add this)

```php
'python_ocr' => [
    'url' => env('PYTHON_OCR_URL', 'http://localhost:8001/api'),
],
```

**File**: `.env` (add this)

```env
PYTHON_OCR_URL=http://localhost:8001/api
```

#### 2.4 Deliverables
- ✅ Laravel HTTP client configured
- ✅ OCRService created to call Python backend
- ✅ Laravel can communicate with Python API
- ✅ Error handling implemented

**Testing**:
```bash
php artisan tinker
>>> $ocr = app(\App\Services\OCRService::class);
>>> $ocr->isBackendAvailable();
>>> $ocr->getBackendStatus();
```

---

### **PHASE 3: Field Parsing & Pattern Matching**
**Duration**: 2-3 weeks  
**Priority**: High

#### 2.1 Create Proposal Parser Service

**File**: `app/Services/ProposalParserService.php`
```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class ProposalParserService
{
    protected $patterns;

    public function __construct()
    {
        $this->patterns = config('ocr.extraction_patterns');
    }

    /**
     * Parse extracted OCR text and identify proposal fields
     */
    public function parseProposalText(string $text): array
    {
        $extracted = [];

        // Preprocess text
        $text = $this->preprocessText($text);

        // Extract each field
        $extracted['research_title'] = $this->extractResearchTitle($text);
        $extracted['description'] = $this->extractDescription($text);
        $extracted['objectives'] = $this->extractObjectives($text);
        $extracted['research_center'] = $this->extractResearchCenter($text);
        $extracted['research_agenda'] = $this->extractResearchAgenda($text);
        $extracted['dost_sps'] = $this->extractDOSTSPs($text);
        $extracted['sdgs'] = $this->extractSDGs($text);
        $extracted['budget'] = $this->extractBudget($text);
        $extracted['proponents'] = $this->extractProponents($text);
        $extracted['timeline'] = $this->extractTimeline($text);

        // Calculate confidence score
        $extracted['confidence_score'] = $this->calculateConfidence($extracted);

        return $extracted;
    }

    /**
     * Extract research title
     */
    protected function extractResearchTitle(string $text): ?string
    {
        $patterns = [
            '/(?:TITLE|RESEARCH\s+TITLE|PROJECT\s+TITLE)\s*[:]\s*(.+?)(?=\n[A-Z]|\n\s*$)/is',
            '/(?:TITLE|RESEARCH\s+TITLE)\s*\n\s*(.+?)(?=\n[A-Z]|\n\s*$)/is',
            '/^(.{10,150})\n/m', // First substantial line
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $title = trim($matches[1]);
                if (strlen($title) > 10 && strlen($title) < 300) {
                    return $this->cleanText($title);
                }
            }
        }

        return null;
    }

    /**
     * Extract description/background
     */
    protected function extractDescription(string $text): ?string
    {
        $patterns = [
            '/(?:BACKGROUND|DESCRIPTION|RATIONALE|INTRODUCTION)\s*[:]\s*(.+?)(?=\n[A-Z]{3,}|OBJECTIVE)/is',
            '/(?:BACKGROUND|DESCRIPTION)\s*\n\s*(.+?)(?=\n[A-Z]{3,}|OBJECTIVE)/is',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $desc = trim($matches[1]);
                if (strlen($desc) > 50) {
                    return $this->cleanText($desc);
                }
            }
        }

        return null;
    }

    /**
     * Extract objectives
     */
    protected function extractObjectives(string $text): ?string
    {
        $patterns = [
            '/(?:OBJECTIVE|OBJECTIVES|GOALS)\s*[:]\s*(.+?)(?=\n[A-Z]{3,}|METHODOLOGY|TIMELINE)/is',
            '/(?:OBJECTIVE|OBJECTIVES)\s*\n\s*(.+?)(?=\n[A-Z]{3,}|METHODOLOGY)/is',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $objectives = trim($matches[1]);
                if (strlen($objectives) > 20) {
                    return $this->cleanText($objectives);
                }
            }
        }

        return null;
    }

    /**
     * Extract research center
     */
    protected function extractResearchCenter(string $text): ?string
    {
        $centers = [
            'Center for Information and Communications Technology',
            'Center for Environmental Studies and Research',
            'Center for Indigenous Studies and Cultural Heritage',
            'Center for Renewable Energy and Sustainability',
            'Center for Health Informatics and Telemedicine',
            // Add all research centers
        ];

        foreach ($centers as $center) {
            if (stripos($text, $center) !== false) {
                return $center;
            }
        }

        return null;
    }

    /**
     * Extract RDE Research Agenda
     */
    protected function extractResearchAgenda(string $text): array
    {
        $agendas = [
            'Food Security',
            'Health and Nutrition',
            'Climate Change',
            'Disaster Risk Reduction',
            // Add all RDE agendas
        ];

        $found = [];
        foreach ($agendas as $agenda) {
            if (stripos($text, $agenda) !== false) {
                $found[] = $agenda;
            }
        }

        return $found;
    }

    /**
     * Extract DOST 6Ps
     */
    protected function extractDOSTSPs(string $text): array
    {
        $sps = [
            'Peace',
            'People',
            'Planet',
            'Prosperity',
            'Partnership',
            'Progress',
        ];

        $found = [];
        foreach ($sps as $sp) {
            if (stripos($text, $sp) !== false) {
                $found[] = $sp;
            }
        }

        return $found;
    }

    /**
     * Extract SDGs
     */
    protected function extractSDGs(string $text): array
    {
        $found = [];
        
        // Look for SDG numbers (1-17)
        if (preg_match_all('/SDG[^\d]*(\d{1,2})/', $text, $matches)) {
            foreach ($matches[1] as $num) {
                if ($num >= 1 && $num <= 17) {
                    $found[] = (int)$num;
                }
            }
        }

        return array_unique($found);
    }

    /**
     * Extract budget
     */
    protected function extractBudget(string $text): ?float
    {
        $patterns = [
            '/(?:BUDGET|TOTAL\s+BUDGET|PROPOSED\s+BUDGET)\s*[:]\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{2})?)/i',
            '/(?:PHP|₱)\s*([\d,]+(?:\.\d{2})?)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $budget = str_replace(',', '', $matches[1]);
                return (float)$budget;
            }
        }

        return null;
    }

    /**
     * Extract proponents/researchers
     */
    protected function extractProponents(string $text): array
    {
        $proponents = [];
        
        // Look for names with titles
        $pattern = '/(?:Dr\.|Prof\.|Mr\.|Ms\.)\s+([A-Z][a-z]+(?:\s+[A-Z]\.)?\s+[A-Z][a-z]+)/';
        
        if (preg_match_all($pattern, $text, $matches)) {
            $proponents = array_unique($matches[1]);
        }

        return $proponents;
    }

    /**
     * Extract timeline/duration
     */
    protected function extractTimeline(string $text): ?string
    {
        $patterns = [
            '/(?:DURATION|TIMELINE|TIMEFRAME)\s*[:]\s*(.+?)(?=\n[A-Z]|\n\s*$)/is',
            '/(\d+)\s+(?:months?|years?)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return trim($matches[1]);
            }
        }

        return null;
    }

    /**
     * Preprocess OCR text
     */
    protected function preprocessText(string $text): string
    {
        // Remove excessive whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        
        // Normalize line breaks
        $text = preg_replace('/\n\s*\n/', "\n", $text);
        
        // Fix common OCR errors
        $text = str_replace([''', ''', '"', '"'], ["'", "'", '"', '"'], $text);
        
        return trim($text);
    }

    /**
     * Clean extracted text
     */
    protected function cleanText(string $text): string
    {
        $text = trim($text);
        $text = preg_replace('/\s+/', ' ', $text);
        return $text;
    }

    /**
     * Calculate confidence score
     */
    protected function calculateConfidence(array $extracted): float
    {
        $totalFields = 10;
        $filledFields = 0;

        foreach ($extracted as $key => $value) {
            if ($key === 'confidence_score') continue;
            
            if (!empty($value)) {
                $filledFields++;
            }
        }

        return round(($filledFields / $totalFields) * 100, 2);
    }
}
```

#### 2.2 Deliverables
- ✅ Field extraction patterns defined
- ✅ ProposalParserService implemented
- ✅ Pattern matching tested with sample proposals

---

### **PHASE 3: Backend API Development**
**Duration**: 1-2 weeks  
**Priority**: High

**Note**: All OCR processing happens in Laravel/PHP. No external API calls.

#### 3.1 Create OCR Controller

**File**: `app/Http/Controllers/OCRController.php`
```php
<?php

namespace App\Http\Controllers;

use App\Services\OCRService;
use App\Services\ProposalParserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class OCRController extends Controller
{
    protected $ocrService;
    protected $parserService;

    public function __construct(OCRService $ocrService, ProposalParserService $parserService)
    {
        $this->ocrService = $ocrService;
        $this->parserService = $parserService;
    }

    /**
     * Process uploaded proposal PDF and extract data
     */
    public function processProposal(Request $request)
    {
        $request->validate([
            'proposal_file' => 'required|file|mimes:pdf|max:10240', // 10MB max
        ]);

        try {
            $file = $request->file('proposal_file');
            
            // Store temporarily
            $tempPath = $file->store('temp/proposals');
            $fullPath = Storage::path($tempPath);

            // Extract text using OCR
            Log::info('Starting OCR extraction for: ' . $file->getClientOriginalName());
            $ocrResult = $this->ocrService->extractTextFromPDF($fullPath);

            if (!$ocrResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'OCR extraction failed',
                    'error' => $ocrResult['error']
                ], 500);
            }

            // Parse extracted text
            Log::info('Parsing extracted text');
            $parsedData = $this->parserService->parseProposalText($ocrResult['full_text']);

            // Clean up temp file
            Storage::delete($tempPath);

            return response()->json([
                'success' => true,
                'message' => 'Proposal processed successfully',
                'data' => [
                    'extracted_fields' => $parsedData,
                    'raw_text' => $ocrResult['full_text'],
                    'total_pages' => $ocrResult['total_pages'],
                    'confidence' => $parsedData['confidence_score']
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Proposal OCR processing error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error processing proposal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test OCR functionality
     */
    public function testOCR(Request $request)
    {
        $request->validate([
            'test_file' => 'required|file|mimes:pdf,jpg,png|max:5120',
        ]);

        try {
            $file = $request->file('test_file');
            $tempPath = $file->store('temp/test');
            $fullPath = Storage::path($tempPath);

            $result = $this->ocrService->extractTextFromPDF($fullPath);
            
            Storage::delete($tempPath);

            return response()->json([
                'success' => true,
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
```

#### 3.2 Add API Routes

**File**: `routes/api.php`
```php
// OCR Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/ocr/process-proposal', [OCRController::class, 'processProposal']);
    Route::post('/ocr/test', [OCRController::class, 'testOCR']);
});
```

#### 3.3 Deliverables
- ✅ OCR API endpoints created
- ✅ File upload handling implemented
- ✅ Error handling and logging added

---

### **PHASE 4: Frontend Integration**
**Duration**: 2 weeks  
**Priority**: High

#### 4.1 Create OCR Service (Frontend)

**File**: `resources/js/services/ocrService.js`
```javascript
import axios from 'axios';

const createAxiosInstance = () => {
    return axios.create({
        baseURL: '/api',
        headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
        },
        withCredentials: true,
    });
};

export const processProposalOCR = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('proposal_file', file);

    try {
        const response = await createAxiosInstance().post('/ocr/process-proposal', formData, {
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (onProgress) {
                    onProgress(percentCompleted);
                }
            },
        });

        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const testOCR = async (file) => {
    const formData = new FormData();
    formData.append('test_file', file);

    try {
        const response = await createAxiosInstance().post('/ocr/test', formData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
```

#### 4.2 Create Auto-Fill Component

**File**: `resources/js/Components/ProposalAutoFill.jsx`
```javascript
import React, { useState } from 'react';
import { processProposalOCR } from '../services/ocrService';

export default function ProposalAutoFill({ onDataExtracted, onError }) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [extracting, setExtracting] = useState(false);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        
        if (!file) return;

        // Validate file type
        if (file.type !== 'application/pdf') {
            onError('Please upload a PDF file');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            onError('File size must be less than 10MB');
            return;
        }

        try {
            setUploading(true);
            setProgress(0);

            // Upload and process
            const result = await processProposalOCR(file, (percent) => {
                setProgress(percent);
            });

            if (result.success) {
                setExtracting(true);
                
                // Simulate processing delay
                setTimeout(() => {
                    onDataExtracted(result.data.extracted_fields);
                    setExtracting(false);
                    setUploading(false);
                }, 1000);
            } else {
                throw new Error(result.message || 'Processing failed');
            }

        } catch (error) {
            console.error('OCR Error:', error);
            onError(error.message || 'Failed to process proposal');
            setUploading(false);
            setExtracting(false);
        }
    };

    return (
        <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6">
            <div className="text-center">
                <svg
                    className="mx-auto h-12 w-12 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                </svg>
                
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Auto-Fill from PDF
                </h3>
                
                <p className="mt-1 text-sm text-gray-500">
                    Upload your research proposal PDF to automatically extract information
                </p>

                <div className="mt-4">
                    <label
                        htmlFor="proposal-upload"
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${
                            uploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {uploading ? (
                            <>
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                {extracting ? 'Extracting...' : `Uploading... ${progress}%`}
                            </>
                        ) : (
                            <>
                                <svg
                                    className="-ml-1 mr-2 h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                    />
                                </svg>
                                Upload PDF
                            </>
                        )}
                    </label>
                    
                    <input
                        id="proposal-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                </div>

                {uploading && (
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <p className="mt-2 text-xs text-gray-500">
                    PDF up to 10MB • Auto-fills: Title, Description, Objectives, Budget & more
                </p>
            </div>
        </div>
    );
}
```

#### 4.3 Integrate into Proponent Proposal Form

**File**: `resources/js/Pages/Proponent/SubmitProposal.jsx` (modified)

**Important**: This feature is ONLY for the Proponent role. CM, RDD, and OP don't fill out forms - they only review and endorse.

```javascript
import ProposalAutoFill from '../../Components/ProposalAutoFill';

// Add to component
const [autoFilledData, setAutoFilledData] = useState(null);
const [showAutoFill, setShowAutoFill] = useState(true);

const handleAutoFillData = (extractedData) => {
    // Map extracted data to form fields
    setFormData(prev => ({
        ...prev,
        researchTitle: extractedData.research_title || prev.researchTitle,
        description: extractedData.description || prev.description,
        objectives: extractedData.objectives || prev.objectives,
        researchCenter: extractedData.research_center || prev.researchCenter,
        researchAgenda: extractedData.research_agenda || prev.researchAgenda,
        dostSPs: extractedData.dost_sps || prev.dostSPs,
        sustainableDevelopmentGoals: extractedData.sdgs || prev.sustainableDevelopmentGoals,
        proposedBudget: extractedData.budget || prev.proposedBudget,
    }));

    setAutoFilledData(extractedData);
    setShowAutoFill(false);
    
    // Show success notification
    alert(`Successfully extracted data with ${extractedData.confidence_score}% confidence! Please review and edit as needed before submitting.`);
};

// Add to JSX (at the top of the form, before manual input fields)
{showAutoFill && (
    <div className="mb-6">
        <ProposalAutoFill
            onDataExtracted={handleAutoFillData}
            onError={(error) => alert(error)}
        />
        
        <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
                💡 Tip: Upload your proposal PDF to auto-fill the form, or fill manually below
            </p>
            <button
                type="button"
                onClick={() => setShowAutoFill(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
            >
                Skip auto-fill
            </button>
        </div>
    </div>
)}

{autoFilledData && (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                    Form auto-filled with {autoFilledData.confidence_score}% confidence
                </p>
                <p className="text-sm text-green-700 mt-1">
                    Please review all fields and make any necessary corrections before submitting.
                </p>
            </div>
        </div>
    </div>
)}
```

#### 4.4 Deliverables
- ✅ Frontend OCR service created
- ✅ Auto-fill component implemented
- ✅ Form integration completed

---

### **PHASE 5: Testing & Optimization**
**Duration**: 1-2 weeks  
**Priority**: Medium

#### 5.1 Testing Strategy

**Unit Tests**:
- Test OCR extraction accuracy
- Test pattern matching for each field
- Test API endpoints

**Integration Tests**:
- Test full workflow (upload → extract → parse → fill)
- Test error handling
- Test file size limits

**User Acceptance Testing**:
- Test with real proposal documents
- Gather feedback on accuracy
- Refine extraction patterns

#### 5.2 Optimization Tasks

1. **Improve OCR Accuracy**:
   - Add image preprocessing (grayscale, denoise, threshold)
   - Experiment with Tesseract PSM modes
   - Increase PDF rendering DPI for better quality

2. **Enhance Pattern Matching**:
   - Add more field patterns based on testing
   - Implement fuzzy matching for field labels
   - Add spell-check correction

3. **Performance Optimization**:
   - Cache OCR results temporarily
   - Process pages in parallel
   - Add progress indicators

4. **User Experience**:
   - Add preview of extracted data before filling
   - Allow manual corrections
   - Show confidence scores per field
   - Highlight auto-filled fields

#### 5.3 Deliverables
- ✅ Test suite created and passing
- ✅ OCR accuracy >= 80%
- ✅ Performance optimized

---

### **PHASE 6: Advanced Features (Future)**
**Duration**: 2-3 weeks  
**Priority**: Low

#### 6.1 Machine Learning Integration
- Train custom model for proposal structure
- Implement field classification ML model
- Add entity recognition (names, dates, amounts)

#### 6.2 Template Recognition
- Detect proposal template format
- Apply template-specific extraction rules
- Support multiple proposal formats

#### 6.3 Batch Processing
- Process multiple proposals at once
- Generate batch processing reports
- Export extracted data

#### 6.4 Advanced Validation
- Cross-validate extracted fields
- Check for missing required fields
- Suggest corrections

---

## 🛠️ Technical Requirements

### Server Requirements
```
- PHP >= 8.2
- Tesseract OCR >= 5.0
- Imagick or GD extension
- Memory >= 512MB (for large PDFs)
- Storage >= 5GB (for temp files)
```

### PHP Packages
```bash
composer require thiagoalessio/tesseract_ocr
composer require spatie/pdf-to-image
composer require intervention/image
```

### Frontend Packages
```bash
npm install axios
npm install react-dropzone (optional)
```

---

## 📊 Success Metrics

### Phase 1-3 (MVP)
- ✅ OCR extraction working for 90% of PDFs
- ✅ Field extraction accuracy >= 70%
- ✅ Processing time < 30 seconds per proposal
- ✅ User can review and edit before submission

### Phase 4-5 (Enhanced)
- ✅ Field extraction accuracy >= 85%
- ✅ Processing time < 20 seconds
- ✅ Auto-fill reduces form completion time by 60%

### Phase 6 (Advanced)
- ✅ Field extraction accuracy >= 95%
- ✅ Support for 10+ proposal templates
- ✅ ML-powered entity recognition

---

## 📝 Testing Checklist

### Unit Testing
- [ ] OCR extraction returns valid text
- [ ] Parser identifies all target fields
- [ ] Patterns match sample proposals
- [ ] Budget extraction handles various formats
- [ ] SDG/Agenda detection works correctly

### Integration Testing
- [ ] Upload → Extract → Parse → Fill workflow
- [ ] Error handling for invalid files
- [ ] File size limits enforced
- [ ] Temp file cleanup working
- [ ] API authentication working

### User Testing
- [ ] Test with 10+ real proposals
- [ ] Measure extraction accuracy
- [ ] Collect user feedback
- [ ] Identify common failure patterns
- [ ] Document edge cases

---

## 🔧 Configuration Files

### Tesseract Config
```bash
# ~/.tesseractrc or C:\Program Files\Tesseract-OCR\tessdata\configs\custom

# Page Segmentation Modes:
# 0 = Orientation and script detection (OSD) only
# 1 = Automatic page segmentation with OSD
# 3 = Fully automatic page segmentation (default)
# 6 = Assume a single uniform block of text
# 11 = Sparse text. Find as much text as possible

tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?'"()[]{}/-₱$%&*@#
```

---

## 📚 Resources & Documentation

### Tesseract OCR
- Documentation: https://tesseract-ocr.github.io/
- Training Data: https://github.com/tesseract-ocr/tessdata
- PHP Wrapper: https://github.com/thiagoalessio/tesseract-ocr-for-php

### Image Processing
- Intervention Image: http://image.intervention.io/
- Spatie PDF to Image: https://github.com/spatie/pdf-to-image

### Pattern Matching
- Regex101 (Testing): https://regex101.com/
- PHP Preg Functions: https://www.php.net/manual/en/ref.pcre.php

---

## 🚀 Deployment Notes

### Production Checklist
- [ ] Install Tesseract on production server
- [ ] Configure Tesseract path in `.env`
- [ ] Set appropriate memory limits
- [ ] Configure file upload limits
- [ ] Set up temp file cleanup cron job
- [ ] Add monitoring for OCR success rate
- [ ] Configure error logging

### Cron Jobs
```bash
# Clean up temp OCR files older than 1 hour
0 * * * * find /path/to/storage/app/temp/ocr -type f -mmin +60 -delete
```

---

## 📞 Support & Maintenance

### Common Issues

**Issue**: Low OCR accuracy
- **Solution**: Increase PDF DPI, preprocess images, check document quality

**Issue**: Slow processing
- **Solution**: Optimize image size, use parallel processing, increase server resources

**Issue**: Memory errors
- **Solution**: Increase PHP memory limit, process pages individually

**Issue**: Pattern not matching
- **Solution**: Review sample documents, refine regex patterns, add more variations

---

## Last Updated
December 14, 2025

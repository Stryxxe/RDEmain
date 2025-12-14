# OCR System Flow Documentation

## Overview
This document explains how the existing OCR auto-fill system works in the `.qodo/eams-*` project, showing the complete flow from frontend file upload to backend OCR processing and auto-fill.

---

## Architecture Components

### 1. **Frontend (Laravel + React + Inertia.js)**
   - Location: `.qodo/eams-*/frontend/`
   - Framework: Laravel with Inertia.js and React
   - Upload Pages: `resources/js/Pages/UploadsView/`

### 2. **Backend (Python + Django REST Framework)**
   - Location: `.qodo/eams-*/backend/`
   - Framework: Django REST API
   - OCR Engine: PaddleOCR (AI-based) with Tesseract fallback

---

## Complete Flow

### **Step 1: User Uploads File (Frontend)**

**File:** `frontend/resources/js/Pages/UploadsView/ActivityReportView.jsx` (or ActivityDesignView, TravelOrderView, etc.)

```jsx
// User selects file through file input
<input 
    type="file" 
    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
    onChange={handleFileChange}
/>
```

---

### **Step 2: Form Submission with File (Frontend)**

**Route:** `POST /activity-reports/process` (or `/activity-designs/process`, etc.)

The frontend sends a `multipart/form-data` request to Laravel:

```javascript
// Inertia.js form submission
Inertia.post(route('activity-reports.process'), {
    file: selectedFile,
    existing_folder_id: folderId || null,
    create_new_folder: willCreateNewFolder,
    new_folder_name: newFolderName
});
```

**Route Definition:**
```php
// frontend/routes/web.php
Route::post('/process', [ActivityReportController::class, 'processDocument'])
    ->name('process');
```

---

### **Step 3: Laravel Controller Receives File (Laravel Backend)**

**File:** `frontend/app/Http/Controllers/ActivityReport/ActivityReportController.php`

The controller uses the `DocumentProcessTrait`:

```php
// Uses trait method
public function processDocument(Request $request): \Inertia\Response
{
    // Defined in DocumentProcessTrait
}
```

---

### **Step 4: File Validation & Temporary Storage (Laravel)**

**File:** `frontend/app/Traits/DocumentProcessTrait.php`

```php
public function processDocument(Request $request): \Inertia\Response
{
    // 1. Validate file
    $validated = $request->validate([
        'file' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        'existing_folder_id' => 'nullable|integer|exists:folders,folderID',
        'create_new_folder' => 'nullable|boolean',
        'new_folder_name' => 'nullable|string|max:255',
    ]);

    $file = $validated['file'];
    $originalName = $file->getClientOriginalName();
    
    // 2. Generate UUID filename
    $filename = Str::uuid() . '.' . $extension;
    
    // 3. Store to temporary location (storage/app/public/temp_uploads/)
    $tempPath = $this->documentStorage->storeTempFile($file, $filename);
}
```

---

### **Step 5: Python Backend API Call (Laravel → Python)**

**File:** `frontend/app/Traits/DocumentProcessTrait.php`

Laravel sends the file to Python backend for OCR processing:

```php
protected function extractDocumentData(string $tempPath, string $originalName, string $docType): array
{
    try {
        $client = new Client(); // GuzzleHTTP
        $pythonBackendUrl = env('PYTHON_BACKEND_URL'); // http://localhost:8001/api/process
        
        // Send multipart form data to Python backend
        $response = $client->post($pythonBackendUrl, [
            'multipart' => [
                [
                    'name' => 'file',
                    'contents' => Utils::tryFopen($disk->path($tempPath), 'r'),
                    'filename' => $originalName,
                ],
                [
                    'name' => 'type',
                    'contents' => $docType, // e.g., 'extension_activity_report'
                ],
            ],
        ]);
        
        // Parse JSON response
        $responseData = json_decode($response->getBody()->getContents(), true);
        
        return $responseData; // Extracted data from OCR
    }
}
```

**Environment Variable:**
```env
# .env
PYTHON_BACKEND_URL=http://localhost:8001/api/process
```

---

### **Step 6: Python Backend Receives Request (Django)**

**File:** `backend/documents/views.py`

```python
@api_view(['POST'])
def process_document(request):
    """
    API endpoint to process uploaded documents with OCR.
    POST /api/process
    """
    logger.info("Backend: /api/process endpoint received a request.")
    
    # 1. Validate file presence
    if 'file' not in request.FILES:
        return Response({'error': 'No file part'}, status=status.HTTP_400_BAD_REQUEST)
    
    file = request.FILES['file']
    process_type = request.data.get('type', 'general')  # Document type
    
    # 2. Route to appropriate service based on document type
    if process_type == 'extension_activity_design':
        full_service_response = activity_design_service.process_and_save_document(
            file, process_type
        )
    elif process_type == 'extension_activity_report':
        full_service_response = activity_report_service.process_and_save_document(
            file, process_type
        )
    elif process_type == 'travel_order':
        full_service_response = travel_order_service.process_and_save_document(
            file, process_type
        )
    elif process_type.startswith('special_order_'):
        full_service_response = special_order_service.process_and_save_document(
            file, process_type
        )
    
    # 3. Extract and return the data
    if 'processed_result' in full_service_response and 'data' in full_service_response['processed_result']:
        response_data = full_service_response['processed_result']['data']
        return Response(response_data, status=status.HTTP_200_OK)
```

**URL Route:**
```python
# backend/documents/urls.py
urlpatterns = [
    path('process/', views.process_document, name='process_document'),
    path('ocr-status/', views.ocr_status, name='ocr_status'),
]
```

---

### **Step 7: OCR Processing (Python)**

**File:** `backend/documents/ocr/ocr_factory.py`

The factory selects the appropriate OCR processor:

```python
class OCRFactory:
    """Factory class for creating OCR processor instances."""
    
    @classmethod
    def get_processor(cls, processor_type: str = 'auto'):
        """
        Get an OCR processor instance.
        
        processor_type options:
        - 'auto': Automatically select best available (default)
        - 'paddle': PaddleOCR processor (AI-based, more accurate)
        - 'tesseract': Tesseract OCR processor (classic, faster)
        - 'hybrid': Hybrid processor with fallback
        """
        env_type = os.getenv('OCR_PROCESSOR_TYPE', processor_type).lower()
        
        if env_type == 'paddle' or env_type == 'paddleocr':
            return cls.get_paddle_processor()
        elif env_type == 'tesseract' or env_type == 'classic':
            return cls.get_tesseract_processor()
        elif env_type == 'hybrid' or env_type == 'auto':
            return cls.get_hybrid_processor()
```

**OCR Processors:**
1. **PaddleOCR** (`paddleocr_processor.py`) - AI-based, high accuracy
2. **Tesseract** (`tesseract_processor.py`) - Classic OCR, faster
3. **Hybrid** - Tries PaddleOCR first, falls back to Tesseract

---

### **Step 8: Service Extracts Fields (Python)**

Each document type has a dedicated extraction service:

**File:** `backend/documents/services/activity_report_extraction_service.py`

```python
class ActivityReportExtractionService:
    def process_and_save_document(self, file, process_type):
        """
        Process uploaded file with OCR and extract fields.
        
        Returns:
            {
                'processed_result': {
                    'data': {
                        'extension_program': '...',
                        'extension_project': '...',
                        'extension_activity': '...',
                        'activity_leader': '...',
                        'venue': '...',
                        'date_conducted': '...',
                        'total_participants': 123,
                        'budgetary_requirement': 5000.00,
                        # ... more fields
                    }
                }
            }
        """
        # 1. Get OCR processor
        processor = OCRFactory.get_processor()
        
        # 2. Extract text from PDF/image
        raw_text = processor.process(file.read(), file.content_type)
        
        # 3. Parse text using field extraction logic
        extracted_data = self.extract_fields(raw_text)
        
        return {
            'processed_result': {
                'data': extracted_data
            }
        }
```

---

### **Step 9: Response Back to Laravel (Python → Laravel)**

Python returns JSON response:

```json
{
  "extension_program": "Community Extension Services",
  "extension_project": "Livelihood Training Program",
  "extension_activity": "Soap Making Workshop",
  "activity_leader": "Dr. Juan Dela Cruz",
  "venue": "Barangay Poblacion Hall",
  "date_conducted": "2025-03-15",
  "total_participants": 45,
  "budgetary_requirement": 15000.00,
  "actual_amount_used": 14500.00,
  "fund_source": "University Extension Fund"
}
```

---

### **Step 10: Laravel Enhances Data (Laravel)**

**File:** `frontend/app/Traits/DocumentProcessTrait.php`

Laravel enhances the extracted data with name matching:

```php
protected function enhanceExtractedNamesForPreview(array $extractedData): array
{
    // Clean OCR names and match with existing persons in database
    foreach ($nameFields as $field) {
        if (isset($extractedData[$field])) {
            $cleanName = $this->cleanNameFromOCR($rawName);
            $matches = $this->searchPersonsByName($cleanName);
            
            // Auto-match if similarity > 80%
            if ($similarity > 0.80) {
                $enhancedEntry['best_match'] = $bestMatch;
                $enhancedEntry['auto_matched'] = true;
            }
        }
    }
    
    return $extractedData;
}
```

This cleans OCR artifacts and matches names to existing database records.

---

### **Step 11: Render Preview with Auto-Filled Data (Laravel → React)**

**File:** `frontend/app/Traits/DocumentProcessTrait.php`

```php
public function processDocument(Request $request): \Inertia\Response
{
    // ... OCR processing ...
    
    // Prepare preview data
    $previewData = [
        'scannedData' => $extractedData,  // Auto-filled data from OCR
        'uploadedFilePath' => $fileStorageResult['publicUrl'],
        'internalStoragePath' => $fileStorageResult['internalPreviewPath'],
        'linkedFolderId' => $linkedFolderId,
        'docType' => $docType,
        'fileData' => [
            'name' => $originalName,
            'size' => $file->getSize(),
            'type' => $file->getMimeType(),
        ],
        'isPreviewStage' => true,
    ];
    
    // Store in session for page refresh support
    session(['activity_report_preview' => $previewData]);
    
    // Return to same page with data pre-filled
    return Inertia::render('UploadsView/ActivityReportView', $previewData);
}
```

---

### **Step 12: React Displays Auto-Filled Form (Frontend)**

**File:** `frontend/resources/js/Pages/UploadsView/ActivityReportView.jsx`

```jsx
export default function ActivityReportView({ scannedData, fileData, ... }) {
    // Initialize form with scannedData
    const [formData, setFormData] = useState({
        extension_program: scannedData?.extension_program || '',
        extension_project: scannedData?.extension_project || '',
        extension_activity: scannedData?.extension_activity || '',
        activity_leader: scannedData?.activity_leader || '',
        venue: scannedData?.venue || '',
        // ... all fields auto-filled from OCR
    });
    
    return (
        <form>
            <InputField
                label="Extension Program"
                value={formData.extension_program}
                onChange={(e) => setFormData({ ...formData, extension_program: e.target.value })}
            />
            {/* User can review and edit auto-filled data */}
        </form>
    );
}
```

---

## Summary: Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React + Inertia.js)                      │
│                                                                             │
│  1. User selects PDF/image file                                            │
│  2. Form submission: POST /activity-reports/process                        │
│     ├── file: uploaded_file.pdf                                            │
│     ├── existing_folder_id: 123                                            │
│     └── create_new_folder: false                                           │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LARAVEL BACKEND (PHP)                                 │
│                                                                             │
│  3. ActivityReportController receives request                              │
│  4. DocumentProcessTrait validates & stores to temp_uploads/               │
│  5. Calls Python backend via GuzzleHTTP:                                   │
│     POST http://localhost:8001/api/process                                 │
│     ├── multipart/form-data                                                │
│     ├── file: PDF content                                                  │
│     └── type: 'extension_activity_report'                                  │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PYTHON BACKEND (Django REST API)                         │
│                                                                             │
│  6. views.process_document() receives file                                 │
│  7. Routes to ActivityReportExtractionService                              │
│  8. OCRFactory.get_processor('auto')                                       │
│     ├── Tries PaddleOCR (AI-based, high accuracy)                         │
│     └── Falls back to Tesseract if needed                                 │
│  9. OCR extracts text from PDF                                             │
│ 10. Service parses text → structured data                                  │
│ 11. Returns JSON:                                                           │
│     {                                                                       │
│       "extension_program": "Community Extension",                          │
│       "extension_activity": "Soap Making",                                 │
│       "total_participants": 45,                                            │
│       ...                                                                   │
│     }                                                                       │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LARAVEL BACKEND (PHP)                                 │
│                                                                             │
│ 12. Receives JSON response from Python                                     │
│ 13. enhanceExtractedNamesForPreview():                                     │
│     ├── Cleans OCR names (removes artifacts)                               │
│     ├── Searches database for matching persons                             │
│     └── Auto-matches if similarity > 80%                                   │
│ 14. Stores preview data in session                                         │
│ 15. Returns Inertia response with scannedData                              │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                                   │
│                                                                             │
│ 16. ActivityReportView receives scannedData prop                           │
│ 17. Initializes form state with auto-filled values                         │
│ 18. User reviews/edits the data                                            │
│ 19. User submits to save (POST /activity-reports/save)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Technologies

### Frontend Stack
- **Laravel 12** - PHP framework
- **Inertia.js 2.0** - SPA adapter
- **React 18** - UI library
- **Tailwind CSS** - Styling
- **Vite** - Build tool

### Backend Stack (Python)
- **Django** - Web framework
- **Django REST Framework** - API framework
- **PaddleOCR** - AI-based OCR (primary)
- **Tesseract OCR** - Classic OCR (fallback)
- **pdf2image** - PDF to image conversion
- **Pillow** - Image processing

---

## Configuration Files

### Laravel .env
```env
# Python backend URL
PYTHON_BACKEND_URL=http://localhost:8001/api/process
```

### Python .env
```env
# OCR processor type: 'paddle', 'tesseract', 'hybrid', 'auto'
OCR_PROCESSOR_TYPE=hybrid

# Prefer PaddleOCR over Tesseract
PREFER_PADDLE_OCR=true
```

---

## Supported Document Types

1. **Extension Activity Design** (`extension_activity_design`)
2. **Extension Activity Report** (`extension_activity_report`)
3. **Travel Order** (`travel_order`)
4. **Special Orders** (`special_order_*`)
   - Student Support
   - Faculty/Staff
   - Individual

---

## Error Handling

### Laravel Side
```php
try {
    $extractedData = $this->extractDocumentData($tempPath, $originalName, $docType);
} catch (ConnectException $e) {
    return Inertia::render($this->getViewName(), [
        'errors' => ['general' => 'Failed to connect to document processing service']
    ]);
} catch (\Exception $e) {
    return Inertia::render($this->getViewName(), [
        'errors' => ['general' => $e->getMessage()]
    ]);
}
```

### Python Side
```python
if 'file' not in request.FILES:
    return Response({'error': 'No file part'}, status=400)

try:
    result = processor.process(file_bytes, content_type)
    return Response({'processed_result': {'data': result}})
except Exception as e:
    logger.exception(f"Error: {str(e)}")
    return Response({'error': str(e)}, status=500)
```

---

## Performance Optimizations

1. **Hybrid OCR Strategy**: Try fast PaddleOCR first, fallback to Tesseract
2. **Processor Caching**: OCR processors cached in factory (singleton pattern)
3. **Temporary File Management**: Files stored in temp_uploads/ during preview
4. **Session Storage**: Preview data stored in session for page refresh support
5. **Name Matching**: Database similarity search for auto-matching persons

---

## This is the Implementation to Follow!

When implementing OCR for the main Laravel project, replicate this exact architecture:
1. Keep Laravel frontend with React/Inertia
2. Use Python backend for OCR processing (PaddleOCR + Tesseract)
3. GuzzleHTTP for Laravel → Python communication
4. Session-based preview before saving
5. Name matching and enhancement logic
6. Factory pattern for OCR processor selection

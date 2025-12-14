# Python OCR Backend for Research Proposal Auto-Fill

OCR microservice for extracting structured data from research proposal PDFs using Tesseract OCR.

## 🚀 Quick Start

### 1. Install Tesseract OCR

**Windows:**
```bash
choco install tesseract
# Or download from: https://github.com/UB-Mannheim/tesseract/wiki
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

**Mac:**
```bash
brew install tesseract
```

Verify installation:
```bash
tesseract --version
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Copy `.env.example` to `.env` and update paths:

```env
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe  # Windows
# TESSERACT_PATH=/usr/bin/tesseract  # Linux
# TESSERACT_PATH=/usr/local/bin/tesseract  # Mac
```

### 5. Run Migrations

```bash
python manage.py migrate
```

### 6. Start Server

```bash
# Run on port 8001 (Laravel uses 8000)
python manage.py runserver 8001
```

Server will be available at: `http://localhost:8001`

## 📡 API Endpoints

### Health Check
```bash
GET http://localhost:8001/api/health
```

### OCR Status
```bash
GET http://localhost:8001/api/ocr-status
```

Response:
```json
{
  "status": "success",
  "service": "Python OCR Backend",
  "ocr_processor": {
    "engine": "Tesseract",
    "version": "5.x.x",
    "available": true,
    "path": "C:\\Program Files\\Tesseract-OCR\\tesseract.exe"
  },
  "supported_formats": ["PDF", "JPG", "JPEG", "PNG"],
  "max_file_size": "10MB"
}
```

### Process Document
```bash
POST http://localhost:8001/api/process
Content-Type: multipart/form-data

file: [PDF or image file]
type: research_proposal
```

Response:
```json
{
  "research_title": "Impact of Climate Change on...",
  "description": "This study aims to...",
  "objectives": "1. To assess... 2. To determine...",
  "research_center": "Center for Environmental Studies",
  "research_agenda": ["Climate Change", "Environmental Protection"],
  "sdgs": [13, 15],
  "budget": 250000.00,
  "proponents": ["Dr. Juan Dela Cruz", "Prof. Maria Santos"],
  "timeline": "12 months",
  "confidence_score": 88.89
}
```

## 🧪 Testing

### Test Health
```bash
curl http://localhost:8001/api/health
```

### Test OCR Status
```bash
curl http://localhost:8001/api/ocr-status
```

### Test with cURL (Windows PowerShell)
```powershell
$file = Get-Item "path\to\proposal.pdf"
$uri = "http://localhost:8001/api/process"
$form = @{
    file = $file
    type = "research_proposal"
}
Invoke-RestMethod -Uri $uri -Method Post -Form $form
```

### Test with Python
```python
import requests

url = "http://localhost:8001/api/process"
files = {'file': open('proposal.pdf', 'rb')}
data = {'type': 'research_proposal'}

response = requests.post(url, files=files, data=data)
print(response.json())
```

## 📁 Project Structure

```
python-ocr-backend/
├── core/                   # Django project settings
│   ├── settings.py        # Main configuration
│   ├── urls.py            # Root URL routing
│   └── wsgi.py            # WSGI application
│
├── documents/             # Main app for OCR processing
│   ├── views.py           # REST API endpoints
│   ├── urls.py            # App URL routing
│   │
│   ├── ocr/               # OCR processors
│   │   └── tesseract_processor.py  # Tesseract integration
│   │
│   └── services/          # Business logic
│       └── proposal_extraction_service.py  # Field extraction
│
├── manage.py              # Django management script
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables (.env)

```env
# Django
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Tesseract
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe

# CORS (Laravel frontend)
LARAVEL_URL=http://localhost:8000
```

### Supported File Formats
- PDF (`.pdf`)
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)

### File Size Limits
- Maximum: 10MB per file

## 🐛 Troubleshooting

### Tesseract not found
```
Error: TesseractNotFoundError
```
**Solution:** Install Tesseract and update `TESSERACT_PATH` in `.env`

### PDF processing fails
```
Error: poppler not found
```
**Solution (Windows):** 
```bash
# Download poppler: http://blog.alivate.com.au/poppler-windows/
# Extract and add bin/ to PATH
```

**Solution (Linux):**
```bash
sudo apt-get install poppler-utils
```

### Low OCR accuracy
- Ensure PDF has 300+ DPI resolution
- Check if PDF is scanned image (not text-based)
- Try preprocessing image for better contrast

### CORS errors from Laravel
- Check `LARAVEL_URL` in `.env`
- Verify Laravel dev server is running on port 8000
- Check Django CORS settings in `core/settings.py`

## 📊 Extracted Fields

The service extracts the following fields:

1. **research_title** - Research proposal title
2. **description** - Background/rationale
3. **objectives** - Research objectives
4. **research_center** - Associated research center
5. **research_agenda** - RDE research agendas (array)
6. **sdgs** - Sustainable Development Goals (array of numbers)
7. **budget** - Proposed budget (float)
8. **proponents** - Researcher names (array)
9. **timeline** - Project duration
10. **confidence_score** - Extraction accuracy (0-100%)

## 🔗 Integration with Laravel

Laravel backend calls this Python service via HTTP:

```php
// Laravel: app/Services/OCRService.php
$response = $client->post('http://localhost:8001/api/process', [
    'multipart' => [
        ['name' => 'file', 'contents' => fopen($pdfPath, 'r')],
        ['name' => 'type', 'contents' => 'research_proposal'],
    ],
]);

$extractedData = json_decode($response->getBody(), true);
```

## 📝 Development

### Run in Development Mode
```bash
python manage.py runserver 8001
```

### Run with Auto-Reload
```bash
python manage.py runserver 8001 --noreload
```

### View Logs
Logs are output to console with INFO level.

## 🚀 Production Deployment

### Using Gunicorn
```bash
pip install gunicorn
gunicorn core.wsgi:application --bind 0.0.0.0:8001 --workers 4
```

### Using Docker
```dockerfile
FROM python:3.11
RUN apt-get update && apt-get install -y tesseract-ocr poppler-utils
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8001"]
```

## 📜 License

MIT License - See main project for details

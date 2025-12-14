# Python OCR Backend Setup Guide

This guide explains how to set up the Python OCR backend and connect it to the Laravel application for the first time.

The high-level architecture is:
- Laravel app (main system) on port 8000
- Python OCR backend (Django + Tesseract) on port 8001
- Laravel calls the Python backend over HTTP for OCR and field extraction

---

## 1. Prerequisites

Before starting, make sure you have:

- **Operating System**: Windows
- **Python**: 3.10+ installed and available on your PATH
- **Git**: to clone or update the repository (optional but recommended)
- **Laravel/PHP**: The main app already installed and working

### 1.1 Install Tesseract OCR (Windows)

1. Download the Windows installer from the official project:
   - https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer and keep the default install path (recommended):
   - `C:\Program Files\Tesseract-OCR\`
3. After installation, verify from a new terminal:

```powershell
"C:\Program Files\Tesseract-OCR\tesseract.exe" --version
```

If this prints a version (e.g., `tesseract 5.5.0`), Tesseract is installed correctly.

---

## 2. Set Up the Python OCR Backend

The Python OCR backend lives in the `python-ocr-backend` folder at the root of this project.

### 2.1 Create and Activate a Virtual Environment

From the project root:

```powershell
cd python-ocr-backend
python -m venv venv

# Activate the virtual environment (PowerShell)
venv\Scripts\Activate.ps1
```

Your prompt should now show `(venv)` at the beginning.

### 2.2 Install Python Dependencies

With the virtual environment active and still inside `python-ocr-backend`:

```powershell
pip install -r requirements.txt
```

This installs Django, Django REST Framework, Tesseract bindings (`pytesseract`), PDF/image libraries, and CORS support.

### 2.3 Configure Environment Variables

Create or edit the `.env` file inside `python-ocr-backend`.

Minimal example for Windows:

```env
TESSERACT_PATH=C:\\Program Files\\Tesseract-OCR\\tesseract.exe
DJANGO_SECRET_KEY=change-me-to-a-long-random-string
DEBUG=True
```

Notes:
- `TESSERACT_PATH` **must** point to the actual `tesseract.exe` path on your machine.
- For production, set `DEBUG=False` and use a stronger, private `DJANGO_SECRET_KEY`.

### 2.4 Run Database Migrations

Still in `python-ocr-backend` with the virtual environment active:

```powershell
python manage.py migrate
```

This creates the default Django tables.

### 2.5 Start the Python OCR Server

Run the development server on port 8001:

```powershell
python manage.py runserver 8001
```

Keep this terminal window open while you use the system. The server should log incoming OCR requests.

### 2.6 Quick Health Checks

With the Python server running, open a browser or use `curl` to check:

- OCR status:
  - `http://127.0.0.1:8001/api/ocr-status/`
- Health (if configured):
  - `http://127.0.0.1:8001/api/health/`

You should see a JSON response indicating Tesseract is available and the service is healthy.

---

## 3. Connect Laravel to the Python Backend

The Laravel app calls the Python OCR backend via `App\Services\OCRService`.

### 3.1 Configure the Python OCR URL in Laravel

In the Laravel project root, edit the `.env` file and add (or update) this entry:

```env
PYTHON_OCR_URL=http://127.0.0.1:8001/api
```

Ensure `config/services.php` has the matching config (already included in this project):

```php
'python_ocr' => [
    'url' => env('PYTHON_OCR_URL', 'http://localhost:8001/api'),
],
```

If you change ports or hosts later (e.g., running the Python backend on another machine), update `PYTHON_OCR_URL` accordingly.

### 3.2 Start the Laravel Application

From the Laravel project root (not inside `python-ocr-backend`):

```powershell
php artisan serve --port=8000
```

Or use your existing web server (Apache/Nginx) configuration.

Make sure **both** of these are running when you want to use OCR auto-fill:
- Laravel app (port 8000 or your configured port)
- Python OCR backend (port 8001)

---

## 4. Verify End-to-End OCR Auto-Fill

Once both servers are running:

1. Log in to the Laravel app as a **Proponent**.
2. Navigate to the Submit Proposal page.
3. Upload a proposal PDF in the existing file upload area (e.g., the `Report` / `Proposal` file field).
4. Click the **“Extract Data from PDF (Auto-Fill)”** button.
5. If everything is configured correctly:
   - The system sends the file to the Python OCR backend.
   - Python extracts and parses fields (objectives, SDGs, budget, proponents, timeline, etc.).
   - Laravel receives structured data and auto-fills the form.
   - A green banner appears showing the confidence score.

If auto-fill fails, the frontend will show an error message, and details will appear in the Laravel logs.

---

## 5. Troubleshooting

### 5.1 Laravel Says OCR Service Is Not Available

Symptoms:
- Error message like “Failed to connect to OCR service”
- `/api/ocr/status` or `/api/ocr/test` endpoints return an error

Checklist:
- Is the Python OCR server running on port 8001?
- Can you open `http://127.0.0.1:8001/api/ocr-status/` in a browser?
- Does `PYTHON_OCR_URL` in Laravel `.env` match the actual URL?
- After editing `.env`, did you clear Laravel config cache?

```powershell
php artisan config:clear
php artisan cache:clear
```

### 5.2 Tesseract Not Found or Failing

Symptoms:
- Python logs show errors about `tesseract` not found
- `/api/ocr-status/` returns `available: false` or an error

Checklist:
- Confirm `TESSERACT_PATH` in `python-ocr-backend/.env` is correct.
- Run the path directly in a terminal to confirm:

```powershell
"C:\Program Files\Tesseract-OCR\tesseract.exe" --version
```

- Restart the Python server after changing `.env`.

### 5.3 OCR Results Are Poor or Missing Fields

Symptoms:
- Confidence score is low
- Only some fields are filled (e.g., objectives but not title)

Notes:
- OCR quality depends heavily on PDF clarity and layout.
- Try with a clean, digital PDF (not a blurred scan).
- Over time, extraction patterns in Python and Laravel can be refined to handle more formats.

### 5.4 Where to Look for Logs

- **Python OCR backend**:
  - The `manage.py runserver 8001` window shows logs and stack traces.
- **Laravel app**:
  - Check `storage/logs/laravel.log` for errors from `OCRService` or `OCRController`.

---

## 6. Summary of Steps

1. Install Tesseract OCR on Windows.
2. In `python-ocr-backend`:
   - Create and activate a virtualenv.
   - Install dependencies with `pip install -r requirements.txt`.
   - Configure `.env` with `TESSERACT_PATH`, `DJANGO_SECRET_KEY`, and `DEBUG`.
   - Run `python manage.py migrate`.
   - Start the server: `python manage.py runserver 8001`.
3. In Laravel:
   - Set `PYTHON_OCR_URL` in `.env`.
   - Start Laravel (e.g., `php artisan serve`).
4. Log in as Proponent, upload a PDF, and click **Extract Data from PDF (Auto-Fill)** to use the feature.

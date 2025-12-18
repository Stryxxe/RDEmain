<?php

namespace App\Http\Controllers;

use App\Services\OCRService;
use App\Services\ProposalParserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

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
     * 
     * POST /api/ocr/process-proposal
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function processProposal(Request $request)
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'proposal_file' => 'required|file|mimes:pdf,jpg,jpeg,png,tiff|max:10240', // 10MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('proposal_file');
            
            Log::info('OCR processing started', [
                'filename' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType()
            ]);

            // Check if Python OCR backend is available
            if (!$this->ocrService->isBackendAvailable()) {
                $backendUrl = config('services.python_ocr.url', 'http://localhost:8001/api');
                Log::error('Python OCR backend is not available', [
                    'backend_url' => $backendUrl,
                    'health_endpoint' => $backendUrl . '/health'
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'OCR service is currently unavailable. The Python OCR backend is not running. Please start it using: cd python-ocr-backend && python manage.py runserver 8001',
                    'error' => 'Python OCR backend not responding',
                    'backend_url' => $backendUrl,
                    'instructions' => 'To start the OCR backend, navigate to the python-ocr-backend directory and run: python manage.py runserver 8001'
                ], 503);
            }

            // Store file temporarily
            $tempPath = $file->store('temp/ocr', 'local');
            $fullPath = Storage::disk('local')->path($tempPath);
            $originalName = $file->getClientOriginalName();

            try {
                // Extract fields using Python OCR backend
                $extractedData = $this->ocrService->extractProposalFields($fullPath, $originalName);

                // Check if extraction was successful
                if (!$extractedData['success']) {
                    throw new \Exception($extractedData['error'] ?? $extractedData['message'] ?? 'OCR extraction failed');
                }

                // Current Python backend returns the final extracted fields directly in data
                $pythonExtracted = $extractedData['data'] ?? [];

                // Clean up temporary file
                Storage::disk('local')->delete($tempPath);

                // Count non-empty fields (excluding confidence_score)
                $fieldsExtracted = collect($pythonExtracted)
                    ->except(['confidence_score'])
                    ->filter(function ($value) {
                        if (is_array($value)) {
                            return count($value) > 0;
                        }
                        return !is_null($value) && $value !== '';
                    })
                    ->count();

                Log::info('OCR processing completed', [
                    'filename' => $originalName,
                    'confidence' => $pythonExtracted['confidence_score'] ?? 0,
                    'fields_extracted' => $fieldsExtracted
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Proposal processed successfully',
                    // Frontend expects the raw extracted fields here
                    'data' => $pythonExtracted,
                    'metadata' => [
                        'filename' => $originalName,
                        'processed_at' => now()->toIso8601String(),
                        'ocr_engine' => 'Tesseract (Python Backend)',
                        'fields_extracted' => $fieldsExtracted
                    ]
                ], 200);

            } catch (\Exception $e) {
                // Clean up temporary file on error
                if (Storage::disk('local')->exists($tempPath)) {
                    Storage::disk('local')->delete($tempPath);
                }
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('OCR processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process proposal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test OCR functionality with a sample file
     * 
     * POST /api/ocr/test
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function testOCR(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'test_file' => 'required|file|mimes:pdf,jpg,jpeg,png,tiff|max:10240',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('test_file');

            // Check backend availability and status in a safe way
            $backendAvailable = $this->ocrService->isBackendAvailable();
            $backendStatus = $this->ocrService->getBackendStatus();

            if (!$backendAvailable) {
                return response()->json([
                    'success' => false,
                    'message' => 'OCR backend is not available',
                    'backend_status' => $backendStatus
                ], 503);
            }

            // Store file temporarily
            $tempPath = $file->store('temp/ocr', 'local');
            $fullPath = Storage::disk('local')->path($tempPath);

            try {
                // Extract text only (no field parsing)
                $result = $this->ocrService->extractProposalFields($fullPath, $file->getClientOriginalName());

                // Clean up
                Storage::disk('local')->delete($tempPath);

                return response()->json([
                    'success' => true,
                    'message' => 'OCR test completed successfully',
                    'backend_status' => $backendStatus,
                    'test_result' => $result,
                    'text_length' => strlen($result['data']['raw_text'] ?? ''),
                    'fields_detected' => count(array_filter($result['data']['extracted_fields'] ?? []))
                ], 200);

            } catch (\Exception $e) {
                // Clean up on error
                if (Storage::disk('local')->exists($tempPath)) {
                    Storage::disk('local')->delete($tempPath);
                }
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('OCR test failed', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'OCR test failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get OCR backend status
     * 
     * GET /api/ocr/status
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStatus()
    {
        try {
            $backendUrl = config('services.python_ocr.url', 'http://localhost:8001/api');
            $isAvailable = $this->ocrService->isBackendAvailable();
            $status = $this->ocrService->getBackendStatus();

            return response()->json([
                'success' => true,
                'available' => $isAvailable,
                'backend_url' => $backendUrl,
                'health_check_url' => rtrim($backendUrl, '/') . '/health',
                'status' => $status
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get OCR status',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Merge extraction results from Python backend and Laravel parser
     * Python backend results take precedence, Laravel fills in gaps
     * 
     * @param array $pythonData
     * @param array $laravelData
     * @return array
     */
    protected function mergeExtractionResults(array $pythonData, array $laravelData): array
    {
        $merged = [];

        // Priority fields (use Python backend if available, fallback to Laravel)
        $fields = [
            'research_title',
            'description',
            'objectives',
            'research_center',
            'research_agendas',
            'dost_6ps',
            'sdgs',
            'budget',
            'proponents',
            'timeline'
        ];

        foreach ($fields as $field) {
            // Use Python backend data if available and not empty
            if (isset($pythonData[$field]) && !empty($pythonData[$field])) {
                $merged[$field] = $pythonData[$field];
            }
            // Fallback to Laravel parser data
            elseif (isset($laravelData[$field]) && !empty($laravelData[$field])) {
                $merged[$field] = $laravelData[$field];
            }
            // Set to null if both are empty
            else {
                $merged[$field] = null;
            }
        }

        // Calculate combined confidence score
        $pythonConfidence = $pythonData['confidence_score'] ?? 0;
        $laravelConfidence = $laravelData['confidence_score'] ?? 0;
        
        // Use weighted average (Python 60%, Laravel 40%)
        $merged['confidence_score'] = round(($pythonConfidence * 0.6) + ($laravelConfidence * 0.4), 2);

        return $merged;
    }
}

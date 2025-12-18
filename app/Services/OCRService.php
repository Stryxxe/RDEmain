<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Psr7\Utils;
use Illuminate\Support\Facades\Log;

class OCRService
{
    protected $client;
    protected $pythonBackendUrl;

    public function __construct()
    {
        $this->pythonBackendUrl = config('services.python_ocr.url', 'http://localhost:8001/api');
        
        // Ensure base_uri ends with slash for proper path resolution
        $baseUri = rtrim($this->pythonBackendUrl, '/') . '/';
        
        $this->client = new Client([
            'base_uri' => $baseUri,
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

            $response = $this->client->post('process/', [
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
                'error' => 'Failed to connect to OCR service. Please ensure Python backend is running on port 8001.'
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
            // Build full URL for health check
            $healthUrl = rtrim($this->pythonBackendUrl, '/') . '/health';
            
            Log::info('Checking Python OCR backend availability', [
                'url' => $healthUrl,
                'python_backend_url' => $this->pythonBackendUrl
            ]);
            
            // Use a fresh client instance to avoid base_uri path resolution issues
            $healthClient = new Client([
                'timeout' => 5,
                'http_errors' => false, // Don't throw exceptions on 4xx/5xx
                'verify' => false, // Disable SSL verification for localhost
            ]);
            
            $response = $healthClient->get($healthUrl);
            
            $statusCode = $response->getStatusCode();
            $isAvailable = $statusCode === 200;
            
            if (!$isAvailable) {
                $responseBody = $response->getBody()->getContents();
                Log::warning('Python OCR backend health check failed', [
                    'status_code' => $statusCode,
                    'url' => $healthUrl,
                    'response' => $responseBody
                ]);
            } else {
                Log::info('Python OCR backend health check passed', [
                    'url' => $healthUrl,
                    'status_code' => $statusCode
                ]);
            }
            
            return $isAvailable;
        } catch (ConnectException $e) {
            Log::error('Python OCR backend connection failed', [
                'error' => $e->getMessage(),
                'error_type' => get_class($e),
                'url' => rtrim($this->pythonBackendUrl, '/') . '/health',
                'python_backend_url' => $this->pythonBackendUrl
            ]);
            return false;
        } catch (\Exception $e) {
            Log::error('Python OCR backend not available', [
                'error' => $e->getMessage(),
                'error_type' => get_class($e),
                'url' => rtrim($this->pythonBackendUrl, '/') . '/health',
                'python_backend_url' => $this->pythonBackendUrl,
                'trace' => $e->getTraceAsString()
            ]);
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
            $response = $this->client->get('ocr-status/');
            return json_decode($response->getBody()->getContents(), true);
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }
}

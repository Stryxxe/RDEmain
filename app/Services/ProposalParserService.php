<?php

namespace App\Services;

use App\Models\ResearchCenter;
use App\Models\User;
use App\Models\Department;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ProposalParserService
{
    /**
     * Enhance and validate data extracted from Python OCR backend
     * 
     * This service complements the Python backend by:
     * - Validating extracted data against database
     * - Matching names to actual users
     * - Normalizing budget formats
     * - Validating research centers, agendas, SDGs
     */
    public function __construct()
    {
        // Constructor - patterns can be defined inline or in config if needed
    }

    /**
     * Enhance extracted data with database validation and matching
     * 
     * @param array $extractedData Raw data from Python OCR backend
     * @return array Enhanced and validated data
     */
    public function enhanceExtractedData(array $extractedData): array
    {
        Log::info('Enhancing OCR extracted data', ['fields_count' => count($extractedData)]);

        $enhanced = [
            'report_title' => $this->cleanText($extractedData['research_title'] ?? ''),
            'description' => $this->cleanText($extractedData['description'] ?? ''),
            'objectives' => $this->cleanText($extractedData['objectives'] ?? ''),
            'proposed_budget' => $this->normalizeBudget($extractedData['budget'] ?? null),
            'research_agenda' => $this->validateResearchAgendas($extractedData['research_agendas'] ?? []),
            'sustainable_development_goals' => $this->validateSDGs($extractedData['sdgs'] ?? []),
            'research_center_id' => $this->matchResearchCenter($extractedData['research_center'] ?? ''),
            'proponents' => $this->matchProponents($extractedData['proponents'] ?? []),
            'timeline' => $this->cleanText($extractedData['timeline'] ?? ''),
            'confidence_score' => $extractedData['confidence_score'] ?? 0,
            'raw_data' => $extractedData, // Keep original for debugging
        ];

        Log::info('Data enhancement complete', [
            'matched_center' => $enhanced['research_center_id'] ? 'yes' : 'no',
            'proponents_matched' => count($enhanced['proponents']),
        ]);

        return $enhanced;
    }

    /**
     * Match research center name to database ID
     * 
     * @param string $centerName Name extracted from OCR
     * @return int|null Research center ID or null if not found
     */
    protected function matchResearchCenter(?string $centerName): ?int
    {
        if (empty($centerName)) {
            return null;
        }

        // Try exact match first
        $center = ResearchCenter::where('name', 'LIKE', $centerName)->first();
        
        if ($center) {
            Log::info("Matched research center: {$centerName} -> {$center->name}");
            return $center->id;
        }

        // Try fuzzy matching with common abbreviations
        $abbreviations = [
            'USTP-CDO' => 'University of Science and Technology of Southern Philippines - Cagayan de Oro',
            'USTP CDO' => 'University of Science and Technology of Southern Philippines - Cagayan de Oro',
            'CAS' => 'College of Arts and Sciences',
            'CIT' => 'College of Information Technology',
            'CEBA' => 'College of Engineering Business and Accountancy',
        ];

        if (isset($abbreviations[$centerName])) {
            $fullName = $abbreviations[$centerName];
            $center = ResearchCenter::where('name', 'LIKE', "%{$fullName}%")->first();
            if ($center) {
                Log::info("Matched research center via abbreviation: {$centerName} -> {$center->name}");
                return $center->id;
            }
        }

        // Try partial match
        $center = ResearchCenter::where('name', 'LIKE', "%{$centerName}%")->first();
        if ($center) {
            Log::info("Matched research center via partial match: {$centerName} -> {$center->name}");
            return $center->id;
        }

        Log::warning("Could not match research center: {$centerName}");
        return null;
    }

    /**
     * Match proponent names to actual users in database
     * 
     * @param array $names Names extracted from OCR
     * @return array Matched user IDs with names
     */
    protected function matchProponents(array $names): array
    {
        $matched = [];

        foreach ($names as $name) {
            $name = trim($name);
            if (empty($name)) {
                continue;
            }

            // Try to match by full name
            $user = User::whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$name}%"])
                ->orWhereRaw("CONCAT(last_name, ', ', first_name) LIKE ?", ["%{$name}%"])
                ->where('role_id', 1) // Proponent role
                ->first();

            if ($user) {
                $matched[] = [
                    'id' => $user->id,
                    'name' => "{$user->first_name} {$user->last_name}",
                    'email' => $user->email,
                    'matched' => true,
                ];
                Log::info("Matched proponent: {$name} -> {$user->first_name} {$user->last_name}");
            } else {
                // Keep unmatched name for manual review
                $matched[] = [
                    'id' => null,
                    'name' => $name,
                    'email' => null,
                    'matched' => false,
                ];
                Log::warning("Could not match proponent: {$name}");
            }
        }

        return $matched;
    }

    /**
     * Normalize budget to decimal format
     * 
     * @param mixed $budget Budget string or number
     * @return float|null Normalized budget amount
     */
    protected function normalizeBudget($budget): ?float
    {
        if (empty($budget)) {
            return null;
        }

        // Remove currency symbols and commas
        $normalized = preg_replace('/[₱$,\s]/', '', (string)$budget);
        
        // Extract numeric value
        if (preg_match('/(\d+\.?\d*)/', $normalized, $matches)) {
            $amount = (float)$matches[1];
            Log::info("Normalized budget: {$budget} -> {$amount}");
            return $amount;
        }

        Log::warning("Could not normalize budget: {$budget}");
        return null;
    }

    /**
     * Validate research agendas against known list
     * 
     * @param array $agendas Agendas extracted from OCR
     * @return array Validated agenda strings
     */
    protected function validateResearchAgendas(array $agendas): array
    {
        $validAgendas = [
            'Agriculture, Aquatic, and Natural Resources',
            'Industry, Energy, and Emerging Technology',
            'Health',
            'Basic Research',
            'Disaster Risk Reduction and Climate Change Adaptation',
        ];

        $validated = [];

        foreach ($agendas as $agenda) {
            $agenda = trim($agenda);
            if (empty($agenda)) {
                continue;
            }

            // Try exact match
            if (in_array($agenda, $validAgendas)) {
                $validated[] = $agenda;
                continue;
            }

            // Try fuzzy match
            foreach ($validAgendas as $validAgenda) {
                if (stripos($validAgenda, $agenda) !== false || stripos($agenda, $validAgenda) !== false) {
                    $validated[] = $validAgenda;
                    Log::info("Matched agenda: {$agenda} -> {$validAgenda}");
                    break;
                }
            }
        }

        return array_unique($validated);
    }

    /**
     * Validate SDG numbers (1-17)
     * 
     * @param array $sdgs SDG numbers extracted from OCR
     * @return array Validated SDG numbers
     */
    protected function validateSDGs(array $sdgs): array
    {
        $validated = [];

        foreach ($sdgs as $sdg) {
            $sdgNumber = (int)$sdg;
            if ($sdgNumber >= 1 && $sdgNumber <= 17) {
                $validated[] = $sdgNumber;
            } else {
                Log::warning("Invalid SDG number: {$sdg}");
            }
        }

        return array_unique($validated);
    }

    /**
     * Clean and normalize text
     * 
     * @param string $text Text to clean
     * @return string Cleaned text
     */
    protected function cleanText(?string $text): string
    {
        if (empty($text)) {
            return '';
        }

        // Remove excessive whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        
        // Remove special characters that might come from OCR errors
        $text = preg_replace('/[^\x20-\x7E\n]/', '', $text);
        
        // Trim
        $text = trim($text);

        return $text;
    }

    /**
     * Calculate enhanced confidence score
     * 
     * @param array $enhancedData Enhanced data with validation results
     * @return float Confidence score (0-100)
     */
    public function calculateConfidence(array $enhancedData): float
    {
        $weights = [
            'report_title' => 15,
            'description' => 15,
            'objectives' => 15,
            'proposed_budget' => 10,
            'research_agenda' => 10,
            'sustainable_development_goals' => 10,
            'research_center_id' => 10,
            'proponents' => 15,
        ];

        $score = 0;
        $totalWeight = array_sum($weights);

        foreach ($weights as $field => $weight) {
            if (!empty($enhancedData[$field])) {
                if ($field === 'proponents') {
                    // For proponents, check if at least one was matched
                    $matchedCount = count(array_filter($enhancedData[$field], fn($p) => $p['matched'] ?? false));
                    if ($matchedCount > 0) {
                        $score += $weight;
                    }
                } elseif ($field === 'research_agenda' || $field === 'sustainable_development_goals') {
                    // For arrays, check if not empty
                    if (is_array($enhancedData[$field]) && count($enhancedData[$field]) > 0) {
                        $score += $weight;
                    }
                } else {
                    $score += $weight;
                }
            }
        }

        $confidence = ($score / $totalWeight) * 100;
        
        Log::info("Calculated confidence score: {$confidence}%");
        
        return round($confidence, 2);
    }

    /**
     * Validate and prepare data for database insertion
     * 
     * @param array $enhancedData Enhanced data from OCR
     * @return array Data ready for database insertion
     */
    public function prepareForDatabase(array $enhancedData): array
    {
        return [
            'report_title' => $enhancedData['report_title'] ?? null,
            'description' => $enhancedData['description'] ?? null,
            'objectives' => $enhancedData['objectives'] ?? null,
            'proposed_budget' => $enhancedData['proposed_budget'] ?? null,
            'research_center_id' => $enhancedData['research_center_id'] ?? null,
            'timeline' => $enhancedData['timeline'] ?? null,
            // Note: Arrays like research_agenda, SDGs, and proponents need to be handled separately
            // after the main proposal is created, using pivot tables
        ];
    }

    /**
     * Get suggestions for missing or low-confidence fields
     * 
     * @param array $enhancedData Enhanced data
     * @return array Suggestions for user to review
     */
    public function getSuggestions(array $enhancedData): array
    {
        $suggestions = [];

        // Check for missing critical fields
        if (empty($enhancedData['report_title'])) {
            $suggestions[] = 'Please provide a research title - it was not detected in the PDF.';
        }

        if (empty($enhancedData['description'])) {
            $suggestions[] = 'Please provide a description/background - it was not clearly identified.';
        }

        if (empty($enhancedData['research_center_id'])) {
            $suggestions[] = 'Research center could not be matched. Please select manually.';
        }

        // Check proponents
        if (!empty($enhancedData['proponents'])) {
            $unmatchedProponents = array_filter(
                $enhancedData['proponents'],
                fn($p) => !($p['matched'] ?? false)
            );

            if (count($unmatchedProponents) > 0) {
                $names = implode(', ', array_column($unmatchedProponents, 'name'));
                $suggestions[] = "Some proponents could not be matched: {$names}. Please verify and add manually.";
            }
        }

        // Check confidence score
        $confidence = $enhancedData['confidence_score'] ?? 0;
        if ($confidence < 50) {
            $suggestions[] = 'Low confidence score detected. Please carefully review all auto-filled fields.';
        } elseif ($confidence < 75) {
            $suggestions[] = 'Moderate confidence score. Please verify the accuracy of extracted information.';
        }

        return $suggestions;
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
        $extracted['research_agendas'] = $this->extractResearchAgenda($text);
        $extracted['dost_6ps'] = $this->extractDOSTSPs($text);
        $extracted['sdgs'] = $this->extractSDGs($text);
        $extracted['budget'] = $this->extractBudget($text);
        $extracted['proponents'] = $this->extractProponents($text);
        $extracted['timeline'] = $this->extractTimeline($text);

        // Calculate confidence score
        $extracted['confidence_score'] = $this->calculateConfidence($extracted);

        Log::info('Proposal parsing complete', [
            'confidence' => $extracted['confidence_score'],
            'fields_extracted' => count(array_filter($extracted))
        ]);

        return $extracted;
    }

    /**
     * Extract research title
     */
    protected function extractResearchTitle(string $text): ?string
    {
        $patterns = [
            '/(?:project\s+)?title\s*:?\s*["\']?(.+?)(?=["\']?\s*(?:\n\n|background|description|objectives?))/is',
            '/research\s+title\s*:?\s*["\']?(.+?)(?=["\']?\s*(?:\n\n|background|description))/is',
            '/^title\s*:?\s*(.+?)$/im',
            '/\btitle\b\s*:?\s*(.+?)(?=\n(?:background|description|objectives?))/is',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return $this->cleanText($matches[1]);
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
            '/(?:background|description|rationale)\s*:?\s*(.+?)(?=\n\s*(?:objectives?|methodology|timeline|budget))/is',
            '/(?:project\s+)?description\s*:?\s*(.+?)(?=\n\s*objectives?)/is',
            '/rationale\s*:?\s*(.+?)(?=\n\s*objectives?)/is',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return $this->cleanText($matches[1]);
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
            '/objectives?\s*:?\s*(.+?)(?=\n\s*(?:methodology|timeline|budget|expected\s+output))/is',
            '/(?:general|specific)\s+objectives?\s*:?\s*(.+?)(?=\n\s*methodology)/is',
            '/aims?\s+and\s+objectives?\s*:?\s*(.+?)(?=\n\s*methodology)/is',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return $this->cleanText($matches[1]);
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
            'CAFS' => ['CAFS', 'College of Agriculture', 'Agriculture and Food'],
            'CAS' => ['CAS', 'College of Arts and Sciences', 'Arts and Sciences'],
            'CBPA' => ['CBPA', 'College of Business and Public Administration', 'Business'],
            'CED' => ['CED', 'College of Education', 'Education'],
            'CEng' => ['CEng', 'College of Engineering', 'Engineering'],
            'CIT' => ['CIT', 'College of Industrial Technology', 'Industrial Technology'],
            'CNAHS' => ['CNAHS', 'College of Nursing and Allied Health Sciences', 'Nursing'],
        ];

        foreach ($centers as $code => $keywords) {
            foreach ($keywords as $keyword) {
                if (stripos($text, $keyword) !== false) {
                    return $code;
                }
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
            'Food Security and Sufficiency',
            'Health and Nutrition',
            'Climate Change Adaptation and Mitigation',
            'Disaster Risk Reduction',
            'Sustainable Environment and Biodiversity Conservation',
            'Education and Human Resource Development',
            'Industry and Infrastructure Development',
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
            'People (Health, Nutrition, Social Development)',
            'Peace (Public Safety, Security, Conflict Resolution)',
            'Planet (Climate Change, DRR, Environment)',
            'Prosperity (Industry, Trade, Commerce)',
            'Partnership (Governance, Institutional Development)',
            'Paradigm Shift (Transformative Technologies)',
        ];

        $found = [];
        foreach ($sps as $sp) {
            if (stripos($text, $sp) !== false || stripos($text, explode(' ', $sp)[0]) !== false) {
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
        
        // Extract SDG numbers (1-17)
        if (preg_match_all('/SDG\s*#?(\d+)/i', $text, $matches)) {
            foreach ($matches[1] as $sdg) {
                $sdgNum = (int)$sdg;
                if ($sdgNum >= 1 && $sdgNum <= 17) {
                    $found[] = $sdgNum;
                }
            }
        }

        // Also try pattern like "Goal 1", "Goal 2", etc.
        if (preg_match_all('/(?:Goal|Sustainable\s+Development\s+Goal)\s*#?(\d+)/i', $text, $matches)) {
            foreach ($matches[1] as $sdg) {
                $sdgNum = (int)$sdg;
                if ($sdgNum >= 1 && $sdgNum <= 17) {
                    $found[] = $sdgNum;
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
            '/(?:total\s+)?budget\s*:?\s*₱?\s*([\d,]+(?:\.\d{2})?)/i',
            '/(?:proposed\s+)?budget\s*:?\s*PHP\s*([\d,]+(?:\.\d{2})?)/i',
            '/amount\s*:?\s*₱?\s*([\d,]+(?:\.\d{2})?)/i',
            '/₱\s*([\d,]+(?:\.\d{2})?)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $amount = str_replace(',', '', $matches[1]);
                return (float)$amount;
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

        // Pattern for "Name, Position" or "Name - Position" format
        $pattern = '/([A-Z][a-z]+(?:\s+[A-Z]\.?\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[,-]\s*(?:Ph\.?D\.?|M\.?S\.?|Professor|Associate|Assistant|Instructor)/i';
        
        if (preg_match_all($pattern, $text, $matches)) {
            $proponents = array_map(function($name) {
                return $this->cleanText($name);
            }, $matches[1]);
        }

        return array_unique($proponents);
    }

    /**
     * Extract timeline/duration
     */
    protected function extractTimeline(string $text): ?string
    {
        $patterns = [
            '/(?:duration|timeline)\s*:?\s*(\d+)\s*(?:months?|years?)/i',
            '/project\s+duration\s*:?\s*(.+?)(?=\n)/i',
            '/(?:start|begin)\s*:?\s*(.+?)\s*(?:to|end|finish)\s*:?\s*(.+?)(?=\n)/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return $this->cleanText($matches[1] . (isset($matches[2]) ? ' to ' . $matches[2] : ''));
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
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        
        // Remove multiple consecutive newlines
        $text = preg_replace('/\n{3,}/', "\n\n", $text);
        
        // Normalize common OCR errors
        $text = str_replace(['ﬁ', 'ﬂ'], ['fi', 'fl'], $text);
        
        return trim($text);
    }
}

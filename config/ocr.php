<?php

return [
    
    /*
    |--------------------------------------------------------------------------
    | OCR Extraction Patterns
    |--------------------------------------------------------------------------
    |
    | Define regex patterns for extracting fields from research proposals.
    | These patterns are used by the ProposalParserService.
    |
    */
    
    'extraction_patterns' => [
        
        'research_title' => [
            '/(?:project\s+)?title\s*:?\s*["\']?(.+?)(?=["\']?\s*(?:\n\n|background|description|objectives?))/is',
            '/research\s+title\s*:?\s*["\']?(.+?)(?=["\']?\s*(?:\n\n|background|description))/is',
            '/^title\s*:?\s*(.+?)$/im',
        ],
        
        'description' => [
            '/(?:background|description|rationale)\s*:?\s*(.+?)(?=\n\s*(?:objectives?|methodology|timeline|budget))/is',
            '/(?:project\s+)?description\s*:?\s*(.+?)(?=\n\s*objectives?)/is',
        ],
        
        'objectives' => [
            '/objectives?\s*:?\s*(.+?)(?=\n\s*(?:methodology|timeline|budget|expected\s+output))/is',
            '/(?:general|specific)\s+objectives?\s*:?\s*(.+?)(?=\n\s*methodology)/is',
        ],
        
        'budget' => [
            '/(?:total\s+)?budget\s*:?\s*₱?\s*([\d,]+(?:\.\d{2})?)/i',
            '/(?:proposed\s+)?budget\s*:?\s*PHP\s*([\d,]+(?:\.\d{2})?)/i',
            '/amount\s*:?\s*₱?\s*([\d,]+(?:\.\d{2})?)/i',
        ],
        
        'timeline' => [
            '/(?:duration|timeline)\s*:?\s*(\d+)\s*(?:months?|years?)/i',
            '/project\s+duration\s*:?\s*(.+?)(?=\n)/i',
        ],
        
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Research Centers
    |--------------------------------------------------------------------------
    |
    | Define research centers and their keywords for matching.
    |
    */
    
    'research_centers' => [
        'CAFS' => [
            'keywords' => ['CAFS', 'College of Agriculture', 'Agriculture and Food Sciences'],
            'name' => 'College of Agriculture and Food Sciences',
        ],
        'CAS' => [
            'keywords' => ['CAS', 'College of Arts and Sciences', 'Arts and Sciences'],
            'name' => 'College of Arts and Sciences',
        ],
        'CBPA' => [
            'keywords' => ['CBPA', 'College of Business and Public Administration', 'Business'],
            'name' => 'College of Business and Public Administration',
        ],
        'CED' => [
            'keywords' => ['CED', 'College of Education', 'Education'],
            'name' => 'College of Education',
        ],
        'CEng' => [
            'keywords' => ['CEng', 'College of Engineering', 'Engineering'],
            'name' => 'College of Engineering',
        ],
        'CIT' => [
            'keywords' => ['CIT', 'College of Industrial Technology', 'Industrial Technology'],
            'name' => 'College of Industrial Technology',
        ],
        'CNAHS' => [
            'keywords' => ['CNAHS', 'College of Nursing and Allied Health Sciences', 'Nursing'],
            'name' => 'College of Nursing and Allied Health Sciences',
        ],
    ],
    
    /*
    |--------------------------------------------------------------------------
    | RDE Research Agendas
    |--------------------------------------------------------------------------
    |
    | Define official RDE research agendas.
    |
    */
    
    'research_agendas' => [
        'Food Security and Sufficiency',
        'Health and Nutrition',
        'Climate Change Adaptation and Mitigation',
        'Disaster Risk Reduction',
        'Sustainable Environment and Biodiversity Conservation',
        'Education and Human Resource Development',
        'Industry and Infrastructure Development',
    ],
    
    /*
    |--------------------------------------------------------------------------
    | DOST 6Ps (Priorities)
    |--------------------------------------------------------------------------
    |
    | Define DOST 6Ps priorities.
    |
    */
    
    'dost_6ps' => [
        'People (Health, Nutrition, Social Development)',
        'Peace (Public Safety, Security, Conflict Resolution)',
        'Planet (Climate Change, DRR, Environment)',
        'Prosperity (Industry, Trade, Commerce)',
        'Partnership (Governance, Institutional Development)',
        'Paradigm Shift (Transformative Technologies)',
    ],
    
    /*
    |--------------------------------------------------------------------------
    | OCR Settings
    |--------------------------------------------------------------------------
    |
    | Configure OCR processing settings.
    |
    */
    
    'settings' => [
        'max_file_size' => 10485760, // 10MB in bytes
        'allowed_mime_types' => [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/tiff',
        ],
        'temp_storage_path' => 'temp/ocr',
        'confidence_threshold' => 60, // Minimum confidence score to accept (%)
    ],
    
];

"""
Proposal Extraction Service - Extract structured data from research proposal PDFs
"""

import logging
import re
from documents.ocr.tesseract_processor import TesseractOCRProcessor
from documents.ocr.checkbox_detector import CheckboxDetector

logger = logging.getLogger(__name__)


class ProposalExtractionService:
    """Service to extract fields from research proposal PDFs"""
    
    def __init__(self):
        self.ocr_processor = TesseractOCRProcessor()
        self.checkbox_detector = CheckboxDetector()
        self.file_bytes = None  # Store for checkbox detection
        logger.info("✓ Proposal Extraction Service initialized")
    
    def process_and_save_document(self, file, process_type):
        """
        Process uploaded proposal file and extract fields
        
        Args:
            file: Uploaded file object
            process_type: Document type (e.g., 'research_proposal')
            
        Returns:
            dict: Extracted data with 'processed_result' containing 'data'
        """
        try:
            logger.info(f"Processing {process_type}: {file.name} ({file.size} bytes)")
            
            # Read file bytes
            file_bytes = file.read()
            self.file_bytes = file_bytes  # Store for checkbox detection
            content_type = file.content_type
            
            logger.info(f"File type: {content_type}")
            
            # Extract text using OCR
            raw_text = self.ocr_processor.process(file_bytes, content_type)
            
            logger.info(f"OCR extracted {len(raw_text)} characters")
            
            # Parse text to extract fields
            extracted_data = self.extract_fields(raw_text)
            
            return {
                'processed_result': {
                    'data': extracted_data,
                    'raw_text': raw_text[:500] + '...' if len(raw_text) > 500 else raw_text  # Truncate for response
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
        logger.info("Starting field extraction...")
        
        # Preprocess text
        text = self._preprocess_text(text)
        
        # Extract each field
        extracted = {}
        extracted['research_title'] = self._extract_research_title(text)
        extracted['description'] = self._extract_description(text)
        extracted['objectives'] = self._extract_objectives(text)
        extracted['research_center'] = self._extract_research_center(text)
        extracted['research_agenda'] = self._extract_research_agenda(text)
        extracted['sdgs'] = self._extract_sdgs(text)
        extracted['dost_6ps'] = self._extract_dost_6ps(text)
        extracted['budget'] = self._extract_budget(text)
        extracted['proponents'] = self._extract_proponents(text)
        extracted['timeline'] = self._extract_timeline(text)
        
        # Calculate confidence score
        extracted['confidence_score'] = self._calculate_confidence(extracted)
        
        filled_count = len([v for v in extracted.values() if v and v != [] and v != 0])
        logger.info(f"Extracted {filled_count}/10 fields, confidence: {extracted['confidence_score']}%")
        
        return extracted
    
    def _preprocess_text(self, text):
        """Clean and normalize OCR text"""
        # Normalize line endings
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        # Collapse spaces and tabs but preserve newlines
        text = re.sub(r'[ \t]+', ' ', text)
        # Remove trailing spaces on lines
        text = re.sub(r'\n[ \t]+', '\n', text)
        # Normalize multiple blank lines
        text = re.sub(r'\n{3,}', '\n\n', text)
        # Fix common OCR errors
        text = text.replace(''', "'").replace(''', "'")
        text = text.replace('"', '"').replace('"', '"')
        return text.strip()
    
    def _extract_research_title(self, text):
        """Extract research title"""
        patterns = [
            # Match "(1) R&D INITIATIVE TITLE" format
            r'\(1\)\s*R&D\s+INITIATIVE\s+TITLE\s*\n\s*(.+?)(?=\n\(2\)|\n\s*$)',
            r'\(1\)\s*R&D\s+INITIATIVE\s+TITLE\s*\n\s*(.+?)\n',
            # Original patterns as fallback
            r'(?:TITLE|RESEARCH\s+TITLE|PROJECT\s+TITLE)\s*[:]\s*(.+?)(?=\n[A-Z]|\n\s*$)',
            r'(?:TITLE|RESEARCH\s+TITLE)\s*\n\s*(.+?)(?=\n[A-Z]|\n\s*$)',
            r'^RESEARCH\s+PROPOSAL\s*\n\s*(.+?)\n',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                title = match.group(1).strip()
                if 10 < len(title) < 300:
                    logger.debug(f"Found title: {title[:50]}...")
                    return title
        
        logger.warning("Research title not found")
        return None
    
    def _extract_description(self, text):
        """Extract description/background/rationale"""
        patterns = [
            # Match "Il. RATIONALE" or "II. RATIONALE" (OCR may read II as Il)
            r'I[Il]\.\s+RATIONALE\s*\n\s*(.+?)(?=\nI[Il]{1,2}\.\s+OBJECTIVES|\nIII\.)',
            # Between I. BACKGROUND ... and II. OBJECTIVES
            r'I\.\s+BACKGROUND(?:\s+AND\s+RATIONALE)?\s*(.+?)(?=\nII\.)',
            r'(?:BACKGROUND|DESCRIPTION|RATIONALE|INTRODUCTION)\s*[:]\s*(.+?)(?=\n[A-Z]{3,}|OBJECTIVE|GOAL)',
            r'(?:BACKGROUND|DESCRIPTION)\s*\n\s*(.+?)(?=\n[A-Z]{3,}|OBJECTIVE)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                desc = match.group(1).strip()
                if len(desc) > 50:
                    logger.debug(f"Found description: {len(desc)} chars")
                    return desc
        
        logger.warning("Description not found")
        return None
    
    def _extract_objectives(self, text):
        """Extract objectives/goals.

        Goal: capture the full objectives block (general + specific,
        including items a., b., c., d., etc.) instead of just the
        first sentence, but stop before unrelated sections like
        RESEARCH AGENDA, SDGs, DOST 6Ps, or BUDGET.

        Strategy:
        - Look for headings like "General Objective", "Specific Objectives",
          "Objectives", or "Aims and Objectives".
        - Capture everything after the heading up to the next major section
          (roman‑numeral heading or known section names).
        - Only use the first match to avoid duplicated blocks when the
          template appears more than once in the document.
        - If that fails, fall back to a broader roman‑numeral based
          OBJECTIVES section capture.
        """

        # Common end-of-section boundary: next roman-numeral heading or
        # known section names (methodology, research agenda, SDGs, DOST, budget, etc.).
        boundary = (
            r'(?=\n\s*(?:'
            r'[IVXLCDM]+\.[ \t]+[A-Z]|'                 # "III. SOMETHING"
            r'methodology|timeline|budget|expected\s+output|'
            r'research\s+agenda|sustainable\s+development\s+goals?|'
            r'dost\s+strategic\s+priorities'
            r')|\Z)'
        )

        # 1) Look for specific objectives-style headings
        patterns = [
            # Starts at "General Objective" heading
            r'General\s+Objective[s]?\s*:?[ \t]*\n?(.*?' + boundary + ')',
            # General or Specific Objectives headings
            r'(?:general|specific)\s+objectives?\s*:?[ \t]*\n?(.*?' + boundary + ')',
            # Generic "Objectives" heading
            r'objectives?\s*:?[ \t]*\n?(.*?' + boundary + ')',
            # "Aims and Objectives" heading
            r'aims?\s+and\s+objectives?\s*:?[ \t]*\n?(.*?' + boundary + ')',
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                segment = match.group(1).strip()
                if len(segment) > 20:
                    logger.debug(f"Found objectives (heading patterns): {len(segment)} chars")
                    return segment

        # 2) Fallback: broader OBJECTIVES section based on roman‑numeral headings
        section_pattern = (
            r'(?:^|\n)'
            r'(?:(?:[IVXLCDM]+\.)\s+)?'  # Optional roman numeral like "II. "
            r'(?:GENERAL\s+AND\s+SPECIFIC\s+)?'
            r'(?:OBJECTIVE|OBJECTIVES|GOALS?)'
            r'(?:\s+OF\s+THE\s+STUDY)?'
            r'[^\n]*\n'  # Rest of the heading line
            r'(.+?)'       # Capture everything after heading
            r'(?=\n(?:[IVXLCDM]+\.[ \t]+[A-Z]|'  # Next roman numeral section like "III. METHODOLOGY"
            r'[A-Z][A-Z \t]{3,}|'                 # Or ALL CAPS heading
            r'METHODOLOGY|TIMELINE|BUDGET)|\Z)'   # Or specific keywords or end of text
        )

        matches = list(re.finditer(section_pattern, text, re.IGNORECASE | re.DOTALL | re.MULTILINE))

        if matches:
            sections = [m.group(1).strip() for m in matches if m.group(1).strip()]
            objectives = "\n\n".join(sections).strip()

            if len(objectives) > 20:
                logger.debug(f"Found objectives (fallback section): {len(objectives)} chars")
                return objectives

        logger.warning("Objectives not found")
        return None
    
    def _extract_research_center(self, text):
        """Extract research center from predefined list or map from research areas"""
        centers = [
            'Center for Information and Communications Technology',
            'Center for Environmental Studies and Research',
            'Center for Indigenous Studies and Cultural Heritage',
            'Center for Renewable Energy and Sustainability',
            'Center for Health Informatics and Telemedicine',
            'Center for Food Security and Agricultural Development',
            'Center for Disaster Risk Reduction and Climate Change',
        ]
        
        # First try direct match
        for center in centers:
            if center.lower() in text.lower():
                logger.debug(f"Found research center: {center}")
                return center
        
        # Map research areas to centers
        area_mappings = {
            'renewable energy': 'Center for Renewable Energy and Sustainability',
            'sustainable energy': 'Center for Renewable Energy and Sustainability',
            'solar': 'Center for Renewable Energy and Sustainability',
            'food security': 'Center for Food Security and Agricultural Development',
            'agriculture': 'Center for Food Security and Agricultural Development',
            'agricultural': 'Center for Food Security and Agricultural Development',
            'ict': 'Center for Information and Communications Technology',
            'information technology': 'Center for Information and Communications Technology',
            'health': 'Center for Health Informatics and Telemedicine',
            'telemedicine': 'Center for Health Informatics and Telemedicine',
            'environment': 'Center for Environmental Studies and Research',
            'climate': 'Center for Disaster Risk Reduction and Climate Change',
            'disaster': 'Center for Disaster Risk Reduction and Climate Change',
            'indigenous': 'Center for Indigenous Studies and Cultural Heritage',
            'cultural heritage': 'Center for Indigenous Studies and Cultural Heritage',
        }
        
        text_lower = text.lower()
        for keyword, center in area_mappings.items():
            if keyword in text_lower:
                logger.debug(f"Mapped research center from keyword '{keyword}': {center}")
                return center
        
        logger.warning("Research center not found")
        return None
    
    def _extract_research_agenda(self, text):
        """Extract RDE research agendas using visual checkbox detection"""
        
        # Try visual checkbox detection first
        if self.file_bytes:
            try:
                checked_rde = self.checkbox_detector.detect_checked_items(
                    self.file_bytes, 'RDE', []
                )
                if checked_rde:
                    logger.debug(f"Found {len(checked_rde)} research agendas via checkbox detection")
                    return checked_rde
            except Exception as e:
                logger.warning(f"Checkbox detection failed, falling back to text analysis: {e}")
        
        # Fallback: keyword-based detection
        agenda_keywords = {
            'Food Security': ['food security', 'agriculture', 'agricultural', 'farming', 'crop'],
            'Health and Nutrition': ['health', 'nutrition', 'medical'],
            'Climate Change': ['climate change'],
            'Disaster Risk Reduction': ['disaster risk', 'disaster reduction'],
            'Environmental Protection': ['environmental protection'],
            'Environment and Natural Resources': ['environment', 'natural resources'],
            'Renewable Energy': ['renewable energy'],
            'Sustainable Energy Systems': ['sustainable energy'],
            'ICT and Digital Transformation': ['ict', 'digital transformation', 'information technology'],
            'Cultural Heritage Preservation': ['cultural heritage', 'indigenous'],
        }
        
        found = []
        text_lower = text.lower()
        
        for agenda, keywords in agenda_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    found.append(agenda)
                    logger.debug(f"Found research agenda '{agenda}' from keyword: {keyword}")
                    break
        
        if found:
            logger.debug(f"Found {len(found)} research agendas")
        else:
            logger.warning("No research agendas found")
        
        return found

    def _extract_dost_6ps(self, text):
        """Extract DOST 6Ps using visual checkmark detection"""
        
        # Try visual checkmark detection first
        if self.file_bytes:
            try:
                checked_6ps = self.checkbox_detector.detect_checked_items(
                    self.file_bytes, '6Ps', []
                )
                if checked_6ps:
                    logger.debug(f"Found {len(checked_6ps)} DOST 6Ps via checkmark detection")
                    return checked_6ps
            except Exception as e:
                logger.warning(f"Checkmark detection failed, falling back to text analysis: {e}")
        
        # Fallback: keyword-based detection
        section_pattern = r'(?:VIII\.?\s+EXPECTED\s+OUTPUTS[\w\s&]*?)(.+?)(?:IX\.|$)'
        section_match = re.search(section_pattern, text, re.IGNORECASE | re.DOTALL)
        search_text = section_match.group(1) if section_match else text

        keywords_map = {
            'product': 'Product',
            'prototype': 'Product',
            'people services': 'People Services',
            'capacity-building': 'People Services',
            'training': 'People Services',
            'places and partnership': "Places and Partnership",
            'collaboration': "Places and Partnership",
            'policies': 'Policies',
            'policy': 'Policies',
            'programs': 'Programs',
            'programme': 'Programs',
            'publication': 'Publications',
            'journal article': 'Publications',
        }

        found = set()
        lower_text = search_text.lower()

        for key, label in keywords_map.items():
            if key in lower_text:
                found.add(label)

        result = sorted(list(found))
        if result:
            logger.debug(f"Found {len(result)} DOST 6Ps: {result}")
        else:
            logger.warning("No DOST 6Ps found")

        return result
    
    def _extract_sdgs(self, text):
        """Extract Sustainable Development Goal numbers using visual checkbox detection"""
        
        # Try visual checkbox detection first
        if self.file_bytes:
            try:
                checked_sdgs = self.checkbox_detector.detect_checked_items(
                    self.file_bytes, 'SDG', []
                )
                if checked_sdgs:
                    logger.debug(f"Found SDGs via checkbox detection: {checked_sdgs}")
                    return checked_sdgs
            except Exception as e:
                logger.warning(f"Checkbox detection failed, falling back to text analysis: {e}")
        
        # Fallback: Look for explicit SDG mentions and targeted inference
        found_sdgs = set()
        
        patterns = [
            r'SDG[\s\-:]*(\d{1,2})\b',
            r'SUSTAINABLE\s+DEVELOPMENT\s+GOAL[\s\-:]*(\d{1,2})',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for num in matches:
                sdg_num = int(num)
                if 1 <= sdg_num <= 17:
                    found_sdgs.add(sdg_num)
        
        # Targeted inference based on key research themes (only add most relevant SDGs)
        if not found_sdgs:
            text_lower = text.lower()
            
            # Only infer the 2 most relevant SDGs
            if any(kw in text_lower for kw in ['solar', 'renewable energy', 'clean energy']):
                found_sdgs.add(7)  # Affordable and Clean Energy
                logger.debug("Inferred SDG 7 from renewable energy content")
            
            if any(kw in text_lower for kw in ['climate', 'climate change', 'climate action']):
                found_sdgs.add(13)  # Climate Action
                logger.debug("Inferred SDG 13 from climate content")
        
        result = sorted(list(found_sdgs))
        if result:
            logger.debug(f"Found SDGs: {result}")
        else:
            logger.warning("No SDGs found (checkboxes in PDF may not be distinguishable in OCR)")
        
        return result
    
    def _extract_budget(self, text):
        """Extract budget amount in PHP"""
        patterns = [
            # Match GRAND TOTAL from budget table - extract all numbers and take the largest
            r'GRAND\s+TOTAL\s+.*?([\d,]+\.\d{2})\s*$',
            # Match line with TOTAL and get last number on that line
            r'(?:^|\n)TOTAL\s+.*?([\d,]+\.\d{2})\s*(?:\n|$)',
            # Original patterns as fallback
            r'(?:BUDGET|TOTAL\s+BUDGET|PROPOSED\s+BUDGET)\s*[:]\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{2})?)',
            r'(?:BUDGETARY\s+REQUIREMENT).*?TOTAL\s+([\d,]+\.\d{2})',
        ]
        
        for pattern in patterns:
            matches = list(re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE))
            if matches:
                # For GRAND TOTAL, we need the last/largest number in the line
                match = matches[-1]  # Get last match
                line = match.group(0)
                # Find all amounts on the line
                all_amounts = re.findall(r'([\d,]+\.\d{2})', line)
                if len(all_amounts) > 1:
                    # Take the largest amount (usually the TOTAL column)
                    amounts_float = []
                    for amt in all_amounts:
                        try:
                            amounts_float.append(float(amt.replace(',', '')))
                        except ValueError:
                            continue
                    if amounts_float:
                        max_budget = max(amounts_float)
                        logger.debug(f"Found budget: PHP {max_budget:,.2f}")
                        return max_budget
                else:
                    budget_str = match.group(1).replace(',', '')
                    try:
                        budget = float(budget_str)
                        logger.debug(f"Found budget: PHP {budget:,.2f}")
                        return budget
                    except ValueError:
                        continue
        
        logger.warning("Budget not found")
        return None
    
    def _extract_proponents(self, text):
        """Extract proponent/researcher names"""
        # Look for names with titles (Dr., Prof., Mr., Ms., Engr.)
        pattern = r'(?:Dr\.|Prof\.|Mr\.|Ms\.|Engr\.)\s+([A-Z][a-z]+(?:\s+[A-Z]\.)?\s+[A-Z][a-z]+)'
        
        matches = re.findall(pattern, text)
        unique_names = list(set(matches))
        
        if unique_names:
            logger.debug(f"Found {len(unique_names)} proponents")
        else:
            logger.warning("No proponents found")
        
        return unique_names
    
    def _extract_timeline(self, text):
        """Extract project timeline/duration"""
        patterns = [
            r'(?:DURATION|TIMELINE|TIMEFRAME|PROJECT\s+PERIOD)\s*[:]\s*(.+?)(?=\n[A-Z]|\n\s*$)',
            r'(\d+)\s+(?:months?|years?)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                timeline = match.group(1).strip()
                logger.debug(f"Found timeline: {timeline}")
                return timeline
        
        logger.warning("Timeline not found")
        return None
    
    def _calculate_confidence(self, extracted):
        """Calculate confidence score based on filled fields"""
        total_fields = 9
        filled = sum(1 for k, v in extracted.items() 
                    if k != 'confidence_score' and v and v != [])
        
        score = round((filled / total_fields) * 100, 2)
        return score

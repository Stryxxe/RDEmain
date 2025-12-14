"""
Proposal Extraction Service - Extract structured data from research proposal PDFs
"""

import logging
import re
from documents.ocr.tesseract_processor import TesseractOCRProcessor

logger = logging.getLogger(__name__)


class ProposalExtractionService:
    """Service to extract fields from research proposal PDFs"""
    
    def __init__(self):
        self.ocr_processor = TesseractOCRProcessor()
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
        extracted['budget'] = self._extract_budget(text)
        extracted['proponents'] = self._extract_proponents(text)
        extracted['timeline'] = self._extract_timeline(text)
        
        # Calculate confidence score
        extracted['confidence_score'] = self._calculate_confidence(extracted)
        
        filled_count = len([v for v in extracted.values() if v and v != [] and v != 0])
        logger.info(f"Extracted {filled_count}/9 fields, confidence: {extracted['confidence_score']}%")
        
        return extracted
    
    def _preprocess_text(self, text):
        """Clean and normalize OCR text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Normalize line breaks
        text = re.sub(r'\n\s*\n+', '\n', text)
        # Fix common OCR errors
        text = text.replace(''', "'").replace(''', "'")
        text = text.replace('"', '"').replace('"', '"')
        return text.strip()
    
    def _extract_research_title(self, text):
        """Extract research title"""
        patterns = [
            r'(?:TITLE|RESEARCH\s+TITLE|PROJECT\s+TITLE)\s*[:]\s*(.+?)(?=\n[A-Z]|\n\s*$)',
            r'(?:TITLE|RESEARCH\s+TITLE)\s*\n\s*(.+?)(?=\n[A-Z]|\n\s*$)',
            r'^(.{10,200})\n',  # First substantial line as fallback
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
        """Extract objectives/goals"""
        patterns = [
            r'(?:OBJECTIVE|OBJECTIVES|GOALS?)\s*[:]\s*(.+?)(?=\n[A-Z]{3,}|METHODOLOGY|TIMELINE|BUDGET)',
            r'(?:OBJECTIVE|OBJECTIVES)\s*\n\s*(.+?)(?=\n[A-Z]{3,}|METHODOLOGY)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                objectives = match.group(1).strip()
                if len(objectives) > 20:
                    logger.debug(f"Found objectives: {len(objectives)} chars")
                    return objectives
        
        logger.warning("Objectives not found")
        return None
    
    def _extract_research_center(self, text):
        """Extract research center from predefined list"""
        centers = [
            'Center for Information and Communications Technology',
            'Center for Environmental Studies and Research',
            'Center for Indigenous Studies and Cultural Heritage',
            'Center for Renewable Energy and Sustainability',
            'Center for Health Informatics and Telemedicine',
            'Center for Food Security and Agricultural Development',
            'Center for Disaster Risk Reduction and Climate Change',
        ]
        
        for center in centers:
            if center.lower() in text.lower():
                logger.debug(f"Found research center: {center}")
                return center
        
        logger.warning("Research center not found")
        return None
    
    def _extract_research_agenda(self, text):
        """Extract RDE research agendas"""
        agendas = [
            'Food Security',
            'Health and Nutrition',
            'Climate Change',
            'Disaster Risk Reduction',
            'Environmental Protection',
            'Renewable Energy',
            'ICT and Digital Transformation',
            'Cultural Heritage Preservation',
        ]
        
        found = []
        for agenda in agendas:
            if agenda.lower() in text.lower():
                found.append(agenda)
        
        if found:
            logger.debug(f"Found {len(found)} research agendas")
        else:
            logger.warning("No research agendas found")
        
        return found
    
    def _extract_sdgs(self, text):
        """Extract Sustainable Development Goal numbers (1-17)"""
        # Look for patterns like "SDG 1", "SDG-3", "SDG No. 5", etc.
        patterns = [
            r'SDG[^\d]*(\d{1,2})',
            r'SUSTAINABLE\s+DEVELOPMENT\s+GOAL[^\d]*(\d{1,2})',
        ]
        
        found_sdgs = set()
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for num in matches:
                sdg_num = int(num)
                if 1 <= sdg_num <= 17:
                    found_sdgs.add(sdg_num)
        
        result = sorted(list(found_sdgs))
        if result:
            logger.debug(f"Found SDGs: {result}")
        else:
            logger.warning("No SDGs found")
        
        return result
    
    def _extract_budget(self, text):
        """Extract budget amount in PHP"""
        patterns = [
            r'(?:BUDGET|TOTAL\s+BUDGET|PROPOSED\s+BUDGET)\s*[:]\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{2})?)',
            r'(?:PHP|₱)\s*([\d,]+(?:\.\d{2})?)',
            r'(?:AMOUNT|FUNDING)\s*[:]\s*(?:PHP|₱)?\s*([\d,]+(?:\.\d{2})?)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
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

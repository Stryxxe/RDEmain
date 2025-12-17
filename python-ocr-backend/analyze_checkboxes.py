"""
Analyze PDF checkboxes visually to detect marked items
"""

import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from pdf2image import convert_from_bytes

def analyze_checkboxes():
    """Analyze PDF to visually detect checked boxes"""
    
    pdf_path = Path(__file__).parent.parent / '.qodo' / 'FM-USeP-MRDI-01 Research Proposal Form.pdf'
    
    if not pdf_path.exists():
        print(f"❌ PDF not found: {pdf_path}")
        return
    
    print(f"📄 Analyzing: {pdf_path.name}")
    print("=" * 80)
    
    # Convert PDF to images
    with open(pdf_path, 'rb') as f:
        pdf_bytes = f.read()
    
    images = convert_from_bytes(pdf_bytes, dpi=300)
    
    print(f"✓ Converted to {len(images)} pages at 300 DPI")
    
    # Save pages as images for visual inspection
    output_dir = Path(__file__).parent / 'pdf_pages'
    output_dir.mkdir(exist_ok=True)
    
    for i, img in enumerate(images, 1):
        # Save page image
        page_path = output_dir / f'page_{i}.png'
        img.save(str(page_path), 'PNG')
        print(f"✓ Saved page {i}: {page_path.name} ({img.size[0]}x{img.size[1]})")
    
    print(f"\n✓ All pages saved to: {output_dir.absolute()}")
    print("\n" + "=" * 80)
    print("MANUAL INSPECTION INSTRUCTIONS:")
    print("=" * 80)
    print("Please open the saved images and identify:")
    print("1. Which SDG checkboxes are CHECKED (marked with X or filled)")
    print("2. Which Research Agenda checkboxes are CHECKED")
    print("3. Which 6Ps checkboxes are CHECKED")
    print(f"\nImages location: {output_dir.absolute()}")
    
    # Open first page
    print(f"\nOpening page 1 for inspection...")
    os.startfile(str(output_dir / 'page_1.png'))

if __name__ == '__main__':
    analyze_checkboxes()

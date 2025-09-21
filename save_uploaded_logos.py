#!/usr/bin/env python3
"""
Script to save uploaded Maku.Travel logos from the attachment system
to the appropriate locations in the frontend application.
"""

import base64
import os

# Directory to save logos
LOGOS_DIR = "/app/frontend/public/logos/"

# Ensure directory exists
os.makedirs(LOGOS_DIR, exist_ok=True)

def save_logo_from_base64(base64_data: str, filename: str):
    """Save a base64 encoded image to the logos directory."""
    try:
        # Remove data:image/png;base64, prefix if present
        if base64_data.startswith('data:image'):
            base64_data = base64_data.split(',')[1]
        
        # Decode base64 to binary
        image_data = base64.b64decode(base64_data)
        
        # Save to file
        filepath = os.path.join(LOGOS_DIR, filename)
        with open(filepath, 'wb') as f:
            f.write(image_data)
        
        print(f"✅ Saved {filename} to {filepath}")
        return True
    
    except Exception as e:
        print(f"❌ Error saving {filename}: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Logo extraction script ready")
    print("This script will extract uploaded logos from the attachment system")
    print("and save them to the appropriate locations in the frontend application.")
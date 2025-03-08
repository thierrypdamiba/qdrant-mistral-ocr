import requests
import json
import base64
import mimetypes
import os
import tempfile
from api.config import MISTRAL_API_KEY
from fastapi import HTTPException
from mistralai import Mistral

async def extract_text_from_file(file):
    """
    Extract text from an image or PDF using Mistral OCR API
    """
    if not MISTRAL_API_KEY:
        raise HTTPException(status_code=500, detail="Mistral API key not configured")
    
    try:
        # Reset file position before reading
        file.file.seek(0)
        file_content = file.file.read()
        
        # Determine the file type
        file_extension = file.filename.split('.')[-1].lower()
        mime_type = mimetypes.guess_type(file.filename)[0] or 'image/jpeg'
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix=f'.{file_extension}', delete=False) as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        try:
            # Initialize Mistral client
            client = Mistral(api_key=MISTRAL_API_KEY)
            
            # Upload the file
            uploaded_file = client.files.upload(
                file={
                    "file_name": file.filename,
                    "content": open(temp_file_path, "rb"),
                },
                purpose="ocr"
            )
            
            # Get the signed URL for the uploaded file
            signed_url = client.files.get_signed_url(file_id=uploaded_file.id)
            
            # Process with OCR
            ocr_model = "mistral-ocr-latest"
            
            try:
                # Process the file with OCR
                if file_extension == 'pdf':
                    response = client.ocr.process(
                        model=ocr_model,
                        document={
                            "type": "document_url",
                            "document_url": signed_url.url
                        }
                    )
                else:
                    response = client.ocr.process(
                        model=ocr_model,
                        document={
                            "type": "image_url",
                            "image_url": signed_url.url
                        }
                    )
                
                # Extract text from the response
                extracted_text = "\n\n".join([f"### Page {i+1}\n{response.pages[i].markdown}" for i in range(len(response.pages))])
                
                if not extracted_text:
                    raise HTTPException(status_code=500, detail=f"No text was extracted from the {file_extension} file")
                
                return extracted_text
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"OCR processing error: {str(e)}")
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document processing error: {str(e)}")

# Maintain backward compatibility
async def extract_text_from_image(file):
    """Legacy function name, use extract_text_from_file instead"""
    return await extract_text_from_file(file)
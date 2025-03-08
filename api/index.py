from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Literal
from enum import Enum

from api.ocr import extract_text_from_image
from api.embeddings import generate_embedding
from api.storage import store_document, search_documents, get_document_by_id

### Create FastAPI instance
app = FastAPI(docs_url="/docs", openapi_url="/openapi.json")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://danek-app.vercel.app",  # Add your Vercel deployment URL here
        "https://danek-1yd7ykrzr-amoeba-labs.vercel.app",
        "https://danek-67qlrugkw-amoeba-labs.vercel.app",
        "https://danek-b130tzill-amoeba-labs.vercel.app",
        "https://danek.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DocType(str, Enum):
    NOTE = "note"
    DOCUMENT = "document"
    
class SearchTarget(str, Enum):
    NOTES = "notes"
    DOCUMENTS = "documents"
    BOTH = "both"

class SearchQuery(BaseModel):
    query: str
    limit: Optional[int] = 5
    search_target: Optional[SearchTarget] = SearchTarget.BOTH
    source_type: Optional[DocType] = None
    
class SimilarQuery(BaseModel):
    document_id: str
    limit: Optional[int] = 5
    search_target: Optional[SearchTarget] = SearchTarget.BOTH

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/hello")
def hello_fast_api():
    return {"message": "Hello from FastAPI"}

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(None),
    doc_type: DocType = Form(...)
):
    """
    Upload a document or note, extract text using OCR, generate embedding, and store in Qdrant
    """
    # Extract text using OCR
    text = await extract_text_from_image(file)
    
    # Generate embedding
    embedding = await generate_embedding(text)
    
    # Store in Qdrant
    metadata = {"title": title} if title else {}
    result = await store_document(text, embedding, doc_type, metadata)
    
    return {
        "id": result["id"],
        "text": result["text"],
        "doc_type": result["doc_type"],
        "message": f"{doc_type.capitalize()} processed and stored successfully"
    }

@app.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    doc_type: DocType = Form(...)
):
    """
    Extract text from an uploaded file without storing it (for search-by-image)
    """
    # Extract text using OCR
    text = await extract_text_from_image(file)
    
    return {
        "text": text,
        "doc_type": doc_type
    }

@app.post("/search")
async def search(query: SearchQuery):
    """
    Search for documents or notes using a text query
    """
    # Generate embedding for query
    query_embedding = await generate_embedding(query.query)
    
    # Determine target type for filtering
    target_type = None
    if query.search_target == SearchTarget.NOTES:
        target_type = DocType.NOTE
    elif query.search_target == SearchTarget.DOCUMENTS:
        target_type = DocType.DOCUMENT
    
    # Search with appropriate filtering
    results = await search_documents(
        query_embedding, 
        target_type=target_type,
        source_type=query.source_type,
        limit=query.limit
    )
    
    return {
        "query": query.query,
        "search_target": query.search_target,
        "results": results
    }

@app.post("/similar")
async def find_similar(query: SimilarQuery):
    """
    Find documents or notes similar to a specific document
    """
    try:
        # Get the document by ID
        source_document = await get_document_by_id(query.document_id)
        
        # Check if vector is available
        if not source_document["vector"]:
            # If vector is not available, we need to generate it from the text
            if not source_document["text"]:
                raise HTTPException(status_code=500, detail="Document has no text to generate embedding from")
            
            # Generate embedding from text
            source_document["vector"] = await generate_embedding(source_document["text"])
        
        # Determine target type for filtering
        target_type = None
        if query.search_target == SearchTarget.NOTES:
            target_type = DocType.NOTE
        elif query.search_target == SearchTarget.DOCUMENTS:
            target_type = DocType.DOCUMENT
        
        # Use the document's vector to search for similar documents
        results = await search_documents(
            source_document["vector"], 
            target_type=target_type,
            # Use the document's type as the source type for logging
            source_type=source_document["doc_type"],
            limit=query.limit + 1  # +1 because the document itself will be returned
        )
        
        # Filter out the source document from results
        filtered_results = [r for r in results if r["id"] != query.document_id]
        
        # If we requested more results than we got after filtering, it's ok
        # We'll just return what we have
        
        return {
            "source_document": {
                "id": source_document["id"],
                "text": source_document["text"],
                "doc_type": source_document["doc_type"],
                "title": source_document["title"],
            },
            "search_target": query.search_target,
            "results": filtered_results[:query.limit]  # Ensure we don't return more than requested
        }
    except HTTPException as e:
        # Pass through HTTP exceptions
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find similar documents: {str(e)}")
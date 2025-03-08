from qdrant_client import QdrantClient
from qdrant_client.http import models
from api.config import QDRANT_URL, QDRANT_API_KEY, COLLECTION_NAME
from fastapi import HTTPException
import uuid

# Initialize Qdrant client
qdrant_client = None

def get_qdrant_client():
    """
    Get or initialize the Qdrant client
    """
    global qdrant_client
    if qdrant_client is None:
        if not QDRANT_URL or not QDRANT_API_KEY:
            raise HTTPException(status_code=500, detail="Qdrant URL or API key not configured")
        
        try:
            qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
            
            # Check if collection exists, if not create it
            collections = qdrant_client.get_collections().collections
            collection_names = [collection.name for collection in collections]
            
            if COLLECTION_NAME not in collection_names:
                qdrant_client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=models.VectorParams(
                        size=768,  # Size of BAAI/bge-base-en-v1.5 embeddings
                        distance=models.Distance.COSINE
                    )
                )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to initialize Qdrant client: {str(e)}")
    
    return qdrant_client

async def store_document(text, embedding, doc_type, metadata=None):
    """
    Store a document with its embedding in Qdrant
    
    Parameters:
    - text: The extracted text
    - embedding: The vector embedding
    - doc_type: The document type ("note" or "document")
    - metadata: Additional metadata (optional)
    """
    client = get_qdrant_client()
    
    # Generate a unique ID
    doc_id = str(uuid.uuid4())
    
    # Prepare metadata
    payload = {
        "text": text,
        "doc_type": doc_type  # "note" or "document"
    }
    if metadata:
        payload.update(metadata)
    
    try:
        client.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                models.PointStruct(
                    id=doc_id,
                    vector=embedding,
                    payload=payload
                )
            ]
        )
        return {"id": doc_id, "text": text, "doc_type": doc_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store document: {str(e)}")
        
# Maintain backward compatibility
async def store_note(text, embedding, metadata=None):
    """Legacy function, use store_document instead"""
    return await store_document(text, embedding, "note", metadata)

async def search_documents(query_embedding, target_type=None, source_type=None, limit=5):
    """
    Search for documents using a query embedding with filtering options
    
    Parameters:
    - query_embedding: The embedding vector to search with
    - target_type: Filter results by document type ("note", "document", or None for both)
    - source_type: For logging/tracking purposes, the type of the source document
    - limit: Maximum number of results to return
    """
    client = get_qdrant_client()
    
    try:
        # Prepare filter condition if target type is specified
        filter_condition = None
        if target_type:
            filter_condition = models.Filter(
                must=[
                    models.FieldCondition(
                        key="doc_type",
                        match=models.MatchValue(value=target_type)
                    )
                ]
            )
        
        # In Qdrant client v1.13.3, the parameter is 'query_filter' instead of 'filter'
        results = client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            limit=limit,
            query_filter=filter_condition
        )
        
        return [
            {
                "id": hit.id,
                "text": hit.payload.get("text", ""),
                "doc_type": hit.payload.get("doc_type", "unknown"),
                "title": hit.payload.get("title", ""),
                "score": hit.score
            }
            for hit in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

# Maintain backward compatibility
async def search_notes(query_embedding, limit=5):
    """Legacy function, use search_documents instead"""
    return await search_documents(query_embedding, target_type=None, limit=limit)

async def get_document_by_id(document_id):
    """
    Retrieve a document by its ID
    
    Parameters:
    - document_id: The unique identifier of the document to retrieve
    """
    client = get_qdrant_client()
    
    try:
        # Search for the document with the given ID
        points = client.retrieve(
            collection_name=COLLECTION_NAME,
            ids=[document_id],
            with_vectors=True
        )
        
        if not points:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")
        
        point = points[0]
        
        return {
            "id": point.id,
            "vector": point.vector,
            "text": point.payload.get("text", ""),
            "doc_type": point.payload.get("doc_type", "unknown"),
            "title": point.payload.get("title", ""),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve document: {str(e)}")
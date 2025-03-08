from fastembed import TextEmbedding
from fastapi import HTTPException

# Initialize the embedding model
embedder = None

def get_embedder():
    """
    Get or initialize the embedding model
    """
    global embedder
    if embedder is None:
        try:
            embedder = TextEmbedding(model_name="BAAI/bge-base-en-v1.5")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to initialize embedding model: {str(e)}")
    return embedder

async def generate_embedding(text):
    """
    Generate embedding for a text
    """
    try:
        embedder = get_embedder()
        embedding = list(embedder.embed([text]))[0]
        return embedding.tolist()  # Convert numpy array to list for JSON serialization
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation error: {str(e)}")
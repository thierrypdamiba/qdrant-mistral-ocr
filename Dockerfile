FROM python:3.10-slim

WORKDIR /app

# Copy just the requirements file first to leverage Docker cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY api/ ./api/

# Create a config.py file if it doesn't exist
RUN if [ ! -f api/config.py ]; then \
    echo 'MISTRAL_API_KEY = ""' > api/config.py && \
    echo 'QDRANT_URL = ""' >> api/config.py && \
    echo 'QDRANT_API_KEY = ""' >> api/config.py && \
    echo 'COLLECTION_NAME = "danek_documents"' >> api/config.py; \
    fi

# Install uvicorn server for production
RUN pip install --no-cache-dir uvicorn

# Expose the port the app will run on
EXPOSE 8080

# Command to run the application
CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8080"]
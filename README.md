# Qdrant Mistral OCR

A powerful application for uploading, processing, and searching handwritten notes and reference materials using AI, powered by FastEmbed & Mistral OCR.

## Features

- **Smart Text Extraction**: Upload PDFs or images of your handwritten notes and reference documents. Both PDFs and images are processed using Mistral's OCR API for accurate text extraction.
- **Embeddings with FastEmbed**: The extracted text is converted into vector embeddings that capture semantic meaning, enabling rich content matching.
- **Smart Search with Qdrant**: Search across your documents and notes, or filter by document type to find exactly what you need through semantic search.
- **Similar Document Search**: Find documents similar to any note or reference document with a single click.
- **Search by Image**: Upload an image directly in the search bar to find related content.

## Architecture

This application is split into two parts:
1. **Frontend**: Next.js application deployed on Vercel
2. **Backend**: FastAPI service deployed on Fly.io

## Document Classification

The application distinguishes between two types of documents:

- **Handwritten Notes**: Your personal notes, class notes, meeting notes, to-do lists, and other handwritten content.
- **Reference Documents**: Textbooks, articles, research papers, and other reference materials you want to search against.

## Technology Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: FastAPI (Python)
- **OCR**: Mistral OCR API
- **Embeddings**: FastEmbed with BAAI/bge-base-en model
- **Vector Database**: Qdrant
- **Deployment**: Vercel (frontend) and Fly.io (backend)

## Deployment Guide

### Backend Deployment (Fly.io)

1. Install the Fly CLI: https://fly.io/docs/hands-on/install-flyctl/

2. Login to Fly.io:
```bash
fly auth login
```

3. Launch the app (first time only):
```bash
fly launch
```

4. Set up secrets for your API keys:
```bash
fly secrets set MISTRAL_API_KEY=your_mistral_api_key
fly secrets set QDRANT_URL=your_qdrant_cloud_url
fly secrets set QDRANT_API_KEY=your_qdrant_api_key
fly secrets set COLLECTION_NAME=notes
```

5. Deploy the app:
```bash
fly deploy
```

### Frontend Deployment (Vercel)

1. Set environment variables on Vercel:
   - `API_BASE_URL`: Your Fly.io app URL (e.g., https://your-app.fly.dev)

2. Deploy to Vercel:
```bash
vercel
```

## Local Development

### Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- Mistral API key
- Qdrant account (cloud or self-hosted)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Backend
MISTRAL_API_KEY=your_mistral_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
COLLECTION_NAME=notes

# Frontend (for local development)
API_BASE_URL=http://localhost:8080
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/thierrypdamiba/qdrant-mistral-ocr.git
cd qdrant-mistral-ocr
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
pip install -r requirements.txt
```

### Running the Application

1. Start the FastAPI backend:
```bash
python -m uvicorn api.index:app --reload --port 8080
```

2. In a separate terminal, start the Next.js frontend:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## API Documentation

When running locally, the API documentation is available at `http://localhost:8080/docs`.

## Recent Updates

- **April 2025**: Added support for PDF processing using Mistral's OCR API
- **March 2025**: Updated OCR processing to use Mistral OCR API instead of the deprecated Document API
- **March 2025**: Improved UI for upload success and error messages
- **March 2025**: Added better error handling for file uploads

## Troubleshooting

### Common Issues

- **Upload fails**: Ensure your Mistral API key is valid and has sufficient credits
- **Search returns no results**: Check that your Qdrant instance is properly configured and accessible
- **OCR quality issues**: For best results, ensure images are clear and well-lit

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Mistral AI for their OCR API
- FastEmbed for the embedding model
- Qdrant for the vector database
- Next.js team for the frontend framework
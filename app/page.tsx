import dynamic from "next/dynamic";
import Image from "next/image";

// Import components with dynamic loading to prevent hydration errors and enable code splitting
const NoteUpload = dynamic(() => import("./components/NoteUpload"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse h-96 w-full bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading upload component...</div>
    </div>
  ),
});

const NoteSearch = dynamic(() => import("./components/NoteSearch"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse h-96 w-full bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading search component...</div>
    </div>
  ),
});

// Add page metadata for better performance
export const metadata = {
  title: 'Qdrant Quill - Smart Document Capture & Search',
  description: "Upload, process, and search your handwritten notes and reference materials powered by Qdrant search and Mistral OCR.",
};

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero section */}
      <section className="bg-background border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
              <a href="https://qdrant.tech" target="_blank" rel="noopener noreferrer" className="text-amaranth hover:text-amaranth/80">Qdrant</a> Quill
            </h1>
            <h2 className="text-lg md:text-xl font-medium text-gray-500 mb-3">
              Document Capture & Semantic Search
            </h2>
            <div className="max-w-3xl mx-auto mb-4">
              <p className="text-sm text-gray-600 italic">
                Empowering organizations to transform documents into actionable knowledge — from scientific research and historical preservation to customer service and technical literature across design, education, and legal fields.
              </p>
            </div>
            <p className="max-w-4xl mx-auto text-md text-gray-600">
              Upload, process, and search your handwritten notes and reference materials powered by <a href="https://qdrant.tech" target="_blank" rel="noopener noreferrer" className="text-amaranth font-medium hover:underline">Qdrant</a> search and <a href="https://mistral.ai/en/news/mistral-ocr" target="_blank" rel="noopener noreferrer" className="text-[#2F6FF0] hover:underline">Mistral OCR</a>.
            </p>
          </div>
        </div>
      </section>
      
      {/* Main app section */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card px-6 pt-6 pb-16 bg-background border border-gray-200 rounded-lg shadow-sm flex flex-col">
              <NoteUpload />
            </div>
            
            <div className="card px-6 pt-6 pb-16 bg-background border border-gray-200 rounded-lg shadow-sm flex flex-col">
              <NoteSearch />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section className="py-12 bg-background border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How It <span className="text-amaranth">Works</span></h2>
            <p className="max-w-2xl mx-auto text-gray-600">
              Qdrant Quill uses advanced AI technologies to make your notes and documents
              searchable and interconnected.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="card p-6 h-full flex flex-col bg-background border border-gray-200 rounded-lg shadow-sm">
                <span className="absolute -top-4 -left-4 w-12 h-12 bg-amaranth text-background rounded-full flex items-center justify-center text-xl font-semibold shadow-md">1</span>
                <h3 className="text-xl font-semibold text-foreground mb-3 mt-3">Smart Text Extraction</h3>
                <p className="text-gray-600 flex-grow">
                  Upload PDFs or images of your handwritten notes and reference documents. 
                  Mistral&apos;s OCR technology extracts text with high accuracy.
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-amaranth">Powered by Mistral OCR</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="card p-6 h-full flex flex-col bg-background border border-gray-200 rounded-lg shadow-sm">
                <span className="absolute -top-4 -left-4 w-12 h-12 bg-amaranth text-background rounded-full flex items-center justify-center text-xl font-semibold shadow-md">2</span>
                <h3 className="text-xl font-semibold text-foreground mb-3 mt-3">Vector Embeddings</h3>
                <p className="text-gray-600 flex-grow">
                  Extracted text is converted into vector embeddings that capture semantic meaning,
                  enabling more intelligent search beyond keyword matching.
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-amaranth">Using <a href="https://github.com/qdrant/fastembed" target="_blank" rel="noopener noreferrer" className="text-[#2F6FF0] hover:underline">FastEmbed</a> & <a href="https://huggingface.co/BAAI/bge-base-en" target="_blank" rel="noopener noreferrer" className="text-[#2F6FF0] hover:underline">BAAI/bge model</a></span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="card p-6 h-full flex flex-col bg-background border border-gray-200 rounded-lg shadow-sm">
                <span className="absolute -top-4 -left-4 w-12 h-12 bg-amaranth text-background rounded-full flex items-center justify-center text-xl font-semibold shadow-md">3</span>
                <h3 className="text-xl font-semibold text-foreground mb-3 mt-3">Semantic Search</h3>
                <p className="text-gray-600 flex-grow">
                  Find content by meaning rather than exact wording. Search across your documents,
                  find similar content, or filter by document type.
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-amaranth">Built with Qdrant vector database</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Document types section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Document <span className="text-amaranth">Classification</span></h2>
            <p className="max-w-2xl mx-auto text-gray-600">
              Qdrant Quill organizes your content into two main categories:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card p-8 border border-gray-200 rounded-lg shadow-sm bg-background hover:border-l-4 hover:border-l-amaranth transition-all">
              <div className="flex items-center mb-4">
                <svg className="h-8 w-8 text-amaranth mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-foreground">Handwritten Notes</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Your personal notes, class notes, meeting notes, to-do lists, and other handwritten content.
                Capture your thoughts and ideas in your own handwriting and make them searchable.
              </p>
              <span className="badge badge-amaranth inline-flex px-2 py-1 text-xs font-medium rounded-md">Notes</span>
            </div>
            
            <div className="card p-8 border border-gray-200 rounded-lg shadow-sm bg-background hover:border-l-4 hover:border-l-amaranth transition-all">
              <div className="flex items-center mb-4">
                <svg className="h-8 w-8 text-amaranth mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <h3 className="text-xl font-semibold text-foreground">Reference Documents</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Textbooks, articles, research papers, and other reference materials you want to search against.
                Make your learning materials and resources easily accessible.
              </p>
              <span className="badge badge-amaranth inline-flex px-2 py-1 text-xs font-medium rounded-md">Documents</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

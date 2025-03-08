'use client';

import { useState, useEffect, KeyboardEvent } from 'react';

// Define search options
type SearchTarget = 'both' | 'notes' | 'documents';

export default function NoteSearch() {
  const [query, setQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState<SearchTarget>('both');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isFirstSearch, setIsFirstSearch] = useState(true);
  const [apiReady, setApiReady] = useState(false);

  // Helper function to truncate long text
  const truncateText = (text: string, maxLength: number = 200) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Check API health when component mounts
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        // Make a direct fetch call to avoid caching issues
        const response = await fetch('/api/py/health', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (response.ok) {
          setApiReady(true);
        } else {
          // If health check fails, try again after a delay
          setTimeout(() => checkApiHealth(), 2000);
        }
      } catch (error) {
        console.warn('API health check failed, will retry shortly');
        // If health check fails, try again after a delay
        setTimeout(() => checkApiHealth(), 2000);
      }
    };

    checkApiHealth();
  }, []);

  // Handle key press in textarea
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // If Enter is pressed without Shift key, submit the form
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default behavior (new line)
      handleSearch(e);
    }
    // Shift+Enter will still add a new line as normal
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      if (selectedFile) {
        // Process the file to extract text
        await processFile(selectedFile);
      }
    }
  };
  
  const processFile = async (file: File) => {
    setFileProcessing(true);
    setError(null);
    
    try {
      // Validate file size first
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File too large. Please upload a file smaller than 10MB.');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', 'document'); // Temporary type for processing

      // Use our retry function for better reliability
      const response = await fetchWithRetry('/api/py/extract-text', {
        method: 'POST',
        body: formData,
      }, 1); // Only retry once for OCR as it's a heavy operation
      
      const data = await response.json();
      
      if (data.text) {
        setExtractedText(data.text);
        
        // Truncate very long texts to improve performance
        const truncatedText = data.text.length > 1000 
          ? data.text.substring(0, 1000) + '...' 
          : data.text;
          
        setQuery(truncatedText); // Automatically set the query to the extracted text
      } else {
        throw new Error('No text was extracted from the image');
      }
    } catch (err: any) {
      // Handle AbortController timeout
      if (err.name === 'AbortError') {
        setError('Text extraction timed out. Please try again with a simpler image.');
      } else {
        setError(err.message || 'An error occurred while processing the image');
      }
      setExtractedText(null);
    } finally {
      setFileProcessing(false);
    }
  };

  // Reusable fetch with retry logic
  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 2) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create a new AbortController for each attempt
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const fetchOptions = {
          ...options,
          signal: controller.signal
        };
        
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Search failed`;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorMessage;
          } catch (parseError) {
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }
        
        return response;
      } catch (err: any) {
        lastError = err;
        
        // If it's not a timeout error, or we've used all retries, throw
        if (err.name !== 'AbortError' || attempt === maxRetries) {
          throw err;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
    
    throw lastError;
  };

  const handleSearch = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a search query or upload an image');
      return;
    }

    // Don't search if already loading
    if (loading) return;

    setLoading(true);
    setError(null);
    
    // For first search, ensure API is ready
    if (isFirstSearch && !apiReady) {
      try {
        // Force a health check before proceeding
        const healthResponse = await fetch('/api/py/health', { 
          method: 'GET',
          cache: 'no-store'
        });
        
        if (healthResponse.ok) {
          setApiReady(true);
        } else {
          // Wait a moment for API to initialize
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (err) {
        console.warn('Health check failed before first search');
        // Continue anyway - the search might still work
      }
    }
    
    // Prepare search data
    const searchData = {
      query: query.trim(),
      search_target: searchTarget,
      limit: 10,
    };
    
    try {
      // Use custom fetch with retry logic - more retries for first search
      const response = await fetchWithRetry('/api/py/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      }, isFirstSearch ? 3 : 2); // More retries on first search
      
      // Directly parse JSON response
      const data = await response.json();
      
      setIsFirstSearch(false);
      setResults(data.results || []);
      
      if (data.results.length === 0) {
        setError('No matching results found');
      }
    } catch (err: any) {
      // Handle errors
      if (err.name === 'AbortError') {
        setError('Search request timed out. Please try again.');
      } else {
        setError(`Search failed: ${err.message || 'Unknown error'}`);
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  const clearFile = () => {
    setFile(null);
    setExtractedText(null);
    // Reset the file input
    const fileInput = document.getElementById('search-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const getSearchTargetLabel = () => {
    switch (searchTarget) {
      case 'notes': return 'Handwritten Notes';
      case 'documents': return 'Reference Documents';
      default: return 'All Documents';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4">Find Documents</h2>
      
      <form onSubmit={handleSearch} className="flex flex-col flex-grow">
        <div className="flex-grow space-y-4">
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
              Enter your search
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={extractedText ? 2 : 1}
                className="block w-full pl-10 pr-4 py-2 border-0 bg-transparent text-gray-900 placeholder-gray-500 focus:ring-0"
                placeholder="Type what you're looking for... (Press Enter to search)"
              />
            </div>
            
            <div className="mt-1 text-center">
              <span className="text-xs text-gray-500">Press Enter to search or Shift+Enter for new line • Or upload an image below</span>
            </div>
          </div>
          
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-gray-700">Search with a photo</span>
              {file && (
                <button
                  type="button"
                  onClick={clearFile}
                  className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear
                </button>
              )}
            </div>
            
            {!file && !fileProcessing && !extractedText ? (
              <div 
                onClick={() => document.getElementById('search-file')?.click()}
                className="flex justify-center px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 transition-colors cursor-pointer bg-white"
              >
                <div className="space-y-2 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  
                  <div className="flex flex-col items-center text-sm">
                    <span className="font-medium text-gray-700">Upload a photo</span>
                    <span className="text-xs text-gray-500">We&apos;ll extract the text for you</span>
                  </div>
                  
                  <input
                    type="file"
                    id="search-file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 border-2 border-gray-200 rounded-lg bg-white">
                {fileProcessing && (
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      <svg className="animate-spin h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-700">Scanning document...</p>
                      <p className="text-xs text-gray-500">Extracting text from your image</p>
                    </div>
                  </div>
                )}
                
                {file && !fileProcessing && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-700">{file.name}</p>
                      <p className="text-xs text-gray-500">Ready to search</p>
                    </div>
                  </div>
                )}
                
                {extractedText && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-gray-600">Text extracted and added to search</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-2 flex p-2 bg-gray-100 rounded-md border border-gray-300">
              <div className="flex-shrink-0 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-600">
                Upload any photo of handwritten notes to find similar documents
              </p>
            </div>
          </div>
          
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="font-medium text-gray-700">Filter by type</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div 
                className={`relative overflow-hidden rounded-lg border-2 ${searchTarget === 'both' ? 'border-gray-800 bg-gray-50' : 'border-gray-300'} cursor-pointer transition-all hover:border-gray-400`}
                onClick={() => setSearchTarget('both')}
              >
                <input
                  id="search-both"
                  name="search_target"
                  type="radio"
                  checked={searchTarget === 'both'}
                  onChange={() => setSearchTarget('both')}
                  className="sr-only"
                />
                
                <div className="p-3 flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${searchTarget === 'both' ? 'text-gray-800' : 'text-gray-400'} mb-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className={`text-xs font-medium ${searchTarget === 'both' ? 'text-gray-800' : 'text-gray-600'}`}>All</span>
                </div>
                
                {searchTarget === 'both' && (
                  <div className="absolute top-1 right-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div 
                className={`relative overflow-hidden rounded-lg border-2 ${searchTarget === 'notes' ? 'border-gray-800 bg-gray-50' : 'border-gray-300'} cursor-pointer transition-all hover:border-gray-400`}
                onClick={() => setSearchTarget('notes')}
              >
                <input
                  id="search-notes"
                  name="search_target"
                  type="radio"
                  checked={searchTarget === 'notes'}
                  onChange={() => setSearchTarget('notes')}
                  className="sr-only"
                />
                
                <div className="p-3 flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${searchTarget === 'notes' ? 'text-gray-800' : 'text-gray-400'} mb-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className={`text-xs font-medium ${searchTarget === 'notes' ? 'text-gray-800' : 'text-gray-600'}`}>Notes</span>
                </div>
                
                {searchTarget === 'notes' && (
                  <div className="absolute top-1 right-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div 
                className={`relative overflow-hidden rounded-lg border-2 ${searchTarget === 'documents' ? 'border-gray-800 bg-gray-50' : 'border-gray-300'} cursor-pointer transition-all hover:border-gray-400`}
                onClick={() => setSearchTarget('documents')}
              >
                <input
                  id="search-documents"
                  name="search_target"
                  type="radio"
                  checked={searchTarget === 'documents'}
                  onChange={() => setSearchTarget('documents')}
                  className="sr-only"
                />
                
                <div className="p-3 flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${searchTarget === 'documents' ? 'text-gray-800' : 'text-gray-400'} mb-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className={`text-xs font-medium ${searchTarget === 'documents' ? 'text-gray-800' : 'text-gray-600'}`}>Docs</span>
                </div>
                
                {searchTarget === 'documents' && (
                  <div className="absolute top-1 right-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-auto pt-4 pb-8">
          <button
            type="submit"
            disabled={loading || fileProcessing || (!query.trim() && !file)}
            className={`h-14 py-3 w-full rounded-lg text-center text-lg font-medium shadow-sm flex items-center justify-center ${loading || fileProcessing ? 'bg-gray-500 text-white' : (query.trim() || file) ? 'bg-amaranth text-white hover:bg-opacity-90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} transition-colors`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : fileProcessing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing image...
              </span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Now
              </>
            )}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="mt-4 p-4 bg-gray-50 text-gray-800 rounded-md border border-gray-300 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {results.length > 0 && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Search Results</h3>
            <span className="text-xs py-1 px-2 bg-amaranth text-white rounded-full">{results.length} found</span>
          </div>
          
          <div className="divide-y divide-gray-200">
            {results.map((result) => (
              <div key={result.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${result.doc_type === 'note' ? 'bg-amaranth bg-opacity-10 text-amaranth' : 'bg-amaranth bg-opacity-10 text-amaranth'}`}>
                      {result.doc_type === 'note' ? 'Note' : 'Document'}
                    </span>
                    {result.title && (
                      <h4 className="font-medium text-gray-900">{result.title}</h4>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    Match: {(result.score * 100).toFixed(0)}%
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">
                  {truncateText(result.text)}
                </p>
                
                <div className="flex justify-end">
                  <a 
                    href={`/similar/${result.id}`}
                    className="text-xs text-amaranth flex items-center hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                    </svg>
                    Find similar
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
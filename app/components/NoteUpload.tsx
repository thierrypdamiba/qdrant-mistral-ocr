'use client';

import { useState, useEffect } from 'react';

// Document type enum
type DocType = 'note' | 'document';

export default function NoteUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<DocType>('note');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [isFirstUpload, setIsFirstUpload] = useState(true);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      // Clear previous results and errors when a new file is selected
      setResult(null);
      setError(null);
    }
  };

  // Reusable fetch with retry logic
  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 2) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create a new AbortController for each attempt
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for upload operations (increased for large files)
        
        const fetchOptions = {
          ...options,
          signal: controller.signal
        };
        
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const status = response.status;
          const errorText = await response.text();
          let errorMessage = `Upload failed (Attempt ${attempt + 1}/${maxRetries + 1})`;
          
          // Handle specific HTTP status codes
          if (status === 502) {
            errorMessage = `Server unavailable (502 Bad Gateway). The API server might be down or restarting.`;
            console.error('Bad Gateway error detected');
            // For Bad Gateway, wait longer before retry
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.detail || errorMessage;
            } catch (parseError) {
              errorMessage = errorText || errorMessage;
            }
          }
          
          throw new Error(errorMessage);
        }
        
        return response;
      } catch (err: any) {
        lastError = err;
        
        // For network errors or gateway errors, add extra waiting time
        if (err.message && (err.message.includes('502') || err.message.includes('Bad Gateway'))) {
          console.log('Detected gateway error, waiting longer before retry...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // If it's not a timeout error, or we've used all retries, throw
        if (err.name !== 'AbortError' || attempt === maxRetries) {
          throw err;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        console.log(`Retrying upload (${attempt + 1}/${maxRetries})...`);
      }
    }
    
    throw lastError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Check if the server is responding before attempting upload
    try {
      const serverCheck = await fetch('/api/py/health', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        },
        // Short timeout for health check
        signal: AbortSignal.timeout(5000)
      });
      
      if (!serverCheck.ok) {
        throw new Error(`API server returned status: ${serverCheck.status}`);
      }
      setApiReady(true);
    } catch (err) {
      console.warn('Server health check failed before upload:', err);
      setError('The server appears to be unavailable. Please try again in a few moments.');
      setLoading(false);
      return;
    }

    // For first upload, ensure API is ready
    if (isFirstUpload && !apiReady) {
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
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err) {
        console.warn('Health check failed before first upload');
        // Continue anyway - the upload might still work
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    try {
      // Check file size before uploading
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File too large. Please upload a file smaller than 10MB.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      if (title) formData.append('title', title);

      // Use enhanced fetch with retry logic - more retries for first upload
      const response = await fetchWithRetry('/api/py/upload', {
        method: 'POST',
        body: formData,
      }, isFirstUpload ? 3 : 2); // More retries for first upload

      const data = await response.json();
      setIsFirstUpload(false);
      setResult(data);
      
      // Reset form after successful upload
      setFile(null);
      setTitle('');
      
      // Reset the file input
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err: any) {
      console.error('Upload error:', err);
      // Handle errors
      if (err.name === 'AbortError') {
        setError('Upload request timed out. Your file might be too large or the connection is slow.');
      } else if (err.message && err.message.includes('502')) {
        setError('Server unavailable (502 Bad Gateway). Please try again in a few minutes as the server might be restarting.');
      } else {
        setError(`Upload failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4">Add a Document</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
        <div className="flex-grow space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Give it a name (optional)
            </label>
            <input
              type="text"
              id="title"
              placeholder="My science notes, Math homework, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="font-medium text-gray-700">Document type</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div 
                className={`relative overflow-hidden rounded-lg border-2 ${docType === 'note' ? 'border-gray-800 bg-gray-50' : 'border-gray-300'} cursor-pointer transition-all hover:border-gray-400`}
                onClick={() => setDocType('note')}
              >
                <input
                  id="note-type"
                  name="doc_type"
                  type="radio"
                  checked={docType === 'note'}
                  onChange={() => setDocType('note')}
                  className="sr-only"
                />
                
                <div className="p-3 flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${docType === 'note' ? 'text-gray-800' : 'text-gray-400'} mb-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={docType === 'note' ? 2 : 1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className={`text-sm font-medium ${docType === 'note' ? 'text-gray-800' : 'text-gray-600'}`}>Handwritten Note</span>
                </div>
                
                {docType === 'note' && (
                  <div className="absolute top-1 right-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div 
                className={`relative overflow-hidden rounded-lg border-2 ${docType === 'document' ? 'border-gray-800 bg-gray-50' : 'border-gray-300'} cursor-pointer transition-all hover:border-gray-400`}
                onClick={() => setDocType('document')}
              >
                <input
                  id="document-type"
                  name="doc_type"
                  type="radio"
                  checked={docType === 'document'}
                  onChange={() => setDocType('document')}
                  className="sr-only"
                />
                
                <div className="p-3 flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${docType === 'document' ? 'text-gray-800' : 'text-gray-400'} mb-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={docType === 'document' ? 2 : 1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className={`text-sm font-medium ${docType === 'document' ? 'text-gray-800' : 'text-gray-600'}`}>Reference Document</span>
                </div>
                
                {docType === 'document' && (
                  <div className="absolute top-1 right-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="font-medium text-gray-700">Upload file</span>
            </div>
            
            <div className={`flex justify-center px-4 py-5 border-2 border-dashed rounded-lg cursor-pointer transition-all ${file ? 'border-gray-600 bg-gray-100' : 'border-gray-300 hover:border-gray-500 bg-white'}`}>
              <div className="space-y-2 text-center">
                {!file ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    
                    <div className="flex flex-col items-center text-sm text-gray-600">
                      <label
                        htmlFor="file"
                        className="relative cursor-pointer font-medium text-gray-800 hover:text-gray-900"
                      >
                        <span className="underline">Select a file</span>
                        <input
                          type="file"
                          id="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <span className="mt-1 text-gray-500">or drag and drop</span>
                    </div>
                    
                    <div className="flex justify-center space-x-2 text-xs text-gray-500">
                      <span className="flex items-center">PDF, JPG, PNG</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 text-sm text-left">{file.name}</p>
                      <button 
                        type="button"
                        onClick={() => {
                          setFile(null);
                          const fileInput = document.getElementById('file') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                        className="text-xs text-gray-600 hover:text-gray-800 underline text-left"
                      >
                        Change file
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-2 flex p-2 bg-gray-100 rounded-md border border-gray-300">
              <div className="flex-shrink-0 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-gray-600">
                We&apos;ll scan your document with AI to extract all the text
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-auto pt-4 pb-8">
          <button
            type="submit"
            disabled={loading || !file}
            className={`h-14 py-3 w-full rounded-lg text-center text-lg font-medium shadow-sm flex items-center justify-center ${loading ? 'bg-gray-500 text-white' : file ? 'bg-amaranth text-white hover:bg-opacity-90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} transition-colors`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="flex flex-col items-start">
                  <span>Processing your document...</span>
                  <span className="text-xs opacity-80">This may take up to 40 seconds</span>
                </span>
              </span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Upload Document
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
      
      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-300">
          <div className="flex items-center text-gray-800 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Document uploaded successfully!</span>
          </div>
          <p className="text-sm text-gray-600">
            Your {docType === 'note' ? 'handwritten note' : 'reference document'} has been processed and is now searchable.
          </p>
        </div>
      )}
    </div>
  );
}
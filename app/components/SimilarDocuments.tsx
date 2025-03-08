'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Define search options
type SearchTarget = 'both' | 'notes' | 'documents';

export default function SimilarDocuments({ documentId }: { documentId: string }) {
  const [searchTarget, setSearchTarget] = useState<SearchTarget>('both');
  const [loading, setLoading] = useState(true);
  const [sourceDocument, setSourceDocument] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const findSimilarDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/py/similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          search_target: searchTarget,
          limit: 5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to find similar documents');
      }

      const data = await response.json();
      setSourceDocument(data.source_document || null);
      setResults(data.results || []);
      
      if (data.results.length === 0) {
        setError('No similar documents found');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while finding similar documents');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [documentId, searchTarget]);

  useEffect(() => {
    findSimilarDocuments();
  }, [findSimilarDocuments]);

  const getSearchTargetLabel = () => {
    switch (searchTarget) {
      case 'notes': return 'Handwritten Notes';
      case 'documents': return 'Reference Documents';
      default: return 'All Documents';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Similar Documents</h2>
        <button
          onClick={() => window.history.back()}
          className="btn btn-outline py-1 px-3 text-sm"
        >
          ← Back
        </button>
      </div>
      
      {sourceDocument && (
        <div className="mb-8 card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {sourceDocument.doc_type === 'note' 
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  }
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {sourceDocument.title || 'Untitled'}
                </h3>
                <div className="flex space-x-2 mt-1">
                  <span className={`badge ${sourceDocument.doc_type === 'note' ? 'badge-gray' : 'badge-accent'}`}>
                    {sourceDocument.doc_type === 'note' ? 'Note' : 'Document'}
                  </span>
                  <span className="text-xs text-gray-500">{sourceDocument.id}</span>
                </div>
              </div>
            </div>
            
            <span className="text-xs text-gray-500 font-medium">Source Document</span>
          </div>
          
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-200 max-h-60 overflow-y-auto">
            {sourceDocument.text}
          </div>
        </div>
      )}
      
      <div className="mb-8 card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Similar Results</h3>
        
        <div className="grid grid-cols-3 gap-3">
          <div className={`border rounded-md p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${searchTarget === 'both' ? 'border-gray-800 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}
              onClick={() => setSearchTarget('both')}>
            <input
              id="search-both"
              name="search_target"
              type="radio"
              checked={searchTarget === 'both'}
              onChange={() => setSearchTarget('both')}
              className="sr-only"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <label htmlFor="search-both" className="block text-xs text-gray-700 text-center cursor-pointer">
              All Documents
            </label>
          </div>
          <div className={`border rounded-md p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${searchTarget === 'notes' ? 'border-gray-800 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}
              onClick={() => setSearchTarget('notes')}>
            <input
              id="search-notes"
              name="search_target"
              type="radio"
              checked={searchTarget === 'notes'}
              onChange={() => setSearchTarget('notes')}
              className="sr-only"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <label htmlFor="search-notes" className="block text-xs text-gray-700 text-center cursor-pointer">
              Notes Only
            </label>
          </div>
          <div className={`border rounded-md p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${searchTarget === 'documents' ? 'border-gray-800 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}
              onClick={() => setSearchTarget('documents')}>
            <input
              id="search-documents"
              name="search_target"
              type="radio"
              checked={searchTarget === 'documents'}
              onChange={() => setSearchTarget('documents')}
              className="sr-only"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <label htmlFor="search-documents" className="block text-xs text-gray-700 text-center cursor-pointer">
              Documents Only
            </label>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">Finding similar documents...</p>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="mt-6 p-4 bg-gray-50 text-gray-800 rounded-md border border-gray-300 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Similar {getSearchTargetLabel()}</h3>
                <span className="text-xs text-gray-500">{results.length} results</span>
              </div>
              
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={result.id} className="card p-5 hover:border-gray-400 transition-standard">
                    <div className="flex justify-between mb-3">
                      <div className="flex items-center">
                        <span className={`badge ${result.doc_type === 'note' ? 'badge-gray' : 'badge-accent'} mr-2`}>
                          {result.doc_type === 'note' ? 'Note' : 'Document'}
                        </span>
                        {result.title && (
                          <span className="text-sm font-medium text-gray-700">{result.title}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">
                          Similarity
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-gray-700 h-2 rounded-full" style={{ width: `${result.score * 100}%` }}></div>
                        </div>
                        <div className="text-xs text-gray-700 mt-1 font-medium">
                          {(result.score * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-200 max-h-40 overflow-y-auto mb-2">
                      {result.text}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        ID: {result.id}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.location.href = `/similar/${result.id}`}
                          className="btn btn-outline py-1 px-3 text-xs"
                        >
                          Find Similar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={() => window.history.back()}
          className="btn btn-outline"
        >
          ← Back to Search
        </button>
        
        {results.length > 0 && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="btn btn-secondary"
          >
            Back to Top
          </button>
        )}
      </div>
    </div>
  );
}
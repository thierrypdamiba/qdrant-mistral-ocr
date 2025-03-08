'use client';

import SimilarDocuments from '../../components/SimilarDocuments';

export default function SimilarPage({ params }: { params: { id: string } }) {
  return (
    <div className="w-full">
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-6 md:p-8">
            <SimilarDocuments documentId={params.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
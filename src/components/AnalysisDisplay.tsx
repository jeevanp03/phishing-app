import React from 'react';

interface AnalysisDisplayProps {
  analysis: string;
  isLoading?: boolean;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 text-gray-500">
        No analysis yet. Generate an email and click &quot;Analyze Email&quot; to see the results.
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="prose prose-sm max-w-none">
        {analysis.split('\n').map((line, i) => (
          <p key={i} className="mb-2">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}; 
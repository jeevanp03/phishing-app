import React, { useState } from 'react';

interface AnalysisDisplayProps {
  analysis: string;
  isLoading?: boolean;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, isLoading }) => {
  const [showRaw, setShowRaw] = useState(false);

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

  let parsed: any = null;
  try {
    parsed = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;
  } catch {
    parsed = null;
  }

  if (parsed && typeof parsed === 'object' && (parsed.riskScore !== undefined || parsed.isPhishing !== undefined)) {
    // Coerce riskScore/confidence to numbers, fallback to 50/0.5 if missing/NaN
    let riskScore = typeof parsed.riskScore === 'number' ? parsed.riskScore : parseFloat(parsed.riskScore);
    if (isNaN(riskScore) || riskScore === undefined || riskScore === null) riskScore = 50;
    let confidence = typeof parsed.confidence === 'number' ? parsed.confidence : parseFloat(parsed.confidence);
    if (isNaN(confidence) || confidence === undefined || confidence === null) confidence = 0.5;
    const isPhishing = parsed.isPhishing === true || parsed.isPhishing === 'true';
    const redFlags = Array.isArray(parsed.redFlags) ? parsed.redFlags : (parsed.redFlags ? [parsed.redFlags] : []);
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : (parsed.recommendations ? [parsed.recommendations] : []);
    const toolResults = parsed.toolResults;
    const scoringNotes = toolResults && toolResults.scoreEmail && Array.isArray(toolResults.scoreEmail.notes) ? toolResults.scoreEmail.notes : [];

    return (
      <div className="p-4 border rounded-lg bg-white">
        <div className="flex items-center gap-4 mb-2">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${isPhishing ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{isPhishing ? 'Phishing' : 'Safe'}</span>
          <button
            className="text-xs underline text-blue-500 ml-2"
            onClick={() => setShowRaw((v) => !v)}
            type="button"
          >
            {showRaw ? 'Hide Raw JSON' : 'Show Raw JSON'}
          </button>
        </div>
        <div className="mb-2 font-semibold text-sm">Risk Score: {isNaN(riskScore) ? 'N/A' : riskScore}</div>
        <div className="mb-2 text-xs">Confidence: {isNaN(confidence) ? 'N/A' : `${(confidence * 100).toFixed(1)}%`}</div>
        {redFlags.length > 0 && (
          <div className="mb-2">
            <div className="font-semibold text-xs">Red Flags:</div>
            <ul className="list-disc ml-5 text-xs text-gray-700">
              {redFlags.map((r: string, i: number) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
        {recommendations.length > 0 && (
          <div className="mb-2">
            <div className="font-semibold text-xs">Recommendations:</div>
            <ul className="list-disc ml-5 text-xs text-gray-700">
              {recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
        {scoringNotes.length > 0 && (
          <div className="mb-2">
            <div className="font-semibold text-xs">Scoring Notes:</div>
            <ul className="list-disc ml-5 text-xs text-gray-700">
              {scoringNotes.map((note: string, i: number) => <li key={i}>{note}</li>)}
            </ul>
          </div>
        )}
        {toolResults && (
          <div className="mb-2">
            <div className="font-semibold text-xs">Tool Details:</div>
            <pre className="bg-gray-50 rounded p-2 text-xs overflow-x-auto max-h-64">{JSON.stringify(toolResults, null, 2)}</pre>
          </div>
        )}
        {showRaw && (
          <div className="mt-2">
            <div className="font-semibold text-xs">Raw JSON:</div>
            <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto max-h-64">{JSON.stringify(parsed, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }

  // Fallback: plain text
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
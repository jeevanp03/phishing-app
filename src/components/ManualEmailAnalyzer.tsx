import { useState } from 'react';
import { AnalysisDisplay } from './AnalysisDisplay';

type AnalyzerMode = 'standard' | 'sophisticated';

export default function ManualEmailAnalyzer() {
  const [email, setEmail] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzerMode, setAnalyzerMode] = useState<AnalyzerMode>('standard');
  const [showTooltip, setShowTooltip] = useState(false);

  const handleAnalyze = async () => {
    if (!email.trim()) {
      setError('Please enter an email to analyze');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      
      let endpoint = '/api/analyze';
      if (analyzerMode === 'sophisticated') {
        endpoint = '/api/sophisticated-agentic-analyze';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze email');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Manual Email Analysis</h2>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <select
            value={analyzerMode}
            onChange={(e) => setAnalyzerMode(e.target.value as AnalyzerMode)}
            className="px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="standard">Standard Analysis</option>
            <option value="sophisticated">Sophisticated Agentic Analysis</option>
          </select>
          <span
            className="ml-1 text-blue-500 cursor-pointer relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            tabIndex={0}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" /><text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">i</text></svg>
            {showTooltip && (
              <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                <b>Standard:</b> Uses a fixed pipeline of traditional checks and LLM analysis.<br/>
                <b>Sophisticated:</b> Advanced agentic analysis with header analysis, domain reputation, content patterns, and link reputation checks.
              </span>
            )}
          </span>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${
          analyzerMode === 'sophisticated' ? 'bg-purple-100 text-purple-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {analyzerMode === 'sophisticated' ? 'Sophisticated' :
           'Standard'}
        </span>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Paste Email Content
        </label>
        <textarea
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Paste the email content here..."
          className="w-full h-64 p-3 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-6">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !email.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? 'Analyzing...' : `Analyze Email (${analyzerMode === 'sophisticated' ? 'Sophisticated' : 'Standard'})`}
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
        <AnalysisDisplay analysis={analysis} isLoading={isAnalyzing} />
      </div>
    </div>
  );
} 
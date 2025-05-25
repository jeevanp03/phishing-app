import { useState } from 'react';
import { AnalysisDisplay } from './AnalysisDisplay';

export default function ManualEmailAnalyzer() {
  const [email, setEmail] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!email.trim()) {
      setError('Please enter an email to analyze');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      const response = await fetch('/api/analyze', {
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
          {isAnalyzing ? 'Analyzing...' : 'Analyze Email'}
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
        <AnalysisDisplay analysis={analysis} isLoading={isAnalyzing} />
      </div>
    </div>
  );
} 
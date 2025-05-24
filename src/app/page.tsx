'use client';

import { useState } from 'react';
import { EmailDisplay } from '@/components/EmailDisplay';
import { AnalysisDisplay } from '@/components/AnalysisDisplay';

export default function Home() {
  const [email, setEmail] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const generateEmail = async () => {
    try {
      setIsGenerating(true);
      setError('');
      const response = await fetch('/api/generate', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate email');
      }
      
      const data = await response.json();
      setEmail(data.email);
      setAnalysis(''); // Clear previous analysis
    } catch (err) {
      setError('Failed to generate email. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeEmail = async () => {
    if (!email) return;
    
    try {
      setIsAnalyzing(true);
      setError('');
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
      setError('Failed to analyze email. Please try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        PhishGen & PhishBuster
      </h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Phishing Email</h2>
            <button
              onClick={generateEmail}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Phish'}
            </button>
          </div>
          <EmailDisplay email={email} isLoading={isGenerating} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Analysis</h2>
            <button
              onClick={analyzeEmail}
              disabled={isAnalyzing || !email}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Email'}
            </button>
          </div>
          <AnalysisDisplay analysis={analysis} isLoading={isAnalyzing} />
        </div>
      </div>
    </main>
  );
}

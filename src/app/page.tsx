'use client';

import { useState } from 'react';
import { EmailDisplay } from '@/components/EmailDisplay';
import { AnalysisDisplay } from '@/components/AnalysisDisplay';
import { SimulationLog } from '@/components/SimulationLog';
import ImapEmailAnalyzer from '@/components/ImapEmailAnalyzer';
import ManualEmailAnalyzer from '@/components/ManualEmailAnalyzer';

type Mode = 'manual' | 'simulation' | 'imap' | 'manual-analysis';

interface SimulationRound {
  round: number;
  email: string;
  analysis: string;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('manual');
  const [email, setEmail] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState('');
  const [simulationRounds, setSimulationRounds] = useState<SimulationRound[]>([]);
  const [rounds, setRounds] = useState(3);
  const [targetCompany, setTargetCompany] = useState('Amazon');
  const [simulationSpeed, setSimulationSpeed] = useState('normal');

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
      const generatedEmail = data.email;
      setEmail(generatedEmail);
      setAnalysis(''); // Clear previous analysis
      return generatedEmail;
    } catch (err) {
      setError('Failed to generate email. Please try again.');
      console.error(err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeEmail = async (emailToAnalyze: string = email) => {
    if (!emailToAnalyze) return '';
    
    try {
      setIsAnalyzing(true);
      setError('');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToAnalyze }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze email');
      }
      
      const data = await response.json();
      const analysisResult = data.analysis;
      setAnalysis(analysisResult);
      return analysisResult;
    } catch (err) {
      setError('Failed to analyze email. Please try again.');
      console.error(err);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runSimulation = async () => {
    try {
      setIsSimulating(true);
      setError('');
      setSimulationRounds([]);

      for (let i = 0; i < rounds; i++) {
        const generatedEmail = await generateEmail();
        const analysisResult = await analyzeEmail(generatedEmail);
        
        setSimulationRounds(prev => [...prev, { 
          round: i + 1,
          email: generatedEmail, 
          analysis: analysisResult 
        }]);
        
        // Add delay based on simulation speed
        if (simulationSpeed !== 'fast') {
          await new Promise(resolve => 
            setTimeout(resolve, simulationSpeed === 'slow' ? 2000 : 1000)
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        PhishGen & PhishBuster
      </h1>

      <div className="mb-8 flex items-center justify-center gap-4">
        <button
          onClick={() => setMode('manual')}
          className={`px-4 py-2 rounded-lg ${
            mode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Manual Mode
        </button>
        <button
          onClick={() => setMode('simulation')}
          className={`px-4 py-2 rounded-lg ${
            mode === 'simulation'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Simulation Mode
        </button>
        <button
          onClick={() => setMode('imap')}
          className={`px-4 py-2 rounded-lg ${
            mode === 'imap'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          IMAP Analysis
        </button>
        <button
          onClick={() => setMode('manual-analysis')}
          className={`px-4 py-2 rounded-lg ${
            mode === 'manual-analysis'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Manual Analysis
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {mode === 'manual' ? (
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
                onClick={() => analyzeEmail()}
                disabled={isAnalyzing || !email}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Email'}
              </button>
            </div>
            <AnalysisDisplay analysis={analysis} isLoading={isAnalyzing} />
          </div>
        </div>
      ) : mode === 'simulation' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Target Company
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Amazon"
                />
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Number of Rounds
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={rounds}
                  onChange={(e) => setRounds(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Simulation Speed
                <select
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="slow">Slow (2s delay)</option>
                  <option value="normal">Normal (1s delay)</option>
                  <option value="fast">Fast (no delay)</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSimulating ? 'Running Simulation...' : 'Run Simulation'}
              </button>
              {isSimulating && (
                <div className="text-sm text-gray-500">
                  Running round {simulationRounds.length + 1} of {rounds}...
                </div>
              )}
            </div>
            <button
              onClick={() => setSimulationRounds([])}
              disabled={isSimulating || !simulationRounds.length}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Results
            </button>
          </div>

          <SimulationLog rounds={simulationRounds} isLoading={isSimulating} />
        </div>
      ) : mode === 'imap' ? (
        <ImapEmailAnalyzer />
      ) : (
        <ManualEmailAnalyzer />
      )}
    </main>
  );
}

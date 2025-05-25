import { useState } from 'react';
import { AnalysisDisplay } from './AnalysisDisplay';

type AnalyzerMode = 'standard' | 'sophisticated';

// Utility to extract links from text
function extractLinks(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return text.match(urlRegex) || [];
}

// Robust email parser
function parseEmail(raw: string) {
  // Extract headers
  const headerRegex = /^(From|To|Subject|Date|Reply-To|Return-Path|Message-ID|Cc|Bcc|Delivered-To|Received|Authentication-Results|X-[^:]+):\s*(.*)$/gim;
  const headers: Record<string, string | string[]> = {};
  let match;
  let lastHeader = null;
  let headerEndIndex = 0;
  // Parse headers line by line
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^(From|To|Subject|Date|Reply-To|Return-Path|Message-ID|Cc|Bcc|Delivered-To|Received|Authentication-Results|X-[^:]+):\s*(.*)$/i);
    if (headerMatch) {
      const key = headerMatch[1].toLowerCase();
      const value = headerMatch[2].trim();
      if (headers[key]) {
        // Handle multiple headers of the same type (e.g., Received)
        if (Array.isArray(headers[key])) {
          (headers[key] as string[]).push(value);
        } else {
          headers[key] = [headers[key] as string, value];
        }
      } else {
        headers[key] = value;
      }
      lastHeader = key;
      headerEndIndex = i;
    } else if (lastHeader && (line.startsWith(' ') || line.startsWith('\t'))) {
      // Handle folded headers (continuation lines)
      if (Array.isArray(headers[lastHeader])) {
        (headers[lastHeader] as string[])[(headers[lastHeader] as string[]).length - 1] += ' ' + line.trim();
      } else {
        headers[lastHeader] += ' ' + line.trim();
      }
      headerEndIndex = i;
    } else if (line.trim() === '') {
      // Blank line signals end of headers
      headerEndIndex = i;
      break;
    }
  }
  // The rest is the body
  const body = lines.slice(headerEndIndex + 1).join('\n').trim();
  // Extract links from body
  const links = extractLinks(body);
  // Compose result
  return {
    from: (headers['from'] as string) || '',
    to: (headers['to'] as string) || '',
    subject: (headers['subject'] as string) || '',
    date: (headers['date'] as string) || '',
    body,
    headers,
    links,
  };
}

export default function ManualEmailAnalyzer() {
  const [email, setEmail] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzerMode, setAnalyzerMode] = useState<AnalyzerMode>('standard');
  const [showTooltip, setShowTooltip] = useState(false);
  const [useLLMParse, setUseLLMParse] = useState(false);
  const [parsedEmail, setParsedEmail] = useState<Record<string, any> | null>(null);
  const [manualFields, setManualFields] = useState<{ from: string; subject: string; date: string; body: string }>({ from: '', subject: '', date: '', body: '' });
  const [showManualFields, setShowManualFields] = useState(false);

  // Helper to merge LLM and regex results
  function mergeEmailObjects(llmObj: any, regexObj: any) {
    // Prefer LLM fields, fallback to regex
    return {
      from: llmObj.from || regexObj.from,
      to: llmObj.to || regexObj.to,
      subject: llmObj.subject || regexObj.subject,
      date: llmObj.date || regexObj.date,
      body: llmObj.body || regexObj.body,
      headers: { ...regexObj.headers, ...llmObj.headers },
      links: Array.from(new Set([...(llmObj.links || []), ...(regexObj.links || [])])),
    };
  }

  // LLM-powered parsing
  async function llmParse(raw: string) {
    try {
      const resp = await fetch('/api/llm-email-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw }),
      });
      const data = await resp.json();
      if (data.email) return data.email;
      return null;
    } catch {
      return null;
    }
  }

  const handleAnalyze = async () => {
    if (!email.trim()) {
      setError('Please enter an email to analyze');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      
      let endpoint = '/api/analyze';
      let payload: any = { email };
      if (analyzerMode === 'sophisticated') {
        endpoint = '/api/sophisticated-agentic-analyze';
        let parsed = parseEmail(email);
        if (useLLMParse) {
          const llmParsed = await llmParse(email);
          if (llmParsed) {
            parsed = mergeEmailObjects(llmParsed, parsed);
          }
        }
        setParsedEmail(parsed);
        // Check for required fields
        const missing = [
          parsed.from && parsed.from.trim() ? null : 'from',
          parsed.subject && parsed.subject.trim() ? null : 'subject',
          parsed.date && parsed.date.trim() ? null : 'date',
          parsed.body && parsed.body.trim() ? null : 'body',
        ].filter(Boolean) as string[];
        if (missing.length > 0) {
          setManualFields({
            from: parsed.from || '',
            subject: parsed.subject || '',
            date: parsed.date || '',
            body: parsed.body || '',
          });
          setShowManualFields(true);
          setIsAnalyzing(false);
          setError(`Missing required fields: ${missing.join(', ')}. Please fill them in below.`);
          return;
        }
        payload = { email: parsed };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze email');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setShowManualFields(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler for submitting manual fields
  const handleManualSubmit = async () => {
    setError(null);
    setIsAnalyzing(true);
    try {
      const merged = { ...parsedEmail, ...manualFields };
      const missing = [
        merged.from && merged.from.trim() ? null : 'from',
        merged.subject && merged.subject.trim() ? null : 'subject',
        merged.date && merged.date.trim() ? null : 'date',
        merged.body && merged.body.trim() ? null : 'body',
      ].filter(Boolean) as string[];
      if (missing.length > 0) {
        setError(`Still missing required fields: ${missing.join(', ')}`);
        setIsAnalyzing(false);
        return;
      }
      const response = await fetch('/api/sophisticated-agentic-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: merged }),
      });
      if (!response.ok) {
        throw new Error('Failed to analyze email');
      }
      const data = await response.json();
      setAnalysis(data.analysis);
      setShowManualFields(false);
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
        {analyzerMode === 'sophisticated' && (
          <label className="flex items-center gap-2 ml-4">
            <input
              type="checkbox"
              checked={useLLMParse}
              onChange={e => setUseLLMParse(e.target.checked)}
            />
            <span className="text-xs">Smart LLM Parse</span>
          </label>
        )}
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

      {/* Show parsed email for debugging */}
      {parsedEmail && (
        <pre className="bg-gray-100 p-2 rounded text-xs mb-2 overflow-x-auto">
          {JSON.stringify(parsedEmail, null, 2)}
        </pre>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Manual field entry if required fields are missing */}
      {showManualFields && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="mb-2 text-yellow-800 font-semibold">Please fill in the missing required fields:</div>
          <div className="grid grid-cols-1 gap-2">
            <input
              className="border rounded p-1"
              placeholder="From"
              value={manualFields.from}
              onChange={(e) => setManualFields((f: typeof manualFields) => ({ ...f, from: e.target.value }))}
            />
            <input
              className="border rounded p-1"
              placeholder="Subject"
              value={manualFields.subject}
              onChange={(e) => setManualFields((f: typeof manualFields) => ({ ...f, subject: e.target.value }))}
            />
            <input
              className="border rounded p-1"
              placeholder="Date (ISO 8601 preferred)"
              value={manualFields.date}
              onChange={(e) => setManualFields((f: typeof manualFields) => ({ ...f, date: e.target.value }))}
            />
            <textarea
              className="border rounded p-1"
              placeholder="Body"
              value={manualFields.body}
              onChange={(e) => setManualFields((f: typeof manualFields) => ({ ...f, body: e.target.value }))}
            />
          </div>
          <button
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleManualSubmit}
            disabled={isAnalyzing}
          >
            Submit & Analyze
          </button>
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
import { useState } from 'react';

const PROVIDERS = {
  Gmail: {
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    note: `\u26A0\uFE0F Gmail Users: You must use an App Password (not your regular password) for IMAP access.\n- Enable 2-Step Verification in your Google Account.\n- Generate an App Password for "Mail": https://support.google.com/accounts/answer/185833\n- Use your full Gmail address and the App Password above.`,
  },
  Outlook: {
    host: 'outlook.office365.com',
    port: 993,
    tls: true,
    note: `\u26A0\uFE0F Outlook Users: If you have 2FA enabled, you may need an app password. See your Microsoft account security settings.`,
  },
  Yahoo: {
    host: 'imap.mail.yahoo.com',
    port: 993,
    tls: true,
    note: `\u26A0\uFE0F Yahoo Users: You must use an app password for IMAP access. See: https://help.yahoo.com/kb/SLN15241.html`,
  },
};

type Provider = keyof typeof PROVIDERS;

type AnalyzerMode = 'standard' | 'sophisticated';

async function testImapConnection({ host, port, user, password, tls }: { host: string; port: number; user: string; password: string; tls: boolean; }) {
  // Use the same API endpoint but only try to connect and logout
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port, user, password, tls, maxResults: 0, testOnly: true }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to connect');
    }
    return true;
  } catch (err: any) {
    throw err;
  }
}

// Helper to fetch emails via IMAP (using the existing /api/analyze endpoint)
async function fetchImapEmails({ host, port, user, password, tls, maxResults }: { host: string; port: number; user: string; password: string; tls: boolean; maxResults: number; }) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host, port, user, password, tls, maxResults }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to fetch emails');
  }
  const data = await response.json();
  return data.analyzedEmails || [];
}

export default function ImapEmailAnalyzer() {
  const [provider, setProvider] = useState<Provider>('Gmail');
  const [host, setHost] = useState(PROVIDERS.Gmail.host);
  const [port, setPort] = useState(PROVIDERS.Gmail.port);
  const [tls, setTls] = useState(PROVIDERS.Gmail.tls);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [maxResults, setMaxResults] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [analyzerMode, setAnalyzerMode] = useState<AnalyzerMode>('standard');
  const [showTooltip, setShowTooltip] = useState(false);

  const handleProviderChange = (prov: Provider) => {
    setProvider(prov);
    setHost(PROVIDERS[prov].host);
    setPort(PROVIDERS[prov].port);
    setTls(PROVIDERS[prov].tls);
  };

  const validate = () => {
    if (!host || !port || !user || !password) {
      setError('All fields are required.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleTestConnection = async () => {
    if (!validate()) return;
    setIsTesting(true);
    setTestSuccess(null);
    setError(null);
    try {
      await testImapConnection({ host, port, user, password, tls });
      setTestSuccess(true);
    } catch (err: any) {
      setTestSuccess(false);
      if (err.message && err.message.includes('Invalid credentials')) {
        setError('Authentication failed: Invalid credentials. Please check your email and app password.');
      } else if (err.message && err.message.includes('Application-specific password required')) {
        setError('Gmail: Application-specific password required. See the instructions above.');
      } else {
        setError('Connection failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsTesting(false);
    }
  };

  // Per-email agentic analysis for IMAP
  const handleAnalyze = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setError(null);
    setResults([]);
    setTestSuccess(null);
    try {
      if (analyzerMode === 'standard') {
        // Standard IMAP analysis
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, port, user, password, tls, maxResults }),
        });
        if (!response.ok) {
          const data = await response.json();
          if (data.error && data.error.includes('Invalid credentials')) {
            setError('Authentication failed: Invalid credentials. Please check your email and app password.');
          } else if (data.error && data.error.includes('Application-specific password required')) {
            setError('Gmail: Application-specific password required. See the instructions above.');
          } else {
            setError(data.error || 'Failed to analyze emails');
          }
          return;
        }
        const data = await response.json();
        setResults(data.analyzedEmails || []);
      } else {
        // Sophisticated: fetch emails, then analyze each one
        const emails = await fetchImapEmails({ host, port, user, password, tls, maxResults });
        if (!emails.length) {
          setError('No emails found.');
          return;
        }
        const sophisticatedResults: any[] = [];
        const endpoint = '/api/sophisticated-agentic-analyze';
        for (let i = 0; i < emails.length; i++) {
          const emailObj = emails[i];
          const emailPayload = {
            from: emailObj.email.from,
            subject: emailObj.email.subject,
            date: emailObj.email.date,
            body: emailObj.email.body,
            headers: emailObj.email.headers || {},
            links: emailObj.email.links || [],
          };
          try {
            const resp = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: emailPayload }),
            });
            if (!resp.ok) {
              const data = await resp.json();
              sophisticatedResults.push({ ...emailObj, analysis: data.error || `Failed to analyze (sophisticated).` });
            } else {
              const data = await resp.json();
              sophisticatedResults.push({ ...emailObj, analysis: data.analysis });
            }
          } catch (err: any) {
            sophisticatedResults.push({ ...emailObj, analysis: err.message || 'Sophisticated analysis error.' });
          }
        }
        setResults(sophisticatedResults);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">IMAP Email Analysis</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.keys(PROVIDERS).map((prov) => (
          <button
            key={prov}
            onClick={() => handleProviderChange(prov as Provider)}
            className={`px-3 py-1 rounded ${provider === prov ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {prov}
          </button>
        ))}
      </div>
      {/* Provider-specific instructional note */}
      <div className="mb-4">
        <div className="text-xs bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded whitespace-pre-line">
          {PROVIDERS[provider].note}
        </div>
      </div>

      {/* Analyzer mode selector and tooltip */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium">IMAP Host</label>
          <input type="text" className="w-full border rounded px-2 py-1" value={host} onChange={e => setHost(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Port</label>
          <input type="number" className="w-full border rounded px-2 py-1" value={port} onChange={e => setPort(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium">Username (Email)</label>
          <input type="email" className="w-full border rounded px-2 py-1" value={user} onChange={e => setUser(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Password / App Password</label>
          <div className="flex items-center gap-2">
            <input type={showPassword ? 'text' : 'password'} className="w-full border rounded px-2 py-1" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="text-xs px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200">
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Use TLS</label>
          <input type="checkbox" checked={tls} onChange={e => setTls(e.target.checked)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Max Emails</label>
          <input type="number" className="w-full border rounded px-2 py-1" value={maxResults} min={1} max={50} onChange={e => setMaxResults(Number(e.target.value))} />
        </div>
      </div>
      {error && <div className="mb-4 text-red-600 bg-red-50 p-2 rounded">{error}</div>}
      <div className="flex gap-4 mb-4">
        <button
          onClick={handleTestConnection}
          disabled={isTesting || isLoading}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          onClick={handleAnalyze}
          disabled={isLoading || isTesting || testSuccess === false}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? `Analyzing (${analyzerMode})...` : `Analyze Emails (${analyzerMode === 'sophisticated' ? 'Sophisticated' :
                                                         'Standard'})`}
        </button>
      </div>
      {testSuccess === true && <div className="mb-4 text-green-700 bg-green-50 p-2 rounded">Connection successful!</div>}
      {testSuccess === false && !error && <div className="mb-4 text-red-600 bg-red-50 p-2 rounded">Connection failed. Please check your credentials.</div>}
      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Results</h3>
          <div className="space-y-4">
            {results.map((result, idx) => (
              <div key={idx} className="border rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="font-medium">{result.email.subject}</div>
                    <div className="text-xs text-gray-600">{result.email.from}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${result.analysis && typeof result.analysis === 'object' ? (result.analysis.isPhishing ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800') : ''}`}>
                    {result.analysis && typeof result.analysis === 'object'
                      ? (result.analysis.isPhishing ? 'Phishing' : 'Safe')
                      : null}
                  </div>
                </div>
                <div className="text-sm text-gray-700 mb-1">{result.email.body.slice(0, 200)}{result.email.body.length > 200 ? '...' : ''}</div>
                <div className="text-xs text-gray-500">Date: {result.email.date}</div>
                <div className="mt-2">
                  {result.analysis && typeof result.analysis === 'object' && !result.analysis.error ? (
                    <>
                      <div className="font-semibold text-sm">Risk Score: {result.analysis.riskScore}</div>
                      <div className="text-xs">Confidence: {(result.analysis.confidence * 100).toFixed(1)}%</div>
                      {result.analysis.reasons && (
                        <ul className="list-disc ml-5 text-xs text-gray-700">
                          {result.analysis.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                        </ul>
                      )}
                      {result.analysis.recommendations && (
                        <ul className="list-disc ml-5 text-xs text-gray-700 mt-1">
                          {result.analysis.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                        </ul>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-red-700">
                      {result.analysis?.error
                        ? result.analysis.error
                        : typeof result.analysis === 'string'
                          ? result.analysis
                          : 'No analysis.'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
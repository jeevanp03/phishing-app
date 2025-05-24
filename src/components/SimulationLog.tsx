import React, { useState } from 'react';

interface SimulationRound {
  round: number;
  email: string;
  analysis: string;
}

interface SimulationLogProps {
  rounds: SimulationRound[];
  isLoading?: boolean;
}

export const SimulationLog: React.FC<SimulationLogProps> = ({ rounds, isLoading }) => {
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  const toggleRound = (round: number) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(round)) {
      newExpanded.delete(round);
    } else {
      newExpanded.add(round);
    }
    setExpandedRounds(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-gray-50 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!rounds.length) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 text-gray-500">
        No simulation rounds yet. Click &quot;Run Simulation&quot; to start.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {rounds.map((round) => (
        <div key={round.round} className="space-y-4">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
            onClick={() => toggleRound(round.round)}
          >
            <span className="text-sm font-medium text-gray-500">Round {round.round}</span>
            <div className="flex-1 h-px bg-gray-200"></div>
            <button className="text-gray-400 hover:text-gray-600">
              {expandedRounds.has(round.round) ? '▼' : '▶'}
            </button>
          </div>
          
          {expandedRounds.has(round.round) && (
            <div className="space-y-4 pl-4 border-l-2 border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-600">PhishGen</span>
                  <div className="flex-1 h-px bg-blue-100"></div>
                </div>
                <div className="p-4 border rounded-lg bg-white font-mono text-sm whitespace-pre-wrap">
                  {round.email}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-green-600">PhishBuster</span>
                  <div className="flex-1 h-px bg-green-100"></div>
                </div>
                <div className="p-4 border rounded-lg bg-white">
                  <div className="prose prose-sm max-w-none">
                    {round.analysis.split('\n').map((line, i) => (
                      <p key={i} className="mb-2">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Simulation Summary</h3>
        <div className="text-sm text-gray-600">
          <p>• Total Rounds: {rounds.length}</p>
          <p>• Last Round: {rounds[rounds.length - 1].round}</p>
          <p>• Expand rounds to see detailed analysis</p>
        </div>
      </div>
    </div>
  );
}; 
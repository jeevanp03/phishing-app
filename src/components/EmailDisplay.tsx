import React from 'react';

interface EmailDisplayProps {
  email: string;
  isLoading?: boolean;
}

export const EmailDisplay: React.FC<EmailDisplayProps> = ({ email, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 text-gray-500">
        No email generated yet. Click &quot;Generate Phish&quot; to create one.
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-white font-mono text-sm whitespace-pre-wrap">
      {email}
    </div>
  );
}; 
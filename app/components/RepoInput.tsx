'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface RepoInputProps {
  onAnalyze: (repoUrl: string) => void;
  isAnalyzing: boolean;
}

export default function RepoInput({ onAnalyze, isAnalyzing }: RepoInputProps) {
  const [repoUrl, setRepoUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl && !isAnalyzing) {
      onAnalyze(repoUrl);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex gap-2">
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="Enter GitHub repository URL (e.g., https://github.com/owner/repo)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black"
          disabled={isAnalyzing}
        />
        <button
          type="submit"
          disabled={!repoUrl || isAnalyzing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Analyze
            </>
          )}
        </button>
      </div>
    </form>
  );
}
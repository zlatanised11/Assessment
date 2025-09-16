'use client';

import { useState } from 'react';
import RepoInput from './components/RepoInput';
import IssuesList from './components/IssuesList';
import CodeView from './components/CodeView';
import { AnalysisResult, SecurityIssue } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<SecurityIssue | null>(null);
  const [activeTab, setActiveTab] = useState('issues');

  const handleAnalyze = async (repoUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSelectedIssue(null);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });
      
      if (!response.ok) throw new Error('Analysis failed');
      
      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing repository:', error);
      alert('Failed to analyze repository. Please check the URL and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleIssueClick = (issue: SecurityIssue) => {
    setSelectedIssue(issue);
    setActiveTab('code');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            GitHub Security Scanner
          </h1>
          <p className="text-gray-600">
            Analyze public GitHub repositories for security vulnerabilities using AI
          </p>
        </div>

        <div className="mb-8">
          <RepoInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </div>

        {analysisResult && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-2 text-black">
                Analysis Results for {analysisResult.repository.name}
              </h2>
              <p className="text-black">
                Found {analysisResult.issues.length} potential security issues in {analysisResult.filesAnalyzed} files
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex gap-2 mb-6">
                <TabsTrigger
                  value="issues"
                  className="px-4 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white text-black"
                >
                  Issues View
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="px-4 py-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white text-black"
                >
                  Code View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="issues">
                <IssuesList
                  issues={analysisResult.issues}
                  onIssueClick={handleIssueClick}
                />
              </TabsContent>

              <TabsContent value="code">
                {selectedIssue ? (
                  <CodeView issue={selectedIssue} />
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-500">
                      Select an issue from the Issues view to see the code
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </main>
  );
}
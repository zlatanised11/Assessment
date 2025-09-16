import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryInfo, getAllFiles, getFileContent } from '@/lib/github';
import { analyzeCode } from '@/lib/llm';
import { AnalysisResult, SecurityIssue } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { repoUrl } = await request.json();
    
    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }
    
    const [, owner, repo] = match;
    
    // Get repository info
    const repoInfo = await getRepositoryInfo(owner, repo);
    
    // Get all code files
    const files = await getAllFiles(owner, repo);
    
    // Limit to first 10 files for demo (to avoid rate limits)
    const filesToAnalyze = files.slice(0, 10);
    
    // Analyze each file
    const allIssues: SecurityIssue[] = [];
    
    for (const filePath of filesToAnalyze) {
      const content = await getFileContent(owner, repo, filePath);
      if (content) {
        const issues = await analyzeCode(filePath, content);
        allIssues.push(...issues);
      }
    }
    
    const result: AnalysisResult = {
      repository: repoInfo,
      issues: allIssues,
      analyzedAt: new Date(),
      filesAnalyzed: filesToAnalyze.length
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze repository' },
      { status: 500 }
    );
  }
}
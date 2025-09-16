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

    // Get all code files (critical files prioritized)
    const files = await getAllFiles(owner, repo);

    // Limit to first 10 files, but critical files are prioritized
    const filesToAnalyze = files.slice(0, 10);

    // Analyze each file
    const allIssues: SecurityIssue[] = [];

    for (const filePath of filesToAnalyze) {
      const content = await getFileContent(owner, repo, filePath);
      if (content) {
        try {
          const issues = await analyzeCode(filePath, content);
          allIssues.push(...issues);
        } catch (err: any) {
          // Handle rate limit/context errors from LLM
          if (err && (err.status === 429 || (err.response && err.response.status === 429))) {
            return NextResponse.json(
              { error: 'Rate limit exceeded. Please wait a moment and try again.' },
              { status: 429 }
            );
          }
          if (err && err.message && err.message.includes('context')) {
            return NextResponse.json(
              { error: 'File too large or too many files. Please try with a smaller repository or fewer files.' },
              { status: 400 }
            );
          }
          console.error('LLM error for file', filePath, err);
          return NextResponse.json(
            { error: `Failed to analyze file: ${filePath}` },
            { status: 500 }
          );
        }
      }
    }

    const result: AnalysisResult = {
      repository: repoInfo,
      issues: allIssues,
      analyzedAt: new Date(),
      filesAnalyzed: filesToAnalyze.length
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    if (error && (error.status === 429 || (error.response && error.response.status === 429))) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { status: 429 }
      );
    }
    if (error && error.message && error.message.includes('context')) {
      return NextResponse.json(
        { error: 'File too large or too many files. Please try with a smaller repository or fewer files.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to analyze repository' },
      { status: 500 }
    );
  }
}
export interface SecurityIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  endLine?: number;
  code: string;
  suggestion?: string;
  category: string;
}

export interface Repository {
  owner: string;
  name: string;
  url: string;
  defaultBranch: string;
}

export interface AnalysisResult {
  repository: Repository;
  issues: SecurityIssue[];
  analyzedAt: Date;
  filesAnalyzed: number;
}
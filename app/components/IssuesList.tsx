'use client';

import { SecurityIssue } from '@/lib/types';
import { AlertTriangle, AlertCircle, Info, Shield } from 'lucide-react';

interface IssuesListProps {
  issues: SecurityIssue[];
  onIssueClick: (issue: SecurityIssue) => void;
}

const severityConfig = {
  critical: { icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
  high: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  medium: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  low: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
};

export default function IssuesList({ issues, onIssueClick }: IssuesListProps) {
  return (
    <div className="space-y-4">
      {issues.map((issue) => {
        const config = severityConfig[issue.severity];
        const Icon = config.icon;
        
        return (
          <div
            key={issue.id}
            onClick={() => onIssueClick(issue)}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${config.bg}`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-black">{issue.title}</h3>
                <p className="text-gray-600 mt-1">{issue.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className={`px-2 py-1 rounded-full ${config.bg} ${config.color} font-medium`}>
                    {issue.severity}
                  </span>
                  <span className="text-gray-500">{issue.file}</span>
                  <span className="text-gray-500">Line {issue.line}</span>
                  <span className="text-gray-500">{issue.category}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
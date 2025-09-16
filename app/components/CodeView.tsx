'use client';

import { SecurityIssue } from '@/lib/types';
import { Highlight, themes } from 'prism-react-renderer';

interface CodeViewProps {
  issue: SecurityIssue;
  fullCode?: string;
}

export default function CodeView({ issue, fullCode }: CodeViewProps) {
  const codeToShow = fullCode || issue.code;
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-2 border-b">
        <h3 className="font-mono text-sm">{issue.file}</h3>
      </div>
      <div className="bg-gray-900 p-4 overflow-x-auto">
        <Highlight
          theme={themes.nightOwl}
          code={codeToShow}
          language="javascript"
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={className} style={style}>
              {tokens.map((line, i) => {
                const lineNumber = i + 1;
                const isHighlighted = 
                  lineNumber >= issue.line && 
                  lineNumber <= (issue.endLine || issue.line);
                
                return (
                  <div
                    key={i}
                    {...getLineProps({ line })}
                    className={`flex ${isHighlighted ? 'bg-red-500 bg-opacity-20' : ''}`}
                  >
                    <span className="text-gray-500 mr-4 select-none w-8 text-right">
                      {lineNumber}
                    </span>
                    <span>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  </div>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>
      {issue.suggestion && (
        <div className="bg-green-50 p-4 border-t">
          <h4 className="font-semibold text-green-800 mb-2">Suggested Fix:</h4>
          <p className="text-green-700">{issue.suggestion}</p>
        </div>
      )}
    </div>
  );
}
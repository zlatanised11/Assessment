import OpenAI from 'openai';
import { SecurityIssue } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SECURITY_ANALYSIS_PROMPT = `
You are a security expert analyzing code for potential vulnerabilities. Analyze the following code and identify security issues.

Focus on:
1. SQL Injection vulnerabilities
2. Cross-Site Scripting (XSS)
3. Authentication/Authorization issues
4. Sensitive data exposure
5. Insecure dependencies
6. Command injection
7. Path traversal
8. Insecure cryptography
9. Race conditions
10. Memory leaks

For each issue found, provide:
- A clear title
- Detailed description
- Severity level (critical, high, medium, low)
- The specific line numbers affected
- A code snippet showing the vulnerability
- A suggestion for fixing it
- Category of the vulnerability

Return ONLY the results as a valid JSON array of objects with the following structure, and NOTHING else:
[
  {
    "title": "Issue title",
    "description": "Detailed description",
    "severity": "critical|high|medium|low",
    "line": line_number,
    "endLine": end_line_number (optional),
    "code": "code snippet",
    "suggestion": "How to fix",
    "category": "Category name"
  }
]

If no issues are found, return an empty array: []
Do not include any explanation, markdown, or text outside the JSON array.
`;

export async function analyzeCode(
  fileName: string,
  fileContent: string
): Promise<SecurityIssue[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: SECURITY_ANALYSIS_PROMPT
        },
        {
          role: 'user',
          content: `File: ${fileName}\n\nCode:\n\`\`\`\n${fileContent}\n\`\`\``
        }
      ],
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    console.debug('[LLM RAW RESPONSE]', content);
    if (!content) {
      console.warn('[LLM] No content returned for', fileName);
      return [];
    }

    let result;
    try {
      // Try direct JSON parse first
      result = JSON.parse(content);
    } catch (e) {
      // Fallback: extract first JSON array from response
      const match = content.match(/(\[.*\])/s);
      if (match) {
        try {
          result = JSON.parse(match[1]);
        } catch (e2) {
          console.error('[LLM] Fallback JSON parse failed for', fileName, content, e2);
          return [];
        }
      } else {
        console.error('[LLM] Failed to parse JSON for', fileName, content, e);
        return [];
      }
    }
    const issues = Array.isArray(result) ? result : (result.issues || result.vulnerabilities || []);
    if (!issues.length) {
      console.info('[LLM] No issues found for', fileName);
    }
    return issues.map((issue: any, index: number) => ({
      id: `${fileName}-${index}`,
      file: fileName,
      ...issue
    }));
  } catch (error) {
    console.error('Error analyzing code with LLM:', error);
    return [];
  }
}
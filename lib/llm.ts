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

Return the results as a JSON array of objects with the following structure:
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

If no issues are found, return an empty array.
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
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) return [];

    const result = JSON.parse(content);
    const issues = result.issues || result.vulnerabilities || [];
    
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
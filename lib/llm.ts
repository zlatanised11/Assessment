import OpenAI from 'openai';
import { SecurityIssue } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SECURITY_ANALYSIS_PROMPT = `
You are a security expert. Analyze the code below for:
SQL/NoSQL Injection, XSS, Auth/AuthZ issues, Sensitive data exposure, Insecure deps, Command injection, Path traversal, Insecure crypto, Race conditions, Memory leaks.

Return ONLY JSON array:
[
  {
    "title": "...",
    "description": "...",
    "severity": "critical|high|medium|low",
    "filePath": "...",
    "line": number|null,
    "endLine": number|null,
    "code": "...",
    "suggestion": "...",
    "category": "...",
    "confidence": "low|medium|high"
  }
]
If no issues, return [].
`;

export async function analyzeCode(
  fileName: string,
  fileContent: string
): Promise<SecurityIssue[]> {
  // Truncate file content to first 300 lines or 10KB
  let truncatedContent = fileContent;
  const lines = fileContent.split('\n');
  if (lines.length > 300) {
    truncatedContent = lines.slice(0, 300).join('\n');
  }
  if (truncatedContent.length > 10240) {
    truncatedContent = truncatedContent.slice(0, 10240);
  }

  // Retry logic for rate limits
  const maxRetries = 4;
  let attempt = 0;
  let lastError;
  while (attempt <= maxRetries) {
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
            content: `File: ${fileName}\n\nCode:\n\`\`\`\n${truncatedContent}\n\`\`\``
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
    } catch (error: any) {
      lastError = error;
      // Check for rate limit error (429)
      if (error.status === 429 || (error.response && error.response.status === 429)) {
        const delay = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
        console.warn(`[LLM] Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(res => setTimeout(res, delay));
        attempt++;
        continue;
      } else {
        console.error('Error analyzing code with LLM:', error);
        return [];
      }
    }
  }
  // If all retries failed
  console.error('Error analyzing code with LLM after retries:', lastError);
  throw lastError;
}
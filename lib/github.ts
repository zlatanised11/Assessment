import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function getRepositoryContent(owner: string, repo: string, path: string = '') {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });
    return data;
  } catch (error) {
    console.error('Error fetching repository content:', error);
    throw error;
  }
}

export async function getFileContent(owner: string, repo: string, path: string) {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });
    
    if ('content' in data && typeof data.content === 'string') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch (error) {
    console.error('Error fetching file content:', error);
    return null;
  }
}

export async function getRepositoryInfo(owner: string, repo: string) {
  try {
    const { data } = await octokit.repos.get({
      owner,
      repo,
    });
    return {
      owner: data.owner.login,
      name: data.name,
      url: data.html_url,
      defaultBranch: data.default_branch,
    };
  } catch (error) {
    console.error('Error fetching repository info:', error);
    throw error;
  }
}

export async function getAllFiles(owner: string, repo: string, path: string = ''): Promise<string[]> {
  const files: string[] = [];
  try {
    const contents = await getRepositoryContent(owner, repo, path);
    if (Array.isArray(contents)) {
      for (const item of contents) {
        if (item.type === 'file' && (
          item.name.endsWith('.js') || 
          item.name.endsWith('.ts') || 
          item.name.endsWith('.jsx') || 
          item.name.endsWith('.tsx') ||
          item.name.endsWith('.py') ||
          item.name.endsWith('.java')
        )) {
          // Prioritize critical files by name or path
          const lowerName = item.name.toLowerCase();
          const lowerPath = item.path.toLowerCase();
          const isCritical =
            lowerName.includes('auth') ||
            lowerName.includes('config') ||
            lowerName.includes('database') ||
            lowerName.includes('user') ||
            lowerName.includes('admin') ||
            lowerPath.includes('lib/') ||
            lowerPath.includes('api/') ||
            lowerPath.includes('server/');
          files.push(isCritical ? '__CRITICAL__' + item.path : item.path);
        } else if (item.type === 'dir') {
          const subFiles = await getAllFiles(owner, repo, item.path);
          files.push(...subFiles);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${path}:`, error);
  }
  // Move critical files to the front
  const prioritized = files.filter(f => f.startsWith('__CRITICAL__')).map(f => f.replace('__CRITICAL__', ''));
  const normal = files.filter(f => !f.startsWith('__CRITICAL__'));
  return [...prioritized, ...normal];
}
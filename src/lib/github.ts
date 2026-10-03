/**
 * Build-time fetch of the org's public repos for the Work section.
 * Falls back to src/data/repos.fallback.json if the API is unreachable or
 * rate-limited. Set GITHUB_TOKEN in the build environment to raise limits.
 */
import fallback from '../data/repos.fallback.json';

export interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
}

interface ApiRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  fork: boolean;
  archived: boolean;
  private: boolean;
}

export async function getRepos(org: string): Promise<{ repos: Repo[]; source: 'api' | 'fallback' }> {
  try {
    const token = import.meta.env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
    const res = await fetch(`https://api.github.com/orgs/${org}/repos?per_page=100&type=public&sort=updated`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'outback-services-website',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
    const data = (await res.json()) as ApiRepo[];
    const repos = data
      .filter((r) => !r.fork && !r.archived && !r.private)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .map((r) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        url: r.html_url,
      }));
    return { repos, source: 'api' };
  } catch (err) {
    console.warn(`[work] Falling back to repos.fallback.json: ${(err as Error).message}`);
    return { repos: fallback as Repo[], source: 'fallback' };
  }
}

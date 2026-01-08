import { Octokit } from '@octokit/rest';
import { simpleGit } from 'simple-git';

const git = simpleGit();

export interface GitHubRepo {
  owner: string;
  repo: string;
}

export interface CreatePROptions {
  owner: string;
  repo: string;
  head: string;
  base: string;
  title: string;
  body: string;
  draft: boolean;
}

export interface PRResult {
  number: number;
  url: string;
}

const getGitHubToken = (): string => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }
  return token;
};

export const parseGitRemoteUrl = (remoteUrl: string): GitHubRepo => {
  // HTTPS: https://github.com/owner/repo.git
  const httpsMatch = /https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/.exec(remoteUrl);
  if (httpsMatch?.[1] && httpsMatch[2]) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  // SSH variants: git@github.com:owner/repo.git, kurone-git:owner/repo.git, etc.
  const sshMatch = /^[^:]+:([^/]+)\/(.+?)(?:\.git)?$/.exec(remoteUrl);
  if (sshMatch?.[1] && sshMatch[2]) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  throw new Error(`Failed to parse GitHub remote URL: ${remoteUrl}`);
};

export const getRepoFromRemote = async (): Promise<GitHubRepo> => {
  const remotes = await git.getRemotes(true);
  const origin = remotes.find((r) => r.name === 'origin');

  if (!origin?.refs.fetch) {
    throw new Error('No origin remote found');
  }

  return parseGitRemoteUrl(origin.refs.fetch);
};

export const createPullRequest = async (options: CreatePROptions): Promise<PRResult> => {
  const octokit = new Octokit({ auth: getGitHubToken() });

  const response = await octokit.rest.pulls.create({
    owner: options.owner,
    repo: options.repo,
    head: options.head,
    base: options.base,
    title: options.title,
    body: options.body,
    draft: options.draft,
  });

  return {
    number: response.data.number,
    url: response.data.html_url,
  };
};

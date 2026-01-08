import { existsSync, readdirSync } from 'node:fs';
import { simpleGit } from 'simple-git';

const git = simpleGit();

const TICKETREE_DIR = '.ticketree';

export interface WorktreeResult {
  path: string;
  branch: string;
  created: boolean;
}

export interface CreateWorktreeOptions {
  ticketKey: string;
  baseBranch: string;
  branchPrefix: string;
}

export interface WorktreeInfo {
  ticketKey: string;
  path: string;
  branch: string;
}

export const getWorktreePath = (ticketKey: string): string => `${TICKETREE_DIR}/${ticketKey}`;

export const worktreeExists = (ticketKey: string): boolean => existsSync(getWorktreePath(ticketKey));

export const pullBaseBranch = async (baseBranch: string): Promise<void> => {
  await git.fetch('origin', baseBranch);
  await git.checkout(baseBranch);
  await git.pull('origin', baseBranch);
};

export const createWorktree = async (options: CreateWorktreeOptions): Promise<WorktreeResult> => {
  const { ticketKey, baseBranch, branchPrefix } = options;
  const worktreePath = getWorktreePath(ticketKey);
  const branchName = `${branchPrefix}${ticketKey}`;

  if (worktreeExists(ticketKey)) {
    return {
      path: worktreePath,
      branch: branchName,
      created: false,
    };
  }

  await pullBaseBranch(baseBranch);
  await git.raw(['worktree', 'add', '-b', branchName, worktreePath, baseBranch]);

  return {
    path: worktreePath,
    branch: branchName,
    created: true,
  };
};

export const listWorktrees = async (): Promise<WorktreeInfo[]> => {
  if (!existsSync(TICKETREE_DIR)) {
    return [];
  }

  const worktreeList = await git.raw(['worktree', 'list', '--porcelain']);
  const worktreeMap = new Map<string, string>();

  let currentPath = '';
  for (const line of worktreeList.split('\n')) {
    if (line.startsWith('worktree ')) {
      currentPath = line.slice(9);
    } else if (line.startsWith('branch ')) {
      const branch = line.slice(7).replace('refs/heads/', '');
      worktreeMap.set(currentPath, branch);
    }
  }

  const entries = readdirSync(TICKETREE_DIR, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory());

  return directories.map((dir) => {
    const ticketKey = dir.name;
    const path = getWorktreePath(ticketKey);
    const absolutePath = process.cwd() + '/' + path;
    const branch = worktreeMap.get(absolutePath) ?? '';

    return { ticketKey, path, branch };
  });
};

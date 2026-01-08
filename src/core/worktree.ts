import { existsSync } from 'node:fs';
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

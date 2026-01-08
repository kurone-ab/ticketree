import { existsSync, readdirSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import chalk from 'chalk';
import { simpleGit } from 'simple-git';
import type { SymlinkConfig } from '@/config/types.js';

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

export const getCurrentTicketKey = (): string | null => {
  const cwd = process.cwd();
  const ticketreeDir = '/.ticketree/';

  const ticketreeIndex = cwd.indexOf(ticketreeDir);
  if (ticketreeIndex === -1) return null;

  const afterTicketree = cwd.slice(ticketreeIndex + ticketreeDir.length);
  const ticketKey = afterTicketree.split('/')[0];

  return ticketKey ?? null;
};

export const pushBranch = async (ticketKey: string): Promise<void> => {
  const worktreePath = getWorktreePath(ticketKey);
  const worktreeGit = simpleGit(worktreePath);
  await worktreeGit.push(['--set-upstream', 'origin', 'HEAD']);
};

export const deleteWorktree = async (ticketKey: string): Promise<void> => {
  const worktreePath = getWorktreePath(ticketKey);
  await git.raw(['worktree', 'remove', worktreePath]);
};

export const deleteBranch = async (branchName: string): Promise<void> => {
  await git.branch(['-d', branchName]);
};

export const getWorktreeBranch = async (ticketKey: string): Promise<string | null> => {
  const worktreePath = getWorktreePath(ticketKey);
  const worktreeGit = simpleGit(worktreePath);
  const branch = await worktreeGit.revparse(['--abbrev-ref', 'HEAD']);
  return branch.trim() || null;
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

export interface CreateSymlinksOptions {
  worktreePath: string;
  symlinks: SymlinkConfig[];
}

export const createSymlinks = (options: CreateSymlinksOptions): void => {
  const { worktreePath, symlinks } = options;

  for (const symlink of symlinks) {
    const config = typeof symlink === 'string' ? { source: symlink, target: symlink } : symlink;
    const sourcePath = resolve(process.cwd(), config.source);
    const targetPath = resolve(worktreePath, config.target);

    if (!existsSync(sourcePath)) {
      console.log(chalk.yellow(`Symlink source does not exist, skipping: ${config.source}`));
      continue;
    }

    if (existsSync(targetPath)) {
      console.log(chalk.gray(`Symlink already exists, skipping: ${config.target}`));
      continue;
    }

    symlinkSync(sourcePath, targetPath);
    console.log(chalk.green(`Created symlink: ${config.target} -> ${config.source}`));
  }
};

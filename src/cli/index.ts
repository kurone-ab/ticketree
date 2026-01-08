#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from '@/cli/commands/init.js';
import { startCommand } from '@/cli/commands/start.js';
import { listCommand } from '@/cli/commands/list.js';
import { endCommand } from '@/cli/commands/end.js';
import { handleError, setupGlobalHandlers } from '@/cli/error-handler.js';

setupGlobalHandlers();

const withErrorHandler =
  <T extends unknown[]>(fn: (...args: T) => Promise<void>) =>
  async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      handleError(error);
    }
  };

const program = new Command();

program
  .name('ticketree')
  .description('CLI tool that connects issue tracker tickets with Git Worktree')
  .version('0.1.0');

program.command('init').description('Initialize Ticketree in current project').action(withErrorHandler(initCommand));

program
  .command('start [ticket]')
  .description('Start working on a ticket (create worktree, open editor/terminal)')
  .action(withErrorHandler(startCommand));

program
  .command('list')
  .description('List current worktrees with ticket information')
  .action(withErrorHandler(listCommand));

program
  .command('end [ticket]')
  .description('End working on a ticket (push, delete worktree)')
  .option('--pr', 'Create a pull request')
  .option('--no-draft', 'Create PR as ready for review (not draft)')
  .option('--base <branch>', 'Base branch for PR')
  .option('--keep', 'Keep worktree and branch after ending')
  .action(withErrorHandler(endCommand));

program.parse();

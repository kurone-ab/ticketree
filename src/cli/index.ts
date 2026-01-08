#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';
import { listCommand } from './commands/list.js';
import { endCommand } from './commands/end.js';

const program = new Command();

program
  .name('ticketree')
  .description('CLI tool that connects issue tracker tickets with Git Worktree')
  .version('0.1.0');

program.command('init').description('Initialize Ticketree in current project').action(initCommand);

program
  .command('start [ticket]')
  .description('Start working on a ticket (create worktree, open editor/terminal)')
  .action(startCommand);

program.command('list').description('List current worktrees with ticket information').action(listCommand);

program
  .command('end [ticket]')
  .description('End working on a ticket (push, delete worktree)')
  .option('--pr', 'Create a pull request')
  .option('--no-draft', 'Create PR as ready for review (not draft)')
  .option('--base <branch>', 'Base branch for PR')
  .action(endCommand);

program.parse();

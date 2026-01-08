import chalk from 'chalk';
import { fetchIssue, fetchIssues, transitionIssue, type JiraIssue } from '../../adapters/jira.js';
import { loadConfig } from '../../config/loader.js';
import { openEditor } from '../../core/editor.js';
import { openTerminal } from '../../core/terminal.js';
import { parseTicketInput, selectTicketInteractively } from '../../core/ticket-parser.js';
import { createWorktree, getWorktreePath, worktreeExists } from '../../core/worktree.js';

export const startCommand = async (ticketInput?: string): Promise<void> => {
  const config = await loadConfig();
  const jiraConfig = config.issueTracker.jira;

  if (!jiraConfig) {
    throw new Error('Jira configuration is missing in .ticketreerc');
  }

  let ticket: JiraIssue;

  if (ticketInput) {
    const parsed = parseTicketInput(ticketInput, jiraConfig.project);
    console.log(chalk.blue(`Fetching ticket ${parsed.key}...`));
    ticket = await fetchIssue(parsed.key);
  } else {
    console.log(chalk.blue('Fetching issues...'));
    const jql = `project = ${jiraConfig.project} AND (${jiraConfig.jql})`;
    const issues = await fetchIssues(jql);
    ticket = await selectTicketInteractively(issues);
  }

  const isExisting = worktreeExists(ticket.key);

  if (isExisting) {
    console.log(chalk.yellow(`Worktree already exists for ${ticket.key}`));
  } else {
    console.log(chalk.blue(`Creating worktree for ${ticket.key}...`));
    const result = await createWorktree({
      ticketKey: ticket.key,
      baseBranch: config.git.baseBranch,
      branchPrefix: config.git.branchPrefix,
    });
    console.log(chalk.green(`Created worktree at ${result.path} (branch: ${result.branch})`));

    if (config.issueTransition.onStart) {
      console.log(chalk.blue(`Transitioning issue to "${config.issueTransition.onStart}"...`));
      await transitionIssue(ticket.key, config.issueTransition.onStart);
      console.log(chalk.green('Issue transitioned successfully'));
    }
  }

  const worktreePath = getWorktreePath(ticket.key);

  if (config.editor.enabled) {
    console.log(chalk.blue(`Opening editor (${config.editor.command})...`));
    openEditor(worktreePath, config.editor.command);
  }

  if (config.terminal.enabled) {
    console.log(chalk.blue(`Opening terminal (${config.terminal.preset})...`));
    openTerminal({ worktreePath, title: ticket.key, preset: config.terminal.preset });
  }

  console.log(chalk.green('\nDone! Happy coding 🚀'));
};

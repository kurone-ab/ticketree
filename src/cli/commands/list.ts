import chalk from 'chalk';
import { fetchIssues, type JiraIssue } from '@/adapters/jira.js';
import { listWorktrees } from '@/core/worktree.js';

export const listCommand = async (): Promise<void> => {
  const worktrees = await listWorktrees();

  if (worktrees.length === 0) {
    console.log(chalk.yellow('No worktrees found.'));
    return;
  }

  const ticketKeys = worktrees.map((w) => w.ticketKey);
  const jql = `key in (${ticketKeys.join(', ')})`;

  let issueMap = new Map<string, JiraIssue>();
  try {
    const issues = await fetchIssues(jql);
    issueMap = new Map(issues.map((issue) => [issue.key, issue]));
  } catch {
    console.log(chalk.yellow('Warning: Failed to fetch Jira issues\n'));
  }

  console.log(chalk.blue('Worktrees:\n'));

  for (const worktree of worktrees) {
    const issue = issueMap.get(worktree.ticketKey);

    if (issue) {
      console.log(`  ${chalk.cyan(`[${issue.key}]`)} ${issue.summary} ${chalk.gray(`(${issue.status})`)}`);
    } else {
      console.log(`  ${chalk.cyan(`[${worktree.ticketKey}]`)} ${chalk.red('(Failed to fetch)')}`);
    }

    console.log(chalk.gray(`    Branch: ${worktree.branch}`));
    console.log(chalk.gray(`    Path:   ${worktree.path}\n`));
  }

  const count = worktrees.length;
  console.log(chalk.gray(`Total: ${String(count)} worktree${count > 1 ? 's' : ''}`));
};

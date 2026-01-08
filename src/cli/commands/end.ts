import chalk from 'chalk';
import { createPullRequest, getRepoFromRemote } from '../../adapters/github.js';
import { fetchIssue, transitionIssue, type JiraIssue } from '../../adapters/jira.js';
import { loadConfig } from '../../config/loader.js';
import { selectTicketInteractively } from '../../core/ticket-parser.js';
import {
  deleteBranch,
  deleteWorktree,
  getCurrentTicketKey,
  getWorktreeBranch,
  getWorktreePath,
  listWorktrees,
  pushBranch,
  worktreeExists,
} from '../../core/worktree.js';

interface EndOptions {
  pr?: boolean;
  draft?: boolean;
  base?: string;
  keep?: boolean;
}

const DEFAULT_PR_BODY_TEMPLATE = '## Related Issue\n{issueLink}';

const buildPRBody = (template: string, issue: JiraIssue, jiraBaseUrl: string): string => {
  const issueUrl = `${jiraBaseUrl}/browse/${issue.key}`;
  const issueLink = `[${issue.key}](${issueUrl})`;

  return template
    .replace(/{issueKey}/g, issue.key)
    .replace(/{issueLink}/g, issueLink)
    .replace(/{issueSummary}/g, issue.summary)
    .replace(/{issueUrl}/g, issueUrl);
};

const resolveTicketKey = async (ticketInput?: string): Promise<string> => {
  if (ticketInput) {
    return ticketInput.toUpperCase();
  }

  const currentKey = getCurrentTicketKey();
  if (currentKey) {
    return currentKey;
  }

  const worktrees = await listWorktrees();
  if (worktrees.length === 0) {
    throw new Error('No worktrees found. Nothing to end.');
  }

  const issues = await Promise.all(
    worktrees.map(async (wt) => {
      try {
        return await fetchIssue(wt.ticketKey);
      } catch {
        return { key: wt.ticketKey, summary: '(Failed to fetch)', status: '', type: '' };
      }
    }),
  );

  const selected = await selectTicketInteractively(issues);
  return selected.key;
};

export const endCommand = async (ticketInput: string | undefined, options: EndOptions): Promise<void> => {
  const config = await loadConfig();
  const jiraConfig = config.issueTracker.jira;

  if (!jiraConfig) {
    throw new Error('Jira configuration is missing in .ticketreerc');
  }

  const ticketKey = await resolveTicketKey(ticketInput);
  console.log(chalk.blue(`Ending work on ${ticketKey}...`));

  if (!worktreeExists(ticketKey)) {
    throw new Error(`Worktree for ${ticketKey} does not exist`);
  }

  const issue = await fetchIssue(ticketKey);
  const branchName = await getWorktreeBranch(ticketKey);

  if (!branchName) {
    throw new Error(`Could not determine branch name for ${ticketKey}`);
  }

  console.log(chalk.blue(`Pushing branch ${branchName}...`));
  await pushBranch(ticketKey);
  console.log(chalk.green('Branch pushed successfully'));

  if (options.pr) {
    console.log(chalk.blue('Creating pull request...'));

    const jiraBaseUrl = process.env.JIRA_BASE_URL;
    if (!jiraBaseUrl) {
      throw new Error('JIRA_BASE_URL environment variable is not set');
    }

    const prBodyTemplate = config.git.github?.prBodyTemplate ?? DEFAULT_PR_BODY_TEMPLATE;
    const prBody = buildPRBody(prBodyTemplate, issue, jiraBaseUrl);

    const { owner, repo } = await getRepoFromRemote();
    const baseBranch = options.base ?? config.git.baseBranch;
    const isDraft = options.draft !== false;

    const pr = await createPullRequest({
      owner,
      repo,
      head: branchName,
      base: baseBranch,
      title: `[${issue.key}] ${issue.summary}`,
      body: prBody,
      draft: isDraft,
    });

    console.log(chalk.green(`Pull request created: ${pr.url}`));
  }

  if (config.issueTransition.onEnd) {
    console.log(chalk.blue(`Transitioning issue to "${config.issueTransition.onEnd}"...`));
    await transitionIssue(ticketKey, config.issueTransition.onEnd);
    console.log(chalk.green('Issue transitioned successfully'));
  }

  if (!options.keep) {
    console.log(chalk.blue(`Removing worktree ${getWorktreePath(ticketKey)}...`));
    await deleteWorktree(ticketKey);
    console.log(chalk.green('Worktree removed'));

    console.log(chalk.blue(`Deleting local branch ${branchName}...`));
    await deleteBranch(branchName);
    console.log(chalk.green('Branch deleted'));
  }

  console.log(chalk.green('\nDone! Ticket work ended successfully.'));
};

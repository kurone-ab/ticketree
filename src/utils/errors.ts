export class UserError extends Error {
  constructor(
    message: string,
    public hint?: string,
  ) {
    super(message);
    this.name = 'UserError';
  }
}

export const jiraConfigMissingError = () =>
  new UserError(
    'Jira configuration is missing in .ticketreerc',
    "Run 'ticketree init' to create the configuration file.",
  );

export const jiraBaseUrlMissingError = () =>
  new UserError('JIRA_BASE_URL environment variable is not set', 'Set up your credentials in .envrc file.');

export const jiraConnectionFailedError = (message: string) =>
  new UserError(`Jira connection failed: ${message}`, 'Check your Jira credentials in .envrc file.');

export const worktreeNotFoundError = (key: string) =>
  new UserError(`Worktree for ${key} does not exist`, "Run 'ticketree list' to see existing worktrees.");

export const noWorktreesFoundError = () =>
  new UserError('No worktrees found. Nothing to end.', "Run 'ticketree start' to begin working on a ticket.");

export const branchNameNotFoundError = (key: string) => new UserError(`Could not determine branch name for ${key}`);

export const invalidTicketFormatError = (input: string) =>
  new UserError(`Invalid ticket format: "${input}"`, 'Expected: PROJ-123, 123, or Jira URL');

export const noIssuesFoundError = () =>
  new UserError('No issues found matching the configured JQL query', 'Check your JQL configuration in .ticketreerc');

export const projectConfigNotFoundError = (projectKey: string) =>
  new UserError(
    `No configuration found for project: ${projectKey}`,
    `Add the project to issueTracker.jira.projects in .ticketreerc, or set defaultProject.`,
  );

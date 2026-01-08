export interface JiraConfig {
  project: string;
  jql: string;
}

export interface IssueTrackerConfig {
  type: 'jira';
  jira?: JiraConfig;
}

export interface GitHubConfig {
  prBodyTemplate?: string;
}

export interface GitConfig {
  baseBranch: string;
  branchPrefix: string;
  github?: GitHubConfig;
}

export interface ExplicitSymlinkConfig {
  source: string;
  target: string;
}

export type SymlinkConfig = ExplicitSymlinkConfig | string;

export interface PostCreateConfig {
  symlinks: SymlinkConfig[];
}

export interface EditorConfig {
  enabled: boolean;
  command: string;
}

export interface TerminalConfig {
  enabled: boolean;
  preset: 'ghostty' | 'iterm' | 'terminal' | 'warp' | 'kitty' | 'alacritty';
}

export interface IssueTransitionConfig {
  onStart: string | null;
  onEnd: string | null;
}

export interface TicketreeConfig {
  issueTracker: IssueTrackerConfig;
  git: GitConfig;
  postCreate: PostCreateConfig;
  editor: EditorConfig;
  terminal: TerminalConfig;
  issueTransition: IssueTransitionConfig;
}

export interface JiraCredentials {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface GitHubCredentials {
  token: string;
}

export interface Credentials {
  jira: JiraCredentials;
  github?: GitHubCredentials;
}

export const DEFAULT_CONFIG: TicketreeConfig = {
  issueTracker: {
    type: 'jira',
    jira: {
      project: 'PROJ',
      jql: 'assignee = currentUser() AND resolution = Unresolved',
    },
  },
  git: {
    baseBranch: 'main',
    branchPrefix: 'feature/',
    github: {
      prBodyTemplate: '## Related Issue\n{issueLink}',
    },
  },
  postCreate: {
    symlinks: [],
  },
  editor: {
    enabled: true,
    command: 'code',
  },
  terminal: {
    enabled: true,
    preset: 'ghostty',
  },
  issueTransition: {
    onStart: null,
    onEnd: null,
  },
};

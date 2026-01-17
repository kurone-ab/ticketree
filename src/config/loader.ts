import chalk from 'chalk';
import { cosmiconfig } from 'cosmiconfig';
import type { JiraConfig, JiraProjectConfig, LegacyTicketreeConfig, TicketreeConfig } from '@/config/types.js';
import { projectConfigNotFoundError } from '@/utils/errors.js';

const explorer = cosmiconfig('ticketree', {
  searchPlaces: ['.ticketreerc', '.ticketreerc.yaml', '.ticketreerc.yml', '.ticketreerc.json'],
});

const isLegacyConfig = (config: unknown): config is LegacyTicketreeConfig => {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;

  if ('issueTransition' in c) return true;

  const issueTracker = c.issueTracker as Record<string, unknown> | undefined;
  const jira = issueTracker?.jira as Record<string, unknown> | undefined;
  if (jira && 'project' in jira && !('projects' in jira)) return true;

  return false;
};

const migrateConfig = (legacy: LegacyTicketreeConfig): TicketreeConfig => {
  const legacyJira = legacy.issueTracker.jira;
  const project = legacyJira?.project ?? 'PROJ';
  const jql = legacyJira?.jql ?? 'assignee = currentUser() AND resolution = Unresolved';

  const { issueTransition: legacyTransition, issueTracker: _legacyIssueTracker, ...rest } = legacy;

  const projectConfig: JiraProjectConfig = { jql };

  if (legacyTransition) {
    projectConfig.transition = {
      onStart: legacyTransition.onStart,
      onEnd: legacyTransition.onEnd,
    };
  }

  return {
    ...rest,
    issueTracker: {
      type: 'jira',
      jira: {
        defaultProject: project,
        projects: {
          [project]: projectConfig,
        },
      },
    },
  };
};

export const loadConfig = async (): Promise<TicketreeConfig> => {
  const result = await explorer.search();

  if (!result || result.isEmpty) {
    throw new Error('No .ticketreerc config file found. Run "ticketree init" first.');
  }

  if (isLegacyConfig(result.config)) {
    console.warn(
      chalk.yellow('⚠ Legacy config format detected. Please update to new format.') +
        '\n' +
        chalk.gray('  See: https://github.com/user/ticketree#config-migration\n'),
    );
    return migrateConfig(result.config);
  }

  return result.config as TicketreeConfig;
};

export const getProjectConfig = (jiraConfig: JiraConfig, ticketKey: string): JiraProjectConfig => {
  const projectKey = ticketKey.split('-')[0] ?? '';

  const config = jiraConfig.projects[projectKey];
  if (config) return config;

  if (jiraConfig.defaultProject) {
    const defaultConfig = jiraConfig.projects[jiraConfig.defaultProject];
    if (defaultConfig) return defaultConfig;
  }

  throw projectConfigNotFoundError(projectKey || ticketKey);
};

export const buildCombinedJql = (jiraConfig: JiraConfig): string => {
  const parts = Object.entries(jiraConfig.projects).map(
    ([projectKey, config]) => `(project = ${projectKey} AND (${config.jql}))`,
  );
  return parts.join(' OR ');
};

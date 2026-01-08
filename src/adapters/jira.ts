import { Version3Client } from 'jira.js';
import type { JiraCredentials } from '../config/types.js';

const getCredentialsFromEnv = (): JiraCredentials => {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!baseUrl) {
    throw new Error('JIRA_BASE_URL environment variable is not set');
  }
  if (!email) {
    throw new Error('JIRA_EMAIL environment variable is not set');
  }
  if (!apiToken) {
    throw new Error('JIRA_API_TOKEN environment variable is not set');
  }

  return { baseUrl, email, apiToken };
};

const createClient = (credentials: JiraCredentials): Version3Client => new Version3Client({
    host: credentials.baseUrl,
    authentication: {
      basic: {
        email: credentials.email,
        apiToken: credentials.apiToken,
      },
    },
  });

export const testJiraConnection = async (credentials?: JiraCredentials): Promise<void> => {
  const client = createClient(credentials ?? getCredentialsFromEnv());
  await client.myself.getCurrentUser();
};

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  type: string;
}

export const fetchIssues = async (jql: string, credentials?: JiraCredentials): Promise<JiraIssue[]> => {
  const client = createClient(credentials ?? getCredentialsFromEnv());
  const response = await client.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
    jql,
    fields: ['summary', 'status', 'issuetype'],
    maxResults: 50,
  });

  return (response.issues ?? []).map((issue) => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name ?? '',
    type: issue.fields.issuetype?.name ?? '',
  }));
};

export const fetchIssue = async (issueKey: string, credentials?: JiraCredentials): Promise<JiraIssue> => {
  const client = createClient(credentials ?? getCredentialsFromEnv());
  const issue = await client.issues.getIssue({
    issueIdOrKey: issueKey,
    fields: ['summary', 'status', 'issuetype'],
  });

  return {
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name ?? '',
    type: issue.fields.issuetype?.name ?? '',
  };
};

export const transitionIssue = async (issueKey: string, transitionName: string, credentials?: JiraCredentials): Promise<void> => {
  const client = createClient(credentials ?? getCredentialsFromEnv());

  const transitions = await client.issues.getTransitions({
    issueIdOrKey: issueKey,
  });

  const transition = transitions.transitions?.find((t) => t.name?.toLowerCase() === transitionName.toLowerCase());

  if (!transition?.id) {
    throw new Error(`Transition "${transitionName}" not found for issue ${issueKey}`);
  }

  await client.issues.doTransition({
    issueIdOrKey: issueKey,
    transition: { id: transition.id },
  });
};

import { Version3Client } from 'jira.js';
import type { JiraCredentials } from '../config/types.js';

export function getJiraCredentials(): JiraCredentials {
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
}

export function createJiraClient(credentials: JiraCredentials): Version3Client {
  return new Version3Client({
    host: credentials.baseUrl,
    authentication: {
      basic: {
        email: credentials.email,
        apiToken: credentials.apiToken,
      },
    },
  });
}

export async function testJiraConnection(credentials: JiraCredentials): Promise<void> {
  const client = createJiraClient(credentials);
  await client.myself.getCurrentUser();
}

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  type: string;
}

export async function fetchIssues(credentials: JiraCredentials, jql: string): Promise<JiraIssue[]> {
  const client = createJiraClient(credentials);
  const response = await client.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
    jql,
    fields: ['summary', 'status', 'issuetype'],
    maxResults: 50,
  });

  return (response.issues ?? []).map((issue) => ({
    key: issue.key,
    summary: (issue.fields.summary as string | undefined) ?? '',
    status: (issue.fields.status as { name?: string } | undefined)?.name ?? '',
    type: (issue.fields.issuetype as { name?: string } | undefined)?.name ?? '',
  }));
}

export async function fetchIssue(credentials: JiraCredentials, issueKey: string): Promise<JiraIssue> {
  const client = createJiraClient(credentials);
  const issue = await client.issues.getIssue({
    issueIdOrKey: issueKey,
    fields: ['summary', 'status', 'issuetype'],
  });

  return {
    key: issue.key,
    summary: (issue.fields.summary as string | undefined) ?? '',
    status: (issue.fields.status as { name?: string } | undefined)?.name ?? '',
    type: (issue.fields.issuetype as { name?: string } | undefined)?.name ?? '',
  };
}

export async function transitionIssue(
  credentials: JiraCredentials,
  issueKey: string,
  transitionName: string,
): Promise<void> {
  const client = createJiraClient(credentials);

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
}

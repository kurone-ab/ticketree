import { search } from '@inquirer/prompts';
import type { JiraIssue } from '@/adapters/jira.js';
import { invalidTicketFormatError, noIssuesFoundError } from '@/utils/errors.js';

export interface ParsedTicket {
  key: string;
  projectKey: string;
  issueNumber: string;
}

const JIRA_URL_REGEX = /\/browse\/([A-Z]+-\d+)/i;
const FULL_KEY_REGEX = /^([A-Z]+)-(\d+)$/i;
const NUMBER_ONLY_REGEX = /^\d+$/;

export const parseTicketInput = (input: string, defaultProject: string): ParsedTicket => {
  const urlMatch = JIRA_URL_REGEX.exec(input);
  if (urlMatch?.[1]) {
    const key = urlMatch[1].toUpperCase();
    const keyMatch = FULL_KEY_REGEX.exec(key);
    if (keyMatch?.[1] && keyMatch[2]) {
      return {
        key,
        projectKey: keyMatch[1],
        issueNumber: keyMatch[2],
      };
    }
  }

  const fullKeyMatch = FULL_KEY_REGEX.exec(input);
  if (fullKeyMatch?.[1] && fullKeyMatch[2]) {
    return {
      key: input.toUpperCase(),
      projectKey: fullKeyMatch[1].toUpperCase(),
      issueNumber: fullKeyMatch[2],
    };
  }

  if (NUMBER_ONLY_REGEX.test(input)) {
    return {
      key: `${defaultProject}-${input}`,
      projectKey: defaultProject,
      issueNumber: input,
    };
  }

  throw invalidTicketFormatError(input);
};

export const selectTicketInteractively = async (issues: JiraIssue[]): Promise<JiraIssue> => {
  if (issues.length === 0) {
    throw noIssuesFoundError();
  }

  const selected = await search<JiraIssue>({
    message: 'Select a ticket:',
    source: (term) => {
      const searchTerm = term?.toLowerCase() ?? '';
      return issues
        .filter((issue) => {
          if (!searchTerm) return true;
          const searchTarget = `${issue.key} ${issue.summary} ${issue.status}`.toLowerCase();
          return searchTarget.includes(searchTerm);
        })
        .map((issue) => ({
          name: `[${issue.key}] ${issue.summary} (${issue.status})`,
          value: issue,
        }));
    },
  });

  return selected;
};

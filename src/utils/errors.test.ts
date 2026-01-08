import { describe, it, expect } from 'vitest';
import {
  UserError,
  jiraConfigMissingError,
  jiraBaseUrlMissingError,
  jiraConnectionFailedError,
  worktreeNotFoundError,
  noWorktreesFoundError,
  branchNameNotFoundError,
  invalidTicketFormatError,
  noIssuesFoundError,
} from './errors.js';

describe('UserError', () => {
  it('creates error with message only', () => {
    const error = new UserError('Test message');
    expect(error.message).toBe('Test message');
    expect(error.hint).toBeUndefined();
    expect(error.name).toBe('UserError');
  });

  it('creates error with message and hint', () => {
    const error = new UserError('Test message', 'Test hint');
    expect(error.message).toBe('Test message');
    expect(error.hint).toBe('Test hint');
  });

  it('is instance of Error', () => {
    const error = new UserError('Test');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(UserError);
  });
});

describe('error factories', () => {
  describe('jiraConfigMissingError', () => {
    it('returns UserError with correct message', () => {
      const error = jiraConfigMissingError();
      expect(error).toBeInstanceOf(UserError);
      expect(error.message).toContain('Jira configuration');
      expect(error.message).toContain('.ticketreerc');
    });

    it('includes hint about init command', () => {
      const error = jiraConfigMissingError();
      expect(error.hint).toContain('ticketree init');
    });
  });

  describe('jiraBaseUrlMissingError', () => {
    it('returns UserError with correct message', () => {
      const error = jiraBaseUrlMissingError();
      expect(error).toBeInstanceOf(UserError);
      expect(error.message).toContain('JIRA_BASE_URL');
    });

    it('includes hint about envrc', () => {
      const error = jiraBaseUrlMissingError();
      expect(error.hint).toContain('.envrc');
    });
  });

  describe('jiraConnectionFailedError', () => {
    it('includes the provided error message', () => {
      const error = jiraConnectionFailedError('Connection refused');
      expect(error).toBeInstanceOf(UserError);
      expect(error.message).toContain('Connection refused');
      expect(error.message).toContain('Jira connection failed');
    });

    it('includes hint about credentials', () => {
      const error = jiraConnectionFailedError('timeout');
      expect(error.hint).toContain('credentials');
    });
  });

  describe('worktreeNotFoundError', () => {
    it('includes ticket key in message', () => {
      const error = worktreeNotFoundError('PROJ-123');
      expect(error).toBeInstanceOf(UserError);
      expect(error.message).toContain('PROJ-123');
    });

    it('includes hint about list command', () => {
      const error = worktreeNotFoundError('PROJ-456');
      expect(error.hint).toContain('ticketree list');
    });
  });

  describe('noWorktreesFoundError', () => {
    it('returns UserError with correct message', () => {
      const error = noWorktreesFoundError();
      expect(error).toBeInstanceOf(UserError);
      expect(error.message).toContain('No worktrees found');
    });

    it('includes hint about start command', () => {
      const error = noWorktreesFoundError();
      expect(error.hint).toContain('ticketree start');
    });
  });

  describe('branchNameNotFoundError', () => {
    it('includes ticket key in message', () => {
      const error = branchNameNotFoundError('PROJ-789');
      expect(error).toBeInstanceOf(UserError);
      expect(error.message).toContain('PROJ-789');
      expect(error.message).toContain('branch name');
    });
  });

  describe('invalidTicketFormatError', () => {
    it('includes the invalid input in message', () => {
      const error = invalidTicketFormatError('bad-input');
      expect(error).toBeInstanceOf(UserError);
      expect(error.message).toContain('bad-input');
      expect(error.message).toContain('Invalid ticket format');
    });

    it('includes hint with valid formats', () => {
      const error = invalidTicketFormatError('xyz');
      expect(error.hint).toContain('PROJ-123');
    });
  });

  describe('noIssuesFoundError', () => {
    it('returns UserError with correct message', () => {
      const error = noIssuesFoundError();
      expect(error).toBeInstanceOf(UserError);
      expect(error.message).toContain('No issues found');
    });

    it('includes hint about JQL configuration', () => {
      const error = noIssuesFoundError();
      expect(error.hint).toContain('JQL');
    });
  });
});

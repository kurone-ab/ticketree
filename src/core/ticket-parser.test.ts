import { describe, expect, it } from 'vitest';
import { parseTicketInput } from './ticket-parser.js';

describe('parseTicketInput', () => {
  const defaultProject = 'PROJ';

  describe('full key format (PROJ-123)', () => {
    it('parses uppercase key', () => {
      const result = parseTicketInput('PROJ-123', defaultProject);
      expect(result).toEqual({
        key: 'PROJ-123',
        projectKey: 'PROJ',
        issueNumber: '123',
      });
    });

    it('converts lowercase to uppercase', () => {
      const result = parseTicketInput('proj-456', defaultProject);
      expect(result).toEqual({
        key: 'PROJ-456',
        projectKey: 'PROJ',
        issueNumber: '456',
      });
    });

    it('handles mixed case', () => {
      const result = parseTicketInput('Proj-789', defaultProject);
      expect(result).toEqual({
        key: 'PROJ-789',
        projectKey: 'PROJ',
        issueNumber: '789',
      });
    });

    it('handles different project key', () => {
      const result = parseTicketInput('ABC-789', defaultProject);
      expect(result).toEqual({
        key: 'ABC-789',
        projectKey: 'ABC',
        issueNumber: '789',
      });
    });
  });

  describe('number only format (123)', () => {
    it('uses default project', () => {
      const result = parseTicketInput('123', defaultProject);
      expect(result).toEqual({
        key: 'PROJ-123',
        projectKey: 'PROJ',
        issueNumber: '123',
      });
    });

    it('uses custom default project', () => {
      const result = parseTicketInput('456', 'CUSTOM');
      expect(result).toEqual({
        key: 'CUSTOM-456',
        projectKey: 'CUSTOM',
        issueNumber: '456',
      });
    });

    it('handles large numbers', () => {
      const result = parseTicketInput('99999', defaultProject);
      expect(result).toEqual({
        key: 'PROJ-99999',
        projectKey: 'PROJ',
        issueNumber: '99999',
      });
    });
  });

  describe('Jira URL format', () => {
    it('parses standard Jira URL', () => {
      const result = parseTicketInput('https://company.atlassian.net/browse/PROJ-123', defaultProject);
      expect(result).toEqual({
        key: 'PROJ-123',
        projectKey: 'PROJ',
        issueNumber: '123',
      });
    });

    it('parses URL with lowercase key', () => {
      const result = parseTicketInput('https://example.atlassian.net/browse/abc-999', defaultProject);
      expect(result).toEqual({
        key: 'ABC-999',
        projectKey: 'ABC',
        issueNumber: '999',
      });
    });

    it('parses URL with different domain', () => {
      const result = parseTicketInput('https://jira.example.com/browse/TEST-42', defaultProject);
      expect(result).toEqual({
        key: 'TEST-42',
        projectKey: 'TEST',
        issueNumber: '42',
      });
    });
  });

  describe('invalid input', () => {
    it('throws on invalid format', () => {
      expect(() => parseTicketInput('invalid', defaultProject)).toThrow();
    });

    it('throws on empty string', () => {
      expect(() => parseTicketInput('', defaultProject)).toThrow();
    });

    it('throws on special characters', () => {
      expect(() => parseTicketInput('PROJ@123', defaultProject)).toThrow();
    });

    it('throws on key without number', () => {
      expect(() => parseTicketInput('PROJ-', defaultProject)).toThrow();
    });

    it('throws on number with letters', () => {
      expect(() => parseTicketInput('123abc', defaultProject)).toThrow();
    });
  });
});

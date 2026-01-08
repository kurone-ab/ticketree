import { describe, expect, it } from 'vitest';
import { parseGitRemoteUrl } from './github.js';

describe('parseGitRemoteUrl', () => {
  describe('HTTPS URLs', () => {
    it('parses standard HTTPS URL with .git suffix', () => {
      const result = parseGitRemoteUrl('https://github.com/owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('parses HTTPS URL without .git suffix', () => {
      const result = parseGitRemoteUrl('https://github.com/owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('handles hyphenated owner name', () => {
      const result = parseGitRemoteUrl('https://github.com/my-org/repo.git');
      expect(result).toEqual({ owner: 'my-org', repo: 'repo' });
    });

    it('handles hyphenated repo name', () => {
      const result = parseGitRemoteUrl('https://github.com/owner/my-repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'my-repo' });
    });

    it('handles both hyphenated', () => {
      const result = parseGitRemoteUrl('https://github.com/my-org/my-repo.git');
      expect(result).toEqual({ owner: 'my-org', repo: 'my-repo' });
    });

    it('handles underscores', () => {
      const result = parseGitRemoteUrl('https://github.com/my_org/my_repo.git');
      expect(result).toEqual({ owner: 'my_org', repo: 'my_repo' });
    });
  });

  describe('SSH URLs', () => {
    it('parses standard SSH URL with .git suffix', () => {
      const result = parseGitRemoteUrl('git@github.com:owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('parses SSH URL without .git suffix', () => {
      const result = parseGitRemoteUrl('git@github.com:owner/repo');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('parses custom SSH alias', () => {
      const result = parseGitRemoteUrl('github-personal:owner/repo.git');
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('handles complex SSH alias with hyphen', () => {
      const result = parseGitRemoteUrl('github-work:my-company/project.git');
      expect(result).toEqual({ owner: 'my-company', repo: 'project' });
    });

    it('handles SSH alias without hyphen', () => {
      const result = parseGitRemoteUrl('gh:user/project.git');
      expect(result).toEqual({ owner: 'user', repo: 'project' });
    });

    it('handles hyphenated names in SSH URL', () => {
      const result = parseGitRemoteUrl('git@github.com:my-org/my-repo.git');
      expect(result).toEqual({ owner: 'my-org', repo: 'my-repo' });
    });
  });

  describe('invalid URLs', () => {
    it('throws on plain text', () => {
      expect(() => parseGitRemoteUrl('not-a-url')).toThrow('Failed to parse GitHub remote URL');
    });

    it('throws on empty string', () => {
      expect(() => parseGitRemoteUrl('')).toThrow('Failed to parse GitHub remote URL');
    });

    it('throws on URL without owner/repo', () => {
      expect(() => parseGitRemoteUrl('https://github.com/')).toThrow('Failed to parse GitHub remote URL');
    });

    it('throws on URL with only owner', () => {
      expect(() => parseGitRemoteUrl('https://github.com/owner')).toThrow('Failed to parse GitHub remote URL');
    });

    it('throws on malformed SSH URL', () => {
      expect(() => parseGitRemoteUrl('git@github.com')).toThrow('Failed to parse GitHub remote URL');
    });
  });
});

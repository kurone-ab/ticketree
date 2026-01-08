# AGENTS.md - Ticketree

> CLI tool that connects issue tracker tickets with Git Worktree for automated ticket-based development workflow.

## Quick Reference

| Action       | Command                                    |
| ------------ | ------------------------------------------ |
| Build        | `pnpm build`                               |
| Dev (watch)  | `pnpm dev`                                 |
| Lint         | `pnpm lint`                                |
| Lint fix     | `pnpm lint:fix`                            |
| Format       | `pnpm format`                              |
| Format check | `pnpm format:check`                        |
| Typecheck    | `pnpm typecheck`                           |
| Run CLI      | `pnpm start` or `node ./dist/cli/index.js` |

> **Note**: No test framework configured yet. Add tests when implementing new features.

---

## Tech Stack

- **Runtime**: Node.js >= 20.10.0
- **Package Manager**: pnpm 10.26.0
- **Language**: TypeScript 5.9 (ES2022, NodeNext modules)
- **Module System**: ESM (`"type": "module"`)
- **CLI Framework**: Commander.js
- **External APIs**: Jira (jira.js), GitHub (octokit)
- **Git Operations**: simple-git
- **Interactive Prompts**: @inquirer/prompts

---

## Code Style Guidelines

### TypeScript Configuration (Strict Mode)

```json
{
  "strict": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "exactOptionalPropertyTypes": true
}
```

**Key implications**:

- Array access returns `T | undefined` - always handle undefined
- Optional properties must be explicitly `undefined` or omitted
- All switch cases must have explicit break/return

### Imports

```typescript
// Node.js built-ins: ALWAYS use 'node:' prefix
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// External packages
import { Command } from 'commander';
import chalk from 'chalk';

// Internal imports: ALWAYS use .js extension (ESM requirement)
import { DEFAULT_CONFIG } from '../../config/types.js';

// Type imports: Use inline 'type' keyword
import type { JiraCredentials } from '../config/types.js';
// OR
import { type JiraCredentials, DEFAULT_CONFIG } from '../config/types.js';
```

### Formatting (Prettier)

| Rule              | Value        |
| ----------------- | ------------ |
| Print width       | 120          |
| Tab width         | 2 spaces     |
| Semicolons        | Always       |
| Quotes            | Single (`'`) |
| Trailing comma    | All          |
| Arrow parens      | Always       |
| Bracket same line | true         |

### Naming Conventions

| Element     | Convention           | Example                        |
| ----------- | -------------------- | ------------------------------ |
| Interfaces  | PascalCase           | `TicketreeConfig`, `JiraIssue` |
| Types       | PascalCase           | `TerminalPreset`               |
| Functions   | camelCase            | `fetchIssues`, `createClient`  |
| Variables   | camelCase            | `configFile`, `excludeLine`    |
| Constants   | SCREAMING_SNAKE_CASE | `TICKETREE_DIR`, `CONFIG_FILE` |
| Files       | kebab-case           | `jira.ts`, `init.ts`           |
| Directories | kebab-case           | `cli/commands/`                |

### Function Signatures

```typescript
// Explicit return types for exported functions
export async function fetchIssues(jql: string, credentials?: JiraCredentials): Promise<JiraIssue[]> {
  // ...
}

// Private functions can omit return types if obvious
function createClient(credentials: JiraCredentials) {
  return new Version3Client({
    /* ... */
  });
}
```

### Unused Variables

Prefix with underscore to ignore:

```typescript
const [_unused, important] = tuple;
array.map((_item, index) => index);
```

---

## Error Handling

```typescript
// Throw explicit Error instances with descriptive messages
if (!baseUrl) {
  throw new Error('JIRA_BASE_URL environment variable is not set');
}

// Always check error type in catch blocks
try {
  await testJiraConnection();
} catch (error) {
  if (error instanceof Error) {
    console.log(chalk.red(`Jira connection failed: ${error.message}`));
  }
  process.exit(1);
}
```

---

## Architecture

```
src/
  index.ts           # Library exports
  adapters/          # External service integrations
    jira.ts          # Jira API adapter
    github.ts        # GitHub PR creation adapter
  cli/
    index.ts         # CLI entry point (Commander setup)
    error-handler.ts # Global error handling & process signals
    commands/        # CLI command implementations
      init.ts
      start.ts
      list.ts
      end.ts
  config/
    types.ts         # Type definitions & default config
    loader.ts        # cosmiconfig-based config loader
  core/              # Core business logic
    editor.ts        # Editor launch utility
    terminal.ts      # Terminal preset support (ghostty, etc.)
    ticket-parser.ts # Ticket input parsing & interactive selection
    worktree.ts      # Git worktree management
  utils/
    errors.ts        # Custom error classes (UserError)
```

### Patterns

1. **Adapter Pattern**: External services in `adapters/`. Each adapter exports functions, not classes.
2. **CLI Commands**: Each command is a separate file exporting a single function.
3. **Config Loading**: Uses `cosmiconfig` for `.ticketreerc` (YAML format).
4. **Environment Variables**: Credentials via env vars (JIRA_BASE_URL, JIRA_EMAIL, etc.)
5. **Error Handling**: Custom `UserError` class with optional hints. Factory functions for common errors in `utils/errors.ts`.

---

## Common Gotchas

1. **ESM requires `.js` extensions** - Even for TypeScript files, import with `.js`
2. **`noUncheckedIndexedAccess`** - Array[index] returns `T | undefined`
3. **Nullish coalescing** - Use `??` for defaults: `response.issues ?? []`
4. **Optional chaining** - Safe navigation: `issue.fields.issuetype?.name ?? ''`

---

## Before Submitting Code

```bash
# Run all checks
pnpm typecheck && pnpm lint && pnpm format:check

# Or fix automatically
pnpm lint:fix && pnpm format
```

---

## Environment Setup

```bash
# Required for Jira integration
export JIRA_BASE_URL="https://your-company.atlassian.net"
export JIRA_EMAIL="your-email@example.com"
export JIRA_API_TOKEN="your-api-token"

# Optional for PR creation
export GITHUB_TOKEN="ghp_xxx"

# Optional for debugging
export DEBUG="1"  # Shows full stack traces on errors
```

Recommend using `direnv` with `.envrc` file.

import chalk from 'chalk';
import { UserError } from '@/utils/errors.js';

const isDebugMode = () => process.env.DEBUG === '1';

const isExitPromptError = (error: unknown): boolean => error instanceof Error && error.name === 'ExitPromptError';

export const handleError = (error: unknown): never => {
  if (isExitPromptError(error)) {
    console.log('\nCancelled.');
    process.exit(130);
  }

  if (error instanceof UserError) {
    console.error(`\n${chalk.red(`\u2716 ${error.message}`)}`);
    if (error.hint) {
      console.error(`\n  ${chalk.cyan('Hint:')} ${error.hint}`);
    }
    if (isDebugMode() && error.stack) {
      console.error(`\n${chalk.gray(error.stack)}`);
    }
    process.exit(1);
  }

  if (error instanceof Error) {
    console.error(`\n${chalk.red(`\u2716 ${error.message}`)}`);
    if (isDebugMode() && error.stack) {
      console.error(`\n${chalk.gray(error.stack)}`);
    } else {
      console.error(`\n  ${chalk.gray('Run with DEBUG=1 for more details.')}`);
    }
    process.exit(1);
  }

  console.error(`\n${chalk.red('\u2716 An unexpected error occurred')}`);
  if (isDebugMode()) {
    console.error(error);
  } else {
    console.error(`\n  ${chalk.gray('Run with DEBUG=1 for more details.')}`);
  }
  process.exit(1);
};

export const setupGlobalHandlers = (): void => {
  process.on('SIGINT', () => {
    console.log('\nCancelled.');
    process.exit(130);
  });

  process.on('uncaughtException', (error) => {
    handleError(error);
  });

  process.on('unhandledRejection', (reason) => {
    handleError(reason);
  });
};

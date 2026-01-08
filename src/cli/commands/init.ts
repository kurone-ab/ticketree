import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { stringify } from 'yaml';
import { DEFAULT_CONFIG } from '@/config/types.js';
import { testJiraConnection } from '@/adapters/jira.js';
import { jiraConnectionFailedError } from '@/utils/errors.js';

const TICKETREE_DIR = '.ticketree';
const CONFIG_FILE = '.ticketreerc';
const GIT_EXCLUDE_FILE = '.git/info/exclude';

export const initCommand = async (): Promise<void> => {
  console.log(chalk.blue('Initializing Ticketree...'));

  if (existsSync(CONFIG_FILE)) {
    console.log(chalk.yellow(`${CONFIG_FILE} already exists. Skipping config creation.`));
  } else {
    const configYaml = stringify(DEFAULT_CONFIG);
    writeFileSync(CONFIG_FILE, configYaml, 'utf-8');
    console.log(chalk.green(`Created ${CONFIG_FILE}`));
  }

  if (!existsSync(TICKETREE_DIR)) {
    mkdirSync(TICKETREE_DIR, { recursive: true });
    console.log(chalk.green(`Created ${TICKETREE_DIR}/ directory`));
  } else {
    console.log(chalk.yellow(`${TICKETREE_DIR}/ already exists.`));
  }

  if (existsSync('.git')) {
    const excludeDir = join('.git', 'info');
    if (!existsSync(excludeDir)) {
      mkdirSync(excludeDir, { recursive: true });
    }

    const excludeLine = `${TICKETREE_DIR}/`;
    let excludeContent = '';

    if (existsSync(GIT_EXCLUDE_FILE)) {
      excludeContent = readFileSync(GIT_EXCLUDE_FILE, 'utf-8');
    }

    if (!excludeContent.includes(excludeLine)) {
      appendFileSync(GIT_EXCLUDE_FILE, `\n# Added by ticketree\n${excludeLine}\n`);
      console.log(chalk.green(`Added ${TICKETREE_DIR}/ to ${GIT_EXCLUDE_FILE}`));
    } else {
      console.log(chalk.yellow(`${TICKETREE_DIR}/ already in ${GIT_EXCLUDE_FILE}`));
    }
  } else {
    console.log(chalk.yellow('Not a git repository. Skipping .git/info/exclude modification.'));
  }

  console.log(chalk.blue('\nTesting Jira connection...'));

  try {
    await testJiraConnection();
    console.log(chalk.green('Jira connection successful!'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw jiraConnectionFailedError(message);
  }

  console.log(chalk.green('\nTicketree initialized successfully!'));
};

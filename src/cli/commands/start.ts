import chalk from 'chalk';

export function startCommand(ticket?: string): void {
  console.log(chalk.blue('Starting ticket work...'));

  if (ticket) {
    console.log(chalk.gray(`Ticket: ${ticket}`));
  } else {
    console.log(chalk.gray('No ticket specified, will show selection...'));
  }

  console.log(chalk.yellow('Not implemented yet'));
}

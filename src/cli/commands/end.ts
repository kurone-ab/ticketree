import chalk from 'chalk';

interface EndOptions {
  pr?: boolean;
  draft?: boolean;
  base?: string;
}

export const endCommand = (ticket: string | undefined, options: EndOptions): void => {
  console.log(chalk.blue('Ending ticket work...'));

  if (ticket) {
    console.log(chalk.gray(`Ticket: ${ticket}`));
  } else {
    console.log(chalk.gray('No ticket specified, will show selection...'));
  }

  if (options.pr) {
    const prType = options.draft !== false ? 'draft' : 'regular';
    console.log(chalk.gray(`Will create ${prType} PR`));
    if (options.base) {
      console.log(chalk.gray(`Base branch: ${options.base}`));
    }
  }

  console.log(chalk.yellow('Not implemented yet'));
};

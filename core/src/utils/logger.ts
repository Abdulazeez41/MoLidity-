import chalk from "chalk";

export const logger = {
  info: (msg: string) => console.log(chalk.blue(`[INFO] ${msg}`)),
  warn: (msg: string) => console.warn(chalk.yellow(`[WARN] ${msg}`)),
  error: (msg: string) => console.error(chalk.red(`[ERROR] ${msg}`)),
  success: (msg: string) => console.log(chalk.green(`[SUCCESS] ${msg}`)),
  verbose: (msg: string, isVerbose: boolean) => {
    if (isVerbose) {
      console.debug(chalk.gray(`[VERBOSE] ${msg}`));
    }
  },
};

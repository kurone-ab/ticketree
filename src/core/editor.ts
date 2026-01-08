import { spawn } from 'node:child_process';

export const openEditor = (worktreePath: string, command: string): void => {
  spawn(command, [worktreePath], {
    detached: true,
    stdio: 'ignore',
  }).unref();
};

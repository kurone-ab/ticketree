import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import type { TerminalConfig } from '../config/types.js';

type TerminalPreset = TerminalConfig['preset'];

export interface OpenTerminalOptions {
  worktreePath: string;
  title: string;
  preset: TerminalPreset;
}

const openGhostty = (absolutePath: string, title: string): void => {
  spawn('open', ['-na', 'ghostty', '--args', `--title=${title}`, `--working-directory=${absolutePath}`], {
    detached: true,
    stdio: 'ignore',
  }).unref();
};

export const openTerminal = (options: OpenTerminalOptions): void => {
  const { worktreePath, title, preset } = options;
  const absolutePath = resolve(worktreePath);

  switch (preset) {
    case 'ghostty':
      openGhostty(absolutePath, title);
      break;
    case 'iterm':
    case 'terminal':
    case 'warp':
    case 'kitty':
    case 'alacritty':
      throw new Error(`Terminal preset "${preset}" is not implemented yet`);
  }
};

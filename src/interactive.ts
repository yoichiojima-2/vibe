import inquirer from 'inquirer';
import type { TargetName } from './config.js';
import { deployToTarget, deployAll } from './deployment.js';

export async function interactive(): Promise<void> {
  console.log('🎵 Vibe - MCP Configuration Deployment\n');

  const { target } = await inquirer.prompt([
    {
      type: 'list',
      name: 'target',
      message: 'Choose a deployment target:',
      choices: [
        { name: 'Claude Desktop', value: 'claude' },
        { name: 'Codex CLI', value: 'codex' },
        { name: 'Gemini', value: 'gemini' },
        { name: 'Claude Code', value: 'claude-code' },
        { name: 'All targets', value: 'all' },
      ],
    },
  ]);

  if (target === 'all') {
    await deployAll();
  } else {
    await deployToTarget(target as TargetName);
  }
}
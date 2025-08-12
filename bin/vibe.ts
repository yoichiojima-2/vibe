#!/usr/bin/env node
import {
  deployToTarget,
  deployAll,
  interactive,
  TARGETS,
} from '../src/index.js';

type TargetName = 'claude' | 'codex' | 'gemini' | 'claude-code';

const args: string[] = process.argv.slice(2);
const target: string | undefined = args[0];
const verbose: boolean = args.includes('-v') || args.includes('--verbose');

if (!target) {
  interactive();
} else if (target === 'all') {
  deployAll(verbose);
} else if (Object.keys(TARGETS).includes(target)) {
  deployToTarget(target as TargetName, verbose);
} else {
  console.log(`✗ Unknown target: ${target}`);
  console.log(`Available targets: ${Object.keys(TARGETS).join(', ')}, all`);
  process.exit(1);
}

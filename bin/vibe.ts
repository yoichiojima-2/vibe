#!/usr/bin/env node
import { deployToTarget, deployAll, interactive, TARGETS } from '../src/index.js';
import type { TargetName } from '../src/index.js';

const args = process.argv.slice(2);
const target = args[0];
const verbose = args.includes('-v') || args.includes('--verbose');

function isValidTarget(target: string): target is TargetName {
  return Object.keys(TARGETS).includes(target);
}

async function main() {
  if (!target) {
    await interactive();
  } else if (target === 'all') {
    await deployAll(verbose);
  } else if (isValidTarget(target)) {
    await deployToTarget(target, verbose);
  } else {
    console.log(`✗ Unknown target: ${target}`);
    console.log(`Available targets: ${Object.keys(TARGETS).join(', ')}, all`);
    process.exit(1);
  }
}

main().catch(console.error);

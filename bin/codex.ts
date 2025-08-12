#!/usr/bin/env node
import { deployToTarget } from '../src/index.js';

console.log('ℹ Codex CLI MCP Configuration Deployment');
deployToTarget('codex', true).catch(console.error);

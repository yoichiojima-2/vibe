#!/usr/bin/env node
import { deployToTarget } from '../src/index.js';

console.log('ℹ Claude Code MCP Configuration Deployment');
deployToTarget('claude-code', true);
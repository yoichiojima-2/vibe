#!/usr/bin/env node
import { deployToTarget } from '../src/index.js';

console.log('ℹ Claude Desktop MCP Configuration Deployment');
deployToTarget('claude', true);

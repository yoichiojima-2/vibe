#!/usr/bin/env node
import { deployToTarget } from '../src/index.js';

console.log('ℹ Gemini MCP Configuration Deployment');
deployToTarget('gemini', true).catch(console.error);

#!/usr/bin/env node
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import TOML, { JsonMap } from '@iarna/toml';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

type LogType = 'info' | 'success' | 'error';
type TargetName = 'claude' | 'codex' | 'gemini' | 'claude-code';

interface McpServer {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

interface McpSettings {
  mcpServers?: Record<string, McpServer>;
}

const VIBE_DIR: string =
  process.env.VIBE_DIR || join(homedir(), 'Developer/repo/vibe');
const MCP_SETTINGS: string = join(VIBE_DIR, 'mcp-settings.json');

// Load and expand .env file from VIBE_DIR
const envConfig = config({ path: join(VIBE_DIR, '.env') });
expand(envConfig);

const TARGETS: Record<TargetName, string> = {
  claude: join(
    homedir(),
    'Library/Application Support/Claude/claude_desktop_config.json'
  ),
  codex: join(homedir(), '.codex/config.toml'),
  gemini: join(homedir(), '.gemini/settings.json'),
  'claude-code': join(homedir(), '.claude-code/mcp_settings.json'),
};

function log(message: string, type: LogType = 'info'): void {
  const prefix = type === 'error' ? '✗' : type === 'success' ? '✓' : 'ℹ';
  console.log(`${prefix} ${message}`);
}

function ensureDir(filepath: string): void {
  const dir = dirname(filepath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// Built-in servers that Claude Code already has
const CLAUDE_CODE_BUILTIN_SERVERS = new Set([
  'filesystem',
  'git',
  'github',
  'brave-search',
  'memory'
]);

function expandEnvVars(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/\$([A-Z_][A-Z0-9_]*)/g, (match, varName) => {
      return process.env[varName] || match;
    });
  }
  
  if (Array.isArray(obj)) {
    return obj.map(expandEnvVars);
  }
  
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = expandEnvVars(value);
    }
    return result;
  }
  
  return obj;
}

function filterServersForTarget(mcpServers: Record<string, McpServer>, target: TargetName): Record<string, McpServer> {
  if (target === 'claude-code') {
    const filtered: Record<string, McpServer> = {};
    for (const [key, value] of Object.entries(mcpServers)) {
      if (!CLAUDE_CODE_BUILTIN_SERVERS.has(key)) {
        filtered[key] = value;
      }
    }
    return filtered;
  }
  return mcpServers;
}


function loadMcpSettings(): McpSettings {
  if (!existsSync(MCP_SETTINGS)) {
    throw new Error(`MCP settings not found: ${MCP_SETTINGS}`);
  }

  try {
    const content = readFileSync(MCP_SETTINGS, 'utf8');
    return JSON.parse(content) as McpSettings;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load MCP settings: ${errorMessage}`);
  }
}

function convertToToml(mcpServers: Record<string, McpServer>): string {
  const tomlObject: JsonMap = { mcp_servers: {} as JsonMap };
  const servers = tomlObject.mcp_servers as JsonMap;
  
  for (const [key, server] of Object.entries(mcpServers)) {
    const serverObj: JsonMap = {};
    
    if (server.command) serverObj.command = server.command;
    if (server.args) serverObj.args = server.args as string[];
    if (server.env) serverObj.env = server.env as JsonMap;
    
    servers[key] = serverObj;
  }
  
  return TOML.stringify(tomlObject);
}

function deployToTarget(target: TargetName, verbose: boolean = false): void {
  try {
    if (verbose) log(`Deploying to ${target}...`);

    const targetPath = TARGETS[target];
    if (!targetPath) {
      throw new Error(`Unknown target: ${target}`);
    }

    const mcpData = loadMcpSettings();
    const expandedMcpData = expandEnvVars(mcpData);
    const filteredMcpServers = filterServersForTarget(expandedMcpData.mcpServers || {}, target);
    const finalMcpData = { ...expandedMcpData, mcpServers: filteredMcpServers };
    
    ensureDir(targetPath);

    if (target === 'codex') {
      const tomlContent = convertToToml(filteredMcpServers);
      writeFileSync(targetPath, tomlContent, 'utf8');
    } else {
      writeFileSync(targetPath, JSON.stringify(finalMcpData, null, 2), 'utf8');
    }

    log(`Configuration deployed to ${target}`, 'success');
    if (verbose) log(`Location: ${targetPath}`);
    if (target === 'claude-code' && verbose) {
      const excludedCount = Object.keys(expandedMcpData.mcpServers || {}).length - Object.keys(filteredMcpServers).length;
      if (excludedCount > 0) {
        log(`Excluded ${excludedCount} built-in server(s) for Claude Code`);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Failed to deploy to ${target}: ${errorMessage}`, 'error');
    process.exit(1);
  }
}

function deployAll(verbose: boolean = false): void {
  (Object.keys(TARGETS) as TargetName[]).forEach((target) =>
    deployToTarget(target, verbose)
  );
}

function interactive(): void {
  console.log('🎵 Vibe - MCP Configuration Deployment\n');
  console.log('Choose a deployment target:');
  console.log('1. Claude Desktop');
  console.log('2. Codex CLI');
  console.log('3. Gemini');
  console.log('4. Claude Code');
  console.log('5. All targets\n');

  process.stdout.write('Enter your choice (1-5): ');
  process.stdin.setEncoding('utf8');

  process.stdin.on('readable', () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
      const choice = chunk.trim();
      process.stdin.destroy();

      switch (choice) {
        case '1':
          deployToTarget('claude');
          break;
        case '2':
          deployToTarget('codex');
          break;
        case '3':
          deployToTarget('gemini');
          break;
        case '4':
          deployToTarget('claude-code');
          break;
        case '5':
          deployAll();
          break;
        default:
          log('Invalid choice. Exiting.', 'error');
          process.exit(1);
      }
    }
  });
}

export { deployToTarget, deployAll, interactive, TARGETS };

#!/usr/bin/env node
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import TOML, { JsonMap } from '@iarna/toml';

type LogType = 'info' | 'success' | 'error';
type TargetName = 'claude' | 'codex' | 'gemini';

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

const TARGETS: Record<TargetName, string> = {
  claude: join(
    homedir(),
    'Library/Application Support/Claude/claude_desktop_config.json'
  ),
  codex: join(homedir(), '.codex/config.toml'),
  gemini: join(homedir(), '.gemini/settings.json'),
};

function log(message: string, type: LogType = 'info'): void {
  const prefix = type === 'error' ? '✗' : type === 'success' ? '✓' : 'ℹ';
  console.log(`${prefix} ${message}`);
}

function ensureDir(filepath: string): void {
  const dir = filepath.substring(0, filepath.lastIndexOf('/'));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
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
    ensureDir(targetPath);

    if (target === 'codex') {
      const tomlContent = convertToToml(mcpData.mcpServers || {});
      writeFileSync(targetPath, tomlContent, 'utf8');
    } else {
      writeFileSync(targetPath, JSON.stringify(mcpData, null, 2), 'utf8');
    }

    log(`Configuration deployed to ${target}`, 'success');
    if (verbose) log(`Location: ${targetPath}`);
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
  console.log('4. All targets\n');

  process.stdout.write('Enter your choice (1-4): ');
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

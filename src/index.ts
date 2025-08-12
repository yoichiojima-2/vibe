import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import TOML, { JsonMap } from '@iarna/toml';
import inquirer from 'inquirer';
import { z } from 'zod';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

type LogType = 'info' | 'success' | 'error';

const McpServerSchema = z.object({
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
});

const McpSettingsSchema = z.object({
  mcpServers: z.record(z.string(), McpServerSchema).optional(),
});

type McpServer = z.infer<typeof McpServerSchema>;
type McpSettings = z.infer<typeof McpSettingsSchema>;
type TargetName = 'claude' | 'codex' | 'gemini' | 'claude-code';

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

async function ensureDir(filepath: string): Promise<void> {
  const dir = dirname(filepath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

// Built-in servers that Claude Code already has
const CLAUDE_CODE_BUILTIN_SERVERS = new Set([
  'filesystem',
  'git',
  'github',
  'brave-search',
  'memory',
]);

function expandEnvVars<T>(obj: T): T {
  const expand = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return value.replace(
        /\$([A-Z_][A-Z0-9_]*)/g,
        (_, varName) => process.env[varName] || `$${varName}`
      );
    }
    if (Array.isArray(value)) {
      return value.map(expand);
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, expand(v)])
      );
    }
    return value;
  };
  return expand(obj) as T;
}

function filterServersForTarget(
  mcpServers: Record<string, McpServer>,
  target: TargetName
): Record<string, McpServer> {
  if (target === 'claude-code') {
    return Object.fromEntries(
      Object.entries(mcpServers).filter(
        ([key]) => !CLAUDE_CODE_BUILTIN_SERVERS.has(key)
      )
    );
  }
  return mcpServers;
}

async function loadMcpSettings(): Promise<McpSettings> {
  if (!existsSync(MCP_SETTINGS)) {
    throw new Error(`MCP settings not found: ${MCP_SETTINGS}`);
  }

  try {
    const content = await readFile(MCP_SETTINGS, 'utf8');
    const parsed = JSON.parse(content);
    return McpSettingsSchema.parse(parsed);
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

async function deployToTarget(
  target: TargetName,
  verbose: boolean = false
): Promise<void> {
  try {
    if (verbose) log(`Deploying to ${target}...`);

    const targetPath = TARGETS[target];
    if (!targetPath) {
      throw new Error(`Unknown target: ${target}`);
    }

    const mcpData = await loadMcpSettings();
    const expandedMcpData = expandEnvVars(mcpData);
    const filteredMcpServers = filterServersForTarget(
      expandedMcpData.mcpServers || {},
      target
    );
    const finalMcpData = { ...expandedMcpData, mcpServers: filteredMcpServers };

    await ensureDir(targetPath);

    const content =
      target === 'codex'
        ? convertToToml(filteredMcpServers)
        : JSON.stringify(finalMcpData, null, 2);

    await writeFile(targetPath, content, 'utf8');

    log(`Configuration deployed to ${target}`, 'success');
    if (verbose) {
      log(`Location: ${targetPath}`);
      if (target === 'claude-code') {
        const excludedCount =
          Object.keys(expandedMcpData.mcpServers || {}).length -
          Object.keys(filteredMcpServers).length;
        if (excludedCount > 0) {
          log(`Excluded ${excludedCount} built-in server(s) for Claude Code`);
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Failed to deploy to ${target}: ${errorMessage}`, 'error');
    process.exit(1);
  }
}

async function deployAll(verbose: boolean = false): Promise<void> {
  const targets = Object.keys(TARGETS) as TargetName[];
  await Promise.all(targets.map((target) => deployToTarget(target, verbose)));
}

async function interactive(): Promise<void> {
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

export { deployToTarget, deployAll, interactive, TARGETS };

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import TOML, { JsonMap } from '@iarna/toml';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import type { McpSettings, McpServer, TargetName } from './config.js';
import { McpSettingsSchema, MCP_SETTINGS, TARGETS } from './config.js';
import { log, ensureDir, expandEnvVars, filterServersForTarget, extractErrorMessage } from './utils.js';

function initializeEnv(): void {
  const envConfig = config({ path: join(homedir(), '.env') });
  expand(envConfig);
}

// Load and expand .env file from VIBE_DIR
initializeEnv();

async function loadMcpSettings(): Promise<McpSettings> {
  if (!existsSync(MCP_SETTINGS)) {
    throw new Error(`MCP settings not found: ${MCP_SETTINGS}`);
  }

  try {
    const content = await readFile(MCP_SETTINGS, 'utf8');
    const parsed = JSON.parse(content);
    return McpSettingsSchema.parse(parsed);
  } catch (error) {
    throw new Error(`Failed to load MCP settings: ${extractErrorMessage(error)}`);
  }
}

function convertToToml(mcpServers: Record<string, McpServer>): string {
  const tomlObject: JsonMap = {
    mcp_servers: Object.fromEntries(
      Object.entries(mcpServers).map(([key, server]) => [
        key,
        Object.fromEntries(Object.entries(server).filter(([, value]) => value !== undefined)),
      ])
    ),
  };

  return TOML.stringify(tomlObject);
}

type FormatStrategy = (mcpData: McpSettings, filteredServers: Record<string, McpServer>) => string;

const FORMAT_STRATEGIES: Record<TargetName, FormatStrategy> = {
  'claude-desktop': (mcpData, filteredServers) => JSON.stringify({ ...mcpData, mcpServers: filteredServers }, null, 2),
  codex: (_, filteredServers) => convertToToml(filteredServers),
  gemini: (mcpData, filteredServers) => JSON.stringify({ ...mcpData, mcpServers: filteredServers }, null, 2),
  'claude-code': (mcpData, filteredServers) => JSON.stringify({ ...mcpData, mcpServers: filteredServers }, null, 2),
};

export async function deployToTarget(target: TargetName, verbose: boolean = false): Promise<void> {
  try {
    if (verbose) log(`Deploying to ${target}...`);

    const targetPath = TARGETS[target];
    if (!targetPath) {
      throw new Error(`Unknown target: ${target}`);
    }

    const mcpData = await loadMcpSettings();
    const expandedMcpData = expandEnvVars(mcpData);
    const filteredMcpServers = filterServersForTarget(expandedMcpData.mcpServers || {}, target);

    await ensureDir(targetPath);

    const content = FORMAT_STRATEGIES[target](expandedMcpData, filteredMcpServers);

    await writeFile(targetPath, content, 'utf8');

    log(`Configuration deployed to ${target}`, 'success');
    if (verbose) {
      log(`Location: ${targetPath}`);
      if (target === 'claude-code') {
        const excludedCount = Object.keys(expandedMcpData.mcpServers || {}).length - Object.keys(filteredMcpServers).length;
        if (excludedCount > 0) {
          log(`Excluded ${excludedCount} built-in server(s) for Claude Code`);
        }
      }
    }
  } catch (error) {
    log(`Failed to deploy to ${target}: ${extractErrorMessage(error)}`, 'error');
    process.exit(1);
  }
}

export async function deployAll(verbose: boolean = false): Promise<void> {
  const targets = Object.keys(TARGETS) as TargetName[];
  await Promise.all(targets.map((target) => deployToTarget(target, verbose)));
}

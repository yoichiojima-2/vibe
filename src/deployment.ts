import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import TOML, { JsonMap } from '@iarna/toml';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import type { McpSettings, McpServer, TargetName } from './config.js';
import { McpSettingsSchema, MCP_SETTINGS, TARGETS, VIBE_DIR } from './config.js';
import { log, ensureDir, expandEnvVars, filterServersForTarget } from './utils.js';

// Load and expand .env file from VIBE_DIR
const envConfig = config({ path: join(VIBE_DIR, '.env') });
expand(envConfig);

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

export async function deployToTarget(
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

export async function deployAll(verbose: boolean = false): Promise<void> {
  const targets = Object.keys(TARGETS) as TargetName[];
  await Promise.all(targets.map((target) => deployToTarget(target, verbose)));
}
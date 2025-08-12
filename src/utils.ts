import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import type { LogType, McpServer, TargetName } from './config.js';
import { CLAUDE_CODE_BUILTIN_SERVERS } from './config.js';

export function log(message: string, type: LogType = 'info'): void {
  const prefix = type === 'error' ? '✗' : type === 'success' ? '✓' : 'ℹ';
  console.log(`${prefix} ${message}`);
}

export async function ensureDir(filepath: string): Promise<void> {
  const dir = dirname(filepath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

export function expandEnvVars<T>(obj: T): T {
  const expand = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return value
        .replace(
          /\$\{([A-Z_][A-Z0-9_]*)\}/g,
          (_, varName) => process.env[varName] || `\${${varName}}`
        )
        .replace(
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

export function filterServersForTarget(
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
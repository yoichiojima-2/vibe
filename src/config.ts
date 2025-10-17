import { homedir } from 'os';
import { join } from 'path';
import { z } from 'zod';

export type TargetName = 'claude-desktop' | 'codex' | 'gemini' | 'claude-code';
export type LogType = 'info' | 'success' | 'error';

export const McpServerSchema = z.object({
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
});

export const McpSettingsSchema = z.object({
  mcpServers: z.record(z.string(), McpServerSchema).optional(),
});

export type McpServer = z.infer<typeof McpServerSchema>;
export type McpSettings = z.infer<typeof McpSettingsSchema>;

export const VIBE_DIR: string = process.env.VIBE_DIR || join(homedir(), 'Developer/repo/vibe');

export const MCP_SETTINGS: string = join(VIBE_DIR, 'mcp-settings.json');

export const TARGETS: Record<TargetName, string> = {
  'claude-desktop': join(homedir(), 'Library/Application Support/Claude/claude_desktop_config.json'),
  codex: join(homedir(), '.codex/config.toml'),
  gemini: join(homedir(), '.gemini/settings.json'),
  'claude-code': join(homedir(), '.claude-code/mcp_settings.json'),
};

export const CLAUDE_CODE_BUILTIN_SERVERS = new Set(['filesystem', 'git', 'github', 'brave-search', 'memory']);

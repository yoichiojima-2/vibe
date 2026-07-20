# Vibe

Simple MCP configuration deployment for Claude, Codex, Gemini, and Claude Code.

## Purpose

Streamlined deployment of MCP configurations to AI coding assistants. No complexity, just results.

## Features

- **Modern Node.js**: Built with ES modules, async/await, and TypeScript
- **Type Safety**: Zod schema validation for the MCP settings file
- **Better UX**: Interactive CLI with `inquirer` for guided deployments
- **Target-aware filtering**: A fixed exclusion list (`filesystem`, `git`, `github`, `brave-search`, `memory`) keeps those server names out of the Claude Code deployment
- **Environment Variables**: Expands `$VAR` / `${VAR}` references in the settings using values from `~/.env`

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

The CLI reads MCP server definitions from `$VIBE_DIR/mcp-settings.json` (`VIBE_DIR` defaults to `~/Developer/repo/vibe`, i.e. this repo's expected checkout location — override it with the `VIBE_DIR` environment variable). The `mcp-settings.json` checked into this repo is an empty placeholder; put your real server definitions there (or symlink the file from wherever you keep your dotfiles).

`$VAR` / `${VAR}` references in the settings are expanded from `~/.env` and the process environment before deployment.

Deployment targets and where they write:

| Target           | File                                                                            |
| ---------------- | ------------------------------------------------------------------------------- |
| `claude-desktop` | `~/Library/Application Support/Claude/claude_desktop_config.json` (overwritten) |
| `codex`          | `~/.codex/config.toml` (overwritten, JSON converted to TOML)                    |
| `gemini`         | `~/.gemini/settings.json` (overwritten)                                         |
| `claude-code`    | `~/.claude.json` (merged — only the `mcpServers` key is replaced)               |

## Usage

### Simple Commands

```bash
# Deploy to specific targets
npm run deploy:claude-desktop # Deploy to Claude Desktop
npm run deploy:codex          # Deploy to Codex CLI
npm run deploy:gemini         # Deploy to Gemini
npm run deploy:claude-code    # Deploy to Claude Code
npm run deploy:all            # Deploy to all targets
```

### CLI Usage

```bash
# Interactive mode
npm run deploy

# Deploy to specific target
npm run deploy:claude-desktop
npm run deploy:codex
npm run deploy:gemini
npm run deploy:claude-code
npm run deploy:all

# Verbose output (after building)
npm run build && node dist/bin/vibe.js claude-desktop -v
```

## Development

```bash
# Development with watch mode
npm run dev

# Formatting
npm run format

# Linting
npm run lint
```

## Philosophy

This repository contains the deployment tooling, not the actual server definitions.
Keep your real `mcp-settings.json` contents versioned elsewhere (e.g. a dotfiles repository) so one source of truth feeds every assistant.

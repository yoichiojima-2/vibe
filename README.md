# Vibe

Simple MCP configuration deployment for Claude, Codex, Gemini, and Claude Code.

## Purpose

Streamlined deployment of MCP configurations to AI coding assistants. No complexity, just results.

## Features

- **Modern Node.js**: Built with ES modules, async/await, and TypeScript
- **Type Safety**: Full Zod schema validation for configuration files
- **Better UX**: Interactive CLI with `inquirer` for guided deployments
- **Smart Filtering**: Automatically excludes built-in servers for Claude Code
- **Environment Variables**: Full support for `.env` files and variable expansion

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

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

## Configuration Source

All MCP configurations are stored in the `dotfiles` repository:

- `~/Developer/repo/dotfiles/mcp-settings.json`
- `~/Developer/repo/dotfiles/claude-settings-local.json`

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

This repository contains only deployment scripts, not configuration files.
Configuration files are centralized in the `dotfiles` repository for better maintainability.

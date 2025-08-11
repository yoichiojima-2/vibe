# Vibe

AI coding environment deployment tools.

## Purpose

This repository manages the deployment of AI/MCP configurations to various AI coding assistants, creating the right "vibe" for AI-enhanced development.

## Contents

- `claude.py` - Deploy MCP settings to Claude Desktop
- `gemini.py` - Deploy MCP settings to Gemini
- `codex.py` - Deploy MCP settings to Codex CLI

## Usage

```bash
# Deploy to Claude Desktop
./claude.py

# Deploy to Gemini
./gemini.py

# Deploy to Codex CLI
./codex.py
```

## Configuration Source

All MCP configurations are stored in the `dotfiles` repository:
- `~/Developer/repo/dotfiles/mcp-settings.json`
- `~/Developer/repo/dotfiles/claude-settings-local.json`

## Philosophy

This repository contains only deployment scripts, not configuration files.
Configuration files are centralized in the `dotfiles` repository for better maintainability.
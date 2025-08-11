# Vibe

Simple MCP configuration deployment for Claude, Codex, and Gemini.

## Purpose

Streamlined deployment of MCP configurations to AI coding assistants. No complexity, just results.

## Installation

```bash
# Install globally
npm install -g .

# Or run locally
npm install
npm run setup
```

## Usage

### Simple Commands

```bash
# Deploy to specific targets
npm run install:claude     # Deploy to Claude Desktop
npm run install:codex      # Deploy to Codex CLI
npm run install:gemini     # Deploy to Gemini
npm run install:all        # Deploy to all targets
```

### Direct Scripts

```bash
# Make scripts executable
npm run setup

# Run deployment scripts
./bin/claude.js
./bin/codex.js
./bin/gemini.js
./bin/vibe.js all
```

### CLI Usage

```bash
# Interactive mode
vibe

# Deploy to specific target
vibe claude
vibe codex
vibe gemini
vibe all

# Verbose output
vibe -v claude
```

## Configuration Source

All MCP configurations are stored in the `dotfiles` repository:

- `~/Developer/repo/dotfiles/mcp-settings.json`
- `~/Developer/repo/dotfiles/claude-settings-local.json`

## Philosophy

This repository contains only deployment scripts, not configuration files.
Configuration files are centralized in the `dotfiles` repository for better maintainability.

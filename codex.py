#!/usr/bin/env python3

import json
import os
import shutil
from datetime import datetime
from pathlib import Path

# Configuration
CODEX_CONFIG_DIR = Path.home() / ".codex"
CODEX_CONFIG_FILE = CODEX_CONFIG_DIR / "config.toml"
DOTFILES_LOCATIONS = [
    Path.home() / "Developer/repo/dotfiles",
    Path.home() / ".dotfiles",
    Path.home() / "dotfiles",
]


def find_dotfiles_dir():
    """Find dotfiles directory"""
    dotfiles_env = os.environ.get("DOTFILES_DIR")
    if dotfiles_env and Path(dotfiles_env).exists():
        return Path(dotfiles_env)

    for loc in DOTFILES_LOCATIONS:
        if loc.exists():
            return loc

    raise FileNotFoundError("Could not locate dotfiles directory")


def backup_file(file_path):
    """Create backup of existing file"""
    if not file_path.exists():
        return

    backup_dir = file_path.parent / "backups"
    backup_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir / f"{file_path.name}.backup.{timestamp}"

    shutil.copy2(file_path, backup_file)
    print(f"✓ Backed up to: {backup_file.name}")


def json_to_toml(mcp_servers):
    """Convert MCP servers JSON to TOML format"""
    toml_lines = []

    for server_name, config in mcp_servers.items():
        toml_lines.append(f"[mcp_servers.{server_name}]")

        if "command" in config:
            toml_lines.append(f'command = "{config["command"]}"')

        if "args" in config:
            args = ", ".join(f'"{arg}"' for arg in config["args"])
            toml_lines.append(f"args = [{args}]")

        if "env" in config:
            env_pairs = ", ".join(f'"{k}" = "{v}"' for k, v in config["env"].items())
            toml_lines.append(f"env = {{ {env_pairs} }}")

        toml_lines.append("")  # Empty line between servers

    return "\n".join(toml_lines)


def main():
    print("ℹ Codex CLI MCP Configuration Deployment")

    try:
        # Find dotfiles directory
        dotfiles_dir = find_dotfiles_dir()
        mcp_settings_file = dotfiles_dir / "mcp-settings.json"

        # Load MCP settings
        with open(mcp_settings_file) as f:
            data = json.load(f)

        mcp_servers = data.get("mcpServers", {})
        if not mcp_servers:
            print("✗ No MCP servers found in settings")
            return 1

        # Convert to TOML
        toml_content = json_to_toml(mcp_servers)

        # Create config directory
        CODEX_CONFIG_DIR.mkdir(exist_ok=True)

        # Backup existing config
        backup_file(CODEX_CONFIG_FILE)

        # Write TOML config
        CODEX_CONFIG_FILE.write_text(toml_content)

        print(f"✓ Deployed {len(mcp_servers)} MCP servers to Codex CLI")
        print(f"ℹ Location: {CODEX_CONFIG_FILE}")

    except Exception as e:
        print(f"✗ Error: {e}")
        return 1


if __name__ == "__main__":
    exit(main())

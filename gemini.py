#!/usr/bin/env python3

import json
import os
import shutil
from datetime import datetime
from pathlib import Path

# Configuration
GEMINI_CONFIG_FILE = Path.home() / ".gemini/settings.json"
DOTFILES_LOCATIONS = [
    Path.home() / "Developer/repo/dotfiles",
    Path.home() / ".dotfiles", 
    Path.home() / "dotfiles"
]

def find_dotfiles_dir():
    """Find dotfiles directory"""
    dotfiles_env = os.environ.get('DOTFILES_DIR')
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

def main():
    print("ℹ Gemini MCP Configuration Deployment")
    
    try:
        # Find dotfiles directory
        dotfiles_dir = find_dotfiles_dir()
        mcp_settings_file = dotfiles_dir / "mcp-settings.json"
        
        # Validate source JSON
        with open(mcp_settings_file) as f:
            json.load(f)  # Just validate it's valid JSON
        
        # Create config directory
        GEMINI_CONFIG_FILE.parent.mkdir(exist_ok=True)
        
        # Backup existing config
        backup_file(GEMINI_CONFIG_FILE)
        
        # Copy settings file
        shutil.copy2(mcp_settings_file, GEMINI_CONFIG_FILE)
        
        print("✓ Configuration deployed to Gemini")
        print(f"ℹ Location: {GEMINI_CONFIG_FILE}")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())